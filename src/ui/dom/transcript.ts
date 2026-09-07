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
    row.className = `transcript__line transcript__line--${line.kind}`;
    row.textContent =
      line.kind === "player" ? `> ${line.text}` : line.kind === "note" ? `# ${line.text}` : line.text;
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
