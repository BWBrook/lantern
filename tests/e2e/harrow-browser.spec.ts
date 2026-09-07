import { expect, test } from "@playwright/test";

test("save, load, and restart work from the control buttons", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("#prompt-input");

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

test("accepts a natural-language mini-chain with pronouns", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("#prompt-input");

  await input.fill("east then east then take crowbar then north then use it on planks");
  await input.press("Enter");

  await expect(page.locator("#room-name")).toHaveText("Broken Entrance");
  await expect(page.locator("#transcript")).toContainText("Taken: old crowbar.");
  await expect(page.locator("#transcript")).toContainText("Bram leans on the crowbar");
});

test("records playtest notes and exports the transcript", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const input = page.locator("#prompt-input");

  await input.fill("east");
  await input.press("Enter");
  await input.fill("# expected to see the milestone mentioned first");
  await input.press("Enter");
  await expect(page.locator("#transcript")).toContainText("# expected to see the milestone mentioned first");

  await page.getByRole("button", { name: "Copy Transcript" }).click();
  await expect(page.locator("#transcript")).toContainText("# transcript copied to the clipboard");

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("> east");
  expect(clipboard).toContain("# expected to see the milestone mentioned first");
});
