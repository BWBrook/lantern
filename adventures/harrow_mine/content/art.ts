import type {
  AdventureArt,
  AdventureSceneElement,
  AdventureScenePalette,
  AdventureSceneSpec
} from "../../../src/engine/types";

const BASE_PALETTE: AdventureScenePalette = {
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

function circle(
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha = 1
): AdventureSceneElement {
  return { type: "circle", x, y, radius, color, alpha };
}

function ellipse(
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 1
): AdventureSceneElement {
  return { type: "ellipse", x, y, width, height, color, alpha };
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  alpha = 1
): AdventureSceneElement {
  return { type: "line", x1, y1, x2, y2, color, alpha };
}

function polygon(
  x: number,
  y: number,
  points: number[],
  color: number,
  alpha = 1
): AdventureSceneElement {
  return { type: "polygon", x, y, points, color, alpha };
}

function rectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  options: {
    alpha?: number;
    rotation?: number;
    stroke?: { width: number; color: number; alpha?: number };
  } = {}
): AdventureSceneElement {
  return { type: "rectangle", x, y, width, height, color, ...options };
}

function scene(
  overrides: Partial<AdventureScenePalette>,
  elements: AdventureSceneElement[],
  lampGlow = false
): AdventureSceneSpec {
  return {
    palette: { ...BASE_PALETTE, ...overrides },
    elements,
    lampGlow
  };
}

export const art: AdventureArt[] = [
  {
    id: "town_edge_dawn",
    label: "Town Edge at cold dawn",
    assetPath: new URL("../assets/rooms/town_edge_dawn.png", import.meta.url).href,
    scene: scene(
      { skyTop: 0x6b4933, skyBottom: 0x261712, haze: 0x876346, accent: 0xe2b26d },
      [
        circle(294, 54, 20, BASE_PALETTE.glow, 0.45),
        polygon(98, 198, [0, 0, 92, -56, 196, 0], BASE_PALETTE.silhouette),
        polygon(254, 192, [0, 0, 92, -42, 206, 0], BASE_PALETTE.silhouette, 0.88),
        rectangle(70, 170, 136, 22, 0x8b7460),
        rectangle(142, 166, 48, 14, 0x8b7460),
        rectangle(246, 194, 164, 44, 0x2e2a22, { alpha: 0.85 })
      ]
    )
  },
  {
    id: "mine_road_hill",
    label: "Mine Road climbing through wet scrub",
    scene: scene(
      { skyTop: 0x5f4533, skyBottom: 0x22160f, haze: 0x75513e, accent: 0xd59f56 },
      [
        polygon(178, 195, [0, 0, 70, 0, 118, 42, -36, 42], 0x5c4633),
        rectangle(248, 178, 14, 34, 0x2c241d),
        rectangle(252, 166, 18, 6, 0x94826e),
        polygon(76, 182, [0, 0, 78, -30, 152, 0], BASE_PALETTE.silhouette),
        polygon(308, 184, [0, 0, 66, -24, 150, 0], BASE_PALETTE.silhouette)
      ]
    )
  },
  {
    id: "loading_yard_ruin",
    label: "The broken loading yard and its dead carts",
    assetPath: new URL("../assets/rooms/loading_yard_ruin.png", import.meta.url).href,
    scene: scene(
      { skyTop: 0x584335, skyBottom: 0x20150f, haze: 0x6e5441, accent: 0xce9451 },
      [
        line(66, 154, 240, 238, 0x645342, 0.95),
        line(96, 154, 306, 238, 0x645342, 0.95),
        line(28, 174, 88, 174, 0x645342, 0.35),
        line(20, 196, 116, 196, 0x645342, 0.25),
        rectangle(290, 146, 58, 48, 0x251e18, {
          stroke: { width: 2, color: 0x8b6b47, alpha: 0.9 }
        }),
        rectangle(290, 150, 18, 32, 0x130f0d),
        rectangle(96, 170, 48, 22, 0x3a2c22, { rotation: -0.24 }),
        rectangle(142, 182, 44, 16, 0x2e241c, { rotation: 0.18 })
      ]
    )
  },
  {
    id: "foreman_shed_interior",
    label: "The cramped interior of the foreman's shed",
    scene: scene(
      {
        skyTop: 0x4a3326,
        skyBottom: 0x1d120d,
        haze: 0x664736,
        accent: 0xdaaa65,
        glow: 0xf6d89e
      },
      [
        rectangle(192, 108, 274, 122, 0x3d2c22, {
          stroke: { width: 2, color: 0x896445, alpha: 0.95 }
        }),
        rectangle(192, 108, 254, 102, 0x2a1d16),
        rectangle(120, 110, 86, 10, 0x8c6c46),
        rectangle(264, 110, 86, 10, 0x8c6c46),
        circle(144, 94, 9, 0xf6d89e, 0.7),
        rectangle(144, 110, 18, 28, 0x5b452f),
        rectangle(242, 96, 26, 14, 0xb7a37d),
        rectangle(272, 96, 18, 14, 0x7f6550)
      ],
      true
    )
  },
  {
    id: "broken_entrance_adit",
    label: "The blocked mine entrance behind warped planks",
    scene: scene(
      { skyTop: 0x483126, skyBottom: 0x17100d, haze: 0x5e4334, accent: 0xcc9150 },
      [
        circle(306, 54, 18, BASE_PALETTE.glow, 0.3),
        ellipse(192, 176, 220, 134, BASE_PALETTE.silhouette),
        rectangle(146, 162, 88, 8, 0x77614e, { rotation: -0.44 }),
        rectangle(188, 154, 96, 8, 0x6f5946, { rotation: 0.18 }),
        rectangle(234, 162, 78, 8, 0x7e664f, { rotation: -0.18 })
      ],
      true
    )
  },
  {
    id: "lamp_room_brackets",
    label: "The lamp room with soot-blackened brackets",
    scene: scene(
      { skyTop: 0x261d18, skyBottom: 0x0f0c09, haze: 0x3a2a21, accent: 0xd7a55f, glow: 0xffd585 },
      [
        rectangle(192, 150, 290, 96, 0x1d1917, {
          stroke: { width: 2, color: 0x5a4734, alpha: 0.8 }
        }),
        circle(124, 112, 16, 0xffd585, 0.38),
        circle(194, 104, 14, 0xffd585, 0.28),
        circle(264, 110, 16, 0xffd585, 0.34),
        rectangle(124, 112, 6, 28, 0x40362c),
        rectangle(194, 104, 6, 24, 0x40362c),
        rectangle(264, 110, 6, 28, 0x40362c)
      ],
      true
    )
  },
  {
    id: "main_gallery_hub",
    label: "The main gallery with rails and a shut west gate",
    assetPath: new URL("../assets/rooms/main_gallery_hub.png", import.meta.url).href,
    scene: scene(
      { skyTop: 0x1a1818, skyBottom: 0x090909, haze: 0x272423, accent: 0xd59c59, glow: 0xffd485 },
      [
        rectangle(192, 176, 310, 106, 0x0d0d0d, { alpha: 0.84 }),
        ellipse(192, 150, 272, 130, 0x171412),
        line(66, 154, 240, 238, 0x53483a, 0.95),
        line(96, 154, 306, 238, 0x53483a, 0.95),
        line(28, 174, 88, 174, 0x53483a, 0.35),
        line(20, 196, 116, 196, 0x53483a, 0.25),
        rectangle(98, 142, 32, 74, 0x201915),
        rectangle(80, 142, 12, 62, 0x3f342a),
        rectangle(116, 142, 12, 62, 0x3f342a)
      ],
      true
    )
  },
  {
    id: "winch_platform_shaft",
    label: "The winch platform above a dark shaft",
    scene: scene(
      { skyTop: 0x181616, skyBottom: 0x080808, haze: 0x24201e, accent: 0xc89354, glow: 0xf4c77d },
      [
        rectangle(192, 174, 246, 26, 0x2d261f),
        rectangle(192, 228, 104, 26, 0x050505, { alpha: 0.9 }),
        rectangle(126, 132, 70, 18, 0x342b24),
        circle(96, 132, 18, 0x544639),
        rectangle(126, 132, 6, 40, 0x5f5041)
      ],
      true
    )
  },
  {
    id: "flooded_drift_ledge",
    label: "The flooded drift and its narrow ledge",
    scene: scene(
      { skyTop: 0x171d22, skyBottom: 0x07090b, haze: 0x23363f, accent: 0x74a9b8, glow: 0xb7d9e1 },
      [
        rectangle(192, 202, 384, 78, 0x12232a),
        rectangle(298, 151, 44, 88, 0x302a23),
        rectangle(276, 151, 12, 88, 0x463d34),
        ellipse(182, 188, 248, 18, 0x4b7987, 0.24)
      ],
      true
    )
  },
  {
    id: "stores_chamber_beam",
    label: "The cluttered stores chamber and fallen beam",
    scene: scene(
      { skyTop: 0x231b17, skyBottom: 0x0b0908, haze: 0x34251e, accent: 0xc68a48 },
      [
        rectangle(192, 176, 292, 98, 0x1a1512),
        rectangle(128, 154, 44, 34, 0x4f3c2d),
        rectangle(174, 150, 52, 38, 0x413225),
        rectangle(238, 146, 122, 12, 0x70553c, { rotation: -0.42 }),
        rectangle(308, 136, 40, 68, 0x141111)
      ],
      true
    )
  },
  {
    id: "assay_office_lockbox",
    label: "The dusty assay office with the paymaster's lockbox",
    scene: scene(
      { skyTop: 0x2a1f1c, skyBottom: 0x0c0909, haze: 0x3d2c28, accent: 0xe0b977, glow: 0xf7dda0 },
      [
        rectangle(192, 168, 284, 112, 0x201816, {
          stroke: { width: 2, color: 0x5d4a3c, alpha: 0.75 }
        }),
        rectangle(146, 150, 98, 18, 0x4a3729),
        rectangle(254, 148, 72, 18, 0x3a2c22),
        rectangle(272, 136, 30, 20, 0x7d6951, {
          stroke: { width: 2, color: 0xe0b977, alpha: 0.9 }
        }),
        circle(272, 136, 24, 0xf7dda0, 0.12)
      ],
      true
    )
  },
  {
    id: "vent_crawl_grate",
    label: "The vent crawl and the rusted grate to daylight",
    scene: scene(
      { skyTop: 0x24343d, skyBottom: 0x101317, haze: 0x567180, accent: 0x9cc7d4, glow: 0xdceef2 },
      [
        ellipse(192, 162, 276, 134, 0x161819),
        rectangle(192, 177, 252, 66, 0x111315),
        rectangle(288, 140, 44, 64, 0x7ea2b0, { alpha: 0.28 }),
        rectangle(272, 140, 3, 68, 0x718a95),
        rectangle(280, 140, 3, 68, 0x718a95),
        rectangle(288, 140, 3, 68, 0x718a95),
        rectangle(296, 140, 3, 68, 0x718a95),
        rectangle(304, 140, 3, 68, 0x718a95)
      ],
      true
    )
  }
];
