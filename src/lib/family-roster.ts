import { generatePlayerSlug } from './slug';

export interface RosterParent {
  name: string;
  phone?: string;
  email?: string;
}

export interface RosterContact {
  number?: number;
  name: string;
  playerEmail?: string;
  playerPhone?: string;
  school?: string;
  parents?: RosterParent[];
}

export interface EnrichedRosterPlayer {
  number?: number;
  name: string;
  playerEmail?: string;
  playerPhone?: string;
  school?: string;
  parents: RosterParent[];
  photoUrl?: string;
  twitter?: string;
  hometown: string;
  path: string;
  hasContact: boolean;
}

export function normName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function telHref(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '');
}

export function buildFamilyRoster(
  players: Array<{
    firstName: string;
    lastName: string;
    photoUrl?: string;
    twitter?: string;
    hometown?: string;
    highSchool?: string;
    contactEmail?: string | null;
  }>,
  contacts: RosterContact[],
): EnrichedRosterPlayer[] {
  const byName = new Map(contacts.map((contact) => [normName(contact.name), contact]));

  return players
    .map((player) => {
      const name = `${player.firstName} ${player.lastName}`;
      const contact = byName.get(normName(name));
      const playerEmail = contact?.playerEmail || player.contactEmail || undefined;
      const hasContact = Boolean(
        playerEmail ||
          contact?.playerPhone ||
          (contact?.parents && contact.parents.length > 0),
      );
      return {
        number: contact?.number,
        name,
        playerEmail,
        playerPhone: contact?.playerPhone,
        school: contact?.school || player.highSchool,
        parents: contact?.parents || [],
        photoUrl: player.photoUrl,
        twitter: player.twitter || undefined,
        hometown: player.hometown || player.highSchool || contact?.school || '',
        path: `/players/${generatePlayerSlug(player.firstName, player.lastName)}/`,
        hasContact,
      };
    })
    .sort((a, b) => {
      if (a.number != null && b.number != null) return a.number - b.number;
      if (a.number != null) return -1;
      if (b.number != null) return 1;
      return a.name.localeCompare(b.name);
    });
}
