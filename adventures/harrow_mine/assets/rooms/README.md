# Harrow Mine Room Art

These images are authored adventure assets, not runtime-generated content.
Lantern loads them deterministically through the Harrow art manifest in
`adventures/harrow_mine/content/art.ts`.

## Current Pilot Assets

- `town_edge_dawn.png`: Greywick at cold dawn, with a low stone wall, wet grass,
  and the mine road leading into the scrub.
- `loading_yard_ruin.png`: broken rails, dead ore carts, the locked shed, and
  the planked mine entrance.
- `main_gallery_hub.png`: underground gallery hub, rails, west gate, branching
  passages, and lamp-lit foreground.

## Asset Format

- Final in-game size: 384x240 PNG.
- Palette target: 16 colors.
- Runtime rule: no model calls, no network asset generation, no procedural
  story/art creation during play.

## Prompt Template

```text
Use case: stylized-concept
Asset type: 1980s home-computer illustrated parser-adventure room still, for a browser game canvas.
Primary request: Create an original Commodore 64-era pixel-art room illustration for the Harrow Mine adventure.
Scene/backdrop: <room-specific description from the adventure content>
Subject: Landscape-only room still, no characters, no UI, no words.
Composition: 4:3-ish retro game still composed for a 384x240 canvas; strong readable silhouettes and player-facing landmarks.
Style: Original 1980s Commodore 64 pixel art, limited 16-color palette, chunky low-resolution pixels, crisp hard edges, visible dithering, no smooth gradients, no anti-aliased modern illustration, no photorealism.
Avoid: no text, no watermark, no logo, no modern interface, no copied game screenshot, no characters.
```
