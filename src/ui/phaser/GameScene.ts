import Phaser from "phaser";
import { eventBus } from "../../app/event-bus";
import { PLACEHOLDER_SCENE_KEY } from "./assets";

export class GameScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private readonly unsubscribe: Array<() => void> = [];

  constructor() {
    super(PLACEHOLDER_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1713);
    this.add.rectangle(width / 2, height / 2, width - 18, height - 18, 0x2a231b).setStrokeStyle(
      2,
      0x8d6d44
    );

    this.subtitleText = this.add.text(width / 2, 56, "Lantern host", {
      color: "#f2e7c8",
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontSize: "18px"
    });
    this.subtitleText.setOrigin(0.5, 0.5);

    this.titleText = this.add.text(width / 2, 128, "Awaiting room data", {
      align: "center",
      color: "#d8c39a",
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontSize: "28px",
      wordWrap: { width: width - 80 }
    });
    this.titleText.setOrigin(0.5, 0.5);

    this.unsubscribe.push(
      eventBus.on("room:changed", ({ adventureTitle, roomTitle, artLabel }) => {
        this.subtitleText?.setText(adventureTitle);
        this.titleText?.setText(`${roomTitle}\n${artLabel}`);
      })
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribe) {
        unsubscribe();
      }

      this.unsubscribe.length = 0;
    });
  }
}
