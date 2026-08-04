import Phaser from "phaser";
import type {
  AdventureSceneElement,
  AdventureScenePalette,
  AdventureSceneSpec,
  RoomViewModel
} from "../../engine/types";
import { PLACEHOLDER_SCENE_KEY } from "./assets";

const DEFAULT_PALETTE: AdventureScenePalette = {
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

function drawSceneElement(
  scene: Phaser.Scene,
  element: AdventureSceneElement
): Phaser.GameObjects.GameObject {
  switch (element.type) {
    case "circle":
      return scene.add.circle(element.x, element.y, element.radius, element.color, element.alpha);
    case "ellipse":
      return scene.add.ellipse(
        element.x,
        element.y,
        element.width,
        element.height,
        element.color,
        element.alpha
      );
    case "line":
      return scene.add
        .line(0, 0, element.x1, element.y1, element.x2, element.y2, element.color, element.alpha)
        .setOrigin(0, 0);
    case "polygon":
      return scene.add.polygon(
        element.x,
        element.y,
        element.points,
        element.color,
        element.alpha
      );
    case "rectangle": {
      const rectangle = scene.add.rectangle(
        element.x,
        element.y,
        element.width,
        element.height,
        element.color,
        element.alpha
      );

      if (element.rotation !== undefined) {
        rectangle.setRotation(element.rotation);
      }

      if (element.stroke) {
        rectangle.setStrokeStyle(
          element.stroke.width,
          element.stroke.color,
          element.stroke.alpha
        );
      }

      return rectangle;
    }
  }
}

function drawCaptionPanel(
  scene: Phaser.Scene,
  palette: AdventureScenePalette,
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
  sceneSpec: AdventureSceneSpec | undefined,
  viewModel: RoomViewModel
): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const palette = sceneSpec?.palette ?? DEFAULT_PALETTE;
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
  objects.push(...(sceneSpec?.elements ?? []).map((element) => drawSceneElement(scene, element)));

  if (sceneSpec?.lampGlow && viewModel.lampState === "Lamp lit") {
    objects.push(scene.add.circle(88, 110, 42, palette.glow, 0.13));
    objects.push(scene.add.circle(88, 110, 20, palette.glow, 0.25));
  }

  objects.push(...drawCaptionPanel(scene, palette, viewModel));

  return objects;
}

function roomArtTextureKey(artId: string): string {
  return `lantern-room-art:${artId}`;
}

function drawLoadedRoomArt(
  scene: Phaser.Scene,
  textureKey: string
): Phaser.GameObjects.GameObject[] {
  const { width, height } = scene.scale;
  const image = scene.add.image(width / 2, height / 2, textureKey).setOrigin(0.5, 0.5);
  image.setDisplaySize(width, height);

  const border = scene.add
    .rectangle(width / 2, height / 2, width - 2, height - 2, 0x000000, 0)
    .setStrokeStyle(2, 0x120f0c, 0.85);

  return [image, border];
}

export class GameScene extends Phaser.Scene {
  private activeObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly pendingAssetKeys = new Set<string>();
  private currentArtKey: string | undefined;
  private pendingViewModel: RoomViewModel | undefined;
  private ready = false;

  constructor() {
    super(PLACEHOLDER_SCENE_KEY);
  }

  setRoomViewModel(viewModel: RoomViewModel): void {
    this.pendingViewModel = viewModel;

    if (this.ready) {
      this.renderRoom(viewModel);
    }
  }

  private queueRoomAssetLoad(
    textureKey: string,
    assetPath: string,
    viewModel: RoomViewModel
  ): void {
    if (this.pendingAssetKeys.has(textureKey)) {
      return;
    }

    this.pendingAssetKeys.add(textureKey);
    this.load.image(textureKey, assetPath);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.pendingAssetKeys.delete(textureKey);

      if (this.currentArtKey === textureKey && this.textures.exists(textureKey)) {
        this.renderRoom(viewModel);
      }
    });

    if (!this.load.isLoading()) {
      this.load.start();
    }
  }

  private renderRoom(viewModel: RoomViewModel): void {
    for (const object of this.activeObjects) {
      object.destroy();
    }

    if (viewModel.artAssetPath) {
      const textureKey = roomArtTextureKey(viewModel.artId);
      this.currentArtKey = textureKey;

      if (this.textures.exists(textureKey)) {
        this.activeObjects = drawLoadedRoomArt(this, textureKey);
        return;
      }

      this.activeObjects = drawRoom(this, viewModel.scene, viewModel);
      this.queueRoomAssetLoad(textureKey, viewModel.artAssetPath, viewModel);
      return;
    }

    this.currentArtKey = undefined;
    this.activeObjects = drawRoom(this, viewModel.scene, viewModel);
  }

  create(): void {
    this.ready = true;

    if (this.pendingViewModel) {
      this.renderRoom(this.pendingViewModel);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const object of this.activeObjects) {
        object.destroy();
      }

      this.activeObjects = [];
      this.ready = false;
    });
  }
}
