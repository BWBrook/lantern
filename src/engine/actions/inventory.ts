import { getAttachmentHost, getItemById, getItemLocation, getSceneryByRef } from "../adventure";
import { setItemLocation, setPronounIt } from "../state";
import type { AdventureDefinition, GameState, ResolvedIntent, TurnResult } from "../types";

export function handleInventory(
  adventure: AdventureDefinition,
  state: GameState
): TurnResult {
  if (state.inventory.length === 0) {
    return {
      state,
      messages: ["You are carrying nothing."]
    };
  }

  const names = state.inventory.map((itemId) => getItemById(adventure, itemId).name);

  return {
    state,
    messages: [`You are carrying ${names.join(", ")}.`]
  };
}

export function handleTake(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return {
      state,
      messages: ["Take what?"]
    };
  }

  const scenery = getSceneryByRef(adventure, itemId);

  if (scenery) {
    return {
      state,
      messages: [`You cannot carry off the ${scenery.nouns[0]}. It belongs to the place.`]
    };
  }

  const item = getItemById(adventure, itemId);
  const location = getItemLocation(adventure, state, item.id);

  if (location === "inventory") {
    return {
      state,
      messages: ["You already have that."]
    };
  }

  const host = getAttachmentHost(adventure, state, item.id);

  if (host) {
    return {
      state,
      messages: [`The ${item.name} is fitted to the ${host.name} now, and better left there.`]
    };
  }

  if (location !== state.currentRoomId) {
    return {
      state,
      messages: ["You cannot see that here."]
    };
  }

  if (item.portable === false || item.scenery) {
    return {
      state,
      messages: [`You cannot carry off the ${item.name}.`]
    };
  }

  const nextState = setPronounIt(setItemLocation(state, item.id, "inventory"), item.id);

  return {
    state: nextState,
    messages: [`Taken: ${item.name}.`]
  };
}

export function handleDrop(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return {
      state,
      messages: ["Drop what?"]
    };
  }

  if (!state.inventory.includes(itemId)) {
    return {
      state,
      messages: ["You are not carrying that."]
    };
  }

  const item = getItemById(adventure, itemId);

  return {
    state: setPronounIt(setItemLocation(state, itemId, state.currentRoomId), itemId),
    messages: [`Dropped: ${item.name}.`]
  };
}
