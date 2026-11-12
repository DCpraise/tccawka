# Evolve-only mode

For now the public website is **just the Evolve page**.

- `/` and the old page links (`/about`, `/contact`, `/events`, `/give`, `/sermons`, `/beautiful-today`) all redirect to `/evolve`.
- The pages are NOT deleted. They are parked in `src/app/_archive/` (folders starting with `_` are not routed).
- The Evolve header has no navigation links, only the logo.
- Still working: the staff area (`/auth`, `/admin`, `/evolve-admin`, `/scan`...). Staff go to `/auth` directly, since there is no login link on the public page.

## Bring the full site back later
1. Move the folders in `src/app/_archive/` back to `src/app/` (`home/page.tsx` goes back to `src/app/page.tsx`).
2. Delete the `redirects()` block in `next.config.js`.
3. (Optional) Re-use the full `Header`/`Footer` from `src/components/site` on the Evolve page.
