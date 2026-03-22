import { getRoomById } from "./adventure";
import { hasLightForRoom } from "./rules/visibility";
import { hasFlag, isItemOpen } from "./state";
import type { AdventureDefinition, AdventureExit, Direction, GameState } from "./types";

type ExitStatus =
  | {
      kind: "available";
      direction: Direction;
      targetRoomTitle: string;
    }
  | {
      kind: "blocked";
      direction: Direction;
      message: string;
    }
  | {
      kind: "hidden";
      direction: Direction;
    };

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function decapitalizeSentence(sentence: string): string {
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

export function getExitBlockReason(
  adventure: AdventureDefinition,
  state: GameState,
  exit: AdventureExit
): string | undefined {
  if (exit.requiredFlags?.some((flagId) => !hasFlag(state, flagId))) {
    return exit.blockedMessage ?? "That way is still blocked.";
  }

  if (exit.requiresOpenItemId && !isItemOpen(adventure, state, exit.requiresOpenItemId)) {
    return exit.blockedMessage ?? "Something still blocks the way.";
  }

  if (!hasLightForRoom(adventure, state, exit.targetRoomId)) {
    return "It is too dark to risk going farther without a proper light.";
  }

  return undefined;
}

function getExitStatus(
  adventure: AdventureDefinition,
  state: GameState,
  exit: AdventureExit
): ExitStatus {
  if (exit.hiddenUnlessFlags?.some((flagId) => !hasFlag(state, flagId))) {
    return {
      kind: "hidden",
      direction: exit.direction
    };
  }

  const blockReason = getExitBlockReason(adventure, state, exit);

  if (blockReason) {
    return {
      kind: "blocked",
      direction: exit.direction,
      message: blockReason
    };
  }

  return {
    kind: "available",
    direction: exit.direction,
    targetRoomTitle: getRoomById(adventure, exit.targetRoomId).title
  };
}

function joinWithOr(parts: string[]): string {
  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0]!;
  }

  if (parts.length === 2) {
    return `${parts[0]!} or ${parts[1]!}`;
  }

  return `${parts.slice(0, -1).join(", ")}, or ${parts[parts.length - 1]!}`;
}

export function describeNavigation(
  adventure: AdventureDefinition,
  state: GameState
): string[] {
  const room = getRoomById(adventure, state.currentRoomId);
  const statuses = room.exits.map((exit) => getExitStatus(adventure, state, exit));
  const available = statuses.filter((status) => status.kind === "available");
  const blocked = statuses.filter((status) => status.kind === "blocked");
  const messages: string[] = [];

  if (available.length > 0) {
    const routeList = joinWithOr(
      available.map(
        (status) => `${status.direction} to ${status.targetRoomTitle}`
      )
    );

    messages.push(`You can go ${routeList}.`);
  }

  for (const status of blocked) {
    messages.push(
      `${capitalize(status.direction)} is blocked: ${decapitalizeSentence(status.message)}`
    );
  }

  return messages;
}
