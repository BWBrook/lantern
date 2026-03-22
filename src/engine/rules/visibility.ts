import { getRoomById } from "../adventure";
import { hasFlag } from "../state";
import type { AdventureDefinition, GameState } from "../types";

export function roomNeedsLight(
  adventure: AdventureDefinition,
  roomId: string
): boolean {
  return Boolean(getRoomById(adventure, roomId).dark);
}

export function hasLightForRoom(
  adventure: AdventureDefinition,
  state: GameState,
  roomId: string
): boolean {
  if (!roomNeedsLight(adventure, roomId)) {
    return true;
  }

  const lightFlagId = adventure.rules?.lightFlagId;

  if (!lightFlagId) {
    return true;
  }

  return hasFlag(state, lightFlagId);
}
