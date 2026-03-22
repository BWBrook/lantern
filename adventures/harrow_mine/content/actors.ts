import type { AdventureActor } from "../../../src/engine/types";

export const actors: AdventureActor[] = [
  {
    id: "bram",
    name: "Bram Pike",
    description:
      "Bram is sturdy, decent, and built for the obvious physical solution to a bad problem.",
    aliases: ["bram", "fighter"],
    abilities: ["pry", "move_heavy"]
  },
  {
    id: "nessa",
    name: "Nessa Vale",
    description:
      "Nessa is the sort of thief who distrusts any object that looks honest and unlocked.",
    aliases: ["nessa", "thief"],
    abilities: ["pick_lock", "cross_ledge"]
  }
];
