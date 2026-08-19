import type { APIRoute } from 'astro';
import schedule from '../../data/schedule.json';
import { buildIcs, icsResponse, type ScheduleEvent } from '../../lib/calendar';

export const GET: APIRoute = () => {
  const body = buildIcs(schedule.events as ScheduleEvent[], {
    name: 'Stars National Walker (Family)',
    family: true,
  });
  return icsResponse(body, 'stars-family.ics');
};
