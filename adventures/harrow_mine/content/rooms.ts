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
    exits: [{ direction: "east", targetRoomId: "mine_road" }]
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
        "The muddy road runs west to town and east to the loading yard."
    },
    exits: [
      { direction: "west", targetRoomId: "town_edge" },
      { direction: "east", targetRoomId: "loading_yard" }
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
        requiresOpenItemId: "shed_door",
        blockedMessage: "The shed door is still shut."
      },
      { direction: "north", targetRoomId: "broken_entrance" }
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
    exits: [{ direction: "west", targetRoomId: "loading_yard" }]
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
        requiredFlags: ["entrance_open"],
        blockedMessage: "The planks still choke the entrance."
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
        requiredFlags: ["west_gate_open"],
        blockedMessage: "The west gate is still shut."
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
    exits: [{ direction: "south", targetRoomId: "main_gallery" }]
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
    exits: [{ direction: "west", targetRoomId: "main_gallery" }]
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
        requiredFlags: ["beam_moved"],
        requiresOpenItemId: "assay_door",
        blockedMessage: "The office is still blocked."
      },
      { direction: "north", targetRoomId: "vent_crawl" }
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
    exits: [{ direction: "north", targetRoomId: "stores_chamber" }]
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
        requiredFlags: ["grate_open"],
        blockedMessage: "The grate is still shut."
      }
    ]
  }
];
