import { describeRoom, getRoomById } from "../adventure";
import { runAdventureHook } from "../rules/hooks";
import { hasLightForRoom } from "../rules/visibility";
import { hasFlag, isItemOpen, setCurrentRoom } from "../state";
import type { AdventureDefinition, GameState, ResolvedIntent, TurnResult } from "../types";

function canUseExit(
  adventure: AdventureDefinition,
  state: GameState,
  exit: ReturnType<typeof getRoomById>["exits"][number]
): string | undefined {
  if (exit.requiredFlags?.some((flagId) => !hasFlag(state, flagId))) {
    return exit.blockedMessage ?? "That way is still blocked.";
  }

  if (exit.hiddenUnlessFlags?.some((flagId) => !hasFlag(state, flagId))) {
    return exit.blockedMessage ?? "That way is not available yet.";
  }

  if (exit.requiresOpenItemId && !isItemOpen(adventure, state, exit.requiresOpenItemId)) {
    return exit.blockedMessage ?? "Something still blocks the way.";
  }

  if (!hasLightForRoom(adventure, state, exit.targetRoomId)) {
    return "It is too dark to risk going farther without a proper light.";
  }

  return undefined;
}

export function handleGo(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const direction = intent.directObjectId;

  if (!direction) {
    return {
      state,
      messages: ["Go where?"]
    };
  }

  const room = getRoomById(adventure, state.currentRoomId);
  const exit = room.exits.find((candidate) => candidate.direction === direction);

  if (!exit) {
    return {
      state,
      messages: ["That direction is not open from here."]
    };
  }

  const blockedMessage = canUseExit(adventure, state, exit);

  if (blockedMessage) {
    return {
      state,
      messages: [blockedMessage]
    };
  }

  let nextState = setCurrentRoom(state, exit.targetRoomId);
  const messages: string[] = [describeRoom(adventure, nextState)];
  const enteredRoom = getRoomById(adventure, nextState.currentRoomId);

  if (enteredRoom.enterHookId) {
    const hookResult = runAdventureHook(adventure, enteredRoom.enterHookId, nextState, intent);
    nextState = hookResult.state;
    messages.push(...hookResult.messages);
  }

  return {
    state: nextState,
    messages
  };
}
