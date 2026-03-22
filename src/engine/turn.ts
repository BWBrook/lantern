import { appendTranscript, describeRoom, getActorById, getArtLabel, getRoomById } from "./adventure";
import { handleSwitchActor } from "./actions/actors";
import { handleInventory, handleDrop, handleTake } from "./actions/inventory";
import { handleGo } from "./actions/movement";
import { handleObjectAction } from "./actions/objects";
import { describeNavigation } from "./navigation";
import { parseCommand } from "./parser/parse";
import { resolveIntent } from "./parser/resolve";
import { loadGame, saveGame } from "./save/storage";
import { createInitialGameState } from "./state";
import type {
  AdventureDefinition,
  GameState,
  RoomViewModel,
  StorageLike,
  TurnResult
} from "./types";

function withMessages(state: GameState, messages: string[]): TurnResult {
  let nextState = state;

  for (const message of messages) {
    nextState = appendTranscript(nextState, "system", message);
  }

  return {
    state: nextState,
    messages
  };
}

function finalize(actionResult: TurnResult): TurnResult {
  return withMessages(actionResult.state, actionResult.messages);
}

function roomEntryMessages(
  adventure: AdventureDefinition,
  state: GameState
): string[] {
  const room = getRoomById(adventure, state.currentRoomId);

  return [room.title, describeRoom(adventure, state), ...describeNavigation(adventure, state)];
}

export function createInitialTranscriptState(adventure: AdventureDefinition): GameState {
  let state = createInitialGameState(adventure);
  const room = getRoomById(adventure, state.currentRoomId);

  state = {
    ...state,
    visitCounts: {
      ...state.visitCounts,
      [room.id]: 1
    }
  };

  state = appendTranscript(
    state,
    "system",
    `${adventure.metadata.title} is loaded into the Lantern host.`
  );

  for (const message of roomEntryMessages(adventure, state)) {
    state = appendTranscript(state, "system", message);
  }

  return state;
}

export function createRoomViewModel(
  adventure: AdventureDefinition,
  state: GameState
): RoomViewModel {
  const room = getRoomById(adventure, state.currentRoomId);
  const actor = getActorById(adventure, state.activeActorId);
  const lampState =
    adventure.rules?.lightFlagId && state.flags.includes(adventure.rules.lightFlagId)
      ? "Lamp lit"
      : "Lamp dark";

  return {
    adventureTitle: adventure.metadata.title,
    roomTitle: room.title,
    artLabel: getArtLabel(adventure, room.artId),
    actorName: actor.name,
    objective: adventure.content.objective,
    lampState
  };
}

export function runTurn(
  adventure: AdventureDefinition,
  state: GameState,
  rawCommand: string,
  storage: StorageLike | undefined
): TurnResult {
  const trimmed = rawCommand.trim();

  if (!trimmed) {
    return withMessages(state, ["Lantern is listening."]);
  }

  let nextState = appendTranscript(state, "player", trimmed);

  try {
    const intent = resolveIntent(adventure, nextState, parseCommand(trimmed, adventure.lexicon));

    switch (intent.verb) {
      case "LOOK":
        if (intent.directObjectId) {
          const actionResult = handleObjectAction(adventure, nextState, {
            ...intent,
            verb: "EXAMINE"
          });
          return finalize(actionResult);
        }
        return withMessages(nextState, roomEntryMessages(adventure, nextState));
      case "INVENTORY":
        return finalize(handleInventory(adventure, nextState));
      case "GO":
        return finalize(handleGo(adventure, nextState, intent));
      case "TAKE":
        return finalize(handleTake(adventure, nextState, intent));
      case "DROP":
        return finalize(handleDrop(adventure, nextState, intent));
      case "SWITCH_ACTOR":
        return finalize(handleSwitchActor(adventure, nextState, intent));
      case "SAVE":
        if (!storage) {
          return withMessages(nextState, ["Save storage is not available in this environment."]);
        }
        saveGame(storage, adventure, nextState);
        return withMessages(nextState, ["Progress saved."]);
      case "LOAD": {
        if (!storage) {
          return withMessages(nextState, ["Save storage is not available in this environment."]);
        }

        const loadedState = loadGame(storage, adventure);

        if (!loadedState) {
          return withMessages(nextState, ["There is no saved game yet."]);
        }

        return withMessages(loadedState, ["Progress restored."]);
      }
      default: {
        const actionResult = handleObjectAction(adventure, nextState, intent);
        return finalize(actionResult);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";

    return withMessages(nextState, [message]);
  }
}
