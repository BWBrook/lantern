import { expect, test } from "@playwright/test";

test("boots the Lantern shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "The Harrow Mine Job" })).toBeVisible();
  await expect(page.locator("#room-name")).toHaveText("Town Edge");
  await expect(page.locator("#prompt-input")).toBeVisible();
  await expect(page.locator("#transcript")).toContainText("Town Edge");
  await expect(page.locator("#transcript")).toContainText("You can go east to Mine Road.");
});
