export const VENUE = "Cine Bangüê" as const;
export const TIMEZONE = "America/Fortaleza";
export const OFFICIAL_INDEX = "https://funesc.pb.gov.br/conheca-a-funesc/cine-bangue-programacao";
export const OFFICIAL_TEXT = `${OFFICIAL_INDEX}/programacao-cine-bangue-texto`;
export type Film = {
  id: string; title: string; director: string | null; year: number | null;
  duration: number | null; rating: string | null; synopsis: string | null;
  country: string | null; genre: string | null; poster: string | null;
  backdrop?: string | null; tmdbId: number | null; sourceUrl: string;
  trailer?: { youtubeId: string; url: string; title: string; language: string; sourceUrl: string } | null;
};
export type Session = {
  id: string; venue: typeof VENUE; date: string; time: string; startsAt: string;
  title: string; filmId: string | null; kind: "film" | "shorts";
  debate: boolean; accessible: boolean; children: boolean; free: boolean;
  price: { full: number | null; half: number | null };
  sourceUrl: string; sourceText: string; needsReview: boolean;
};
export type Issue = {
  id: string; code: string; message: string; sessionIds: string[];
  resolved: boolean; resolution?: string;
};
export type Schedule = {
  schemaVersion: 1; venue: typeof VENUE; timezone: string; period: string;
  sourceUrl: string; pdfUrl: string | null; fetchedAt: string; sourceHash: string;
  films: Film[]; sessions: Session[]; noSessionDates: string[]; issues: Issue[];
  validation?: { name: string; url: string; checkedAt: string; status: "fulfilled" | "rejected"; observations: number; matched: number }[];
};
