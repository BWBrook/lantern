import type { AdventureRoom } from "../../../src/engine/types";

export const rooms: AdventureRoom[] = [
  {
    id: "town_edge",
    title: "Town Edge",
    artId: "town_edge_dawn",
    descriptions: {
      first:
        "Cold grass bends against the low wall above Greywick. The mine road waits to the east while Bram and Nessa pretend this is a professional job.",
      repeat:
        "Greywick sits behind you in the morning gloom. East, the mine road climbs toward trouble."
    },
    exits: [
      {
        direction: "east",
        targetRoomId: "mine_road"
      }
    ]
  },
  {
    id: "mine_road",
    title: "Mine Road",
    artId: "mine_road_hill",
    descriptions: {
      first:
        "The road is more mud than track now, hemmed by gorse and the memory of wagons. Greywick lies west. The loading yard waits farther east.",
      repeat:
        "The hill road runs west to town and east to the mine yard."
    },
    exits: [
      {
        direction: "west",
        targetRoomId: "town_edge"
      },
      {
        direction: "east",
        targetRoomId: "loading_yard"
      }
    ]
  },
  {
    id: "loading_yard",
    title: "Loading Yard",
    artId: "loading_yard_ruin",
    descriptions: {
      first:
        "Bent rails and dead ore carts choke the yard. Somewhere under the wreckage waits a usable crowbar. West is the road back toward town.",
      repeat:
        "The loading yard is a sprawl of rotten timber, broken iron, and the beginning of a much worse idea."
    },
    exits: [
      {
        direction: "west",
        targetRoomId: "mine_road"
      }
    ]
  }
];
