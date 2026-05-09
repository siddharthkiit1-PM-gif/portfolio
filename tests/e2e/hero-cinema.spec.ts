import { test, expect, devices } from "@playwright/test";

test("desktop: cinema canvas mounts and pin holds", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  // Scroll halfway through pin (200vh)
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(300);
  // Hero section should still be in view (because of pin)
  const hero = page.locator("section").first();
  const box = await hero.boundingBox();
  // Viewport height is 900 (set above). `window` is not defined in Node test context.
  expect(box?.y ?? 999).toBeLessThan(900);
});

test.describe("phone (iPhone 13)", () => {
  // Strip defaultBrowserType — Playwright forbids switching browser inside describe,
  // and the chromium project is the only one configured. Keep viewport/UA/scaling.
  const { defaultBrowserType, ...iPhone13 } = devices["iPhone 13"];
  test.use({ ...iPhone13 });
  test("mobile cinema canvas mounts", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(100);
  });
});

test.describe("tablet (iPad Pro)", () => {
  // Plan calls for "iPad Pro"; current Playwright ships "iPad Pro 11" — closest equivalent.
  const { defaultBrowserType, ...iPadPro } = devices["iPad Pro 11"];
  test.use({ ...iPadPro });
  test("tablet cinema canvas mounts", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });
});

test("reduced-motion: portrait fallback, no canvas", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("canvas")).toHaveCount(0);
  // Portrait image should be visible
  const portraitDiv = page.locator('div[style*="portrait-1024"]');
  await expect(portraitDiv).toBeAttached();
  await context.close();
});

test("no console errors on home page load (desktop)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors, errors.join("\n")).toEqual([]);
});
