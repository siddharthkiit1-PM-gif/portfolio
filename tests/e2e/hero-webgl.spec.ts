import { test, expect } from "@playwright/test";

test("hero mounts a webgl canvas in default mode", async ({ page }) => {
  await page.goto("/");
  // Canvas appears once dynamic import resolves
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  // Sanity: canvas has a non-zero size
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);
  expect(box?.height ?? 0).toBeGreaterThan(100);
});

test("reduced-motion users see no canvas", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  // Give the dynamic import time to resolve before asserting absence
  await page.waitForLoadState("networkidle");
  await expect(page.locator("canvas")).toHaveCount(0);
  await context.close();
});

test("no console errors on home page load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors, errors.join("\n")).toEqual([]);
});
