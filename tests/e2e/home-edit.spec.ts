import { test, expect } from "@playwright/test";

test("admin sees edit affordances on the hero in dev", async ({ page }) => {
  // Programmatic dev sign-in via page.request so the cookie is bound
  // to the same browser context the page navigates with.
  const res = await page.request.post("/dev-auth", {
    data: { secret: "local-only-dev-secret", email: "siddharth@example.com" },
  });
  expect(res.ok()).toBe(true);

  await page.goto("/");
  // AdminBar appears
  await expect(page.getByText(/EDITING/)).toBeVisible();
  // Hero headline shows the dashed-outline cursor (admin hover state)
  const headline = page.getByText("I build products", { exact: true });
  await expect(headline).toBeVisible();
  await headline.click();
  // Tiptap mounts a ProseMirror contenteditable. Wait for it.
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible({
    timeout: 5000,
  });
});

test("public visitor sees no admin affordances", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/EDITING/)).toHaveCount(0);
});
