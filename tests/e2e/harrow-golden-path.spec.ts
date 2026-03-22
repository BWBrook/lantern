import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("plays the Harrow golden path to victory", async ({ page }) => {
  const commands = readFileSync(
    join(process.cwd(), "adventures/harrow_mine/tests/golden-path.txt"),
    "utf8"
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  await page.goto("/");

  const input = page.getByPlaceholder("Try LOOK, TAKE CROWBAR, NESSA, PICK LOCK, or EAST");

  for (const command of commands) {
    await input.fill(command);
    await input.press("Enter");
  }

  await expect(page.getByText("With the paymaster's lockbox in hand and open air around you")).toBeVisible();
  await expect(page.locator("#room-name")).toHaveText("Mine Road");
});
