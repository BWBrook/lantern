import { actors } from "./content/actors";
import { art } from "./content/art";
import { flags } from "./content/flags";
import { items } from "./content/items";
import { lexicon } from "./content/lexicon";
import { metadata } from "./content/metadata";
import { objective } from "./content/objective";
import { rooms } from "./content/rooms";
import { hooks } from "./hooks";
import type { AdventureDefinition, AdventureTheme } from "../../src/engine/types";

const theme: AdventureTheme = {
  accentColor: "#c48b44",
  panelColor: "#1e1914",
  backgroundColor: "#120f0c",
  textColor: "#f1e6ca"
};

const harrowMineAdventure: AdventureDefinition = {
  metadata,
  theme,
  lexicon,
  content: {
    objective,
    rooms,
    items,
    actors,
    flags,
    art
  },
  hooks,
  createInitialState() {
    return {
      currentRoomId: "town_edge",
      activeActorId: "bram"
    };
  },
  validate() {
    return [];
  }
};

export default harrowMineAdventure;
