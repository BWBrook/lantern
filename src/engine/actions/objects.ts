import {
  findActorById,
  findItemById,
  getAttachmentHost,
  getItemById,
  getItemLocation,
  getSceneryByRef,
  getVisibleItems,
  isItemVisible
} from "../adventure";
import { runAdventureHook } from "../rules/hooks";
import { hasFlag, isItemLocked, isItemOpen, playerHasItem, setItemLocation, setItemState, setPronounIt } from "../state";
import type {
  AdventureDefinition,
  AdventureItem,
  CanonicalVerb,
  GameState,
  ItemActionHookName,
  ResolvedIntent,
  TurnResult
} from "../types";

function reply(state: GameState, ...messages: string[]): TurnResult {
  return { state, messages };
}

function respond(adventure: AdventureDefinition, verb: CanonicalVerb, fallback: string): string {
  return adventure.content.responses?.[verb] ?? fallback;
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function itemHookId(item: AdventureItem, action: ItemActionHookName): string | undefined {
  return item.hooks?.[action];
}

// Run the item's hook for an action. An item fitted to something else
// (a handle in a winch) borrows its host's hook when it has none of its own.
function executeItemHook(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  item: AdventureItem,
  action: ItemActionHookName
): TurnResult | undefined {
  let hookId = itemHookId(item, action);
  let target = item;

  if (!hookId) {
    const host = getAttachmentHost(adventure, state, item.id);

    if (host && itemHookId(host, action)) {
      hookId = itemHookId(host, action);
      target = host;
    }
  }

  if (!hookId) {
    return undefined;
  }

  const hookResult = runAdventureHook(adventure, hookId, state, intent);

  return {
    state: setPronounIt(hookResult.state, target.id),
    messages: hookResult.messages
  };
}

// Pick up a portable thing in the room before using it, and say so.
function ensureCarried(
  adventure: AdventureDefinition,
  state: GameState,
  item: AdventureItem
): { state: GameState; messages: string[] } {
  const location = getItemLocation(adventure, state, item.id);

  if (location === state.currentRoomId && item.portable !== false && !item.scenery) {
    return {
      state: setItemLocation(state, item.id, "inventory"),
      messages: [`(first taking the ${item.name})`]
    };
  }

  return { state, messages: [] };
}

function prepend(prefix: string[], result: TurnResult): TurnResult {
  return { state: result.state, messages: [...prefix, ...result.messages] };
}

function sceneryResponse(adventure: AdventureDefinition, verb: CanonicalVerb, ref: string): string {
  const scenery = getSceneryByRef(adventure, ref);
  const noun = scenery?.nouns[0] ?? "that";

  switch (verb) {
    case "EXAMINE":
      return scenery?.description ?? "You see nothing special about that.";
    case "SEARCH":
      return `You find nothing useful among the ${noun}.`;
    case "TAKE":
      return `You cannot carry off the ${noun}. It belongs to the place.`;
    default:
      return `The ${noun} is part of the place. Looking is about all it invites.`;
  }
}

function describeItemState(adventure: AdventureDefinition, state: GameState, item: AdventureItem): string {
  const notes: string[] = [];

  if (item.lockable && isItemLocked(adventure, state, item.id)) {
    notes.push("It is locked.");
  } else if (item.openable) {
    notes.push(isItemOpen(adventure, state, item.id) ? "It is open." : "It is closed.");
  }

  return [item.description, ...notes].join(" ");
}

export function handleExamine(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const id = intent.directObjectId;

  if (!id) {
    return reply(state, "Examine what?");
  }

  if (getSceneryByRef(adventure, id)) {
    return reply(state, sceneryResponse(adventure, "EXAMINE", id));
  }

  const item = findItemById(adventure, id);

  if (item) {
    if (!isItemVisible(adventure, state, item.id)) {
      return reply(state, "You cannot see that here.");
    }

    const hookResult = executeItemHook(adventure, state, intent, item, "examine");

    if (hookResult) {
      return hookResult;
    }

    return reply(setPronounIt(state, item.id), describeItemState(adventure, state, item));
  }

  const actor = findActorById(adventure, id);

  if (actor) {
    return reply(state, actor.description);
  }

  return reply(state, "You see nothing special about that.");
}

export function handleUnlock(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return reply(state, "Unlock what?");
  }

  const item = getItemById(adventure, itemId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You cannot see that here.");
  }

  const hookResult = executeItemHook(adventure, state, intent, item, "unlock");

  if (hookResult) {
    return hookResult;
  }

  if (!item.lockable) {
    return reply(state, "That is not something you can unlock.");
  }

  if (!isItemLocked(adventure, state, item.id)) {
    return reply(state, "It is already unlocked.");
  }

  if (!item.keyItemId) {
    return reply(state, "You do not see how to unlock that.");
  }

  if (intent.indirectObjectId && intent.indirectObjectId !== item.keyItemId) {
    const tool = findItemById(adventure, intent.indirectObjectId);

    return reply(state, `The ${tool?.name ?? "that"} does not fit the lock.`);
  }

  if (!playerHasItem(state, item.keyItemId)) {
    return reply(state, "You do not have the right key.");
  }

  return reply(setPronounIt(setItemState(state, item.id, { locked: false }), item.id), `Unlocked: ${item.name}.`);
}

export function handleOpenOrClose(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  action: "OPEN" | "CLOSE"
): TurnResult {
  const itemId = intent.directObjectId;

  if (!itemId) {
    return reply(state, `${action === "OPEN" ? "Open" : "Close"} what?`);
  }

  const item = getItemById(adventure, itemId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You cannot see that here.");
  }

  const hookResult = executeItemHook(adventure, state, intent, item, action === "OPEN" ? "open" : "close");

  if (hookResult) {
    return hookResult;
  }

  if (!item.openable) {
    return reply(state, "That does not open or close.");
  }

  if (action === "OPEN") {
    if (item.requiredFlagsToOpen?.some((flagId) => !hasFlag(state, flagId))) {
      return reply(state, item.blockedOpenMessage ?? "Something still prevents that from opening.");
    }

    if (isItemLocked(adventure, state, item.id)) {
      // Try the obvious thing first: unlock it, if the party can.
      const canTry = Boolean(itemHookId(item, "unlock")) || (item.keyItemId ? playerHasItem(state, item.keyItemId) : false);

      if (canTry) {
        const unlockResult = handleUnlock(adventure, state, { ...intent, verb: "UNLOCK", indirectObjectId: undefined });

        if (!isItemLocked(adventure, unlockResult.state, item.id)) {
          return prepend(
            unlockResult.messages,
            handleOpenOrClose(adventure, unlockResult.state, intent, "OPEN")
          );
        }

        return unlockResult;
      }

      return reply(state, "It is still locked.");
    }

    if (isItemOpen(adventure, state, item.id)) {
      return reply(state, "It is already open.");
    }

    return reply(setPronounIt(setItemState(state, item.id, { open: true }), item.id), `Opened: ${item.name}.`);
  }

  if (!isItemOpen(adventure, state, item.id)) {
    return reply(state, "It is already closed.");
  }

  return reply(setPronounIt(setItemState(state, item.id, { open: false }), item.id), `Closed: ${item.name}.`);
}

function handleMove(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (!intent.directObjectId) {
    return reply(state, "Move what?");
  }

  const item = getItemById(adventure, intent.directObjectId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You cannot see that here.");
  }

  const hookResult =
    executeItemHook(adventure, state, intent, item, "move") ??
    (getAttachmentHost(adventure, state, item.id) ? executeItemHook(adventure, state, intent, item, "turn") : undefined);

  if (hookResult) {
    return hookResult;
  }

  // Pushing or forcing something that opens is an attempt to open it.
  if ((item.openable || itemHookId(item, "open")) && !isItemOpen(adventure, state, item.id)) {
    return handleOpenOrClose(adventure, state, { ...intent, verb: "OPEN" }, "OPEN");
  }

  if (item.portable !== false && !item.scenery) {
    return reply(state, `You shift the ${item.name} about a little. Nothing comes of it.`);
  }

  return reply(state, respond(adventure, "MOVE", "Shoving it around accomplishes nothing useful."));
}

function handleUse(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (!intent.directObjectId) {
    return reply(state, "Use what?");
  }

  const item = getItemById(adventure, intent.directObjectId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You cannot see that here.");
  }

  if (intent.indirectObjectId) {
    const target = getItemById(adventure, intent.indirectObjectId);

    if (!isItemVisible(adventure, state, target.id)) {
      return reply(state, "You cannot see what you are trying to use it on.");
    }

    if (target.lockable && target.keyItemId === item.id) {
      return handleUnlock(adventure, state, {
        ...intent,
        verb: "UNLOCK",
        directObjectId: target.id,
        indirectObjectId: item.id
      });
    }

    const targetHook =
      executeItemHook(adventure, state, intent, target, "use") ??
      executeItemHook(adventure, state, intent, target, "move") ??
      executeItemHook(adventure, state, intent, target, "unlock") ??
      executeItemHook(adventure, state, intent, target, "open") ??
      executeItemHook(adventure, state, intent, target, "attach");

    if (targetHook) {
      return targetHook;
    }

    return reply(state, `Using the ${item.name} on the ${target.name} accomplishes nothing.`);
  }

  const useHook = executeItemHook(adventure, state, intent, item, "use");

  if (useHook) {
    return useHook;
  }

  const lockTarget = getVisibleItems(adventure, state).find(
    (candidate) => candidate.keyItemId === item.id && isItemLocked(adventure, state, candidate.id)
  );

  if (lockTarget) {
    return handleUnlock(adventure, state, {
      ...intent,
      verb: "UNLOCK",
      directObjectId: lockTarget.id,
      indirectObjectId: item.id
    });
  }

  const singleHook = (["light", "turn", "move", "cross", "open", "search"] as ItemActionHookName[]).filter((action) =>
    itemHookId(item, action)
  );

  if (singleHook.length === 1) {
    return executeItemHook(adventure, state, intent, item, singleHook[0]!)!;
  }

  if (item.portable !== false && !item.scenery) {
    return reply(state, `Use the ${item.name} on what?`);
  }

  return reply(state, "That does not accomplish anything yet.");
}

function handleAttach(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (!intent.directObjectId || !intent.indirectObjectId) {
    return reply(state, "Attach what to what?");
  }

  const item = getItemById(adventure, intent.directObjectId);
  const target = getItemById(adventure, intent.indirectObjectId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You are not holding that.");
  }

  if (!isItemVisible(adventure, state, target.id)) {
    return reply(state, "You cannot see what you are trying to attach it to.");
  }

  const carried = ensureCarried(adventure, state, item);
  const hookResult = executeItemHook(adventure, carried.state, intent, target, "attach");

  if (hookResult) {
    return prepend(carried.messages, hookResult);
  }

  return reply(state, "Those do not seem to fit together.");
}

function handleSimpleHookVerb(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent,
  action: ItemActionHookName,
  prompt: string,
  fallback: string,
  implicitTake: boolean
): TurnResult {
  if (!intent.directObjectId) {
    return reply(state, prompt);
  }

  const item = getItemById(adventure, intent.directObjectId);

  if (!isItemVisible(adventure, state, item.id)) {
    return reply(state, "You cannot see that here.");
  }

  const carried = implicitTake ? ensureCarried(adventure, state, item) : { state, messages: [] };
  const hookResult = executeItemHook(adventure, carried.state, intent, item, action);

  if (hookResult) {
    return prepend(carried.messages, hookResult);
  }

  return reply(state, fallback);
}

function handleTalk(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  const target = findActorById(adventure, intent.directObjectId);

  if (target && target.id === intent.actorId) {
    return reply(state, `${firstName(target.name)} keeps that thought private.`);
  }

  if (target) {
    return reply(
      state,
      respond(adventure, "TALK", `${firstName(target.name)} has nothing to add just now. The work is the conversation.`)
    );
  }

  return reply(state, respond(adventure, "TALK", "Nobody here is much for conversation. Try doing something instead."));
}

function helpText(adventure: AdventureDefinition, state: GameState): string {
  const companion = adventure.content.actors.find((actor) => actor.id !== state.activeActorId);
  const lines = [
    "Type short commands: LOOK, EXAMINE <thing>, TAKE, DROP, OPEN, UNLOCK, LIGHT, MOVE, ATTACH, TURN, or a compass direction (or OUT, BACK, or a place name)."
  ];

  if (companion) {
    const name = firstName(companion.name).toUpperCase();
    lines.push(`Direct a companion with "${name}, <command>" or "TELL ${name} TO <command>". Switch viewpoint with BE ${name}.`);
  }

  lines.push("SAVE and LOAD keep your place. AGAIN repeats the last command.");

  return lines.join(" ");
}

export function handleObjectAction(
  adventure: AdventureDefinition,
  state: GameState,
  intent: ResolvedIntent
): TurnResult {
  if (intent.directObjectId && getSceneryByRef(adventure, intent.directObjectId)) {
    return reply(state, sceneryResponse(adventure, intent.verb, intent.directObjectId));
  }

  switch (intent.verb) {
    case "EXAMINE":
      return handleExamine(adventure, state, intent);
    case "OPEN":
      return handleOpenOrClose(adventure, state, intent, "OPEN");
    case "CLOSE":
      return handleOpenOrClose(adventure, state, intent, "CLOSE");
    case "UNLOCK":
      return handleUnlock(adventure, state, intent);
    case "LIGHT":
      return handleSimpleHookVerb(adventure, state, intent, "light", "Light what?", "That does not seem lightable.", true);
    case "EXTINGUISH":
      return reply(state, respond(adventure, "EXTINGUISH", "There is nothing here you would want to put out."));
    case "MOVE":
    case "PUSH":
    case "PULL":
      return handleMove(adventure, state, intent);
    case "SEARCH": {
      const actor = findActorById(adventure, intent.directObjectId);

      if (actor) {
        return reply(state, `${firstName(actor.name)} has nothing to hand over.`);
      }

      return handleSimpleHookVerb(adventure, state, intent, "search", "Search what?", "You do not find anything helpful.", false);
    }
    case "ATTACH":
      return handleAttach(adventure, state, intent);
    case "TURN":
      return handleSimpleHookVerb(adventure, state, intent, "turn", "Turn what?", "That does not turn in any useful way.", false);
    case "CROSS":
      return handleSimpleHookVerb(adventure, state, intent, "cross", "Cross what?", "That is not a crossing you can simply take.", false);
    case "USE":
      return handleUse(adventure, state, intent);
    case "TALK":
      return handleTalk(adventure, state, intent);
    case "LISTEN":
      return reply(state, respond(adventure, "LISTEN", "You listen. Nothing here has anything to say."));
    case "BREAK": {
      const item = findItemById(adventure, intent.directObjectId);

      if (item && isItemVisible(adventure, state, item.id) && (itemHookId(item, "move") || item.openable || itemHookId(item, "open"))) {
        return handleMove(adventure, state, { ...intent, verb: "MOVE" });
      }

      return reply(state, respond(adventure, "BREAK", "Brute force will not help here."));
    }
    case "GIVE":
      return reply(state, respond(adventure, "GIVE", "The party shares one pack. What one of you carries, both of you have."));
    case "CLIMB":
      return reply(state, respond(adventure, "CLIMB", "Nothing here rewards climbing."));
    case "FILL":
      return reply(state, respond(adventure, "FILL", "Nothing here needs filling."));
    case "SWIM":
      return reply(state, respond(adventure, "SWIM", "There is no water here worth the risk."));
    case "WAIT":
      return reply(state, respond(adventure, "WAIT", "Time passes. Nothing changes."));
    case "HELP":
      return reply(state, respond(adventure, "HELP", helpText(adventure, state)));
    default:
      return reply(state, "That action is not available.");
  }
}
