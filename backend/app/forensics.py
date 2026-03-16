"""
forensics.py - Deepfake Image Detector
Loads the prithivMLmods/Deep-Fake-Detector-v2-Model base ViT and applies
custom LoRA adapter weights trained on 100,000 images (webcam_lora_weights_100k).
Runs on CUDA device 0 (RTX 3050) in eval mode for fast live deepfake scanning.

Usage:
    python forensics.py <image_path>
    python forensics.py test.jpg
"""

import sys
import torch
import torch.nn.functional as F
from pathlib import Path
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification
from peft import PeftModel


# ── Model config ─────────────────────────────────────────────────────────────
BASE_MODEL_ID  = "prithivMLmods/Deep-Fake-Detector-v2-Model"
LORA_WEIGHTS_DIR = Path(__file__).parent.parent / "webcam_lora_weights_100k"


def load_detector(device: int = 0):
    """
    Load the base ViT model, apply the custom 100k LoRA adapter,
    push to GPU, and lock in eval mode.

    Args:
        device: CUDA device index. 0 = first GPU (RTX 3050).

    Returns:
        A tuple of (model, processor, device_str) ready for inference.
    """
    device_str = f"cuda:{device}" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Loading base model '{BASE_MODEL_ID}' …")

    processor = AutoImageProcessor.from_pretrained(BASE_MODEL_ID)

    base_model = AutoModelForImageClassification.from_pretrained(
        BASE_MODEL_ID,
        ignore_mismatched_sizes=True,
    )

    print(f"[INFO] Applying LoRA adapter from: {LORA_WEIGHTS_DIR}")
    model = PeftModel.from_pretrained(base_model, str(LORA_WEIGHTS_DIR))

    model = model.to(device_str)
    model.eval()

    print(f"[INFO] Model ready on {device_str} in eval mode. ✅\n")
    return model, processor, device_str


def analyze_pixels(image_path: str, detector=None) -> dict:
    """
    Run the deepfake detector on a single image and return the scores.

    Args:
        image_path: Absolute or relative path to the image file.
        detector:   Optional pre-loaded (model, processor, device_str) tuple.
                    Loads a new one if None.

    Returns:
        A dict mapping label → confidence score (0-1).
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path.resolve()}")

    if detector is None:
        detector = load_detector(device=0)

    model, processor, device_str = detector

    image = Image.open(path).convert("RGB")
    print(f"[INFO] Analysing image : {path.name}")
    print(f"       Size            : {image.size[0]} x {image.size[1]} px")
    print(f"       Mode            : {image.mode}\n")

    inputs = processor(images=image, return_tensors="pt")
    inputs = {k: v.to(device_str) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probs = F.softmax(outputs.logits, dim=-1)[0]
    id2label = model.config.id2label

    scores: dict[str, float] = {
        id2label[i]: float(probs[i]) for i in range(len(probs))
    }
    return scores


def print_scores(scores: dict[str, float]) -> None:
    """Pretty-print the deepfake vs. realism confidence scores."""
    print("=" * 45)
    print("   DEEPFAKE DETECTION RESULTS")
    print("=" * 45)

    # Attempt to surface the two most meaningful labels
    label_order = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)

    for label in label_order:
        confidence_pct = scores[label] * 100
        bar_length = int(confidence_pct / 2)       # scale to 50 chars max
        bar = "█" * bar_length + "░" * (50 - bar_length)
        print(f"  {label:<20} {confidence_pct:6.2f}%  {bar}")

    print("=" * 45)

    # Verdict
    top_label = label_order[0]
    top_score = scores[top_label] * 100
    verdict = "⚠  LIKELY DEEPFAKE" if "fake" in top_label.lower() else "✅  LIKELY REAL"
    print(f"\n  Verdict : {verdict}")
    print(f"  Top label: '{top_label}'  ({top_score:.2f}% confidence)")
    print("=" * 45)


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python forensics.py <image_path>")
        print("Example: python forensics.py test.jpg")
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        # Load detector once
        detector = load_detector(device=0)

        # Run inference
        scores = analyze_pixels(image_path, detector=detector)

        # Display results
        print_scores(scores)

    except FileNotFoundError as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        raise
