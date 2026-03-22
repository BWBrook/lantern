import { getActorById } from "../adventure";
import { setActiveActor } from "../state";
import type { AdventureDefinition, GameState, ResolvedIntent, TurnResult } from "../types";

export function handleSwitchActor(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const actor = getActorById(adventure, intent.actorId);

  return {
    state: setActiveActor(state, actor.id),
    messages: [`You shift perspective to ${actor.name}.`]
  };
}
