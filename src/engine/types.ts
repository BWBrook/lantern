export type Direction = "north" | "south" | "east" | "west" | "up" | "down" | "in" | "out";

export type RoomId = string;
export type ItemId = string;
export type ActorId = string;
export type FlagId = string;
export type HookId = string;
export type ArtId = string;
export type ItemLocation = RoomId | "inventory" | "hidden" | `attached:${string}`;

export const CANONICAL_VERBS = [
  "LOOK",
  "EXAMINE",
  "GO",
  "TAKE",
  "DROP",
  "OPEN",
  "CLOSE",
  "UNLOCK",
  "USE",
  "LIGHT",
  "EXTINGUISH",
  "MOVE",
  "PUSH",
  "PULL",
  "SEARCH",
  "TURN",
  "ATTACH",
  "CROSS",
  "INVENTORY",
  "WAIT",
  "TALK",
  "LISTEN",
  "BREAK",
  "CLIMB",
  "FILL",
  "SWIM",
  "GIVE",
  "SWITCH_ACTOR",
  "SAVE",
  "LOAD",
  "HELP"
] as const;

export type CanonicalVerb = (typeof CANONICAL_VERBS)[number];

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

export type ParseConfidence = "exact" | "likely" | "low";

export interface DictionaryAliasEntry {
  aliases?: string[];
  nouns?: string[];
  adjectives?: string[];
  pronouns?: string[];
}

export interface AdventureCommandTemplate {
  verb: CanonicalVerb;
  actor?: string;
  directObject?: string;
  indirectObject?: string;
  preposition?: string;
  confidence?: ParseConfidence;
}

export interface AdventureDictionary {
  verbs: Partial<Record<CanonicalVerb, string[]>>;
  directions: Partial<Record<Direction, string[]>>;
  actors: Partial<Record<ActorId, DictionaryAliasEntry>>;
  items: Partial<Record<ItemId, DictionaryAliasEntry>>;
  groups?: Record<string, string[]>;
  noiseWords?: string[];
  stopWords?: string[];
  idioms?: Record<string, AdventureCommandTemplate>;
  phraseAliases?: Record<string, CanonicalVerb>;
}

export interface AdventureExit {
  direction: Direction;
  targetRoomId: RoomId;
  viaItemId?: ItemId;
  requiredFlags?: FlagId[];
  hiddenUnlessFlags?: FlagId[];
  requiresOpenItemId?: ItemId;
  blockedMessage?: string;
}

export interface AdventureScenery {
  nouns: string[];
  description: string;
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
  scenery?: AdventureScenery[];
}

export interface AdventureItem {
  id: ItemId;
  name: string;
  description: string;
  location: RoomId | "hidden";
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
  abilities?: string[];
}

export interface AdventureArt {
  id: ArtId;
  label: string;
  assetPath?: string;
  scene?: AdventureSceneSpec;
}

export interface AdventureScenePalette {
  skyTop: number;
  skyBottom: number;
  haze: number;
  terrain: number;
  silhouette: number;
  accent: number;
  glow: number;
  panel: number;
  panelBorder: number;
  caption: string;
  captionMuted: string;
}

interface SceneStroke {
  width: number;
  color: number;
  alpha?: number;
}

export type AdventureSceneElement =
  | {
      type: "circle";
      x: number;
      y: number;
      radius: number;
      color: number;
      alpha?: number;
    }
  | {
      type: "ellipse";
      x: number;
      y: number;
      width: number;
      height: number;
      color: number;
      alpha?: number;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: number;
      alpha?: number;
    }
  | {
      type: "polygon";
      x: number;
      y: number;
      points: number[];
      color: number;
      alpha?: number;
    }
  | {
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      color: number;
      alpha?: number;
      rotation?: number;
      stroke?: SceneStroke;
    };

export interface AdventureSceneSpec {
  palette: AdventureScenePalette;
  elements: AdventureSceneElement[];
  lampGlow?: boolean;
}

export interface AdventureRules {
  lightFlagId?: FlagId;
}

export interface AdventureContent {
  objective: string;
  responses?: Partial<Record<CanonicalVerb, string>>;
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
  confidence?: ParseConfidence;
  normalized?: string;
  particles?: string[];
}

export interface ResolvedIntent {
  verb: CanonicalVerb;
  actorId: ActorId;
  directObjectId: string | undefined;
  indirectObjectId: string | undefined;
  preposition: string | undefined;
  raw: string;
  confidence?: ParseConfidence;
  normalized?: string;
}

export interface PendingClarification {
  originalRaw: string;
  intent: Intent;
  objectRole: "directObject" | "indirectObject";
  candidateIds: ItemId[];
}

export interface ParserContext {
  lastIntent: ResolvedIntent | undefined;
  pendingClarification: PendingClarification | undefined;
}

export interface AtomicCommand {
  confidence: ParseConfidence;
  intent: ResolvedIntent;
  normalized: string;
  source: string;
}

export interface GameState {
  adventureId: string;
  currentRoomId: RoomId;
  previousRoomId: RoomId | undefined;
  activeActorId: ActorId;
  inventory: ItemId[];
  flags: FlagId[];
  itemLocations: Record<ItemId, ItemLocation>;
  itemStates: Record<ItemId, ItemRuntimeState>;
  parser: ParserContext;
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
}

export interface RoomViewModel {
  adventureTitle: string;
  adventureSummary: string;
  roomTitle: string;
  roomId: RoomId;
  artId: ArtId;
  artLabel: string;
  artAssetPath: string | undefined;
  scene: AdventureSceneSpec | undefined;
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
  savedAt: string;
  state: GameState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}
