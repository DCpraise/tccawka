// Single source of truth for the Evolve program. Pure data (safe to import on server and client).
export type EvolveCategory = "member" | "worker" | "state_pastor" | "campus_pastor";

export const EVOLVE = {
  name: "Evolve",
  tagline: "...your personal transformation",
  speaker: "Pastor Isaac",
  startsAt: "2026-11-19T08:00:00+01:00",
  endsAt: "2026-11-22T18:00:00+01:00",
  // Registration closes right before the first session. Change if you want an earlier cut-off.
  registrationClosesAt: "2026-11-19T07:00:00+01:00",
  dateLabel: "Thursday 19th – Sunday 22nd November 2026",
  days: [
    { date: "2026-11-19", label: "Thursday 19 Nov" },
    { date: "2026-11-20", label: "Friday 20 Nov" },
    { date: "2026-11-21", label: "Saturday 21 Nov" },
    { date: "2026-11-22", label: "Sunday 22 Nov" },
  ],
  sessions: ["8:00 AM", "4:00 PM"],
  venue: "36 Abakaliki Street, beside Queens Suites, Awka, Anambra State",
  phone: "808 176 6433",
  phoneHref: "tel:+2348081766433",
  whatsappUrl: "https://wa.me/2348081766433",
  // Registration fee in Naira One payment covers all four days. Paid categories are only registered AFTER payment is confirmed.
  fees: { member: 5000, worker: 10000, state_pastor: 30000, campus_pastor: 20000 } as Record<EvolveCategory, number>,
  categoryLabels: {
    member: "Member", worker: "Worker", state_pastor: "State Pastor", campus_pastor: "Satellite / Campus Pastor",
  } as Record<EvolveCategory, string>,
};

export const isPaidCategory = (c: EvolveCategory) => EVOLVE.fees[c] > 0;
