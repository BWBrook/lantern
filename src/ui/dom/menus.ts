export function bindRestartButton(
  button: HTMLButtonElement,
  onRestart: () => void
): void {
  button.addEventListener("click", () => {
    onRestart();
  });
}
