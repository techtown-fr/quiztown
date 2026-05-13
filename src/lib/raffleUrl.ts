/**
 * URL helpers for the raffle feature.
 *
 * Why client-side parsing?
 * The `[id].astro` pages are statically pre-rendered for `id = 'demo'` only.
 * In production, Firebase Hosting rewrites `/raffle/{realId}` to that demo
 * HTML, so the real ID lives only in `window.location` at runtime.
 *
 * Both the `?id=` query param and the path segment are supported (the dev
 * preview at `/raffle/demo?id=xxx` uses the query, the prod rewrite uses
 * the path).
 */

// "/raffle/{id}" but NOT "/raffle/screen/..."
const RAFFLE_PATH_RE = /\/raffle\/(?!screen(?:\/|$))([^/?#]+)/;
const RAFFLE_SCREEN_PATH_RE = /\/raffle\/screen\/([^/?#]+)/;

function extractId(re: RegExp, pathname: string, search: string): string | null {
  const fromQuery = new URLSearchParams(search).get('id');
  if (fromQuery && fromQuery !== 'demo') return fromQuery;

  const match = pathname.match(re);
  if (match && match[1] && match[1] !== 'demo') return match[1];

  return null;
}

type Loc = { pathname: string; search: string };

/** Read the raffle ID from a player URL (`/raffle/{id}` or `?id=...`). */
export function getRaffleIdFromLocation(loc: Loc = window.location): string | null {
  return extractId(RAFFLE_PATH_RE, loc.pathname, loc.search);
}

/** Read the raffle ID from the projection screen URL (`/raffle/screen/{id}` or `?id=...`). */
export function getRaffleScreenIdFromLocation(loc: Loc = window.location): string | null {
  return extractId(RAFFLE_SCREEN_PATH_RE, loc.pathname, loc.search);
}
