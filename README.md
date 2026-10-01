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
