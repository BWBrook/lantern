import Phaser from "phaser";
import { eventBus } from "./event-bus";
import { INTERNAL_SCENE_HEIGHT, INTERNAL_SCENE_WIDTH } from "./settings";
import { loadActiveAdventure } from "./load-adventure";
import { createRoomViewModel, createInitialTranscriptState, runTurn } from "../engine/turn";
import { validateAdventureBundle } from "../engine/validation";
import type { AdventureDefinition, GameState, TranscriptLine } from "../engine/types";
import { bindRestartButton } from "../ui/dom/menus";
import { createPromptController } from "../ui/dom/prompt";
import { createStatusController } from "../ui/dom/status";
import { createTranscriptController } from "../ui/dom/transcript";
import { GameScene } from "../ui/phaser/GameScene";

interface ShellElements {
  adventureName: HTMLElement;
  roomName: HTMLElement;
  actorName: HTMLElement;
  objective: HTMLElement;
  lampState: HTMLElement;
  transcript: HTMLElement;
  promptForm: HTMLFormElement;
  promptInput: HTMLInputElement;
  restartButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  loadButton: HTMLButtonElement;
  artMount: HTMLElement;
}

function buildShell(root: HTMLElement): ShellElements {
  root.innerHTML = `
    <main class="lantern-shell">
      <section class="lantern-frame">
        <div class="lantern-stage">
          <section class="lantern-card lantern-art" id="lantern-art"></section>
          <aside class="lantern-sidebar">
            <section class="lantern-card lantern-status">
              <p class="lantern-status__eyebrow">Bundled Adventure</p>
              <h1 class="lantern-status__title" id="adventure-name"></h1>
              <p class="lantern-status__room" id="room-name"></p>
              <div class="lantern-status__meta">
                <div>
                  <strong>Active Actor</strong>
                  <span id="actor-name"></span>
                </div>
                <div>
                  <strong>Lamp</strong>
                  <span id="lamp-state"></span>
                </div>
                <div>
                  <strong>Objective</strong>
                  <span id="objective-text"></span>
                </div>
              </div>
            </section>
            <section class="lantern-card lantern-log">
              <div class="transcript" id="transcript" aria-live="polite"></div>
            </section>
          </aside>
        </div>
        <section class="lantern-card lantern-controls">
          <form class="lantern-prompt" id="prompt-form">
            <input
              id="prompt-input"
              class="lantern-prompt__input"
              autocomplete="off"
              placeholder="Try LOOK, TAKE CROWBAR, NESSA, PICK LOCK, or EAST"
              spellcheck="false"
            />
          </form>
          <div class="lantern-controls__row">
            <button class="lantern-button" id="restart-button" type="button">New Game</button>
            <button class="lantern-button" id="save-button" type="button">Save</button>
            <button class="lantern-button" id="load-button" type="button">Load</button>
          </div>
          <p class="lantern-help">
            The parser supports directed commands, actor switching, inventory, object interaction, and save/load.
          </p>
        </section>
      </section>
    </main>
  `;

  return {
    adventureName: root.querySelector<HTMLElement>("#adventure-name")!,
    roomName: root.querySelector<HTMLElement>("#room-name")!,
    actorName: root.querySelector<HTMLElement>("#actor-name")!,
    objective: root.querySelector<HTMLElement>("#objective-text")!,
    lampState: root.querySelector<HTMLElement>("#lamp-state")!,
    transcript: root.querySelector<HTMLElement>("#transcript")!,
    promptForm: root.querySelector<HTMLFormElement>("#prompt-form")!,
    promptInput: root.querySelector<HTMLInputElement>("#prompt-input")!,
    restartButton: root.querySelector<HTMLButtonElement>("#restart-button")!,
    saveButton: root.querySelector<HTMLButtonElement>("#save-button")!,
    loadButton: root.querySelector<HTMLButtonElement>("#load-button")!,
    artMount: root.querySelector<HTMLElement>("#lantern-art")!
  };
}

function applyTheme(root: HTMLElement, adventure: AdventureDefinition): void {
  root.style.setProperty("--lantern-accent", adventure.theme.accentColor);
  root.style.setProperty("--lantern-panel", adventure.theme.panelColor);
  root.style.setProperty("--lantern-background", adventure.theme.backgroundColor);
  root.style.setProperty("--lantern-text", adventure.theme.textColor);
}

function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: INTERNAL_SCENE_WIDTH,
    height: INTERNAL_SCENE_HEIGHT,
    backgroundColor: "#17120e",
    parent,
    pixelArt: true,
    roundPixels: true,
    scene: [GameScene]
  });
}

function appendLines(
  transcriptController: ReturnType<typeof createTranscriptController>,
  lines: TranscriptLine[]
): void {
  for (const line of lines) {
    transcriptController.append(line);
  }
}

function renderState(
  adventure: AdventureDefinition,
  state: GameState,
  transcriptController: ReturnType<typeof createTranscriptController>,
  statusController: ReturnType<typeof createStatusController>
): void {
  transcriptController.clear();
  appendLines(transcriptController, state.transcript);

  const viewModel = createRoomViewModel(adventure, state);
  statusController.render(viewModel);
  eventBus.emit("room:changed", viewModel);
}

export async function bootApplication(root: HTMLElement | null): Promise<void> {
  if (!root) {
    throw new Error("Missing app root.");
  }

  const adventure = loadActiveAdventure();
  const issues = validateAdventureBundle(adventure);

  if (issues.length > 0) {
    root.innerHTML = `<pre>${issues.map((issue) => `${issue.scope}: ${issue.message}`).join("\n")}</pre>`;
    throw new Error(`Adventure validation failed for ${adventure.metadata.id}.`);
  }

  applyTheme(root, adventure);
  const shell = buildShell(root);
  const transcriptController = createTranscriptController(shell.transcript);
  const promptController = createPromptController(shell.promptForm, shell.promptInput);
  const statusController = createStatusController(
    shell.adventureName,
    shell.roomName,
    shell.actorName,
    shell.objective,
    shell.lampState
  );

  const game = createGame(shell.artMount);
  let state = createInitialTranscriptState(adventure);

  renderState(adventure, state, transcriptController, statusController);

  function dispatch(command: string): void {
    state = runTurn(adventure, state, command, window.localStorage).state;
    renderState(adventure, state, transcriptController, statusController);
    promptController.reset();
  }

  promptController.bind(dispatch);

  bindRestartButton(shell.restartButton, () => {
    state = createInitialTranscriptState(adventure);
    renderState(adventure, state, transcriptController, statusController);
    promptController.focus();
  });

  shell.saveButton.addEventListener("click", () => {
    dispatch("SAVE");
  });

  shell.loadButton.addEventListener("click", () => {
    dispatch("LOAD");
  });

  root.addEventListener(
    "DOMNodeRemoved",
    () => {
      game.destroy(true);
    },
    { once: true }
  );

  promptController.focus();
}
