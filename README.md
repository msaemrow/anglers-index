# Anglers Index — Vue frontend

The first migrated route is the dashboard, built with Vue 3, Composition API, `<script setup>`, Vue Router, Vite, and Lucide icons. The existing backend remains the source of truth.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173/dashboard. Start the existing API on port 3001. Sign in with your existing Anglers Index username and password; account registration has not been migrated.

The default configuration works without an environment file. Copy `.env.example` to `.env.local` to override it:

- `VITE_API_BASE_URL`: `/api` by default.
- `API_PROXY_TARGET`: existing API address, default `http://localhost:3001`.
- `VITE_MAPBOX_ACCESS_TOKEN`: public Mapbox token (`pk.*`) for the interactive lake map. Add it to `.env.local` and restart Vite. For deployed builds, set it before building. The map uses Mapbox Outdoors with a lake marker, zoom controls, and an approximate-location label. Without a token, lake details remain available and a map placeholder is shown.

The development proxy forwards `/api/*` to the backend. It strips the browser Origin header on that server-to-server request so no backend CORS change is needed for local development.

## Scope and data flow

- `/dashboard`, `/`, and `/:username/profile` display the signed-in user's dashboard. The API scopes data to the bearer token, not the route username.
- `/:username/fishcatch/all` lists the signed-in user’s catches via `GET /fishcatch?user_id=…&orderBy=date:DESC`. Search, eligibility filtering, sorting, and pagination run locally on that response; the existing API has no server pagination. The URL username does not choose whose catches are requested. Empty, failed, and expired-session states are handled separately.
- `/:username/fishcatch/:id` displays a single catch using one cancellable `GET /fishcatch/:id` request. Dashboard catch cards use this Vue route. The page includes measurements, location, lure, conditions, photo fallbacks, and Master Angler eligibility. Submission/review/certificate workflows are not migrated.
- `/lakes/all` displays the public lake directory with search, a state filter, sorting, and pagination. `/lakes/:id` loads one lake and its Mapbox location map. Lake links now stay in Vue; admin add/edit links still open the existing app. Nearby lodging search is not migrated.
- A local sign-in panel uses `POST /users/login`. This is supporting authentication, not a migration of registration or other account routes.
- One `GET /dashboard` request returns lifetime statistics, up to five recent catches, up to five Master Angler catches, and the admin review preview. Refresh repeats that request; leaving the view or signing out cancels unfinished work.
- Dashboard data is local to the view. No Pinia/global data store or application-wide preloading is used.
- Session state is owned by each view's `useSession` composable and saved as `anglers-index.session` in browser storage. Decoded JWT claims only drive presentation; the API validates authorization.
- Buttons and navigation for unfinished routes open the existing app in the same tab. Its authentication storage is separate because it runs on another origin; you may need to sign in there separately. Tokens are never passed in links.
- API failures, empty collections, loading, expired sessions, and pending admin reviews have distinct states.

## Checks

```sh
npm run lint
npm test
npm run build
```

Tests cover session parsing/expiry, API authentication and cancellation, catch response validation, missing catches, photo URL resolution, lake responses, and coordinate validation. Visual review is manual.

## Deployment

`npm run build` produces `dist/`. Configure your host to serve `index.html` for Vue Router history routes. The Vite development proxy is not part of the production build: configure your deployment to proxy `/api` to the backend, or set `VITE_API_BASE_URL` to the deployed API URL and allow the frontend origin in backend CORS. Unimplemented routes stay in this app and display a placeholder page. Do not put secrets in `VITE_*` variables.

## Fishing trips

The Trips navigation opens `/:username/trips`; each trip has a detail page at `/:username/trips/:id`. Trips belong to the authenticated user and cover one lake. Trips automatically appear completed after their end date, including outings with no catches. Status is derived from calendar dates at midnight in America/Chicago; it needs no manual finish action or scheduled job. Legacy stored status flags are ignored.

Trips use calendar dates, not start/end times. Creation offers a start date, an end date, and a Multi-day trip checkbox. Trips default to a single day; checking Multi-day trip reveals an end date. Single-day trips use the start date for both dates. Both boundary dates include the entire day. The list and detail pages show date range, days, status, and catch count; hourly duration and catch rates are not calculated. Catch timestamps remain available for weather and time-of-day analysis.

Fish Mode shows compact trip controls on the left, stacked lake/lure selections on the right, and species buttons below. New trip opens the creation modal with the selected lake prefilled. A trip is only created when Save trip is submitted. It sets the trip lake for quick catch entry. The selected active trip is remembered on this device. The catch modal can choose an existing trip or start one with the first catch, including a custom date range. The API saves the inline trip and catch in one transaction. The trip detail page can link existing unassigned catches. The API validates catch ownership, matching lake, and catch dates within the inclusive trip range. Existing catches are not assigned automatically.

Trip notes currently save at creation. This increment does not add trip editing, multi-lake trips, or pause tracking.

Before using the updated API on another environment, run its `npm run migrate:up`, then restart the API. `20261008030000-fishing-trips.js` adds trips and nullable catch links. `20261008040000-trip-calendar-dates.js` adds calendar dates/status and preserves legacy timestamps for rollback. Legacy dates use America/Chicago because no timezone was saved; ranges expand to include recorded dates of linked catches.

Authenticated endpoints: `GET /trips` (cursor pages via `after`, optional active/completed `status`), `POST /trips` (lake_id, start_date, end_date or single_day: true, optional notes), `GET /trips/:id`, and `POST /trips/:id/catches` (catch_id). Dates use YYYY-MM-DD in the API and dd/mm/yyyy in displays. Catch creation accepts either trip_id or new_trip: { start_date, end_date, single_day }. Trip lists use bounded pages and grouped catch totals per page.

Fish Mode and the trip pages refresh when the America/Chicago calendar day changes or the window regains focus.

The trip detail page includes Delete trip with a confirmation explaining that catches are retained. `DELETE /trips/:id` checks ownership, locks the trip, clears catch trip_id values (including soft-deleted catches), and deletes the trip in one transaction. Catch details and Master Angler submissions remain intact. No schema migration is needed for deletion.

## Shared dropdowns

`src/components/ui/AppSelect.vue` wraps native dropdowns with consistent border, padding, arrow placement, and disabled styling. Use v-model and option slots; numeric option values stay numeric. Labels can wrap the component, or pass id and use a separate label with for. Attributes such as name, required, disabled, and aria-label forward to the native select. Sizes are compact, regular (default), and large. Searchable choices continue to use SearchSelect.vue.
