import type { APIRoute } from 'astro';
import players from '../data/players.json';
import schedule from '../data/schedule.json';
import team from '../data/team.json';
import { generatePlayerSlug } from '../lib/slug';

const siteUrl = 'https://starsnatwalker.com';

// Every URL here MUST carry a trailing slash. Cloudflare Pages 308s the
// slashless form, so a sitemap of slashless URLs is a sitemap of redirects —
// it wastes crawl budget and splits signals across two URLs. That is how the
// homepage ended up outranking player pages for the players' own names.
//
// Slug functions are duplicated from their page templates on purpose: the
// originals are declared inside getStaticPaths and aren't importable. If a
// slug rule changes there, change it here too or the sitemap will list 404s.
const eventSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const staffSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const GET: APIRoute = () => {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', changefreq: 'weekly', priority: '1.0' },
    { url: 'recruiting/', changefreq: 'weekly', priority: '0.9' },
    { url: 'coaches/', changefreq: 'weekly', priority: '0.9' },
    { url: 'tryout/', changefreq: 'weekly', priority: '0.8' },
    { url: 'camps/', changefreq: 'weekly', priority: '0.8' },
    { url: 'pitchers/', changefreq: 'monthly', priority: '0.8' },
    { url: 'catchers/', changefreq: 'monthly', priority: '0.8' },
    { url: 'infielders/', changefreq: 'monthly', priority: '0.8' },
    { url: 'outfielders/', changefreq: 'monthly', priority: '0.8' },
    { url: 'contact/', changefreq: 'monthly', priority: '0.6' },
    { url: 'brand/', changefreq: 'yearly', priority: '0.3' },
  ];

  // Player pages are the point of this site — highest priority after home.
  const playerPages = players.map((player) => ({
    url: `players/${generatePlayerSlug(player.firstName, player.lastName)}/`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: player.lastUpdated || today,
  }));

  const staffPages = [
    ...team.coaches.map((c: any) => c.name),
    (team as any).recruitingCoordinator?.name,
  ]
    .filter(Boolean)
    .map((name: string) => ({
      url: `staff/${staffSlug(name)}/`,
      changefreq: 'monthly',
      priority: '0.6',
    }));

  // /events/[slug] generates only from `events` (not pastEvents).
  const eventPages = ((schedule as any).events || [])
    .filter((e: any) => e?.name)
    .map((e: any) => ({
      url: `events/${eventSlug(e.name)}/`,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  const allPages: any[] = [...staticPages, ...playerPages, ...staffPages, ...eventPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}/${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
