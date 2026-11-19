import type { CanonicalVerb } from "../../../src/engine/types";

export const objective =
  "Recover the paymaster's lockbox from the assay office and get back out to the road.";

export const responses: Partial<Record<CanonicalVerb, string>> = {
  BREAK: "Brute force is Bram's second-favourite tool, and even he can see it would only make noise here.",
  CLIMB: "Nothing here rewards climbing except bruises.",
  EXTINGUISH: "The lamp stays lit. Nobody in this mine is saving oil at the expense of their neck.",
  FILL: "The lamp has oil enough for the job. The flask can wait for a longer night.",
  LISTEN: "Water ticks somewhere. Timber settles. The mine says nothing that wants an answer.",
  SWIM: "The water here is black, cold, and not a route anybody sensible takes.",
  TALK: "Talk can wait. Nessa gives the look she saves for people who chat in mines: later, with money.",
  WAIT: "You wait a moment. The mine remains itself."
};
