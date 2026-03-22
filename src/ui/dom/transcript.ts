import type { TranscriptLine } from "../../engine/types";

export interface TranscriptController {
  append(line: TranscriptLine): void;
  clear(): void;
}

export function createTranscriptController(
  container: HTMLElement
): TranscriptController {
  function append(line: TranscriptLine): void {
    const row = document.createElement("p");
    row.className =
      line.kind === "player" ? "transcript__line transcript__line--player" : "transcript__line";
    row.textContent = line.kind === "player" ? `> ${line.text}` : line.text;
    container.append(row);
    container.scrollTop = container.scrollHeight;
  }

  function clear(): void {
    container.innerHTML = "";
  }

  return {
    append,
    clear
  };
}
