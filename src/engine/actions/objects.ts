import { getItemById, isItemVisible } from "../adventure";
import { runAdventureHook } from "../rules/hooks";
import { hasFlag, isItemLocked, isItemOpen, playerHasItem, setItemState, setPronounIt } from "../state";
import type {
  AdventureDefinition,
  AdventureItem,
  CanonicalVerb,
  GameState,
  ResolvedIntent,
  TurnResult
} from "../types";

function itemOrMessage(
  adventure: AdventureDefinition,
  itemId: string | undefined
): AdventureItem | undefined {
  if (!itemId) {
    return undefined;
  }

  return adventure.content.items.find((item) => item.id === itemId);
}

function canReachItem(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: string
): boolean {
  return isItemVisible(adventure, state, itemId) || state.inventory.includes(itemId);
}

function executeItemHook(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  item: AdventureItem,
  action: keyof NonNullable<AdventureItem["hooks"]>
): TurnResult | undefined {
  const hookId = item.hooks?.[action];

  if (!hookId) {
    return undefined;
  }

  const hookResult = runAdventureHook(adventure, hookId, state, intent);

  return {
    state: setPronounIt(hookResult.state, item.id),
    messages: hookResult.messages
  };
}

export function handleExamine(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (!intent.directObjectId) {
    return {
      state,
      messages: ["Examine what?"]
    };
  }

  const item = itemOrMessage(adventure, intent.directObjectId);

  if (item) {
    if (!canReachItem(adventure, state, item.id)) {
      return {
        state,
        messages: ["You cannot see that here."]
      };
    }

    const hookResult = executeItemHook(adventure, state, intent, item, "examine");

    if (hookResult) {
      return hookResult;
    }

    return {
      state: setPronounIt(state, item.id),
      messages: [item.description]
    };
  }

  const actor = adventure.content.actors.find((candidate) => candidate.id === intent.directObjectId);

  if (actor) {
    return {
      state,
      messages: [actor.description]
    };
  }

  return {
    state,
    messages: ["You see nothing special about that."]
  };
}

export function handleOpenOrClose(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  action: "OPEN" | "CLOSE"
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return {
      state,
      messages: [`${action === "OPEN" ? "Open" : "Close"} what?`]
    };
  }

  const item = getItemById(adventure, itemId);

  if (!canReachItem(adventure, state, item.id)) {
    return {
      state,
      messages: ["You cannot see that here."]
    };
  }

  const hookResult = executeItemHook(
    adventure,
    state,
    intent,
    item,
    action === "OPEN" ? "open" : "close"
  );

  if (hookResult) {
    return hookResult;
  }

  if (!item.openable) {
    return {
      state,
      messages: ["That does not open or close."]
    };
  }

  if (action === "OPEN") {
    if (item.requiredFlagsToOpen?.some((flagId) => !hasFlag(state, flagId))) {
      return {
        state,
        messages: [item.blockedOpenMessage ?? "Something still prevents that from opening."]
      };
    }

    if (isItemLocked(adventure, state, item.id)) {
      return {
        state,
        messages: ["It is still locked."]
      };
    }

    if (isItemOpen(adventure, state, item.id)) {
      return {
        state,
        messages: ["It is already open."]
      };
    }

    return {
      state: setPronounIt(setItemState(state, item.id, { open: true }), item.id),
      messages: [`Opened: ${item.name}.`]
    };
  }

  if (!isItemOpen(adventure, state, item.id)) {
    return {
      state,
      messages: ["It is already closed."]
    };
  }

  return {
    state: setPronounIt(setItemState(state, item.id, { open: false }), item.id),
    messages: [`Closed: ${item.name}.`]
  };
}

export function handleUnlock(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return {
      state,
      messages: ["Unlock what?"]
    };
  }

  const item = getItemById(adventure, itemId);

  if (!canReachItem(adventure, state, item.id)) {
    return {
      state,
      messages: ["You cannot see that here."]
    };
  }

  const hookResult = executeItemHook(adventure, state, intent, item, "unlock");

  if (hookResult) {
    return hookResult;
  }

  if (!item.lockable) {
    return {
      state,
      messages: ["That is not something you can unlock."]
    };
  }

  if (!isItemLocked(adventure, state, item.id)) {
    return {
      state,
      messages: ["It is already unlocked."]
    };
  }

  if (!item.keyItemId) {
    return {
      state,
      messages: ["You do not see how to unlock that."]
    };
  }

  if (!playerHasItem(state, item.keyItemId)) {
    return {
      state,
      messages: ["You do not have the right key."]
    };
  }

  return {
    state: setPronounIt(setItemState(state, item.id, { locked: false }), item.id),
    messages: [`Unlocked: ${item.name}.`]
  };
}

function notYetMessage(verb: CanonicalVerb): string {
  switch (verb) {
    case "WAIT":
      return "You wait a moment, but the mine remains itself.";
    case "HELP":
      return "Try LOOK, EXAMINE, TAKE, OPEN, UNLOCK, LIGHT, ATTACH, TURN, SAVE, LOAD, or a compass direction. Use BE NESSA to switch actor, or NESSA, PICK LOCK to direct her.";
    default:
      return "That action is not wired up yet."
  }
}

export function handleObjectAction(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  switch (intent.verb) {
    case "EXAMINE":
      return handleExamine(adventure, state, intent);
    case "OPEN":
      return handleOpenOrClose(adventure, state, intent, "OPEN");
    case "CLOSE":
      return handleOpenOrClose(adventure, state, intent, "CLOSE");
    case "UNLOCK":
      return handleUnlock(adventure, state, intent);
    case "LIGHT": {
      if (!intent.directObjectId) {
        return { state, messages: ["Light what?"] };
      }

      const item = getItemById(adventure, intent.directObjectId);

      if (!canReachItem(adventure, state, item.id)) {
        return { state, messages: ["You cannot see that here."] };
      }

      const hookResult = executeItemHook(adventure, state, intent, item, "light");

      if (hookResult) {
        return hookResult;
      }

      return { state, messages: ["That does not seem lightable."] };
    }
    case "MOVE":
    case "PUSH":
    case "PULL": {
      if (!intent.directObjectId) {
        return { state, messages: ["Move what?"] };
      }

      const item = getItemById(adventure, intent.directObjectId);

      if (!canReachItem(adventure, state, item.id)) {
        return { state, messages: ["You cannot see that here."] };
      }

      const hookResult = executeItemHook(adventure, state, intent, item, "move");

      if (hookResult) {
        return hookResult;
      }

      return { state, messages: ["Shoving it around accomplishes nothing useful."] };
    }
    case "SEARCH": {
      if (!intent.directObjectId) {
        return { state, messages: ["Search what?"] };
      }

      const item = getItemById(adventure, intent.directObjectId);

      if (!canReachItem(adventure, state, item.id)) {
        return { state, messages: ["You cannot see that here."] };
      }

      const hookResult = executeItemHook(adventure, state, intent, item, "search");

      if (hookResult) {
        return hookResult;
      }

      return { state, messages: ["You do not find anything helpful."] };
    }
    case "ATTACH": {
      if (!intent.directObjectId || !intent.indirectObjectId) {
        return { state, messages: ["Attach what to what?"] };
      }

      if (!canReachItem(adventure, state, intent.directObjectId)) {
        return { state, messages: ["You are not holding that."] };
      }

      const indirectItem = getItemById(adventure, intent.indirectObjectId);

      if (!canReachItem(adventure, state, indirectItem.id)) {
        return { state, messages: ["You cannot see what you are trying to attach it to."] };
      }

      const hookResult = executeItemHook(adventure, state, intent, indirectItem, "attach");

      if (hookResult) {
        return hookResult;
      }

      return { state, messages: ["Those do not seem to fit together."] };
    }
    case "TURN":
    case "USE":
    case "CROSS": {
      if (!intent.directObjectId) {
        return { state, messages: [`${intent.verb === "CROSS" ? "Cross" : "Use"} what?`] };
      }

      const item = getItemById(adventure, intent.directObjectId);

      if (!canReachItem(adventure, state, item.id)) {
        return { state, messages: ["You cannot see that here."] };
      }

      const hookName = intent.verb === "TURN" ? "turn" : intent.verb === "CROSS" ? "cross" : "use";
      const hookResult = executeItemHook(adventure, state, intent, item, hookName);

      if (hookResult) {
        return hookResult;
      }

      if (intent.verb === "CROSS") {
        return {
          state,
          messages: ["That is not a crossing you can simply take."]
        };
      }

      return { state, messages: ["That does not accomplish anything yet."] };
    }
    case "WAIT":
    case "HELP":
      return {
        state,
        messages: [notYetMessage(intent.verb)]
      };
    default:
      return {
        state,
        messages: ["That action is not available."]
      };
  }
}
