import { test, expect } from "@playwright/test";

/**
 * Scoped-down Playwright coverage for `/admin/edit` (Task 5 of the
 * admin-edit-page plan, v1).
 *
 * Only the anonymous-redirect path is real today — Convex magic-link auth
 * needs a non-trivial fixture (see test-harness plan), so the
 * authenticated paths are skipped with TODOs that point to that follow-up.
 *
 * NOTE: a richer auth-fixture-based suite already lives in
 * `admin-edit-page.spec.ts` (uses the dev-cookie short-circuit). This
 * file is the v1 minimum-viable surface called out by the plan, kept
 * separate so the auth-fixture work in the test-harness plan can land
 * here without touching the existing suite.
 */

test("anonymous redirect", async ({ page }) => {
  await page.goto("/admin/edit");
  // The page issues `router.replace("/admin/login")` from a `useEffect`,
  // so wait for the navigation rather than asserting URL synchronously.
  await page.waitForURL(/\/admin\/login/, { timeout: 5_000 });
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("authenticated admin sees three tabs", async ({ page }) => {
  test.skip(
    true,
    "TODO: requires Convex magic-link auth fixture; defer to test-harness plan",
  );

  // TODO(test-harness): log in as admin via magic-link fixture.
  await page.goto("/admin/edit");
  await expect(page.getByRole("tab", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Contacts" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Experience" })).toBeVisible();
});

test("copy slot edit round-trips", async ({ page }) => {
  test.skip(
    true,
    "TODO: requires Convex magic-link auth fixture; defer to test-harness plan",
  );

  // TODO(test-harness): log in as admin via magic-link fixture.
  await page.goto("/admin/edit");
  // TODO(test-harness): select a slot, type a marker, blur / Cmd+S to save,
  // reload, reselect the same slot, expect the marker to persist.
  const proseMirror = page.locator('[contenteditable="true"]').first();
  await proseMirror.click();
  await page.keyboard.type(" e2e-marker");
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+s" : "Control+s",
  );
  await page.reload();
  await expect(proseMirror).toContainText("e2e-marker");
});
