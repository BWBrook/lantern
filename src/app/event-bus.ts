import type { RoomViewModel } from "../engine/types";

type LanternEventMap = {
  "room:changed": RoomViewModel;
};

class LanternEventBus {
  private readonly target = new EventTarget();

  emit<K extends keyof LanternEventMap>(type: K, detail: LanternEventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends keyof LanternEventMap>(
    type: K,
    handler: (detail: LanternEventMap[K]) => void
  ): () => void {
    const listener: EventListener = (event) => {
      const customEvent = event as CustomEvent<LanternEventMap[K]>;
      handler(customEvent.detail);
    };

    this.target.addEventListener(type, listener);

    return () => {
      this.target.removeEventListener(type, listener);
    };
  }
}

export const eventBus = new LanternEventBus();
