"""
train_lora.py
Fine-tunes prithivMLmods/Deep-Fake-Detector-v2-Model (ViT) with LoRA adapters
using the Hugging Face PEFT library.

Dataset layout expected:
  backend/dataset/Train/
      real/   <- images of real faces
      fake/   <- images of deepfake faces

Output:
  backend/webcam_lora_weights/   <- saved LoRA adapter weights
"""

import os
import numpy as np
from pathlib import Path

import torch
from datasets import load_dataset
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    TrainingArguments,
    Trainer,
    DefaultDataCollator,
)
from peft import LoraConfig, get_peft_model
import evaluate

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
MODEL_NAME  = "prithivMLmods/Deep-Fake-Detector-v2-Model"
DATASET_DIR = Path(__file__).parent / "dataset" / "Train"
OUTPUT_DIR  = Path(__file__).parent / "webcam_lora_weights"
NUM_EPOCHS  = 3
SEED        = 42

# RTX 3050 6 GB – tuned settings
BATCH_SIZE  = 4          # per_device_train_batch_size
GRAD_ACCUM  = 4          # effective batch = 16
LR          = 2e-4

# ─────────────────────────────────────────────
# Module-level helpers
# These MUST live at module scope so they are
# picklable by Windows DataLoader worker processes.
# ─────────────────────────────────────────────

# Will be set to the real processor inside __main__
processor = None


def preprocess(batch):
    """Convert PIL images → model pixel values."""
    inputs = processor(
        images=[img.convert("RGB") for img in batch["image"]],
        return_tensors="pt",
    )
    inputs["labels"] = batch["label"]
    return inputs


accuracy_metric = evaluate.load("accuracy")


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return accuracy_metric.compute(predictions=predictions, references=labels)


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point – guarded so Windows `spawn` workers never re-run training
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    # ── 1. Validate dataset directory ─────────────────────────────────────────
    assert DATASET_DIR.exists(), (
        f"Dataset not found at {DATASET_DIR}. "
        "Create dataset/Train/real/ and dataset/Train/fake/ with your images."
    )

    # ── 2. Load dataset from local image folders ───────────────────────────────
    print("📂  Loading dataset from:", DATASET_DIR)
    raw_dataset = load_dataset(
        "imagefolder",
        data_dir=str(DATASET_DIR),
        split="train",
    )

    # Build label maps
    label_names = raw_dataset.features["label"].names   # e.g. ['fake', 'real']
    id2label = {i: name for i, name in enumerate(label_names)}
    label2id = {name: i for i, name in id2label.items()}
    print(f"   Labels: {label_names}")
    print(f"   Total samples: {len(raw_dataset)}")

    # Train / eval split (90 / 10)
    split    = raw_dataset.train_test_split(test_size=0.1, seed=SEED)
    train_ds = split["train"]
    eval_ds  = split["test"]
    print(f"   Train: {len(train_ds)} | Eval: {len(eval_ds)}")

    # ── 3. Image processor ────────────────────────────────────────────────────
    # Assign to the module-level global so preprocess() can reach it
    # in both the main process and spawned DataLoader workers.
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)

    print("🔄  Attaching image transforms …")
    train_ds = train_ds.with_transform(preprocess)
    eval_ds  = eval_ds.with_transform(preprocess)

    # ── 4. Load base model ────────────────────────────────────────────────────
    print(f"🤗  Loading base model: {MODEL_NAME}")
    model = AutoModelForImageClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(label_names),
        id2label=id2label,
        label2id=label2id,
        ignore_mismatched_sizes=True,   # classification head may resize
    )

    # ── 5. Apply LoRA ─────────────────────────────────────────────────────────
    lora_config = LoraConfig(
        r=16,                               # LoRA rank
        lora_alpha=32,                      # scaling factor
        lora_dropout=0.05,
        target_modules=["query", "value"],  # ViT attention projections
        bias="none",
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ── 6. Training arguments  (RTX 3050 6 GB optimised) ─────────────────────
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        remove_unused_columns=False,                # <--- THE FIX

        # Batching
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,     # effective batch = 16

        # Precision
        fp16=True,                                  # half-precision for 6 GB VRAM

        # Schedule
        num_train_epochs=NUM_EPOCHS,
        learning_rate=LR,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,

        # Optimiser
        optim="adamw_torch",
        weight_decay=0.01,

        # Logging / saving
        logging_strategy="steps",
        logging_steps=20,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        save_total_limit=2,

        # Misc
        seed=SEED,
        dataloader_num_workers=2,
        report_to="none",                           # disable wandb / tensorboard
    )

    # ── 7. Trainer ────────────────────────────────────────────────────────────
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        compute_metrics=compute_metrics,
        data_collator=DefaultDataCollator(),
    )

    # ── 8. Train & save ───────────────────────────────────────────────────────
    print("\n🚀  Starting LoRA fine-tuning …")
    trainer.train()

    print(f"\n💾  Saving LoRA adapter weights → {OUTPUT_DIR}")
    model.save_pretrained(str(OUTPUT_DIR))       # lightweight adapter only
    processor.save_pretrained(str(OUTPUT_DIR))

    print("✅  Done! Adapter saved to:", OUTPUT_DIR)
    print("   To load for inference:")
    print("     from peft import PeftModel")
    print("     from transformers import AutoModelForImageClassification")
    print(f"     base  = AutoModelForImageClassification.from_pretrained('{MODEL_NAME}')")
    print(f"     model = PeftModel.from_pretrained(base, '{OUTPUT_DIR}')")