#!/usr/bin/env python3
"""
Utility script to create the nine mood × stage Crypto Pet sprites described in
docs/sprint-artifacts/e2-s6-create-pixel-art-pet-sprites.md.

The sprites are intentionally simple but consistent pixel art silhouettes that
highlight size progression (baby → adult → legendary) and mood differences
(happy/neutral/sad). Re-run this script whenever the palette or styling needs
updates.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "sprites"

Color = Tuple[int, int, int, int]

STAGES: Dict[str, Dict[str, float | Tuple[int, int, int] | Tuple[int, int, int, int]]] = {
    "baby": {
        "size": 64,
        "body": (253, 233, 196, 255),
        "belly": (255, 248, 226, 255),
        "outline": (92, 64, 56, 255),
        "accent": (255, 206, 150, 255),
        "glow": (255, 255, 255, 60),
    },
    "adult": {
        "size": 128,
        "body": (196, 233, 253, 255),
        "belly": (226, 246, 255, 255),
        "outline": (37, 64, 92, 255),
        "accent": (120, 191, 245, 255),
        "glow": (255, 255, 255, 50),
    },
    "legendary": {
        "size": 192,
        "body": (225, 207, 255, 255),
        "belly": (242, 233, 255, 255),
        "outline": (68, 45, 100, 255),
        "accent": (164, 132, 255, 255),
        "glow": (255, 255, 255, 40),
    },
}

MOODS: Dict[str, Dict[str, float | Tuple[int, int, int]]] = {
    "happy": {
        "eye_height": 0.35,
        "mouth_height": 0.53,
        "mouth_curve": -8.0,
        "cheek_alpha": 120,
    },
    "neutral": {
        "eye_height": 0.38,
        "mouth_height": 0.58,
        "mouth_curve": -3.0,
        "cheek_alpha": 0,
    },
    "sad": {
        "eye_height": 0.42,
        "mouth_height": 0.63,
        "mouth_curve": -1.0,
        "cheek_alpha": 0,
    },
}


def clamp(value: int) -> int:
    return max(0, min(255, value))


def lighten(color: Tuple[int, int, int, int], amount: float) -> Color:
    r, g, b, a = color
    return (
        clamp(int(r + (255 - r) * amount)),
        clamp(int(g + (255 - g) * amount)),
        clamp(int(b + (255 - b) * amount)),
        a,
    )


def draw_body(draw: ImageDraw.ImageDraw, size: int, cfg: Dict[str, Color]) -> None:
    outline_width = max(2, size // 32)
    margin = size // 8
    top = int(size * 0.18)
    bottom = size - int(size * 0.12)
    radius = size // 4
    draw.rounded_rectangle(
        (margin, top, size - margin, bottom),
        radius=radius,
        fill=cfg["body"],
        outline=cfg["outline"],
        width=outline_width,
    )

    belly_margin = size // 3
    draw.ellipse(
        (
            belly_margin,
            int(size * 0.42),
            size - belly_margin,
            size - int(size * 0.16),
        ),
        fill=cfg["belly"],
    )

    draw.arc(
        (margin, top, size - margin, bottom),
        start=200,
        end=340,
        fill=cfg["accent"],
        width=outline_width,
    )


def draw_ears(draw: ImageDraw.ImageDraw, size: int, cfg: Dict[str, Color], stage: str) -> None:
    outline_width = max(2, size // 36)
    ear_height = size // 7
    ear_width = size // 6
    left = (size // 2) - ear_width - size // 12
    right = (size // 2) + size // 12
    top = int(size * 0.08)

    if stage == "legendary":
        horn_height = size // 4
        for offset in (-ear_width, ear_width):
            draw.polygon(
                [
                    (size // 2 + offset, top),
                    (size // 2 + offset * 0.6, top + horn_height),
                    (size // 2 + offset * 1.4, top + horn_height),
                ],
                fill=cfg["accent"],
                outline=cfg["outline"],
            )
    else:
        draw.rounded_rectangle(
            (left, top, left + ear_width, top + ear_height),
            radius=ear_width // 2,
            fill=cfg["body"],
            outline=cfg["outline"],
            width=outline_width,
        )
        draw.rounded_rectangle(
            (right, top, right + ear_width, top + ear_height),
            radius=ear_width // 2,
            fill=cfg["body"],
            outline=cfg["outline"],
            width=outline_width,
        )


def draw_face(
    draw: ImageDraw.ImageDraw,
    size: int,
    cfg: Dict[str, Color],
    mood_cfg: Dict[str, float | int],
) -> None:
    eye_width = max(4, size // 16)
    eye_height = max(6, size // 10)
    eye_spacing = size // 8
    center_x = size // 2
    eye_y = int(size * mood_cfg["eye_height"])
    outline = cfg["outline"]

    for offset in (-eye_spacing, eye_spacing):
        draw.rounded_rectangle(
            (
                center_x + offset - eye_width // 2,
                eye_y - eye_height // 2,
                center_x + offset + eye_width // 2,
                eye_y + eye_height // 2,
            ),
            radius=eye_width // 2,
            fill=outline,
        )

    mouth_width = size // 6
    mouth_height = int(size * mood_cfg["mouth_height"])
    curve = mood_cfg["mouth_curve"]
    start = 200 - curve * 20
    end = 340 + curve * 20
    draw.arc(
        (
            center_x - mouth_width,
            mouth_height - mouth_width // 2,
            center_x + mouth_width,
            mouth_height + mouth_width // 2,
        ),
        start=start,
        end=end,
        fill=outline,
        width=max(2, size // 48),
    )

    cheek_alpha = mood_cfg["cheek_alpha"]
    if cheek_alpha:
        cheek_color = (255, 153, 170, cheek_alpha)
        cheek_radius = size // 12
        for offset in (-eye_spacing, eye_spacing):
            draw.ellipse(
                (
                    center_x + offset - cheek_radius,
                    mouth_height - cheek_radius // 2,
                    center_x + offset + cheek_radius,
                    mouth_height + cheek_radius,
                ),
                fill=cheek_color,
            )


def draw_glow(draw: ImageDraw.ImageDraw, size: int, cfg: Dict[str, Color]) -> None:
    glow_margin = size // 10
    draw.ellipse(
        (
            glow_margin,
            glow_margin,
            size - glow_margin,
            size - glow_margin,
        ),
        outline=cfg["glow"],
        width=max(1, size // 64),
    )


def draw_sprite(stage: str, mood: str) -> Image.Image:
    stage_cfg = STAGES[stage]
    mood_cfg = MOODS[mood]
    size = int(stage_cfg["size"])

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw_glow(draw, size, stage_cfg)
    draw_ears(draw, size, stage_cfg, stage)
    draw_body(draw, size, stage_cfg)
    draw_face(draw, size, stage_cfg, mood_cfg)

    if stage == "legendary":
        star_size = size // 10
        star_center = (int(size * 0.78), int(size * 0.28))
        star_points = []
        for i in range(10):
            angle = math.radians(i * 36)
            radius = star_size if i % 2 == 0 else star_size // 2
            star_points.append(
                (
                    star_center[0] + radius * math.cos(angle),
                    star_center[1] + radius * math.sin(angle),
                )
            )
        draw.polygon(star_points, fill=lighten(stage_cfg["accent"], 0.2))

    return img


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for stage in STAGES:
        for mood in MOODS:
            sprite = draw_sprite(stage, mood)
            filepath = OUTPUT_DIR / f"pet-{stage}-{mood}.png"
            sprite.save(filepath, "PNG")
            print(f"Wrote {filepath}")


if __name__ == "__main__":
    main()

