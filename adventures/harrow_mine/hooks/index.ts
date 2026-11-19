import {
  hasFlag,
  playerHasItem,
  setFlag,
  setItemLocation,
  setItemState
} from "../../../src/engine/state";
import type { AdventureHookRegistry, HookResult } from "../../../src/engine/types";

function result(state: HookResult["state"], ...messages: string[]): HookResult {
  return {
    state,
    messages
  };
}

export const hooks: AdventureHookRegistry = {
  unlock_shed_door({ state, actor }) {
    if (hasFlag(state, "shed_unlocked")) {
      return result(state, "The shed padlock is already beaten.");
    }

    if (actor.id !== "nessa") {
      return result(
        state,
        "Bram gives the padlock a solid look and then a less solid shrug. This is Nessa's sort of argument."
      );
    }

    let nextState = setItemState(state, "shed_door", { locked: false });
    nextState = setFlag(nextState, "shed_unlocked");

    return result(
      nextState,
      "Nessa crouches at the padlock, listens once, then twice. The hasp clicks. \"These miners trusted rock more than locksmiths,\" she says."
    );
  },

  unlock_assay_door({ state }) {
    if (hasFlag(state, "office_unlocked")) {
      return result(state, "The assay office door is already unlocked.");
    }

    if (!playerHasItem(state, "brass_key")) {
      return result(state, "You do not have the brass office key.");
    }

    let nextState = setItemState(state, "assay_door", { locked: false });
    nextState = setFlag(nextState, "office_unlocked");

    return result(nextState, "The brass key turns with a dry little complaint. The assay office door is unlocked.");
  },

  light_lamp({ state }) {
    if (!playerHasItem(state, "lamp")) {
      return result(state, "You need to be carrying the lamp before you can light it.");
    }

    if (hasFlag(state, "lamp_lit")) {
      return result(state, "The lamp is already lit.");
    }

    return result(
      setFlag(state, "lamp_lit"),
      "The brass lamp catches after a moment and settles into a steady glow."
    );
  },

  pry_entrance({ state, actor }) {
    if (hasFlag(state, "entrance_open")) {
      return result(state, "The entrance is already pried open wide enough.");
    }

    if (actor.id !== "bram") {
      return result(
        state,
        "Nessa eyes the planks, then the crowbar, then Bram. \"This is aggressively your department,\" she says."
      );
    }

    if (!playerHasItem(state, "crowbar")) {
      return result(state, "Without the crowbar, the planks look more stubborn than vulnerable.");
    }

    return result(
      setFlag(state, "entrance_open"),
      "Bram leans on the crowbar until the warped planks complain, split, and finally give way into a man-sized gap."
    );
  },

  attach_handle({ state }) {
    if (state.itemLocations.winding_handle === "attached:winch") {
      return result(state, "The winding handle is already attached to the winch.");
    }

    if (!playerHasItem(state, "winding_handle")) {
      return result(state, "You need the winding handle before the winch will listen to you.");
    }

    return result(
      setItemLocation(state, "winding_handle", "attached:winch"),
      "The iron handle slots into the winch with a satisfying weight."
    );
  },

  turn_winch({ state }) {
    if (hasFlag(state, "west_gate_open")) {
      return result(state, "The winch has already done its work. Somewhere west, the gate stays open.");
    }

    if (state.itemLocations.winding_handle !== "attached:winch") {
      return result(state, "The winch needs its handle attached before it can be turned.");
    }

    return result(
      setFlag(state, "west_gate_open"),
      "The winch groans, chains answer somewhere in the dark, and the west gate in the gallery lifts clear."
    );
  },

  cross_ledge({ state, actor }) {
    if (hasFlag(state, "brass_key_recovered")) {
      return result(state, "Nessa has already been across the ledge and brought back the brass key.");
    }

    if (actor.id !== "nessa") {
      return result(
        state,
        "The ledge is there, yes. So is the water. Bram has exactly enough sense not to try that in borrowed boots."
      );
    }

    let nextState = setFlag(state, "brass_key_recovered");
    nextState = setItemLocation(nextState, "brass_key", "inventory");

    return result(
      nextState,
      "Nessa edges across the ledge with the sort of calm that makes Bram nervous. A moment later she comes back with a brass key and an expression that says the far side was not worth visiting twice."
    );
  },

  move_beam({ state, actor }) {
    if (hasFlag(state, "beam_moved")) {
      return result(state, "The beam has already been shifted clear of the office door.");
    }

    if (actor.id !== "bram") {
      return result(
        state,
        "Nessa gives the beam a skeptical shove. \"I'd rather pick the mine,\" she says."
      );
    }

    return result(
      setFlag(state, "beam_moved"),
      "Bram shoulders the soaked beam aside with an ugly scrape of wood on stone. The office door can move freely now."
    );
  },

  open_grate({ state }) {
    if (hasFlag(state, "grate_open")) {
      return result(state, "The grate is already open to the road.");
    }

    let nextState = setItemState(state, "vent_grate", { open: true });
    nextState = setFlag(nextState, "grate_open");

    return result(
      nextState,
      "The rusted grate jerks once, then swings outward. Cold daylight pours in like the mine has finally given up."
    );
  },

  gate_refuse({ state }) {
    if (hasFlag(state, "west_gate_open")) {
      return result(state, "The gate already stands open. Whatever raised it is still holding.");
    }

    return result(
      state,
      "The gate is worked from somewhere else. There is no handle on this side, only chains running off into the dark and the sense of a mechanism waiting."
    );
  },

  lockbox_refuse({ state }) {
    return result(
      state,
      "The lockbox is locked, heavy, and not your problem to open here. The point is to be somewhere else with it. Nessa has already decided which somewhere."
    );
  },

  check_victory({ state, room }) {
    if (hasFlag(state, "victory")) {
      return result(state);
    }

    if (!room.exterior || !playerHasItem(state, "lockbox")) {
      return result(state);
    }

    return result(
      setFlag(state, "victory"),
      "With the paymaster's lockbox in hand and open air around you, the job finally becomes real. Greywick can keep the mine. You and Nessa are leaving richer than you arrived."
    );
  }
};
