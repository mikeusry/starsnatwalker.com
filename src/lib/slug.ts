/**
 * Generate URL-friendly slug from text
 * @param text - Text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate player slug from first and last name
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 * @returns Slug in format first-last
 */
export function generatePlayerSlug(firstName: string, lastName: string): string {
  return `${slugify(firstName)}-${slugify(lastName)}`;
}

/**
 * Generate structured data (JSON-LD) for athlete
 * @param player - Player data
 * @returns JSON-LD structured data
 */
export function generateAthleteStructuredData(player: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${player.firstName} ${player.lastName}`,
    jobTitle: 'Softball Athlete',
    memberOf: {
      '@type': 'SportsTeam',
      name: 'Stars National Walker',
      sport: 'Softball',
    },
    ...(player.photoUrl && { image: player.photoUrl }),
    ...(player.twitter && {
      sameAs: [`https://x.com/${player.twitter}`],
    }),
  };
}
