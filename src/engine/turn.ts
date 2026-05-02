import {
  appendTranscript,
  describeRoom,
  getActorById,
  getArtAssetPath,
  getArtLabel,
  getRoomById
} from "./adventure";
import { handleSwitchActor } from "./actions/actors";
import { handleInventory, handleDrop, handleTake } from "./actions/inventory";
import { handleGo } from "./actions/movement";
import { handleObjectAction } from "./actions/objects";
import { describeNavigation } from "./navigation";
import { ParserDiagnosticError } from "./parser/diagnostics";
import { isParserMetaVerb, parseAtomicCommands, splitCommandChain } from "./parser/plan";
import { formatParserDiagnosticMessage } from "./parser/resolve";
import { loadGame, saveGame } from "./save/storage";
import {
  createInitialGameState,
  setLastParserIntent,
  setPendingClarification,
  setPronounThem
} from "./state";
import type {
  AtomicCommand,
  AdventureDefinition,
  GameState,
  ResolvedIntent,
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

function isLikelyActionFailure(messages: string[]): boolean {
  const first = messages[0]?.toLowerCase() ?? "";

  return [
    "that ",
    "there is nothing",
    "you cannot",
    "you do not",
    "you need",
    "without"
  ].some((prefix) => first.startsWith(prefix));
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
    adventureSummary: adventure.metadata.summary,
    roomTitle: room.title,
    roomId: room.id,
    artId: room.artId,
    artLabel: getArtLabel(adventure, room.artId),
    artAssetPath: getArtAssetPath(adventure, room.artId),
    actorName: actor.name,
    objective: adventure.content.objective,
    lampState
  };
}

function runResolvedIntent(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  storage: StorageLike | undefined
): TurnResult {
  switch (intent.verb) {
    case "LOOK":
      if (intent.directObjectId) {
        return handleObjectAction(adventure, state, {
          ...intent,
          verb: "EXAMINE"
        });
      }
      return {
        state,
        messages: roomEntryMessages(adventure, state)
      };
    case "INVENTORY":
      return handleInventory(adventure, state);
    case "GO":
      return handleGo(adventure, state, intent);
    case "TAKE":
      return handleTake(adventure, state, intent);
    case "DROP":
      return handleDrop(adventure, state, intent);
    case "SWITCH_ACTOR":
      return handleSwitchActor(adventure, state, intent);
    case "SAVE":
      if (!storage) {
        return {
          state,
          messages: ["Save storage is not available in this environment."]
        };
      }
      saveGame(storage, adventure, state);
      return {
        state,
        messages: ["Progress saved."]
      };
    case "LOAD": {
      if (!storage) {
        return {
          state,
          messages: ["Save storage is not available in this environment."]
        };
      }

      const loadedState = loadGame(storage, adventure);

      if (!loadedState) {
        return {
          state,
          messages: ["There is no saved game yet."]
        };
      }

      return {
        state: loadedState,
        messages: ["Progress restored."]
      };
    }
    default:
      return handleObjectAction(adventure, state, intent);
  }
}

function shouldRememberIntent(command: AtomicCommand): boolean {
  return !isParserMetaVerb(command.intent.verb) && command.intent.verb !== "SWITCH_ACTOR";
}

function applyParserSuccessContext(state: GameState, command: AtomicCommand): GameState {
  let nextState = setPendingClarification(state, undefined);

  if (shouldRememberIntent(command)) {
    nextState = setLastParserIntent(nextState, command.intent);
  }

  return nextState;
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
  const messages: string[] = [];
  const parts = splitCommandChain(trimmed);

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    let commands: AtomicCommand[];

    try {
      commands = parseAtomicCommands(adventure, nextState, parts[partIndex]!);
    } catch (error) {
      if (error instanceof ParserDiagnosticError) {
        if (
          error.diagnostic.code === "ambiguous_noun" &&
          error.diagnostic.intent &&
          error.diagnostic.objectRole &&
          error.diagnostic.candidateIds
        ) {
          nextState = setPendingClarification(nextState, {
            originalRaw: parts[partIndex]!,
            intent: error.diagnostic.intent,
            objectRole: error.diagnostic.objectRole,
            candidateIds: error.diagnostic.candidateIds
          });
        }

        const message = formatParserDiagnosticMessage(error.diagnostic, adventure, nextState) || error.message;
        const finalMessages =
          partIndex < parts.length - 1 ? [message, "The rest of your command was not attempted."] : [message];
        const result = withMessages(nextState, finalMessages);

        return {
          state: result.state,
          messages: [...messages, ...finalMessages]
        };
      }

      const message = error instanceof Error ? error.message : "Something went wrong.";
      const result = withMessages(nextState, [message]);

      return {
        state: result.state,
        messages: [...messages, message]
      };
    }

    const batchObjectIds = commands.map((command) => command.intent.directObjectId).filter(Boolean) as string[];

    for (let commandIndex = 0; commandIndex < commands.length; commandIndex += 1) {
      const command = commands[commandIndex]!;
      const prefixMessages =
        command.confidence === "likely" ? [`I read that as: ${command.normalized}.`] : [];
      const actionResult = runResolvedIntent(adventure, nextState, command.intent, storage);
      const commandMessages = [...prefixMessages, ...actionResult.messages];
      const transcriptResult = withMessages(actionResult.state, commandMessages);

      nextState = applyParserSuccessContext(transcriptResult.state, command);
      messages.push(...commandMessages);

      if (commands.length > 1 && batchObjectIds.length > 1) {
        nextState = setPronounThem(nextState, batchObjectIds);
      }

      if (
        isLikelyActionFailure(actionResult.messages) &&
        (commandIndex < commands.length - 1 || partIndex < parts.length - 1)
      ) {
        const stopMessage = "The rest of your command was not attempted.";
        const stopped = withMessages(nextState, [stopMessage]);

        return {
          state: stopped.state,
          messages: [...messages, stopMessage]
        };
      }
    }
  }

  return {
    state: nextState,
    messages
  };
}
