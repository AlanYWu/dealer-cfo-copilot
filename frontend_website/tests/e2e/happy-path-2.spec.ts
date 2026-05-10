import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_PDF = path.resolve(__dirname, "fixtures/tiny.pdf");

test.beforeEach(async () => {
  const dir = path.resolve(__dirname, ".tmp-data");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

test("log out, log back in, reopen past session from sidebar", async ({ page }) => {
  const username = "bob" + Date.now().toString(36);
  const password = "testtest1";

  await page.goto("/signup");
  await page.fill('input[minlength="2"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  await page.fill('input[placeholder="New folder"]', "Ford");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText("+ Upload PDF").last().click(),
  ]);
  await chooser.setFiles(FIXTURE_PDF);
  await expect(page.getByText("tiny.pdf")).toBeVisible({ timeout: 10_000 });

  await page.fill("input[placeholder^='Ask a question']", "unapplied labor");
  await page.click('button:has-text("Search")');
  await page.waitForURL(/\/s\/s_[a-f0-9]+$/);
  const sessionUrl = page.url();

  await page.click('button:has-text("Log out")');
  await page.waitForURL(/\/login$/);

  await page.fill("input", username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  await expect(page.getByText("unapplied labor")).toBeVisible();

  await page.click('a:has-text("unapplied labor")');
  await page.waitForURL(sessionUrl);
  await expect(page.locator('button:has(mark)').first()).toBeVisible();
});
