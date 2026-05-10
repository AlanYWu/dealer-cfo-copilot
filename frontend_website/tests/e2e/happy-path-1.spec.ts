import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_PDF = path.resolve(__dirname, "fixtures/tiny.pdf");

test.beforeEach(async () => {
  const dir = path.resolve(__dirname, ".tmp-data");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

test("signup → upload → search → see quote → PDF pane updates", async ({ page }) => {
  const username = "alice" + Date.now().toString(36);

  await page.goto("/signup");
  await page.fill('input[minlength="2"]', username);
  await page.fill('input[type="password"]', "testtest1");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  await page.fill('input[placeholder="New folder"]', "Ford");
  const chooser = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText("+ Upload PDF").last().click(),
  ]);
  await chooser[0].setFiles(FIXTURE_PDF);

  await expect(page.getByText("tiny.pdf")).toBeVisible({ timeout: 10_000 });

  await page.fill("input[placeholder^='Ask a question']", "unapplied labor");
  await page.click('button:has-text("Search")');

  await page.waitForURL(/\/s\/s_[a-f0-9]+$/, { timeout: 10_000 });

  const firstCard = page.locator('button:has(mark)').first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).toContainText("unapplied", { ignoreCase: true });

  await expect(page.getByText(/tiny\.pdf/).first()).toBeVisible();
});
