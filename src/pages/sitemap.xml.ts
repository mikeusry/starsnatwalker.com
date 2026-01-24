import type { APIRoute } from 'astro';
import players from '../data/players.json';
import { generatePlayerSlug } from '../lib/slug';

const siteUrl = 'https://starsnatwalker.com';

export const GET: APIRoute = () => {
  const pages = [
    { url: '', changefreq: 'weekly', priority: '1.0' },
    { url: 'coaches', changefreq: 'weekly', priority: '0.9' },
    { url: 'tryout', changefreq: 'weekly', priority: '0.9' },
    { url: 'contact', changefreq: 'monthly', priority: '0.8' },
  ];

  // Add player pages
  const playerPages = players.map((player) => ({
    url: `players/${generatePlayerSlug(player.firstName, player.lastName)}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: player.lastUpdated || new Date().toISOString().split('T')[0],
  }));

  const allPages = [...pages, ...playerPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}/${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
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
