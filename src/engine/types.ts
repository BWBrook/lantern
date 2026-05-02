export type Direction = "north" | "south" | "east" | "west";

export type RoomId = string;
export type ItemId = string;
export type ActorId = string;
export type FlagId = string;
export type HookId = string;
export type ArtId = string;
export type ItemLocation = RoomId | "inventory" | "hidden" | `attached:${string}`;

export type CanonicalVerb =
  | "LOOK"
  | "EXAMINE"
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
  | "PUSH"
  | "PULL"
  | "SEARCH"
  | "TURN"
  | "ATTACH"
  | "CROSS"
  | "INVENTORY"
  | "WAIT"
  | "SWITCH_ACTOR"
  | "SAVE"
  | "LOAD"
  | "HELP";

export type ItemActionHookName =
  | "attach"
  | "close"
  | "cross"
  | "examine"
  | "light"
  | "move"
  | "open"
  | "search"
  | "take"
  | "turn"
  | "unlock"
  | "use";

export interface TranscriptLine {
  kind: "system" | "player";
  text: string;
}

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

export interface AdventureDictionary {
  verbs: Partial<Record<CanonicalVerb, string[]>>;
  directions: Partial<Record<Direction, string[]>>;
  actors: Partial<Record<ActorId, string[]>>;
  items: Partial<Record<ItemId, string[]>>;
  groups?: Record<string, string[]>;
  stopWords?: string[];
  phraseAliases?: Record<string, CanonicalVerb>;
}

export interface AdventureExit {
  direction: Direction;
  targetRoomId: RoomId;
  requiredFlags?: FlagId[];
  hiddenUnlessFlags?: FlagId[];
  requiresOpenItemId?: ItemId;
  blockedMessage?: string;
}

export interface AdventureRoom {
  id: RoomId;
  title: string;
  artId: ArtId;
  dark?: boolean;
  exterior?: boolean;
  enterHookId?: HookId;
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
  location: RoomId | "hidden";
  aliases?: string[];
  portable?: boolean;
  scenery?: boolean;
  openable?: boolean;
  initiallyOpen?: boolean;
  lockable?: boolean;
  initiallyLocked?: boolean;
  keyItemId?: ItemId;
  requiredFlagsToOpen?: FlagId[];
  blockedOpenMessage?: string;
  hooks?: Partial<Record<ItemActionHookName, HookId>>;
}

export interface AdventureActor {
  id: ActorId;
  name: string;
  description: string;
  aliases?: string[];
  abilities?: string[];
}

export interface AdventureArt {
  id: ArtId;
  label: string;
  assetPath?: string;
}

export interface AdventureRules {
  lightFlagId?: FlagId;
}

export interface AdventureContent {
  objective: string;
  rooms: AdventureRoom[];
  items: AdventureItem[];
  actors: AdventureActor[];
  flags: FlagId[];
  art: AdventureArt[];
}

export interface ItemRuntimeState {
  open?: boolean;
  locked?: boolean;
}

export interface AdventureStateSeed {
  currentRoomId: RoomId;
  activeActorId: ActorId;
  inventory?: ItemId[];
  flags?: FlagId[];
  itemLocations?: Partial<Record<ItemId, ItemLocation>>;
  itemStates?: Partial<Record<ItemId, ItemRuntimeState>>;
}

export interface PronounState {
  it: string | undefined;
  them: string[] | undefined;
}

export interface Intent {
  verb: CanonicalVerb;
  actorId: ActorId | undefined;
  directObject: string | undefined;
  indirectObject: string | undefined;
  preposition: string | undefined;
  raw: string;
}

export interface ResolvedIntent {
  verb: CanonicalVerb;
  actorId: ActorId;
  directObjectId: string | undefined;
  indirectObjectId: string | undefined;
  preposition: string | undefined;
  raw: string;
}

export interface GameState {
  adventureId: string;
  currentRoomId: RoomId;
  activeActorId: ActorId;
  inventory: ItemId[];
  flags: FlagId[];
  itemLocations: Record<ItemId, ItemLocation>;
  itemStates: Record<ItemId, ItemRuntimeState>;
  pronouns: PronounState;
  visitCounts: Record<RoomId, number>;
  transcript: TranscriptLine[];
}

export interface ValidationIssue {
  scope: "metadata" | "room" | "item" | "actor" | "flag" | "art" | "hook" | "save";
  message: string;
  id?: string;
}

export interface HookContext {
  adventure: AdventureDefinition;
  state: GameState;
  intent: ResolvedIntent;
  actor: AdventureActor;
  room: AdventureRoom;
  directItem: AdventureItem | undefined;
  indirectItem: AdventureItem | undefined;
}

export interface HookResult {
  state: GameState;
  messages: string[];
}

export type AdventureHook = (context: HookContext) => HookResult;

export type AdventureHookRegistry = Record<HookId, AdventureHook>;

export interface AdventureDefinition {
  metadata: AdventureMetadata;
  theme: AdventureTheme;
  dictionary: AdventureDictionary;
  rules?: AdventureRules;
  content: AdventureContent;
  hooks: AdventureHookRegistry;
  createInitialState(): AdventureStateSeed;
  validate(): ValidationIssue[];
}

export interface RoomViewModel {
  adventureTitle: string;
  adventureSummary: string;
  roomTitle: string;
  roomId: RoomId;
  artId: ArtId;
  artLabel: string;
  artAssetPath: string | undefined;
  actorName: string;
  objective: string;
  lampState: string;
}

export interface TurnResult {
  state: GameState;
  messages: string[];
}

export interface SaveRecord {
  adventureId: string;
  adventureVersion: string;
  savedAt: string;
  state: GameState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}
