import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import type { AdventureDefinition } from "../engine/types";

export function loadActiveAdventure(): AdventureDefinition {
  return harrowMineAdventure;
}
