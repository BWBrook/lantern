import type { AdventureLexicon, Intent } from "../types";
import { normalizeTokens } from "./normalize";
import { tokenize } from "./tokenize";

export function parseCommand(raw: string, lexicon: AdventureLexicon): Intent {
  return normalizeTokens(tokenize(raw), lexicon);
}
