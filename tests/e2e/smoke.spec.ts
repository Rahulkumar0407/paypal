import { expect, test } from "@playwright/test";

test("home renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("today renders a forecast", async ({ page }) => {
  const response = await page.goto("/today");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Available Cash Today")).toBeVisible();
});

for (const path of ["/dues", "/approvals", "/ask", "/dashboard", "/settings", "/demo", "/store", "/design"] as const) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("each visitor gets their own store id", async ({ browser }) => {
  test.setTimeout(60000);
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pa = await a.newPage();
  const pb = await b.newPage();
  await pa.goto("/", { waitUntil: "domcontentloaded" });
  await pb.goto("/", { waitUntil: "domcontentloaded" });
  const idA = (await a.cookies()).find((c) => c.name === "ns_store")?.value;
  const idB = (await b.cookies()).find((c) => c.name === "ns_store")?.value;
  expect(idA).toMatch(/^st_[a-z0-9]{12}$/);
  expect(idB).toMatch(/^st_[a-z0-9]{12}$/);
  expect(idA).not.toBe(idB);
  await a.close();
  await b.close();
});
