import { expect, test } from "@playwright/test";

test("real merchant journey", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/register");
  await page.fill('input[name="name"]', "Test Merchant");
  await page.fill('input[name="email"]', `merchant_${Date.now()}@example.com`);
  await page.fill('input[name="password"]', "SecurePass123!");
  await page.fill('input[name="storeName"]', "Test Store");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/onboarding/);

  // onboarding
  await page.fill('input[name="name"]', "Test Store");
  await page.fill('textarea[name="whatYouSell"], input[name="whatYouSell"]', "Test goods");
  await page.fill('input[name="openingBalanceDollars"]', "1000");
  await page.fill('input[name="minimumReserveDollars"]', "200");
  await page.click('button[type="submit"]:has-text("Save Merchant Setup")');
  await page.waitForURL(/\/today|\/onboarding/);

  // data page
  await page.goto("/data");
  await expect(page).toHaveURL(/\/data/);

  // add transaction
  await page.fill('input[name="occurredOn"]', "2026-11-03");
  await page.selectOption('select[name="direction"]', "IN");
  await page.fill('input[name="amountDollars"]', "50");
  await page.fill('input[name="description"]', "Test sale");
  await page.click('button:has-text("Save transaction")');
  await page.waitForTimeout(1000);

  // forecast page
  await page.goto("/today");
  await expect(page.getByText("Available Cash Today")).toBeVisible();
});
