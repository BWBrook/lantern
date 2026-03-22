import { describeRoom, getRoomById } from "../adventure";
import { describeNavigation, getExitBlockReason } from "../navigation";
import { runAdventureHook } from "../rules/hooks";
import { setCurrentRoom } from "../state";
import type { AdventureDefinition, GameState, ResolvedIntent, TurnResult } from "../types";

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
      messages: [`You cannot go ${direction} from here.`, ...describeNavigation(adventure, state)]
    };
  }

  const blockedMessage = getExitBlockReason(adventure, state, exit);

  if (blockedMessage) {
    return {
      state,
      messages: [blockedMessage, ...describeNavigation(adventure, state)]
    };
  }

  let nextState = setCurrentRoom(state, exit.targetRoomId);
  const enteredRoomView = getRoomById(adventure, nextState.currentRoomId);
  const messages: string[] = [
    enteredRoomView.title,
    describeRoom(adventure, nextState),
    ...describeNavigation(adventure, nextState)
  ];
  const enteredRoom = enteredRoomView;

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
