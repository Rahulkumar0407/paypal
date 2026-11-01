import { expect, test } from "@playwright/test";

// Owner: Person 3. Foundation smoke test: every page renders with the stub data, on phone and laptop.

test("home reads the forecast sentence and shows 14 days", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Clear until Wednesday. On Thu 12 Nov you'll be $90 short: the supplier order and rent land the same day.",
  );
  await expect(page.getByRole("list", { name: "Your balance at the end of each of the next 14 days" }).getByRole("listitem")).toHaveCount(14);
  await expect(page.getByText("Thu 12 Nov closes at $150: covered.")).toBeVisible();
});

test("receipts print, with one blocked", async ({ page }) => {
  await page.goto("/receipts");
  await expect(page.getByRole("article").filter({ hasText: "Margin Guard receipt" })).toHaveCount(6);
  await expect(page.getByLabel("Receipt 9: Send reminder, blocked")).toBeVisible();
});

for (const [path, text] of [
  ["/dues", "payments in the next two weeks"],
  ["/approvals", "decisions are waiting for you"],
  ["/ask", "Every answer is worked out from your own numbers"],
  ["/dashboard", "Two weeks ahead"],
  ["/settings", "so the forecast fits the shop"],
  ["/demo", "This is your own copy of Loop Audio"],
  ["/store", "Loop Audio"],
  ["/design", "Money weather for a small shop"],
] as const) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(text);
  });
}

test("each visitor gets their own store id", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pa = await a.newPage();
  const pb = await b.newPage();
  await pa.goto("/");
  await pb.goto("/");
  const idA = (await a.cookies()).find((c) => c.name === "ns_store")?.value;
  const idB = (await b.cookies()).find((c) => c.name === "ns_store")?.value;
  expect(idA).toMatch(/^st_[a-z0-9]{12}$/);
  expect(idB).toMatch(/^st_[a-z0-9]{12}$/);
  expect(idA).not.toBe(idB);
  await a.close();
  await b.close();
});
