import { expect, test } from "@playwright/test";

test("boots the Lantern shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "The Harrow Mine Job" })).toBeVisible();
  await expect(page.getByText("Town Edge")).toBeVisible();
  await expect(page.getByPlaceholder("Try LOOK, INVENTORY, EAST, or WEST")).toBeVisible();
});
