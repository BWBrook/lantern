import type { AdventureDefinition, GameState, Intent, ResolvedIntent } from "../types";
import { getCompiledDictionary } from "./dictionary";
import { normalizeTokens } from "./normalize";
import { resolveIntent } from "./resolve";
import { tokenize } from "./tokenize";

export function parseCommand(raw: string, adventure: AdventureDefinition): Intent {
  const dictionary = getCompiledDictionary(adventure);

  return normalizeTokens(tokenize(raw), dictionary);
}

export function parseAndResolveCommand(
  adventure: AdventureDefinition,
  state: GameState,
  raw: string
): ResolvedIntent {
  return resolveIntent(adventure, state, parseCommand(raw, adventure));
}
