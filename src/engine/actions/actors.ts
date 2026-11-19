import { getActorById } from "../adventure";
import { setActiveActor } from "../state";
import type { AdventureDefinition, GameState, ResolvedIntent, TurnResult } from "../types";

export function handleSwitchActor(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (!intent.directObjectId) {
    const current = getActorById(adventure, state.activeActorId);

    return {
      state,
      messages: [`You are ${current.name} at the moment.`]
    };
  }

  const actor = getActorById(adventure, intent.directObjectId);

  if (actor.id === state.activeActorId) {
    return {
      state,
      messages: [`You are already ${actor.name}.`]
    };
  }

  return {
    state: setActiveActor(state, actor.id),
    messages: [`You shift perspective to ${actor.name}.`]
  };
}
