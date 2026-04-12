import type { AdventureDefinition, AdventureTheme } from "../../../src/engine/types";

const theme: AdventureTheme = {
  accentColor: "#7cb06d",
  panelColor: "#182318",
  backgroundColor: "#0f160f",
  textColor: "#eef6df"
};

const tinyAdventure: AdventureDefinition = {
  metadata: {
    id: "tiny_adventure",
    title: "Tiny Adventure",
    version: "0.1.0",
    summary: "A two-room fixture used to prove the Lantern contract."
  },
  theme,
  dictionary: {
    verbs: {},
    directions: {
      east: ["east"],
      west: ["west"]
    },
    actors: {
      scout: ["scout"]
    },
    items: {
      iron_door: ["iron door"],
      oak_door: ["oak door"],
      signal_lamp: ["lamp", "signal lamp"]
    },
    groups: {
      door: ["oak_door", "iron_door"]
    },
    phraseAliases: {
      "look at": "EXAMINE",
      "turn on": "LIGHT"
    }
  },
  content: {
    objective: "Walk east and back again.",
    rooms: [
      {
        id: "clearing",
        title: "Clearing",
        artId: "clearing_art",
        descriptions: {
          first: "A quiet clearing waits at the edge of the trees.",
          repeat: "The clearing is still and green."
        },
        exits: [
          {
            direction: "east",
            targetRoomId: "camp"
          }
        ]
      },
      {
        id: "camp",
        title: "Camp",
        artId: "camp_art",
        descriptions: {
          first: "A small campfire ring marks the second room in the fixture.",
          repeat: "The camp is exactly as you left it."
        },
        exits: [
          {
            direction: "west",
            targetRoomId: "clearing"
          }
        ]
      }
    ],
    items: [
      {
        id: "oak_door",
        name: "oak door",
        description: "A plain oak door with a brass latch.",
        location: "clearing",
        portable: false,
        openable: true
      },
      {
        id: "iron_door",
        name: "iron door",
        description: "A heavier iron door with a dark handle.",
        location: "clearing",
        portable: false,
        openable: true
      },
      {
        id: "signal_lamp",
        name: "signal lamp",
        description: "A small lamp used by the fixture scout.",
        location: "camp",
        hooks: {}
      }
    ],
    actors: [
      {
        id: "scout",
        name: "Fixture Scout",
        description: "A utility actor for tests."
      }
    ],
    flags: [],
    art: [
      {
        id: "clearing_art",
        label: "Clearing placeholder"
      },
      {
        id: "camp_art",
        label: "Camp placeholder"
      }
    ]
  },
  hooks: {},
  createInitialState() {
    return {
      currentRoomId: "clearing",
      activeActorId: "scout"
    };
  },
  validate() {
    return [];
  }
};

export default tinyAdventure;
