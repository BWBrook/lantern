import { describeRoom, getRoomById } from "../adventure";
import { describeNavigation, getExitBlockReason } from "../navigation";
import { runAdventureHook } from "../rules/hooks";
import { setCurrentRoom } from "../state";
import type {
  AdventureDefinition,
  AdventureExit,
  AdventureRoom,
  GameState,
  ResolvedIntent,
  TurnResult
} from "../types";

const DIRECTIONS = new Set(["north", "south", "east", "west", "up", "down", "in", "out"]);

function visibleExits(room: AdventureRoom, state: GameState): AdventureExit[] {
  return room.exits.filter(
    (exit) => !exit.hiddenUnlessFlags?.some((flagId) => !state.flags.includes(flagId))
  );
}

function isExterior(adventure: AdventureDefinition, roomId: string): boolean {
  return Boolean(getRoomById(adventure, roomId).exterior);
}

// "out", "in" and "back" are relative: pick the exit a player would mean.
function chooseRelativeExit(
  adventure: AdventureDefinition,
  state: GameState,
  room: AdventureRoom,
  target: string
): { exit?: AdventureExit | undefined; message?: string } {
  const exits = visibleExits(room, state);
  const literal = exits.find((exit) => exit.direction === target);

  if (literal) {
    return { exit: literal };
  }

  const backExit = exits.find((exit) => exit.targetRoomId === state.previousRoomId);

  if (target === "back") {
    return backExit ? { exit: backExit } : { message: "You have not come from anywhere yet." };
  }

  if (target === "out") {
    const outward = exits.filter((exit) => !room.exterior && isExterior(adventure, exit.targetRoomId));

    if (outward.length === 1) {
      return { exit: outward[0] };
    }

    if (room.exterior) {
      return { message: "You are already out in the open." };
    }

    if (exits.length === 1) {
      return { exit: exits[0] };
    }

    return backExit ? { exit: backExit } : { message: "There is no single way out from here. Try a compass direction." };
  }

  const inward = exits.filter((exit) => exit.viaItemId && !isExterior(adventure, exit.targetRoomId));

  if (inward.length === 1) {
    return { exit: inward[0] };
  }

  const candidates = exits.filter((exit) => exit !== backExit && !isExterior(adventure, exit.targetRoomId));

  if (candidates.length === 1) {
    return { exit: candidates[0] };
  }

  return { message: "There is no obvious way in from here. Try a compass direction." };
}

export function handleGo(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const target = intent.directObjectId;

  if (!target) {
    return {
      state,
      messages: ["Go where?"]
    };
  }

  const room = getRoomById(adventure, state.currentRoomId);
  let exit: AdventureExit | undefined;

  if (target === "back" || target === "out" || target === "in") {
    const chosen = chooseRelativeExit(adventure, state, room, target);

    if (chosen.message) {
      return { state, messages: [chosen.message, ...describeNavigation(adventure, state)] };
    }

    exit = chosen.exit;
  } else if (DIRECTIONS.has(target)) {
    exit = room.exits.find((candidate) => candidate.direction === target);

    if (!exit) {
      return {
        state,
        messages: [`You cannot go ${target} from here.`, ...describeNavigation(adventure, state)]
      };
    }
  } else {
    return {
      state,
      messages: [`You cannot see a way to ${target} from here.`, ...describeNavigation(adventure, state)]
    };
  }

  if (!exit) {
    return { state, messages: ["Go where?", ...describeNavigation(adventure, state)] };
  }

  const blockedMessage = getExitBlockReason(adventure, state, exit);

  if (blockedMessage) {
    return {
      state,
      messages: [blockedMessage, ...describeNavigation(adventure, state)]
    };
  }

  let nextState = setCurrentRoom(state, exit.targetRoomId);
  const enteredRoom = getRoomById(adventure, nextState.currentRoomId);
  const messages: string[] = [
    enteredRoom.title,
    describeRoom(adventure, nextState),
    ...describeNavigation(adventure, nextState)
  ];

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
