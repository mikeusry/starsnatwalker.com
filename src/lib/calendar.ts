import { generateEventSlug } from './slug';

export type EventType = 'tournament' | 'camp' | 'practice' | 'hotel' | 'travel' | 'other';
export type EventVisibility = 'public' | 'family';

export type TeamHotel = {
  label: string;
  url: string;
  note?: string | null;
  address?: string | null;
};

export interface ScheduleEvent {
  id?: string;
  name: string;
  org?: string | null;
  dates: string;
  start?: string;
  end?: string;
  timezone?: string;
  location?: string | null;
  venue?: string | null;
  address?: string | null;
  hotel?: string | null;
  hotelAddress?: string | null;
  hotelUrl?: string | null;
  hotelBlocks?: TeamHotel[];
  schedulePosted?: string | null;
  notes?: string | null;
  type?: EventType;
  visibility?: EventVisibility;
  isShowcase?: boolean;
  note?: string;
  result?: string;
}

const SITE = 'https://starsnatwalker.com';
const DEFAULT_TZ = 'America/New_York';

const TYPE_LABEL: Record<EventType, string> = {
  tournament: 'Tournament',
  camp: 'Camp',
  practice: 'Practice',
  hotel: 'Hotel',
  travel: 'Travel',
  other: 'Event',
};

export function eventId(event: ScheduleEvent): string {
  if (event.id) return event.id;
  return generateEventSlug(`${event.name}-${event.start || event.dates}`);
}

export function eventType(event: ScheduleEvent): EventType {
  return event.type || 'tournament';
}

export function typeLabel(event: ScheduleEvent): string {
  if (event.isShowcase) return 'Showcase';
  return TYPE_LABEL[eventType(event)];
}

export function isPublic(event: ScheduleEvent): boolean {
  return event.visibility !== 'family';
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function ymdToUtcEnd(ymd: { y: number; m: number; d: number }): Date {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 23, 59, 59));
}

function addDays(ymd: { y: number; m: number; d: number }, days: number): string {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
  return dt.toISOString().slice(0, 10);
}

function compactDate(ymd: string): string {
  return ymd.replace(/-/g, '');
}

/** Fall back for events that still only have a display string like "Oct 17-18, 2026". */
export function parseEndDateFromDisplay(dates: string): Date | null {
  const year = dates.match(/(\d{4})\s*$/)?.[1];
  if (!year) return null;
  const tail = dates.replace(/\s*\d{4}\s*$/, '').split(/\s*[-–]\s*/).pop()?.trim() ?? '';
  const month = tail.match(/[A-Za-z]{3,}/)?.[0] ?? dates.match(/[A-Za-z]{3,}/)?.[0];
  const day = tail.match(/\d{1,2}/)?.[0];
  if (!month || !day) return null;
  const parsed = new Date(`${month} ${day}, ${year} 23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function eventStartYmd(event: ScheduleEvent): string | null {
  if (event.start && parseYmd(event.start)) return event.start.slice(0, 10);
  return null;
}

export function eventEndYmd(event: ScheduleEvent): string | null {
  if (event.end && parseYmd(event.end)) return event.end.slice(0, 10);
  return eventStartYmd(event);
}

export function eventEndInclusive(event: ScheduleEvent): Date | null {
  const end = eventEndYmd(event);
  if (end) {
    const ymd = parseYmd(end);
    if (ymd) return ymdToUtcEnd(ymd);
  }
  return parseEndDateFromDisplay(event.dates);
}

export function isUpcoming(event: ScheduleEvent, now = new Date()): boolean {
  if (event.result) return false;
  const end = eventEndInclusive(event);
  if (!end) return true;
  return end.getTime() >= now.getTime();
}

export function upcomingEvents(
  events: ScheduleEvent[],
  opts: { family?: boolean } = {},
): ScheduleEvent[] {
  return events
    .filter((event) => isUpcoming(event))
    .filter((event) => opts.family || isPublic(event))
    .sort((a, b) => (eventStartYmd(a) || a.dates).localeCompare(eventStartYmd(b) || b.dates));
}

export function nextEvent(
  events: ScheduleEvent[],
  opts: { family?: boolean } = {},
): ScheduleEvent | null {
  return upcomingEvents(events, opts)[0] ?? null;
}

export function locationLine(event: ScheduleEvent): string {
  return [event.venue, event.location].filter(Boolean).join(' · ');
}

export function mapsUrl(event: ScheduleEvent): string | null {
  const query = event.address || [event.venue, event.location].filter(Boolean).join(', ');
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function placeMapsUrl(query: string | null | undefined): string | null {
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function directionsUrl(origin: string, destination: string): string {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function directionsEmbedUrl(origin: string, destination: string): string {
  const params = new URLSearchParams({
    saddr: origin,
    daddr: destination,
    output: 'embed',
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export function teamHotels(event: ScheduleEvent): TeamHotel[] {
  if (event.hotelBlocks?.length) return event.hotelBlocks;
  if (event.hotelUrl || event.hotel) {
    return [
      {
        label: event.hotel || 'Team hotel block',
        url: event.hotelUrl || '',
        note: null,
        address: event.hotelAddress ?? null,
      },
    ];
  }
  return [];
}

export function hasTeamHotel(event: ScheduleEvent): boolean {
  return teamHotels(event).some((h) => h.url);
}

export function travelKitPath(event: ScheduleEvent): string | null {
  if (!event.id && !event.name) return null;
  return `/family/travel/${eventId(event)}/`;
}

export function eventPagePath(event: ScheduleEvent): string | null {
  if (!isPublic(event) || eventType(event) !== 'tournament') return null;
  return `/events/${generateEventSlug(event.name)}/`;
}

export function googleTemplateUrl(event: ScheduleEvent): string {
  const start = eventStartYmd(event);
  const end = eventEndYmd(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    details: icsDescription(event),
  });
  const loc = locationLine(event);
  if (loc) params.set('location', loc);
  if (start) {
    const startYmd = parseYmd(start);
    const endYmd = parseYmd(end || start);
    if (startYmd && endYmd) {
      // Google all-day dates are exclusive on the end, same as ICS.
      params.set('dates', `${compactDate(start)}/${compactDate(addDays(endYmd, 1))}`);
    }
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsDescription(event: ScheduleEvent): string {
  const parts = [
    event.org,
    event.note,
    event.notes,
    event.hotel && `Hotel: ${event.hotel}`,
    eventPagePath(event) && `${SITE}${eventPagePath(event)}`,
  ].filter(Boolean);
  return parts.join('\n') || 'Stars National Walker';
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldIcs(line: string): string {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return chunks.join('\r\n');
}

function vevent(event: ScheduleEvent): string {
  const start = eventStartYmd(event);
  const end = eventEndYmd(event) || start;
  if (!start || !end) return '';
  const endYmd = parseYmd(end);
  if (!endYmd) return '';

  const loc = locationLine(event);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${eventId(event)}@starsnatwalker.com`,
    `DTSTAMP:${compactDate(start)}T120000Z`,
    `DTSTART;VALUE=DATE:${compactDate(start)}`,
    `DTEND;VALUE=DATE:${compactDate(addDays(endYmd, 1))}`,
    `SUMMARY:${escapeIcs(event.name)}`,
    `CATEGORIES:${escapeIcs(typeLabel(event).toUpperCase())}`,
    loc && `LOCATION:${escapeIcs(loc)}`,
    `DESCRIPTION:${escapeIcs(icsDescription(event))}`,
    `URL:${SITE}${eventPagePath(event) || '/'}`,
    'END:VEVENT',
  ].filter(Boolean) as string[];

  return lines.map(foldIcs).join('\r\n');
}

export function buildIcs(
  events: ScheduleEvent[],
  opts: { name: string; family?: boolean } = { name: 'Stars National Walker' },
): string {
  const selected = upcomingEvents(events, { family: opts.family }).filter(eventStartYmd);
  const blocks = selected.map(vevent).filter(Boolean);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stars National Walker//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(opts.name)}`,
    `X-WR-TIMEZONE:${DEFAULT_TZ}`,
    ...blocks,
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function icsResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
