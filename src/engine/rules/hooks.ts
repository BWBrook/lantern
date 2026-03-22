import { getActorById, getRoomById } from "../adventure";
import type {
  AdventureDefinition,
  GameState,
  HookId,
  HookResult,
  ResolvedIntent
} from "../types";

export function runAdventureHook(
  adventure: AdventureDefinition,
  hookId: HookId,
  state: GameState,
  intent: ResolvedIntent
): HookResult {
  const hook = adventure.hooks[hookId];

  if (!hook) {
    throw new Error(`Unknown hook "${hookId}".`);
  }

  return hook({
    adventure,
    state,
    intent,
    actor: getActorById(adventure, intent.actorId),
    room: getRoomById(adventure, state.currentRoomId),
    directItem: intent.directObjectId
      ? adventure.content.items.find((item) => item.id === intent.directObjectId)
      : undefined,
    indirectItem: intent.indirectObjectId
      ? adventure.content.items.find((item) => item.id === intent.indirectObjectId)
      : undefined
  });
}
