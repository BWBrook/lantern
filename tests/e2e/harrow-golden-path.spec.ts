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

  const input = page.getByPlaceholder("Try LOOK, EAST, TAKE CROWBAR, or NESSA");

  for (const command of commands) {
    await input.fill(command);
    await input.press("Enter");
  }

  await expect(page.getByText("With the paymaster's lockbox in hand and open air around you")).toBeVisible();
  await expect(page.locator("#room-name")).toHaveText("Mine Road");
});

test("save, load, and restart work from the control buttons", async ({ page }) => {
  await page.goto("/");

  const input = page.getByPlaceholder("Try LOOK, EAST, TAKE CROWBAR, or NESSA");

  await input.fill("NESSA");
  await input.press("Enter");
  await expect(page.locator("#actor-name")).toHaveText("Nessa Vale");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#transcript")).toContainText("Progress saved.");

  await input.fill("BE BRAM");
  await input.press("Enter");
  await expect(page.locator("#actor-name")).toHaveText("Bram Pike");

  await page.getByRole("button", { name: "Load" }).click();
  await expect(page.locator("#actor-name")).toHaveText("Nessa Vale");
  await expect(page.locator("#transcript")).toContainText("Progress restored.");

  await page.getByRole("button", { name: "New Game" }).click();
  await expect(page.locator("#room-name")).toHaveText("Town Edge");
  await expect(page.locator("#actor-name")).toHaveText("Bram Pike");
});
