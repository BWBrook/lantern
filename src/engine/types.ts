export type Direction = "north" | "south" | "east" | "west";

export type RoomId = string;
export type ItemId = string;
export type ActorId = string;
export type FlagId = string;
export type HookId = string;
export type ArtId = string;

export interface TranscriptLine {
  kind: "system" | "player";
  text: string;
}

export type CanonicalVerb =
  | "LOOK"
  | "GO"
  | "TAKE"
  | "DROP"
  | "OPEN"
  | "CLOSE"
  | "UNLOCK"
  | "USE"
  | "LIGHT"
  | "EXTINGUISH"
  | "MOVE"
  | "SEARCH"
  | "INVENTORY"
  | "WAIT"
  | "SWITCH_ACTOR"
  | "SAVE"
  | "LOAD"
  | "HELP";

export interface AdventureMetadata {
  id: string;
  title: string;
  version: string;
  summary: string;
}

export interface AdventureTheme {
  accentColor: string;
  panelColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface AdventureLexicon {
  actorAliases: Record<string, ActorId>;
  directionAliases: Record<string, Direction>;
  nounAliases: Record<string, string>;
  verbAliases: Record<string, string>;
}

export interface AdventureExit {
  direction: Direction;
  targetRoomId: RoomId;
  hookId?: HookId;
}

export interface AdventureRoom {
  id: RoomId;
  title: string;
  artId: ArtId;
  descriptions: {
    first: string;
    repeat: string;
  };
  exits: AdventureExit[];
}

export interface AdventureItem {
  id: ItemId;
  name: string;
  description: string;
  location: RoomId;
  aliases?: string[];
  hookId?: HookId;
}

export interface AdventureActor {
  id: ActorId;
  name: string;
  description: string;
  aliases?: string[];
}

export interface AdventureArt {
  id: ArtId;
  label: string;
}

export interface AdventureContent {
  objective: string;
  rooms: AdventureRoom[];
  items: AdventureItem[];
  actors: AdventureActor[];
  flags: FlagId[];
  art: AdventureArt[];
}

export interface AdventureStateSeed {
  currentRoomId: RoomId;
  activeActorId: ActorId;
  inventory?: ItemId[];
  flags?: FlagId[];
}

export interface AdventureHookContext {
  actorId: ActorId;
  roomId: RoomId;
}

export type AdventureHook = (context: AdventureHookContext) => string | void;

export type AdventureHookRegistry = Record<HookId, AdventureHook>;

export interface AdventureDefinition {
  metadata: AdventureMetadata;
  theme: AdventureTheme;
  lexicon: AdventureLexicon;
  content: AdventureContent;
  hooks: AdventureHookRegistry;
  createInitialState(): AdventureStateSeed;
  validate(): ValidationIssue[];
}

export interface ValidationIssue {
  scope: "metadata" | "room" | "item" | "actor" | "flag" | "art" | "hook";
  message: string;
  id?: string;
}

export interface GameState {
  adventureId: string;
  currentRoomId: RoomId;
  activeActorId: ActorId;
  inventory: ItemId[];
  flags: FlagId[];
  visitCounts: Record<RoomId, number>;
  transcript: TranscriptLine[];
}

export interface RoomViewModel {
  adventureTitle: string;
  roomTitle: string;
  artLabel: string;
}

export interface TurnResult {
  state: GameState;
  messages: string[];
}

export interface Intent {
  verb: CanonicalVerb;
  actorId: ActorId | undefined;
  directObject: string | undefined;
  indirectObject: string | undefined;
  preposition: string | undefined;
  raw: string;
}
