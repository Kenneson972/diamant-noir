import { describe, expect, it } from "vitest";
import { isStaffAdmin, postLoginDestination } from "./admin-access";

const ADMIN_DEST = "https://admin.kayvila.com/admin";

describe("postLoginDestination", () => {
  describe("compte staff", () => {
    it("envoie sur le sous-domaine admin (URL absolue) depuis /admin", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/admin",
          profileRole: "admin",
          metadataRole: undefined,
        })
      ).toBe(ADMIN_DEST);
    });

    it("redirige le staff hors de /dashboard et /espace-client", () => {
      for (const requestedRedirect of ["/dashboard", "/espace-client"]) {
        expect(
          postLoginDestination({
            requestedRedirect,
            profileRole: "admin",
            metadataRole: undefined,
          })
        ).toBe(ADMIN_DEST);
      }
    });

    it("reconnaît le staff via user_metadata quand profiles.role est absent", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/admin",
          profileRole: null,
          metadataRole: "admin",
        })
      ).toBe(ADMIN_DEST);
    });
  });

  describe("compte non staff demandant /admin", () => {
    // Régression : le middleware redirige admin.kayvila.com/admin vers
    // `/login?redirect=/admin`. Un non-staff qui se connecte alors repartait sur
    // kayvila.com/admin, où le 404 d'isolation du domaine public l'attendait.
    it("renvoie un locataire vers son espace, jamais vers /admin", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/admin",
          profileRole: "tenant",
          metadataRole: undefined,
        })
      ).toBe("/espace-client");
    });

    it("renvoie un propriétaire vers son dashboard, jamais vers /admin", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/admin",
          profileRole: "owner",
          metadataRole: undefined,
        })
      ).toBe("/dashboard");
    });

    it("couvre aussi les sous-routes /admin/*", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/admin/reservations",
          profileRole: "tenant",
          metadataRole: undefined,
        })
      ).toBe("/espace-client");
    });

    it("laisse intacte une destination légitime", () => {
      expect(
        postLoginDestination({
          requestedRedirect: "/espace-client/reservations",
          profileRole: "tenant",
          metadataRole: undefined,
        })
      ).toBe("/espace-client/reservations");
    });
  });
});

describe("isStaffAdmin", () => {
  it("n'accorde pas l'admin à un compte Google fraîchement créé", () => {
    // Un compte créé via OAuth Google n'a pas de user_metadata.role : l'accès
    // dépend entièrement de profiles.role (tenant par défaut).
    expect(isStaffAdmin("tenant", undefined, "karibloom972@gmail.com")).toBe(false);
  });

  it("accorde l'admin depuis profiles.role", () => {
    expect(isStaffAdmin("admin", undefined, "contact@kayvila.com")).toBe(true);
  });
});
