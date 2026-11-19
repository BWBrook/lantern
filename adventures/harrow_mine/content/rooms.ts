import type { AdventureRoom } from "../../../src/engine/types";

export const rooms: AdventureRoom[] = [
  {
    id: "town_edge",
    title: "Town Edge",
    artId: "town_edge_dawn",
    exterior: true,
    enterHookId: "check_victory",
    descriptions: {
      first:
        "A low stone wall keeps faith with the edge of Greywick while wet grass leans under the dawn wind. East, the mine road heads into the scrub. Bram and Nessa both look colder than heroic.",
      repeat:
        "Greywick waits behind the wall. East, the mine road still offers the same bad idea."
    },
    exits: [{ direction: "east", targetRoomId: "mine_road" }],
    scenery: [
      {
        nouns: ["wall", "stone wall", "low wall", "stones"],
        description: "Dry-laid stone, older than anyone's grandmother. It keeps the town in and the weather out, roughly."
      },
      {
        nouns: ["grass", "wet grass"],
        description: "Wet enough to soak a boot through in a step. It leans east, as if it knows the way."
      },
      {
        nouns: ["town", "greywick", "roofs", "houses"],
        description: "Greywick is a smudge of roofs and one reluctant chimney. Nobody there expects you back with anything."
      },
      {
        nouns: ["road", "mine road", "track", "path"],
        description: "The road east is two ruts and an argument with the gorse. It goes to the mine and nowhere else."
      },
      {
        nouns: ["sky", "dawn", "wind", "weather"],
        description: "Grey going to pale gold, with a wind that makes the plan look worse than it did indoors."
      },
      {
        nouns: ["scrub", "hedges", "gorse", "bushes"],
        description: "Bare hedges and gorse, all of it hunched against the wind like it has heard about the mine."
      }
    ]
  },
  {
    id: "mine_road",
    title: "Mine Road",
    artId: "mine_road_hill",
    exterior: true,
    enterHookId: "check_victory",
    descriptions: {
      first:
        "The old mine road is mostly ruts, gorse, and memory. Town lies west. East, the loading yard hunches under the hill. A broken milestone has stayed on the job longer than the mine did.",
      repeat:
        "The muddy mine road still runs west to town and east to the loading yard, with the broken milestone keeping its lonely watch beside the track."
    },
    exits: [
      { direction: "west", targetRoomId: "town_edge" },
      { direction: "east", targetRoomId: "loading_yard" }
    ],
    scenery: [
      {
        nouns: ["road", "track", "ruts", "mud", "path"],
        description: "Ruts deep enough to remember ore carts. Nothing heavier than rumor has used the road in years."
      },
      {
        nouns: ["gorse", "scrub", "bushes"],
        description: "Gorse on both sides, yellow and spiteful. It has claimed the verges and is considering the road."
      },
      {
        nouns: ["hill", "hills", "hillside"],
        description: "The hill rises ahead with the mine workings scarred into its flank."
      },
      {
        nouns: ["spoil heap", "heap", "spoil", "slag"],
        description: "A spoil heap in the distance, grey and settled, the mine's only lasting monument."
      },
      {
        nouns: ["yard", "loading yard"],
        description: "East, the loading yard hunches under the hill, all broken angles. Closer inspection needs a closer stand."
      },
      {
        nouns: ["town", "greywick"],
        description: "West lies Greywick, and everything in it you are trying to leave behind."
      }
    ]
  },
  {
    id: "loading_yard",
    title: "Loading Yard",
    artId: "loading_yard_ruin",
    descriptions: {
      first:
        "Bent rails, rotten sleepers, and dead ore carts have collapsed the yard into a carpenter's nightmare. A locked shed stands east. North, warped planks still choke the mine mouth. An old crowbar lies among the wreckage.",
      repeat:
        "The loading yard remains a tangle of broken timber, dead carts, and opportunities with sharp edges."
    },
    exits: [
      { direction: "west", targetRoomId: "mine_road" },
      {
        direction: "east",
        targetRoomId: "foreman_shed",
        viaItemId: "shed_door",
        requiresOpenItemId: "shed_door",
        blockedMessage: "The shed door is still shut."
      },
      { direction: "north", targetRoomId: "broken_entrance", viaItemId: "entrance_planks" }
    ],
    scenery: [
      {
        nouns: ["carts", "ore carts", "cart", "ore cart", "dead carts"],
        description: "Two ore carts lean on each other like drunks at closing time. Neither will roll again, and neither holds anything but rust."
      },
      {
        nouns: ["rails", "bent rails", "rail", "tracks"],
        description: "The rails buckle and dive under the wreckage. They lead north, toward the mine, the way rails here always did."
      },
      {
        nouns: ["sleepers", "rotten sleepers", "timber", "timbers", "wreckage", "wood"],
        description: "Rotten sleepers and split timber, soft enough to put a boot through. Nothing here worth carrying except the crowbar."
      },
      {
        nouns: ["crane", "gantry", "hook", "crane hook", "dead crane"],
        description: "A dead crane leans over the yard, its hook frozen mid-reach. It has not lifted anything since the mine last paid wages."
      },
      {
        nouns: ["chain", "wet chain", "chains"],
        description: "A length of chain, wet and heavy, lying where it fell. It is going nowhere."
      },
      {
        nouns: ["planks", "mine mouth", "mine entrance", "entrance", "mine", "adit"],
        description: "North, warped planks still choke the mine mouth. You will need to be standing at them to do anything about them."
      }
    ]
  },
  {
    id: "foreman_shed",
    title: "Foreman's Shed",
    artId: "foreman_shed_interior",
    descriptions: {
      first:
        "Inside the shed, the mine's last practical week survives on shelves: a brass lamp, a flask of oil, a winding handle, and a ledger that says the assay office once held payroll worth stealing.",
      repeat:
        "The shed smells of dry timber and old paper. The useful things are the things still left on the shelf."
    },
    exits: [{ direction: "west", targetRoomId: "loading_yard" }],
    scenery: [
      {
        nouns: ["shelves", "shelf", "shelving"],
        description: "Plain plank shelves, sagging under dust and the few things nobody bothered to steal."
      },
      {
        nouns: ["roof", "slats", "daylight", "walls", "wall"],
        description: "Cold daylight slides in through the slats. The shed is dry by mine standards, which is not saying much."
      },
      {
        nouns: ["floor", "boards", "floorboards"],
        description: "Warped boards, swept once, long ago, by someone who was leaving."
      }
    ]
  },
  {
    id: "broken_entrance",
    title: "Broken Entrance",
    artId: "broken_entrance_adit",
    descriptions: {
      first:
        "The adit mouth is blocked by warped planks and old collapse rubbish. The timber is no longer holding anything up. It is simply in the way, which is almost insulting.",
      repeat:
        "The mine entrance waits behind the planks and rubble."
    },
    exits: [
      { direction: "south", targetRoomId: "loading_yard" },
      {
        direction: "north",
        targetRoomId: "lamp_room",
        viaItemId: "entrance_planks",
        requiredFlags: ["entrance_open"],
        blockedMessage: "The planks still choke the entrance."
      }
    ],
    scenery: [
      {
        nouns: ["stone", "mossy stone", "moss", "rock", "walls", "wall"],
        description: "Mossy stone, sweating cold. The mine begins here whether the planks agree or not."
      },
      {
        nouns: ["timbers", "timber", "beams", "props"],
        description: "The old props are past holding anything up. They stay standing out of habit."
      },
      {
        nouns: ["gap", "dark", "darkness", "opening", "way in"],
        description: "Behind the planks, a black gap breathes cold air at you. It smells of wet iron."
      }
    ]
  },
  {
    id: "lamp_room",
    title: "Lamp Room",
    artId: "lamp_room_brackets",
    descriptions: {
      first:
        "The air changes here. Damp stone and soot-blackened lamp brackets turn salvage into adventure. Beyond lies real mine darkness now, the sort that deserves a proper lamp and a second thought.",
      repeat:
        "Soot stains the brackets. The cold dark ahead feels more deliberate from here."
    },
    exits: [
      { direction: "south", targetRoomId: "broken_entrance" },
      { direction: "north", targetRoomId: "main_gallery" }
    ],
    scenery: [
      {
        nouns: ["brackets", "lamp brackets", "bracket", "soot"],
        description: "Iron brackets streaked black. Miners hung their lamps here before going down. The habit seems worth copying."
      },
      {
        nouns: ["stone", "walls", "wall", "rock", "damp"],
        description: "Damp stone, chill to the touch. The mine has been holding its breath in here for fifteen years."
      },
      {
        nouns: ["dark", "darkness", "gloom"],
        description: "North, the dark is total. Not the dark of night, the dark of underground, which has never met a window."
      },
      {
        nouns: ["dust", "floor"],
        description: "Dust on stone, unmarked by any boot but yours."
      }
    ]
  },
  {
    id: "main_gallery",
    title: "Main Gallery",
    artId: "main_gallery_hub",
    dark: true,
    descriptions: {
      first:
        "Old rails vanish into the gallery gloom while water ticks somewhere ahead. North lies the winch platform, east the flooded drift, and west an iron gate that refuses to budge. This is the mine's true center.",
      repeat:
        "The main gallery branches north and east, while the west gate waits on machinery and patience."
    },
    exits: [
      { direction: "south", targetRoomId: "lamp_room" },
      { direction: "north", targetRoomId: "winch_platform" },
      { direction: "east", targetRoomId: "flooded_drift" },
      {
        direction: "west",
        targetRoomId: "stores_chamber",
        viaItemId: "gate",
        requiredFlags: ["west_gate_open"],
        blockedMessage: "The west gate is still shut."
      }
    ],
    scenery: [
      {
        nouns: ["rails", "tracks", "rail", "track"],
        description: "Rails run off into the dark in three directions, pitted and patient."
      },
      {
        nouns: ["signboards", "signs", "sign", "signboard", "boards"],
        description: "Old signboards, painted words worn to ghosts. One arrow still points west with conviction."
      },
      {
        nouns: ["water", "drips", "drip", "dripping"],
        description: "Water ticks somewhere ahead, keeping time for nobody."
      },
      {
        nouns: ["roof", "supports", "timbers", "props", "ceiling"],
        description: "Roof supports, black with damp, doing their slow work of failing."
      },
      {
        nouns: ["dark", "darkness", "gloom"],
        description: "The lamp pushes the dark back a few yards. The dark does not seem bothered."
      }
    ]
  },
  {
    id: "winch_platform",
    title: "Winch Platform",
    artId: "winch_platform_shaft",
    dark: true,
    descriptions: {
      first:
        "A timber platform hangs over a shaft that swallows sound. The winch beside it still has teeth, but no handle. If the gate elsewhere answers to this machine, the shed handle is what it wants.",
      repeat:
        "The winch crouches over the shaft, waiting for its missing handle."
    },
    exits: [{ direction: "south", targetRoomId: "main_gallery" }],
    scenery: [
      {
        nouns: ["shaft", "pit", "hole", "drop", "bottom"],
        description: "The shaft goes down further than the lamp cares to say. Nothing down there is worth the drop, and there is no way back up."
      },
      {
        nouns: ["platform", "timbers", "planks", "boards", "timber"],
        description: "Timber planks over nothing much. They hold your weight with an air of reluctance."
      },
      {
        nouns: ["chains", "chain", "cable", "rope"],
        description: "Chains run from the winch drum off into the dark, toward whatever the gallery gate hangs from."
      },
      {
        nouns: ["brake wheel", "wheel", "drum"],
        description: "A rusted brake wheel and drum, part of the winch. They will move when the winch does."
      }
    ]
  },
  {
    id: "flooded_drift",
    title: "Flooded Drift",
    artId: "flooded_drift_ledge",
    dark: true,
    descriptions: {
      first:
        "Black water fills most of the drift, leaving only a narrow ledge along one wall. Somewhere on the far side, something brass glints near an abandoned satchel. Bram has the sense not to try it.",
      repeat:
        "The ledge is still there, thin and treacherous above the black water."
    },
    exits: [{ direction: "west", targetRoomId: "main_gallery" }],
    scenery: [
      {
        nouns: ["satchel", "bag", "far side", "other side", "glint", "brass"],
        description: "The satchel sits on the far side, exactly where a careful person would have died reaching it. Something brass glints beside it. Only the ledge gets there."
      },
      {
        nouns: ["walls", "wall", "rock", "stone"],
        description: "Wet rock, slick with fifteen years of seep. Not a handhold on it."
      },
      {
        nouns: ["reflection", "lamplight", "surface"],
        description: "The lamp lies flat on the black water and shows you nothing underneath."
      }
    ]
  },
  {
    id: "stores_chamber",
    title: "Stores Chamber",
    artId: "stores_chamber_beam",
    dark: true,
    descriptions: {
      first:
        "Dusty crates and broken tools crowd the stores chamber. A fallen beam pins the assay office door to the south. To the north, a draft slips past a narrow crawl and a grate that smells faintly of daylight.",
      repeat:
        "The stores chamber holds dust, broken gear, a blocked office door, and that promising draft to the north."
    },
    exits: [
      { direction: "east", targetRoomId: "main_gallery" },
      {
        direction: "south",
        targetRoomId: "assay_office",
        viaItemId: "assay_door",
        requiredFlags: ["beam_moved"],
        requiresOpenItemId: "assay_door",
        blockedMessage: "The office is still blocked."
      },
      { direction: "north", targetRoomId: "vent_crawl" }
    ],
    scenery: [
      {
        nouns: ["crates", "boxes", "crate", "broken crates", "box"],
        description: "Split crates, picked over long ago by people with more time than you. Dust and bent nails."
      },
      {
        nouns: ["tools", "picks", "broken tools", "gear", "shovels"],
        description: "Broken picks and a shovel without a blade. The miners took everything that still worked."
      },
      {
        nouns: ["draft", "draught", "air", "breeze"],
        description: "The draft comes from the north, cold and faintly green with daylight. Somewhere up that crawl, the mine leaks outside."
      },
      {
        nouns: ["crawl", "narrow crawl", "passage", "vent"],
        description: "A narrow crawl leads north, low enough to take skin off a careless scalp."
      },
      {
        nouns: ["grate", "bars", "daylight"],
        description: "The grate is up the crawl to the north, where the draft and the daylight come from. You would need to be there to do anything about it."
      },
      {
        nouns: ["dust", "floor"],
        description: "Dust thick enough to hold a footprint. Yours are the only ones."
      }
    ]
  },
  {
    id: "assay_office",
    title: "Assay Office",
    artId: "assay_office_lockbox",
    dark: true,
    descriptions: {
      first:
        "The office is smaller than the rumors made it sound: desk, scales, shelves, warped ledgers, and beside them the paymaster's lockbox. Ugly, iron-banded, and instantly worth the whole miserable morning.",
      repeat:
        "The assay office still holds the desk, the scales, and the lockbox that brought you here."
    },
    exits: [{ direction: "north", targetRoomId: "stores_chamber" }],
    scenery: [
      {
        nouns: ["ledgers", "ledger", "books", "warped ledgers", "book"],
        description: "Warped ledgers, columns of ore weights nobody will ever check again. Not one line about where the paymaster went."
      },
      {
        nouns: ["walls", "wall", "rock", "stone", "ceiling"],
        description: "Rock walls dressed smooth by somebody who wanted an office, not a cave. Drier than the rest of the mine."
      },
      {
        nouns: ["floor", "dust"],
        description: "Swept stone, once. The dust came back."
      }
    ]
  },
  {
    id: "vent_crawl",
    title: "Vent Crawl",
    artId: "vent_crawl_grate",
    dark: true,
    descriptions: {
      first:
        "The crawl is cramped but honest: stone, draft, rusted bars, and daylight somewhere just beyond them. It is not graceful, but it feels like the sort of exit thieves would call efficient.",
      repeat:
        "The vent crawl remains narrow, air-stirred, and one grate short of freedom."
    },
    exits: [
      { direction: "south", targetRoomId: "stores_chamber" },
      {
        direction: "east",
        targetRoomId: "mine_road",
        viaItemId: "vent_grate",
        requiredFlags: ["grate_open"],
        blockedMessage: "The grate is still shut."
      }
    ],
    scenery: [
      {
        nouns: ["daylight", "sky", "outside", "road"],
        description: "Daylight, grey and ordinary and the best thing you have seen all morning, waits on the far side of the bars."
      },
      {
        nouns: ["stone", "walls", "wall", "rock", "ceiling"],
        description: "Stone close enough on every side to feel like a coat that does not fit."
      },
      {
        nouns: ["draft", "draught", "air", "breeze"],
        description: "The draft pours in through the grate, cold and clean and smelling of gorse."
      }
    ]
  }
];
