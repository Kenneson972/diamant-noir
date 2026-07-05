import { calculateTransferAmounts } from "@/lib/stripe/connect";
import { getCommissionRate, stayCentsFromBooking, grossCentsFromBooking, channelLabel } from "./booking-revenue";

export type ConfirmedBookingInput = {
  id: string;
  villa_id: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  price: number | null;
  cleaning_fee: number | null;
  service_fee: number | null;
  total_price_cents: number | null;
  source: string | null;
};

export type MinimalBookingInput = {
  villa_id: string;
  start_date: string;
  price: number | null;
  cleaning_fee: number | null;
  service_fee: number | null;
  total_price_cents: number | null;
};

export type VillaInfo = { id: string; name: string };

export type VillaMonthRow = {
  villaId: string;
  name: string;
  gross: number;
  nightsSold: number;
  occupancyRate: number;
  adr: number;
  platformTotal: number;
  ownerNet: number;
  bookingCount: number;
  shareOfMonthPct: number;
};

export type ChannelMonthRow = {
  channel: string;
  gross: number;
  sharePct: number;
  commissionRate: number;
};

export type MonthBookingRow = {
  id: string;
  villaId: string;
  villaName: string;
  guestName: string;
  startDate: string;
  endDate: string;
  nights: number;
  channel: string;
  gross: number;
  platform: number;
  owner: number;
};

export type MonthDetail = {
  monthKey: string;
  label: string;
  gross: number;
  platformTotal: number;
  platformOnStay: number;
  platformCleaning: number;
  platformService: number;
  ownerNet: number;
  bookingCount: number;
  nightsSold: number;
  adr: number;
  avgBasket: number;
  occupancyRate: number;
  cancelled: { count: number; lostGross: number };
  pending: { count: number; potentialGross: number };
  byVilla: VillaMonthRow[];
  byChannel: ChannelMonthRow[];
  bookings: MonthBookingRow[];
};

export type BuildMonthlyDetailsResult = {
  /** MonthDetail complet, uniquement pour les monthKeys demandés (fenêtre affichée). */
  monthlyDetails: Record<string, MonthDetail>;
  /** CA brut par mois sur tout l'historique fourni (pour les comparaisons N-1/N-12, même hors fenêtre affichée). */
  monthlyGrossHistory: Record<string, number>;
};

const MONTH_LABELS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function monthKeyOf(dateStr: string): string {
  // Découpage manuel pour éviter le décalage timezone (new Date("2026-07-01") → 2026-06-30 en UTC-4).
  const [year, month] = dateStr.split("-");
  return `${year}-${month}`;
}

function monthLabelOf(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_LABELS_FR[month - 1]} ${year}`;
}

function nightsBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function emptyMonthDetail(monthKey: string): MonthDetail {
  return {
    monthKey,
    label: monthLabelOf(monthKey),
    gross: 0,
    platformTotal: 0,
    platformOnStay: 0,
    platformCleaning: 0,
    platformService: 0,
    ownerNet: 0,
    bookingCount: 0,
    nightsSold: 0,
    adr: 0,
    avgBasket: 0,
    occupancyRate: 0,
    cancelled: { count: 0, lostGross: 0 },
    pending: { count: 0, potentialGross: 0 },
    byVilla: [],
    byChannel: [],
    bookings: [],
  };
}

/**
 * Transforme les réservations brutes en un dictionnaire de détails mensuels.
 *
 * Deux conventions de rattachement cohabitent — toutes deux déjà utilisées ailleurs dans le code :
 * 1. CA / commission / ADR / nuitées vendues / annulé / pipeline → mois de la date d'arrivée (start_date).
 *    Une réservation à cheval sur deux mois compte entièrement dans le mois de son check-in.
 * 2. Taux d'occupation → découpage nuit par nuit avec chevauchement (même logique que occupancyByVilla
 *    dans app/(admin)/admin/page.tsx). Une résa à cheval sur juillet/août compte ses nuits dans les deux mois.
 *
 * Le champ nightsSold (et l'ADR qui en dérive) utilise la convention 1 (nuits entières) pour rester cohérent
 * avec le CA (même numérateur/dénominateur). C'est un nombre DIFFÉRENT des nuits occupées utilisées en
 * interne pour occupancyRate (convention 2).
 */
export function buildMonthlyDetails(params: {
  confirmedBookings: ConfirmedBookingInput[];
  cancelledBookings: MinimalBookingInput[];
  pendingBookings: MinimalBookingInput[];
  villas: VillaInfo[];
  monthKeys: string[];
}): BuildMonthlyDetailsResult {
  const { confirmedBookings, cancelledBookings, pendingBookings, villas, monthKeys } = params;
  const villaNameById = new Map(villas.map((v) => [v.id, v.name]));
  const monthKeySet = new Set(monthKeys);

  const monthlyGrossHistory: Record<string, number> = {};
  const monthlyDetails: Record<string, MonthDetail> = {};
  for (const key of monthKeys) monthlyDetails[key] = emptyMonthDetail(key);

  // Accumulateurs intermédiaires, uniquement pour les mois affichés.
  const villaAcc: Record<string, Record<string, {
    gross: number; nightsSold: number; stayGross: number;
    platformTotal: number; ownerNet: number; bookingCount: number;
  }>> = {};
  const channelAcc: Record<string, Record<string, { gross: number; rate: number }>> = {};
  const stayGrossByMonth: Record<string, number> = {};

  for (const b of confirmedBookings) {
    // Rattachement CA/commission/nuitées : mois de la date d'arrivée (check-in),
    // cf. commentaire JSDoc ci-dessus — différent de la convention utilisée pour l'occupation.
    const key = monthKeyOf(b.start_date);
    const gross = grossCentsFromBooking(b);

    // Historique complet (comparaisons N-1/N-12), y compris hors fenêtre affichée.
    monthlyGrossHistory[key] = (monthlyGrossHistory[key] ?? 0) + gross;

    if (!monthKeySet.has(key)) continue;

    const detail = monthlyDetails[key];
    const rate = getCommissionRate(b.source);
    const stayCents = stayCentsFromBooking(b);
    const cleaningCents = Math.round(Number(b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round(Number(b.service_fee ?? 0) * 100);
    const { ownerAmountCents, platformFeeCents: platformCents } = calculateTransferAmounts(
      stayCents, cleaningCents, serviceCents, rate
    );
    const commissionOnStay = Math.round(stayCents * (rate / 100));
    const nights = nightsBetween(b.start_date, b.end_date);
    const channel = channelLabel(b.source);
    const villaName = villaNameById.get(b.villa_id) ?? b.villa_id.slice(0, 8);

    detail.gross += gross;
    detail.platformTotal += platformCents;
    detail.platformOnStay += commissionOnStay;
    detail.platformCleaning += cleaningCents;
    detail.platformService += serviceCents;
    detail.ownerNet += ownerAmountCents;
    detail.bookingCount += 1;
    detail.nightsSold += nights;
    stayGrossByMonth[key] = (stayGrossByMonth[key] ?? 0) + stayCents;

    detail.bookings.push({
      id: b.id,
      villaId: b.villa_id,
      villaName,
      guestName: b.guest_name ?? "Anonyme",
      startDate: b.start_date,
      endDate: b.end_date,
      nights,
      channel,
      gross,
      platform: platformCents,
      owner: ownerAmountCents,
    });

    villaAcc[key] ??= {};
    villaAcc[key][b.villa_id] ??= { gross: 0, nightsSold: 0, stayGross: 0, platformTotal: 0, ownerNet: 0, bookingCount: 0 };
    const vAcc = villaAcc[key][b.villa_id];
    vAcc.gross += gross;
    vAcc.nightsSold += nights;
    vAcc.stayGross += stayCents;
    vAcc.platformTotal += platformCents;
    vAcc.ownerNet += ownerAmountCents;
    vAcc.bookingCount += 1;

    channelAcc[key] ??= {};
    channelAcc[key][channel] ??= { gross: 0, rate };
    channelAcc[key][channel].gross += gross;
  }

  // Annulés (rattachés au mois de start_date, même convention que le CA)
  for (const b of cancelledBookings) {
    const key = monthKeyOf(b.start_date);
    const gross = grossCentsFromBooking(b);
    monthlyGrossHistory[key] = (monthlyGrossHistory[key] ?? 0) + gross;
    if (!monthKeySet.has(key)) continue;
    monthlyDetails[key].cancelled.count += 1;
    monthlyDetails[key].cancelled.lostGross += gross;
  }

  // Pipeline (réservations en attente, même convention)
  for (const b of pendingBookings) {
    const key = monthKeyOf(b.start_date);
    const gross = grossCentsFromBooking(b);
    monthlyGrossHistory[key] = (monthlyGrossHistory[key] ?? 0) + gross;
    if (!monthKeySet.has(key)) continue;
    monthlyDetails[key].pending.count += 1;
    monthlyDetails[key].pending.potentialGross += gross;
  }

  for (const key of monthKeys) {
    const detail = monthlyDetails[key];
    detail.adr = detail.nightsSold > 0 ? Math.round((stayGrossByMonth[key] ?? 0) / detail.nightsSold) : 0;
    detail.avgBasket = detail.bookingCount > 0 ? Math.round(detail.gross / detail.bookingCount) : 0;

    detail.byVilla = Object.entries(villaAcc[key] ?? {})
      .map(([villaId, acc]) => ({
        villaId,
        name: villaNameById.get(villaId) ?? villaId.slice(0, 8),
        gross: acc.gross,
        nightsSold: acc.nightsSold,
        occupancyRate: 0, // complété par Task 5
        adr: acc.nightsSold > 0 ? Math.round(acc.stayGross / acc.nightsSold) : 0,
        platformTotal: acc.platformTotal,
        ownerNet: acc.ownerNet,
        bookingCount: acc.bookingCount,
        shareOfMonthPct: detail.gross > 0 ? Math.round((acc.gross / detail.gross) * 100) : 0,
      }))
      .sort((a, b) => b.gross - a.gross);

    detail.byChannel = Object.entries(channelAcc[key] ?? {})
      .map(([channel, acc]) => ({
        channel,
        gross: acc.gross,
        sharePct: detail.gross > 0 ? Math.round((acc.gross / detail.gross) * 100) : 0,
        commissionRate: acc.rate,
      }))
      .sort((a, b) => b.gross - a.gross);

    detail.bookings.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  return { monthlyDetails, monthlyGrossHistory };
}
