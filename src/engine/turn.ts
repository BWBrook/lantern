import { appendTranscript, getRoomById } from "./adventure";
import { parseCommand } from "./parser/parse";
import { resolveIntent } from "./parser/resolve";
import type { AdventureDefinition, GameState, TurnResult } from "./types";

function describeRoom(
  adventure: AdventureDefinition,
  state: GameState
): string {
  const room = getRoomById(adventure, state.currentRoomId);
  const visits = state.visitCounts[state.currentRoomId] ?? 0;

  return visits === 0 ? room.descriptions.first : room.descriptions.repeat;
}

function enterRoom(
  adventure: AdventureDefinition,
  state: GameState,
  roomId: string
): TurnResult {
  const nextState = {
    ...state,
    currentRoomId: roomId,
    visitCounts: {
      ...state.visitCounts,
      [roomId]: (state.visitCounts[roomId] ?? 0) + 1
    }
  };

  return {
    state: nextState,
    messages: [describeRoom(adventure, nextState)]
  };
}

export function runBootstrapTurn(
  adventure: AdventureDefinition,
  state: GameState,
  rawCommand: string
): TurnResult {
  const command = rawCommand.trim().toLowerCase();

  if (!command) {
    return {
      state,
      messages: ["Lantern is listening."]
    };
  }

  try {
    const intent = resolveIntent(adventure, parseCommand(command, adventure.lexicon));

    if (intent.verb === "LOOK") {
      return {
        state,
        messages: [describeRoom(adventure, state)]
      };
    }

    if (intent.verb === "INVENTORY") {
      return {
        state,
        messages: [
          state.inventory.length === 0
            ? "You are carrying nothing yet."
            : `You are carrying: ${state.inventory.join(", ")}.`
        ]
      };
    }

    if (intent.verb === "SWITCH_ACTOR" && intent.actorId) {
      return {
        state: {
          ...state,
          activeActorId: intent.actorId
        },
        messages: [`You shift perspective to ${intent.actorId}.`]
      };
    }

    if (intent.verb === "GO" && intent.directObject) {
      const room = getRoomById(adventure, state.currentRoomId);
      const exit = room.exits.find((candidate) => candidate.direction === intent.directObject);

      if (!exit) {
        return {
          state,
          messages: ["That direction is not open from here."]
        };
      }

      return enterRoom(adventure, state, exit.targetRoomId);
    }
  } catch {
    return {
      state,
      messages: ["I couldn't make sense of that yet."]
    };
  }

  return {
    state: appendTranscript(
      state,
      "system",
      "The full parser is not wired in yet. Try LOOK, INVENTORY, or a compass direction."
    ),
    messages: ["The full parser is not wired in yet. Try LOOK, INVENTORY, or a compass direction."]
  };
}
