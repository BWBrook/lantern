import Phaser from "phaser";
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
  adventureSummary: HTMLElement;
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
              <p class="lantern-status__summary" id="adventure-summary"></p>
              <div class="lantern-status__chips">
                <div class="lantern-chip">
                  <strong>Room</strong>
                  <span id="room-name"></span>
                </div>
                <div class="lantern-chip">
                  <strong>Actor</strong>
                  <span id="actor-name"></span>
                </div>
                <div class="lantern-chip">
                  <strong>Lamp</strong>
                  <span id="lamp-state"></span>
                </div>
              </div>
              <p class="lantern-status__label">Current Aim</p>
              <p class="lantern-status__objective" id="objective-text"></p>
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
              aria-label="Command prompt"
              autocomplete="off"
              placeholder="Type a command and press Enter"
              spellcheck="false"
            />
            <button class="lantern-prompt__submit" type="submit" aria-label="Submit command">
              Enter
            </button>
          </form>
          <div class="lantern-controls__row">
            <button class="lantern-button" id="restart-button" type="button">New Game</button>
            <button class="lantern-button" id="save-button" type="button">Save</button>
            <button class="lantern-button" id="load-button" type="button">Load</button>
          </div>
          <p class="lantern-help">
            Plain English works: LOOK, EXAMINE something, GO somewhere, or ask a companion. Type HELP for more.
          </p>
        </section>
      </section>
    </main>
  `;

  return {
    adventureName: root.querySelector<HTMLElement>("#adventure-name")!,
    adventureSummary: root.querySelector<HTMLElement>("#adventure-summary")!,
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

function createGame(parent: HTMLElement): GameScene {
  const scene = new GameScene();
  new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#17120e",
    parent,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: INTERNAL_SCENE_WIDTH,
      height: INTERNAL_SCENE_HEIGHT
    },
    scene: [scene]
  });

  return scene;
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
  statusController: ReturnType<typeof createStatusController>,
  scene: GameScene
): void {
  transcriptController.clear();
  appendLines(transcriptController, state.transcript);

  const viewModel = createRoomViewModel(adventure, state);
  statusController.render(viewModel);
  scene.setRoomViewModel(viewModel);
}

export function bootApplication(root: HTMLElement | null): void {
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
    shell.adventureSummary,
    shell.roomName,
    shell.actorName,
    shell.objective,
    shell.lampState
  );

  const scene = createGame(shell.artMount);
  let state = createInitialTranscriptState(adventure);

  renderState(adventure, state, transcriptController, statusController, scene);

  function dispatch(command: string): void {
    state = runTurn(adventure, state, command, window.localStorage).state;
    renderState(adventure, state, transcriptController, statusController, scene);
    promptController.reset();
  }

  promptController.bind(dispatch);

  bindRestartButton(shell.restartButton, () => {
    state = createInitialTranscriptState(adventure);
    renderState(adventure, state, transcriptController, statusController, scene);
    promptController.focus();
  });

  shell.saveButton.addEventListener("click", () => {
    dispatch("SAVE");
  });

  shell.loadButton.addEventListener("click", () => {
    dispatch("LOAD");
  });

  // On a narrow screen an autofocused input scrolls the illustration away.
  if (window.matchMedia("(min-width: 901px)").matches) {
    promptController.focus();
  }
}
