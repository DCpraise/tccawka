import { EVOLVE } from "@/lib/evolve-config";

export function downloadCalendarFile() {
  const fmt = (d: string | Date) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = EVOLVE.days.flatMap((d) => [
    "BEGIN:VEVENT",
    `UID:evolve-${d.date}@thecrownedchurch`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(`${d.date}T08:00:00+01:00`)}`,
    `DTEND:${fmt(`${d.date}T18:00:00+01:00`)}`,
    `SUMMARY:Evolve – ${EVOLVE.speaker}`,
    `LOCATION:${EVOLVE.venue}`,
    `DESCRIPTION:Sessions at ${EVOLVE.sessions.join(" and ")}. ${EVOLVE.tagline}`,
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Evolve starts soon", "END:VALARM",
    "END:VEVENT",
  ]);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Crowned Church//Evolve//EN", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "evolve.ics"; a.click();
  URL.revokeObjectURL(url);
}
