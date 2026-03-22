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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    onSubmit(value);
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
