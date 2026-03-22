export interface PromptController {
  bind(handler: (command: string) => void): void;
  focus(): void;
  reset(): void;
}

export function createPromptController(
  form: HTMLFormElement,
  input: HTMLInputElement
): PromptController {
  let onSubmit = (_command: string): void => {};
  const history: string[] = [];
  let historyIndex = -1;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!value) {
      return;
    }

    history.push(value);
    historyIndex = history.length;
    onSubmit(value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (history.length === 0) {
        return;
      }

      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? "";
      input.setSelectionRange(input.value.length, input.value.length);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (history.length === 0) {
        return;
      }

      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] ?? "";
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  return {
    bind(handler) {
      onSubmit = handler;
    },
    focus() {
      input.focus();
    },
    reset() {
      input.value = "";
      input.focus();
    }
  };
}
