import type { AstroIntegration } from 'astro';
import { appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import players from '../data/players.json';
import { generatePlayerShortSlug, generatePlayerSlug } from '../lib/slug';

/**
 * starsnatwalker.com/<firstname> → the player's page, tagged so clicks from X
 * land in Profile Views. Derived from players.json at build time so the list
 * can never drift from the roster.
 *
 * Appended to dist/_redirects rather than using Astro's `redirects` config:
 * without an adapter Astro emits meta-refresh HTML, which drops the 302 and
 * the X card crawler won't follow it.
 *
 * 302, not 301, so changing a destination takes effect without fighting
 * browser caches.
 */
export default function shortLinks(): AstroIntegration {
  return {
    name: 'short-links',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const seen = new Map<string, string>();
        const lines = ['', '# Player short links — generated from players.json by src/integrations/short-links.ts'];

        for (const p of players) {
          const name = `${p.firstName} ${p.lastName}`;
          const short = generatePlayerShortSlug(p.firstName);
          if (seen.has(short)) {
            throw new Error(`Short link /${short}/ is claimed by both ${seen.get(short)} and ${name}`);
          }
          if (existsSync(join(dist, short))) {
            throw new Error(`Short link /${short}/ for ${name} collides with an existing page`);
          }
          seen.set(short, name);
          const dest = `/players/${generatePlayerSlug(p.firstName, p.lastName)}/?utm_source=x&utm_medium=social&utm_campaign=profile-series-${p.gradYear}`;
          lines.push(`/${short}  ${dest}  302`, `/${short}/  ${dest}  302`);
        }

        appendFileSync(join(dist, '_redirects'), lines.join('\n') + '\n');
        logger.info(`${seen.size} player short links written`);
      },
    },
  };
}
