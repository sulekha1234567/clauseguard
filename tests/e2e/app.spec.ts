import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page renders hero and author footer", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Understand any contract/i }),
    ).toBeVisible();
    await expect(page.getByText(/Built by/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /LinkedIn/i })).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("authentication + dashboard", () => {
  test("demo user can sign in and see the seeded contract", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@clauseguard.app");
    await page.getByLabel("Password").fill("Demo1234");
    await page.getByRole("button", { name: /^Sign in$/ }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /Your contracts/i }),
    ).toBeVisible();
    await expect(page.getByText(/Sample Apartment Lease/i)).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@clauseguard.app");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /^Sign in$/ }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("can open a contract and see clause risk analysis", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@clauseguard.app");
    await page.getByLabel("Password").fill("Demo1234");
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByText(/Sample Apartment Lease/i).click();
    await expect(page).toHaveURL(/\/dashboard\/contracts\//);
    await expect(page.getByRole("heading", { name: /Clauses/i })).toBeVisible();
    await expect(page.getByText(/Automatic renewal/i)).toBeVisible();
    // Risk indicators present
    await expect(page.getByText(/High risk/i).first()).toBeVisible();
  });
});
