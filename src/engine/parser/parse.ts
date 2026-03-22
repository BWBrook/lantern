import type { AdventureLexicon, Intent } from "../types";
import { normalizeTokens } from "./normalize";
import { tokenize } from "./tokenize";

export function parseCommand(raw: string, lexicon: AdventureLexicon): Intent {
  const tokens = tokenize(raw);
  const normalized = normalizeTokens(tokens, lexicon);

  if (!normalized.verb) {
    throw new Error("Unknown or incomplete command.");
  }

  if (normalized.verb === "SWITCH_ACTOR") {
    return {
      verb: "SWITCH_ACTOR",
      actorId: normalized.directObjectTokens[0],
      directObject: undefined,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  return {
    verb: normalized.verb,
    actorId: normalized.actorAlias,
    directObject: normalized.directObjectTokens.join(" ") || undefined,
    indirectObject: normalized.indirectObjectTokens.join(" ") || undefined,
    preposition: normalized.preposition,
    raw
  };
}
