import { test, expect, type Page } from "@playwright/test";

const PREBOOK = {
  villaId: "11111111-1111-1111-1111-111111111111",
  email: "visiteur@test.com",
  startDate: "2026-08-01",
  endDate: "2026-08-05",
  guests: 4,
  firstName: "Jean",
};

async function openChatbot(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le chat" }).click();
  await expect(page.getByPlaceholder("Tapez votre message...")).toBeVisible();
}

test.describe("Chatbot visiteur — pré-réservation & escalade", () => {
  test("preBooking → appelle pre-book et affiche la carte avec le bon lien", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Parfait, je vous prépare cette réservation.",
          stage: "prebook",
          preBooking: PREBOOK,
          suggestedQuickReplies: [],
        }),
      })
    );
    const bookingUrl =
      "/book?villaId=" + PREBOOK.villaId + "&checkin=2026-08-01&checkout=2026-08-05&guests=4";
    let preBookBody: Record<string, unknown> | null = null;
    await page.route("**/api/chat/pre-book", async (route) => {
      preBookBody = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, bookingUrl }),
      });
    });

    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je confirme ma réservation");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");

    const cta = page.getByRole("link", { name: "Réserver cette villa" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", bookingUrl);
    // Le front a bien transmis les champs attendus par validatePreBook
    expect(preBookBody).toMatchObject({
      villaId: PREBOOK.villaId,
      email: PREBOOK.email,
      startDate: PREBOOK.startDate,
      endDate: PREBOOK.endDate,
      guests: PREBOOK.guests,
      name: PREBOOK.firstName,
    });
  });

  test("pre-book en échec → pas de carte mais le message reste", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply: "Je note votre demande.", stage: "prebook", preBooking: PREBOOK }),
      })
    );
    await page.route("**/api/chat/pre-book", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Villa introuvable." }),
      })
    );
    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je confirme");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");
    await expect(page.getByText("Je note votre demande.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Réserver cette villa" })).toHaveCount(0);
  });

  test("shouldEscalateToHuman → bandeau handoff", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Je transmets votre demande à notre équipe.",
          stage: "handoff",
          shouldEscalateToHuman: true,
        }),
      })
    );
    await openChatbot(page);
    await page.getByPlaceholder("Tapez votre message...").fill("Je veux parler à un humain");
    await page.getByPlaceholder("Tapez votre message...").press("Enter");
    await expect(page.getByText("Notre équipe vous contactera personnellement")).toBeVisible();
  });
});
