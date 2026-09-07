import { describe, expect, it } from "vitest";
import corpus from "../../adventures/harrow_mine/tests/parser-corpus.json";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { parseAtomicCommands } from "../../src/engine/parser/plan";
import {
  createInitialGameState,
  setCurrentRoom,
  setFlag,
  setItemLocation
} from "../../src/engine/state";
import type { GameState, ItemLocation } from "../../src/engine/types";

interface CorpusCase {
  currentRoomId: string;
  expected: Array<{
    actorId: string;
    directObjectId?: string;
    indirectObjectId?: string;
    verb: string;
  }>;
  flags?: string[];
  input: string;
  inventory?: string[];
  itemLocations?: Record<string, ItemLocation>;
}

function buildState(testCase: CorpusCase): GameState {
  let state = setCurrentRoom(createInitialGameState(harrowMineAdventure), testCase.currentRoomId);

  for (const itemId of testCase.inventory ?? []) {
    state = setItemLocation(state, itemId, "inventory");
  }

  for (const [itemId, location] of Object.entries(testCase.itemLocations ?? {})) {
    state = setItemLocation(state, itemId, location);
  }

  for (const flagId of testCase.flags ?? []) {
    state = setFlag(state, flagId);
  }

  return state;
}

function commandShape(command: ReturnType<typeof parseAtomicCommands>[number]) {
  return {
    actorId: command.intent.actorId,
    ...(command.intent.directObjectId ? { directObjectId: command.intent.directObjectId } : {}),
    ...(command.intent.indirectObjectId ? { indirectObjectId: command.intent.indirectObjectId } : {}),
    verb: command.intent.verb
  };
}

describe("Harrow parser v3 phrase corpus", () => {
  it.each(corpus as CorpusCase[])("$input", (testCase) => {
    const commands = parseAtomicCommands(harrowMineAdventure, buildState(testCase), testCase.input);

    expect(commands.map(commandShape)).toEqual(testCase.expected);
  });
});
