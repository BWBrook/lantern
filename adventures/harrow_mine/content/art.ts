import type { AdventureArt } from "../../../src/engine/types";

export const art: AdventureArt[] = [
  {
    id: "town_edge_dawn",
    label: "Town Edge at cold dawn",
    assetPath: new URL("../assets/rooms/town_edge_dawn.png", import.meta.url).href
  },
  { id: "mine_road_hill", label: "Mine Road climbing through wet scrub" },
  {
    id: "loading_yard_ruin",
    label: "The broken loading yard and its dead carts",
    assetPath: new URL("../assets/rooms/loading_yard_ruin.png", import.meta.url).href
  },
  { id: "foreman_shed_interior", label: "The cramped interior of the foreman's shed" },
  { id: "broken_entrance_adit", label: "The blocked mine entrance behind warped planks" },
  { id: "lamp_room_brackets", label: "The lamp room with soot-blackened brackets" },
  {
    id: "main_gallery_hub",
    label: "The main gallery with rails and a shut west gate",
    assetPath: new URL("../assets/rooms/main_gallery_hub.png", import.meta.url).href
  },
  { id: "winch_platform_shaft", label: "The winch platform above a dark shaft" },
  { id: "flooded_drift_ledge", label: "The flooded drift and its narrow ledge" },
  { id: "stores_chamber_beam", label: "The cluttered stores chamber and fallen beam" },
  { id: "assay_office_lockbox", label: "The dusty assay office with the paymaster's lockbox" },
  { id: "vent_crawl_grate", label: "The vent crawl and the rusted grate to daylight" }
];
