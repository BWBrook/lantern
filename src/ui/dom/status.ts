interface StatusViewModel {
  actorName: string;
  objective: string;
  roomTitle: string;
  adventureTitle: string;
}

export interface StatusController {
  render(viewModel: StatusViewModel): void;
}

export function createStatusController(
  adventureNameElement: HTMLElement,
  roomNameElement: HTMLElement,
  actorElement: HTMLElement,
  objectiveElement: HTMLElement
): StatusController {
  return {
    render(viewModel) {
      adventureNameElement.textContent = viewModel.adventureTitle;
      roomNameElement.textContent = viewModel.roomTitle;
      actorElement.textContent = viewModel.actorName;
      objectiveElement.textContent = viewModel.objective;
    }
  };
}
