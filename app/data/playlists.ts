export interface Playlist {
  id: string;
  title: string;
  description: string;
  tags: string;
}

export const playlists: Playlist[] = [
  {
    id: "money-tracker",
    title: "Money Tracker",
    description:
      "Membangun aplikasi pencatat keuangan dari nol — mulai dari setup, auth, database schema, sampai dashboard.",
    tags: "Nuxt · Supabase · Better Auth",
  },
  {
    id: "tips",
    title: "Tips",
    description:
      "Hal-hal yang gua temukan untuk menambah produktifitas gua yang mungkin relate.",
    tags: "Tips · Random",
  },
];

export function findPlaylist(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}
