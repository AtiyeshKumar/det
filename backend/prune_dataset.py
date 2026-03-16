"""
prune_dataset.py
Shrinks dataset/Train/real and dataset/Train/fake to 2,000 images each.

Rules
-----
• dataset/Train/real  – ALWAYS keeps ALL webcam photos (WIN_* prefix or
  any file whose name doesn't match the Kaggle numeric/UUID pattern).
  Then fills up to 2,000 with random Kaggle images; extras go to backup.
• dataset/Train/fake  – Keeps 2,000 random images; extras go to backup.
• Leftover images are MOVED (not deleted) to:
    dataset_backup/real/
    dataset_backup/fake/

Webcam detection heuristic (real folder only)
----------------------------------------------
A file is treated as a protected webcam photo if ANY of these match:
  1. Name starts with  WIN_
  2. Name starts with  IMG_
  3. Name starts with  DSC
  4. Name starts with  DCIM
  5. Name does NOT look like a Kaggle image.
     Kaggle names are typically: all-digit IDs, or contain only hex chars,
     or follow pattern like  <digits>.jpg / <uuid>.jpg
     Anything else is assumed to be a custom/webcam photo.

Adjust WEBCAM_PREFIXES or RE_KAGGLE below if your files differ.
"""

import os
import re
import shutil
import random
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
BACKEND_DIR  = Path(__file__).parent
TRAIN_DIR    = BACKEND_DIR / "dataset" / "Train"
BACKUP_DIR   = BACKEND_DIR / "dataset_backup"
REAL_DIR     = TRAIN_DIR / "real"
FAKE_DIR     = TRAIN_DIR / "fake"
KEEP_COUNT   = 2_000
SEED         = 42
IMAGE_EXTS   = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

# Prefixes that always mark a file as a custom/webcam photo (case-insensitive)
WEBCAM_PREFIXES = ("win_", "img_", "dsc", "dcim", "photo_", "capture_")

# Kaggle image name pattern: purely numeric, purely hex-32 (md5), or
# numeric-underscore combos like  00001_00.jpg
RE_KAGGLE = re.compile(
    r"^(?:"
    r"\d+"                          # all-digit   e.g.  00001
    r"|[0-9a-f]{32}"               # md5 hex      e.g.  a1b2c3…
    r"|\d+[_\-]\d+"                # numeric pair e.g.  00001_00
    r"|real_\d+"                   # prefixed     e.g.  real_00001
    r"|fake_\d+"
    r")$",
    re.IGNORECASE,
)

# ── Helpers ───────────────────────────────────────────────────────────────────
def list_images(folder: Path) -> list[Path]:
    return [f for f in folder.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXTS]


def is_webcam(path: Path) -> bool:
    name = path.name.lower()
    stem = path.stem.lower()
    # Rule 1: starts with a known webcam prefix
    if name.startswith(WEBCAM_PREFIXES):
        return True
    # Rule 2: stem does NOT look like a Kaggle name → treat as custom
    if not RE_KAGGLE.match(stem):
        return True
    return False


def move_files(files: list[Path], dest_dir: Path):
    dest_dir.mkdir(parents=True, exist_ok=True)
    for src in files:
        dst = dest_dir / src.name
        # Avoid name collision in backup
        if dst.exists():
            dst = dest_dir / f"{src.stem}_dup{src.suffix}"
        shutil.move(str(src), str(dst))


def prune_folder(
    folder: Path,
    keep: int,
    backup_dir: Path,
    protect_webcam: bool = False,
    label: str = "",
):
    all_images = list_images(folder)
    print(f"\n[{label}] Total images found : {len(all_images)}")

    if protect_webcam:
        webcam  = [f for f in all_images if is_webcam(f)]
        kaggle  = [f for f in all_images if not is_webcam(f)]
        print(f"  ├─ Webcam (protected) : {len(webcam)}")
        print(f"  └─ Kaggle pool        : {len(kaggle)}")

        if len(webcam) >= keep:
            # Edge case: more webcam photos than the keep limit
            print(f"  ⚠️  Webcam photos ({len(webcam)}) already exceed the "
                  f"keep limit ({keep}). Keeping ALL webcam photos "
                  f"and moving ALL Kaggle images to backup.")
            to_keep   = webcam
            to_backup = kaggle
        else:
            slots = keep - len(webcam)
            random.seed(SEED)
            random.shuffle(kaggle)
            to_keep   = webcam + kaggle[:slots]
            to_backup = kaggle[slots:]
    else:
        random.seed(SEED)
        random.shuffle(all_images)
        to_keep   = all_images[:keep]
        to_backup = all_images[keep:]

    print(f"  ✅ Keeping  : {len(to_keep)}")
    print(f"  📦 Moving to backup: {len(to_backup)}")

    if to_backup:
        move_files(to_backup, backup_dir)
        print(f"  Backup destination : {backup_dir}")
    else:
        print("  Nothing to move — dataset is already within the limit.")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Dataset Pruner")
    print(f"  Target keep count  : {KEEP_COUNT} per class")
    print(f"  Train directory    : {TRAIN_DIR}")
    print(f"  Backup directory   : {BACKUP_DIR}")
    print("=" * 60)

    for d in (REAL_DIR, FAKE_DIR):
        if not d.exists():
            raise FileNotFoundError(
                f"Expected directory not found: {d}\n"
                "Make sure your dataset is at  backend/dataset/Train/real  "
                "and  backend/dataset/Train/fake"
            )

    # ── Fake folder ───────────────────────────────────────────────────────────
    prune_folder(
        folder=FAKE_DIR,
        keep=KEEP_COUNT,
        backup_dir=BACKUP_DIR / "fake",
        protect_webcam=False,
        label="FAKE",
    )

    # ── Real folder  (protect webcam photos) ──────────────────────────────────
    prune_folder(
        folder=REAL_DIR,
        keep=KEEP_COUNT,
        backup_dir=BACKUP_DIR / "real",
        protect_webcam=True,
        label="REAL",
    )

    print("\n" + "=" * 60)
    print("  ✅  Pruning complete!")
    print(f"  Your training set now lives in : {TRAIN_DIR}")
    print(f"  Leftover images backed up to   : {BACKUP_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
