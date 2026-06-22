import { describe, it, expect } from "vitest";
import { calculateTransferAmounts } from "./connect";

describe("calculateTransferAmounts", () => {
  it("100€ séjour + 50€ ménage + 20€ frais service, commission 25%", () => {
    const result = calculateTransferAmounts(10000, 5000, 2000, 25);
    expect(result).toEqual({ ownerAmountCents: 7500, platformFeeCents: 9500 });
  });

  it("séjour à 0€ → seul le ménage + service vont à la plateforme", () => {
    const result = calculateTransferAmounts(0, 5000, 2000, 25);
    expect(result).toEqual({ ownerAmountCents: 0, platformFeeCents: 7000 });
  });

  it("commission 20% → proprio reçoit 80% du séjour", () => {
    const result = calculateTransferAmounts(20000, 0, 0, 20);
    expect(result).toEqual({ ownerAmountCents: 16000, platformFeeCents: 4000 });
  });

  it("commission par défaut (25%) si non spécifiée", () => {
    const result = calculateTransferAmounts(10000, 0, 0);
    expect(result).toEqual({ ownerAmountCents: 7500, platformFeeCents: 2500 });
  });
});
