export type PlayerPhotoSource = {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  jerseyOk?: boolean;
};

export function playerInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Photos stay visible unless jerseyOk is explicitly false. */
export function showPlayerPhoto(player: PlayerPhotoSource): boolean {
  return Boolean(player.photoUrl) && player.jerseyOk !== false;
}
