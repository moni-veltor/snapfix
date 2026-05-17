import "server-only";

type IcsInput = {
  uid: string;
  title: string;
  description: string;
  location: string | null;
  start: Date;
  durationMin: number;
  organizerName: string;
  organizerEmail: string;
  attendeeEmails: string[];
};

/** Minimal RFC 5545 .ics generator. Single VEVENT, UTC timestamps. */
export function generateIcs(input: IcsInput): string {
  const dtstart = toIcsDate(input.start);
  const dtend = toIcsDate(new Date(input.start.getTime() + input.durationMin * 60_000));
  const dtstamp = toIcsDate(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SnapFix//Plan-an-Exercise//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(input.uid)}@snapfix`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(input.description)}`,
    ...(input.location ? [`LOCATION:${escapeIcs(input.location)}`] : []),
    `ORGANIZER;CN=${escapeIcs(input.organizerName)}:mailto:${input.organizerEmail}`,
    ...input.attendeeEmails.map(
      (email) =>
        `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`,
    ),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function toIcsDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
