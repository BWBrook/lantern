interface StatusViewModel {
  actorName: string;
  objective: string;
  roomTitle: string;
  adventureTitle: string;
  adventureSummary: string;
  lampState: string;
}

export interface StatusController {
  render(viewModel: StatusViewModel): void;
}

export function createStatusController(
  adventureNameElement: HTMLElement,
  adventureSummaryElement: HTMLElement,
  roomNameElement: HTMLElement,
  actorElement: HTMLElement,
  objectiveElement: HTMLElement,
  lampElement: HTMLElement
): StatusController {
  return {
    render(viewModel) {
      adventureNameElement.textContent = viewModel.adventureTitle;
      adventureSummaryElement.textContent = viewModel.adventureSummary;
      roomNameElement.textContent = viewModel.roomTitle;
      actorElement.textContent = viewModel.actorName;
      objectiveElement.textContent = viewModel.objective;
      lampElement.textContent = viewModel.lampState;
    }
  };
}
