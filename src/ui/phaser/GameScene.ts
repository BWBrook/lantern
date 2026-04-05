import Phaser from "phaser";
import { eventBus } from "../../app/event-bus";
import type { RoomViewModel } from "../../engine/types";
import { PLACEHOLDER_SCENE_KEY } from "./assets";

interface ScenePalette {
  skyTop: number;
  skyBottom: number;
  haze: number;
  terrain: number;
  silhouette: number;
  accent: number;
  glow: number;
  panel: number;
  panelBorder: number;
  caption: string;
  captionMuted: string;
}

const DEFAULT_PALETTE: ScenePalette = {
  skyTop: 0x221910,
  skyBottom: 0x140f0b,
  haze: 0x3d2b1c,
  terrain: 0x211913,
  silhouette: 0x120d0a,
  accent: 0xc48b44,
  glow: 0xf0cb81,
  panel: 0x18120f,
  panelBorder: 0x8d6d44,
  caption: "#f1e6ca",
  captionMuted: "#c9b487"
};

function paletteForRoom(roomId: string): ScenePalette {
  switch (roomId) {
    case "town_edge":
      return { ...DEFAULT_PALETTE, skyTop: 0x6b4933, skyBottom: 0x261712, haze: 0x876346, accent: 0xe2b26d };
    case "mine_road":
      return { ...DEFAULT_PALETTE, skyTop: 0x5f4533, skyBottom: 0x22160f, haze: 0x75513e, accent: 0xd59f56 };
    case "loading_yard":
      return { ...DEFAULT_PALETTE, skyTop: 0x584335, skyBottom: 0x20150f, haze: 0x6e5441, accent: 0xce9451 };
    case "foreman_shed":
      return { ...DEFAULT_PALETTE, skyTop: 0x4a3326, skyBottom: 0x1d120d, haze: 0x664736, accent: 0xdaaa65, glow: 0xf6d89e };
    case "broken_entrance":
      return { ...DEFAULT_PALETTE, skyTop: 0x483126, skyBottom: 0x17100d, haze: 0x5e4334, accent: 0xcc9150 };
    case "lamp_room":
      return { ...DEFAULT_PALETTE, skyTop: 0x261d18, skyBottom: 0x0f0c09, haze: 0x3a2a21, accent: 0xd7a55f, glow: 0xffd585 };
    case "main_gallery":
      return { ...DEFAULT_PALETTE, skyTop: 0x1a1818, skyBottom: 0x090909, haze: 0x272423, accent: 0xd59c59, glow: 0xffd485 };
    case "winch_platform":
      return { ...DEFAULT_PALETTE, skyTop: 0x181616, skyBottom: 0x080808, haze: 0x24201e, accent: 0xc89354, glow: 0xf4c77d };
    case "flooded_drift":
      return { ...DEFAULT_PALETTE, skyTop: 0x171d22, skyBottom: 0x07090b, haze: 0x23363f, accent: 0x74a9b8, glow: 0xb7d9e1 };
    case "stores_chamber":
      return { ...DEFAULT_PALETTE, skyTop: 0x231b17, skyBottom: 0x0b0908, haze: 0x34251e, accent: 0xc68a48 };
    case "assay_office":
      return { ...DEFAULT_PALETTE, skyTop: 0x2a1f1c, skyBottom: 0x0c0909, haze: 0x3d2c28, accent: 0xe0b977, glow: 0xf7dda0 };
    case "vent_crawl":
      return { ...DEFAULT_PALETTE, skyTop: 0x24343d, skyBottom: 0x101317, haze: 0x567180, accent: 0x9cc7d4, glow: 0xdceef2 };
    default:
      return DEFAULT_PALETTE;
  }
}

function hashSeed(value: string): number {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawMotes(
  scene: Phaser.Scene,
  seed: string,
  count: number,
  color: number,
  minAlpha: number,
  maxAlpha: number
): Phaser.GameObjects.Arc[] {
  const rng = mulberry32(hashSeed(seed));
  const motes: Phaser.GameObjects.Arc[] = [];

  for (let index = 0; index < count; index += 1) {
    const x = 18 + rng() * (scene.scale.width - 36);
    const y = 18 + rng() * (scene.scale.height - 36);
    const radius = 0.8 + rng() * 2.2;
    const alpha = minAlpha + rng() * (maxAlpha - minAlpha);
    motes.push(scene.add.circle(x, y, radius, color, alpha));
  }

  return motes;
}

function drawStoneWall(scene: Phaser.Scene, color: number): Phaser.GameObjects.Rectangle[] {
  return [
    scene.add.rectangle(70, 170, 136, 22, color, 1).setOrigin(0.5, 0.5),
    scene.add.rectangle(142, 166, 48, 14, color, 1).setOrigin(0.5, 0.5)
  ];
}

function drawRoad(scene: Phaser.Scene, color: number): Phaser.GameObjects.Polygon {
  return scene.add.polygon(178, 195, [0, 0, 70, 0, 118, 42, -36, 42], color, 1);
}

function drawRails(scene: Phaser.Scene, color: number): Phaser.GameObjects.Line[] {
  return [
    scene.add.line(0, 0, 66, 154, 240, 238, color, 0.95).setOrigin(0, 0),
    scene.add.line(0, 0, 96, 154, 306, 238, color, 0.95).setOrigin(0, 0),
    scene.add.line(0, 174, 28, 0, 88, 0, color, 0.35).setOrigin(0, 0),
    scene.add.line(0, 196, 20, 0, 116, 0, color, 0.25).setOrigin(0, 0)
  ];
}

function drawCaptionPanel(
  scene: Phaser.Scene,
  palette: ScenePalette,
  viewModel: RoomViewModel
): Phaser.GameObjects.GameObject[] {
  const panel = scene.add.rectangle(192, 192, 324, 70, palette.panel, 0.9).setStrokeStyle(
    2,
    palette.panelBorder,
    0.95
  );
  const roomTitle = scene.add.text(32, 158, viewModel.roomTitle, {
    color: palette.caption,
    fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
    fontSize: "26px"
  });
  const label = scene.add.text(32, 186, viewModel.artLabel, {
    color: palette.captionMuted,
    fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
    fontSize: "14px",
    wordWrap: { width: 255 }
  });
  const corner = scene.add.text(287, 153, viewModel.lampState, {
    color: palette.captionMuted,
    fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
    fontSize: "12px",
    align: "right"
  });
  corner.setOrigin(1, 0);

  return [panel, roomTitle, label, corner];
}

function drawRoom(
  scene: Phaser.Scene,
  palette: ScenePalette,
  viewModel: RoomViewModel
): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { width, height } = scene.scale;
  const sky = scene.add.graphics();
  sky.fillGradientStyle(palette.skyTop, palette.skyTop, palette.skyBottom, palette.skyBottom, 1);
  sky.fillRect(0, 0, width, height);
  objects.push(sky);

  const haze = scene.add.ellipse(width / 2, 86, width * 0.9, 92, palette.haze, 0.35);
  objects.push(haze);
  objects.push(...drawMotes(scene, `${viewModel.roomId}:motes`, 18, palette.glow, 0.03, 0.15));

  const horizon = scene.add.rectangle(width / 2, 188, width, 104, palette.terrain, 1);
  objects.push(horizon);

  switch (viewModel.roomId) {
    case "town_edge":
      objects.push(scene.add.circle(294, 54, 20, palette.glow, 0.45));
      objects.push(scene.add.polygon(98, 198, [0, 0, 92, -56, 196, 0], palette.silhouette, 1));
      objects.push(scene.add.polygon(254, 192, [0, 0, 92, -42, 206, 0], palette.silhouette, 0.88));
      objects.push(...drawStoneWall(scene, 0x8b7460));
      objects.push(scene.add.rectangle(246, 194, 164, 44, 0x2e2a22, 0.85));
      break;
    case "mine_road":
      objects.push(drawRoad(scene, 0x5c4633));
      objects.push(scene.add.rectangle(248, 178, 14, 34, 0x2c241d, 1));
      objects.push(scene.add.rectangle(252, 166, 18, 6, 0x94826e, 1));
      objects.push(scene.add.polygon(76, 182, [0, 0, 78, -30, 152, 0], palette.silhouette, 1));
      objects.push(scene.add.polygon(308, 184, [0, 0, 66, -24, 150, 0], palette.silhouette, 1));
      break;
    case "loading_yard":
      objects.push(...drawRails(scene, 0x645342));
      objects.push(scene.add.rectangle(290, 146, 58, 48, 0x251e18, 1).setStrokeStyle(2, 0x8b6b47, 0.9));
      objects.push(scene.add.rectangle(290, 150, 18, 32, 0x130f0d, 1));
      objects.push(scene.add.rectangle(96, 170, 48, 22, 0x3a2c22, 1).setRotation(-0.24));
      objects.push(scene.add.rectangle(142, 182, 44, 16, 0x2e241c, 1).setRotation(0.18));
      break;
    case "foreman_shed":
      objects.push(scene.add.rectangle(192, 108, 274, 122, 0x3d2c22, 1).setStrokeStyle(2, 0x896445, 0.95));
      objects.push(scene.add.rectangle(192, 108, 254, 102, 0x2a1d16, 1));
      objects.push(scene.add.rectangle(120, 110, 86, 10, 0x8c6c46, 1));
      objects.push(scene.add.rectangle(264, 110, 86, 10, 0x8c6c46, 1));
      objects.push(scene.add.circle(144, 94, 9, palette.glow, 0.7));
      objects.push(scene.add.rectangle(144, 110, 18, 28, 0x5b452f, 1));
      objects.push(scene.add.rectangle(242, 96, 26, 14, 0xb7a37d, 1));
      objects.push(scene.add.rectangle(272, 96, 18, 14, 0x7f6550, 1));
      break;
    case "broken_entrance":
      objects.push(scene.add.circle(306, 54, 18, palette.glow, 0.3));
      objects.push(scene.add.ellipse(192, 176, 220, 134, palette.silhouette, 1));
      objects.push(scene.add.rectangle(146, 162, 88, 8, 0x77614e, 1).setRotation(-0.44));
      objects.push(scene.add.rectangle(188, 154, 96, 8, 0x6f5946, 1).setRotation(0.18));
      objects.push(scene.add.rectangle(234, 162, 78, 8, 0x7e664f, 1).setRotation(-0.18));
      break;
    case "lamp_room":
      objects.push(scene.add.rectangle(192, 150, 290, 96, 0x1d1917, 1).setStrokeStyle(2, 0x5a4734, 0.8));
      objects.push(scene.add.circle(124, 112, 16, palette.glow, 0.38));
      objects.push(scene.add.circle(194, 104, 14, palette.glow, 0.28));
      objects.push(scene.add.circle(264, 110, 16, palette.glow, 0.34));
      objects.push(scene.add.rectangle(124, 112, 6, 28, 0x40362c, 1));
      objects.push(scene.add.rectangle(194, 104, 6, 24, 0x40362c, 1));
      objects.push(scene.add.rectangle(264, 110, 6, 28, 0x40362c, 1));
      break;
    case "main_gallery":
      objects.push(scene.add.rectangle(192, 176, 310, 106, 0x0d0d0d, 0.84));
      objects.push(scene.add.ellipse(192, 150, 272, 130, 0x171412, 1));
      objects.push(...drawRails(scene, 0x53483a));
      objects.push(scene.add.rectangle(98, 142, 32, 74, 0x201915, 1));
      objects.push(scene.add.rectangle(80, 142, 12, 62, 0x3f342a, 1));
      objects.push(scene.add.rectangle(116, 142, 12, 62, 0x3f342a, 1));
      break;
    case "winch_platform":
      objects.push(scene.add.rectangle(192, 174, 246, 26, 0x2d261f, 1));
      objects.push(scene.add.rectangle(192, 228, 104, 26, 0x050505, 1).setAlpha(0.9));
      objects.push(scene.add.rectangle(126, 132, 70, 18, 0x342b24, 1));
      objects.push(scene.add.circle(96, 132, 18, 0x544639, 1));
      objects.push(scene.add.rectangle(126, 132, 6, 40, 0x5f5041, 1));
      break;
    case "flooded_drift":
      objects.push(scene.add.rectangle(192, 202, 384, 78, 0x12232a, 1));
      objects.push(scene.add.rectangle(298, 151, 44, 88, 0x302a23, 1));
      objects.push(scene.add.rectangle(276, 151, 12, 88, 0x463d34, 1));
      objects.push(scene.add.ellipse(182, 188, 248, 18, 0x4b7987, 0.24));
      break;
    case "stores_chamber":
      objects.push(scene.add.rectangle(192, 176, 292, 98, 0x1a1512, 1));
      objects.push(scene.add.rectangle(128, 154, 44, 34, 0x4f3c2d, 1));
      objects.push(scene.add.rectangle(174, 150, 52, 38, 0x413225, 1));
      objects.push(scene.add.rectangle(238, 146, 122, 12, 0x70553c, 1).setRotation(-0.42));
      objects.push(scene.add.rectangle(308, 136, 40, 68, 0x141111, 1));
      break;
    case "assay_office":
      objects.push(scene.add.rectangle(192, 168, 284, 112, 0x201816, 1).setStrokeStyle(2, 0x5d4a3c, 0.75));
      objects.push(scene.add.rectangle(146, 150, 98, 18, 0x4a3729, 1));
      objects.push(scene.add.rectangle(254, 148, 72, 18, 0x3a2c22, 1));
      objects.push(scene.add.rectangle(272, 136, 30, 20, 0x7d6951, 1).setStrokeStyle(2, palette.accent, 0.9));
      objects.push(scene.add.circle(272, 136, 24, palette.glow, 0.12));
      break;
    case "vent_crawl":
      objects.push(scene.add.ellipse(192, 162, 276, 134, 0x161819, 1));
      objects.push(scene.add.rectangle(192, 177, 252, 66, 0x111315, 1));
      objects.push(scene.add.rectangle(288, 140, 44, 64, 0x7ea2b0, 0.28));
      for (let x = 272; x <= 304; x += 8) {
        objects.push(scene.add.rectangle(x, 140, 3, 68, 0x718a95, 1));
      }
      break;
    default:
      break;
  }

  if (viewModel.lampState === "Lamp lit" && !["town_edge", "mine_road", "loading_yard"].includes(viewModel.roomId)) {
    objects.push(scene.add.circle(88, 110, 42, palette.glow, 0.13));
    objects.push(scene.add.circle(88, 110, 20, palette.glow, 0.25));
  }

  objects.push(...drawCaptionPanel(scene, palette, viewModel));

  return objects;
}

export class GameScene extends Phaser.Scene {
  private readonly unsubscribe: Array<() => void> = [];
  private activeObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(PLACEHOLDER_SCENE_KEY);
  }

  private renderRoom(viewModel: RoomViewModel): void {
    for (const object of this.activeObjects) {
      object.destroy();
    }

    this.activeObjects = drawRoom(this, paletteForRoom(viewModel.roomId), viewModel);
  }

  create(): void {
    this.unsubscribe.push(
      eventBus.on("room:changed", (viewModel) => {
        this.renderRoom(viewModel);
      })
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribe) {
        unsubscribe();
      }

      this.unsubscribe.length = 0;
    });
  }
}
