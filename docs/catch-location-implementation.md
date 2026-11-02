# Private catch locations

## Agreed behavior

Catch coordinates are private to their owner, including when an administrator reviews a catch. Missing location or denied device permission must never prevent saving an otherwise valid catch. Capture is a single position, not background tracking. Existing lake coordinates and weather lookups remain independent.

## Delivery plan

1. **Settings and capture/editing — implemented (2026-10-31).** Persist an opt-in default (off initially), initialize a per-catch checkbox, capture current device position with accuracy/time, support manual coordinates/pin placement, retry and removal. Backdated catches require an explicit current-location action. Provide owner-only location editing on catch details. Preserve draft data after failed saves. Add API validation, ownership checks and migration.
2. **Map displays — implemented (2026-10-31).** Show the owner's catch point and accuracy on catch details. Add owner-only lake markers based on catch lake ID, clusters with counts, tap/click catch summaries, identical-point lists, and date/species filters. Fetch lightweight marker data. Refactor existing map primitives only as needed.
3. **GPX export — implemented (2026-11-01).** Owner-only GPX 1.1 waypoints for all catches or lake/date filters; skip missing coordinates and show counts. Use readable names and optional catch metadata. Verify output against schema and the user's intended mapping app/GPS.

## Step one design

- Store the preference on `users.capture_catch_location`, independent of browser permission.
- Store positions in a separate `catch_locations` table, keyed by catch, with owner ID, latitude/longitude (WGS84), accuracy in meters, capture timestamp and source (`device` or `manual`). Do not automatically associate/include this table in catch, dashboard, certificate or award-review responses.
- Authenticated `GET/PATCH /users/me/preferences` reads/writes only the signed-in user's preference.
- Catch creation accepts optional `location` (object or JSON multipart field). No available location means null/omitted; malformed supplied coordinates are rejected by the API.
- Owner-only `GET/PUT/DELETE /fishcatch/:catch_id/location` reads, replaces or permanently removes the saved position, without an admin bypass. Omitted location in unrelated edits preserves the position.
- Deleting a catch also permanently removes its location, even though catches are soft-deleted. Removal does not erase historical database backups.
- No precise catch coordinates are sent to the weather service; weather still uses the lake reference point. A map provider can observe the area viewed when a map is opened; private API access does not mean third-party basemaps are offline.
- Use a fresh, high-accuracy device request with a finite timeout; ignore late responses after toggle-off, manual edits, save, or unmount. Allow saving while a request is pending, using only a position already obtained.
- For old catch dates, explain that the device position is today's position and require an explicit action. Changing the catch time clears an automatically acquired position.
- Manual coordinate entry works without maps or browser permission. Pin placement uses the existing Mapbox coordinate picker.

## Validation and rollout

Implemented across the Vue frontend and existing API. Settings is available at `/settings` from the navigation. New catches, including Fish Mode's shared form, read the saved default. Catch details expose a private location editor only to the owner. No other routes were migrated. The old Next.js catch-details source was reviewed; it displays the lake association and has no precise catch location flow to preserve.

Automatic capture is limited to catches within 15 minutes of the current device time. Outside that window, capture requires pressing **Use current device location** or choosing manual coordinates. Device permission denial, unsupported/insecure contexts, invalid manual input and timeouts leave catch saving available. The UI explains when a location will not be saved. Pending device requests never hold up submission. Location failure reasons are not persisted. Invalid explicitly supplied API coordinates receive a 400 rather than storing bad data.

Completed checks:

- API suite: **113 passed, 1 skipped** across 26 files, including new owner/admin isolation, preference validation, optional JSON/multipart capture, removal, and transactional catch-deletion coverage. The skipped test requires a separate PostgreSQL test database for logout revocation.
- Frontend suite: all test files passed; new coverage exercises authenticated API requests, optional JSON/photo multipart payloads, geolocation errors, cancellation, and mounted component behavior for backdating, manual entry, opt-out and late fixes.
- Targeted ESLint and production build passed. The build reports the existing large Mapbox chunks warning.
- Whitespace checks passed in both repositories.

Rollout:

1. In `/home/matt/anglers-index-api`, run `npm run migrate:up` against the intended environment. The new migration is `20261031000000-private-catch-locations.js`. It creates the private table and opt-in preference; old catches have no locations and all users start opted out.
2. Restart the API, then serve/build the updated Vue frontend. No new environment variables or dependencies are needed; pin placement uses the existing public Mapbox token.
3. On a mobile HTTPS connection, verify browser allow/deny flows, poor accuracy, retry, backdated catches, saving while capture is pending, manual entry, preference persistence and removal. Verify that a second user and an administrator cannot read or modify another user's location.

The migration was applied to the configured local development database on 2026-10-31 after confirming that its missing preference column caused login queries to fail. The normal Sequelize user lookup used by login and a private-location lookup both passed after migration. Other environments still require the rollout migration. Real mobile browser permissions/GPS and map pin gestures were not exercised in this environment. Database constraints/migration need verification on the target PostgreSQL environment. Rolling back the new migration drops stored positions and the preference, so export/back up needed data first. Form values survive a failed request while the form stays open; this does not add offline storage or protection against closing/reloading the page.

## Step two implementation and validation (2026-10-31)

- Catch details show the persisted private point and a geodesic accuracy circle for device positions, with a coordinate/accuracy text fallback. Manual points do not imply GPS accuracy. Unsaved edits do not move the saved map; successful saves refresh it, and removal removes it.
- The existing lake map now uses a shared `LocationMap` renderer. Signed-in lake views add only the current user's catches, while anonymous lake views retain the approximate lake marker. Missing lake coordinates do not prevent showing located catches. A lake reference point is never substituted for an unlocated catch.
- Nearby catches cluster into numbered orange circles with larger sizes for larger groups. Tap/click selects a point/group, shows catch summaries underneath, and zooms clusters toward their members. Exact overlapping points remain individually listed even at the highest zoom. Selection uses stable catch IDs because rendered tile coordinates can be rounded.
- The catch list shows species, date, length/weight and lure, with links to catch details. It is also a keyboard-accessible fallback for selecting catches when the map is unavailable. Lists display ten items initially with Show more. Desktop hover previews are optional and deferred; tap/click is the primary interaction.
- Species and inclusive catch-date filters update markers, clusters and the list together without extra API requests. Changing filters clears the previous selection. Empty, missing-coordinate, loading, request-failure, missing-token and map-failure states have separate feedback and retry controls.
- New authenticated endpoint: `GET /fishcatch/locations?lake_id=<id>&after=<optional catch id>`. Returns `{ catches, next_cursor }`, with up to 500 lightweight records per page. It strictly scopes both location and joined catch to the authenticated owner and requested lake, excludes soft-deleted catches, and returns `Cache-Control: no-store`. It rejects ownership override parameters. Administrators see only their own positions. No photos, witness data, weather data or user records are included.
- The one-way location-to-catch association supports this private query without attaching coordinates to normal catches, award reviews, dashboards or certificates. The frontend fetches all cursor pages once per lake/session; leaving the view or changing sessions cancels requests. Failed pagination does not present a partial result as complete. Cluster callbacks from an old data set or an unmounted map are ignored.
- No schema changes or new dependencies were required. The existing step-one migration was confirmed applied in the configured development database; the new Sequelize map query succeeded against that database. No login endpoint was called for verification.

Validation: the API suite passed **116 tests with 1 unrelated PostgreSQL logout integration test skipped**. The frontend suite, targeted ESLint, production build and whitespace checks passed. New tests cover owner/admin query scoping, cursor validation/pagination, response minimization, species/date filters, identical coordinates, date-line bounds, accuracy geometry, stable-ID marker selection, clustering/zoom callbacks, filter updates and map teardown. Existing Mapbox bundle-size warnings remain. Actual Mapbox rendering and mobile gestures still need a browser/device smoke test; renderer interaction tests use a controlled Mapbox stub.

### Simplified add-catch and Fish Mode controls

The shared new-catch form now shows only the location checkbox and a brief capture status. With the preference enabled, a current catch requests location when the form opens; turning the checkbox on also requests it. Refresh, pin placement, manual coordinate inputs and privacy explanatory copy were removed from creation. Pin placement and manual coordinate editing remain available from catch details. Older catches are not assigned the device's current position; their status directs location entry to catch details after saving. Changing the catch time clears the prior position and captures a fresh reading only if the new time is current. Failure never blocks saving. No API/schema changes are needed.

### Catch details presentation

The owner-only section is titled **Catch Location**. With no saved position, it shows only **No location saved.** and **Add location**. Add/Edit opens a pin picker with Save location and Cancel; the saved map is shown outside editing, with Edit location and Remove location controls. Cancelling leaves saved data unchanged. Removal returns to the empty state. The capture checkbox and its explanatory copy are reserved for the add-catch/Fish Mode form. Backend privacy enforcement remains unchanged.

### Catch location picker defaults

The catch-location pin picker starts at the already selected/saved catch position. If none exists, opening the picker requests the current device position; denied permission, unavailable location, insecure context or timeout falls back to the associated lake's coordinates. If neither is available, the existing broad map view remains available for manual navigation. The catch details pass their associated lake through the editor, and the new-catch form uses its selected lake without an additional API request.

Device/lake defaults only center the picker. They do not create a catch marker or populate/save catch coordinates; the user selects a pin or uses **Use map center**. A saved catch position does not trigger a device request. Valid manual coordinates override pending device centering, and closing the picker cancels its request. Other lake-coordinate editing retains its existing behavior.

Validation: new mounted-picker tests cover the fallback order, denied/unavailable device location, unchanged selection, manual override and cancellation. Frontend suite, targeted ESLint and production build passed. No API or schema changes were needed.

Step three is implemented; see the export behavior and validation below.

## Step three: GPX export (2026-11-01)

**Settings → Export catch locations** provides an all-lakes/one-lake selector, optional inclusive From/Through catch dates, and an Include catch details checkbox. Download GPX exports the signed-in user's saved locations. The result reports the exported and skipped catch counts. If no locations match, the page explains why and does not download an empty file. Failed requests retain filters for retry; signing out or leaving cancels pending work. Loading lake choices can fail independently without blocking an all-lakes export.

The file follows [Topografix GPX 1.1](https://www.topografix.com/GPX/1/1/), using one WGS84 waypoint per located catch. Equal coordinates remain separate waypoints with distinct catch IDs. With details enabled, names include species/date/ID; descriptions include lake, catch date/time, measurements explicitly labeled in inches/pounds, and lure. GPX waypoint time uses the saved catch timestamp in UTC, never the time the location was captured. Without details, waypoints contain only coordinates and a generic catch-ID name. No account information, witnesses, photos or weather data are exported. No device-specific extensions, guessed elevation, or HDOP values are added.

Coordinate output uses eight decimal places to avoid XML decimal exponent notation. Positive 180° longitude is normalized to equivalent −180° because GPX longitude excludes positive 180. Missing/invalid coordinates are skipped, including in the counts; lake reference coordinates are never substituted. XML text is escaped and invalid XML 1.0 characters are stripped.

Authenticated endpoint: `GET /fishcatch/export/gpx`, with optional `lake_id`, `from`, `to`, and `details=true|false`. It returns `application/gpx+xml` with a static `.gpx` attachment filename, `Cache-Control: no-store`, and `X-Export-Count`/`X-Skipped-Count` headers exposed for cross-origin clients. Query fields are validated and ownership override parameters rejected. Both catch and location reads use the authenticated owner, without an admin bypass; normal catch scopes exclude soft-deleted catches. A repeatable-read transaction keeps points and counts consistent. Catches are queried in batches of 500, with a single location query per batch; the completed XML file is assembled in memory and returned directly, with no server-side export files or new persistent storage.

Validation:

- Official GPX 1.1 schema validation passed for populated and empty exports using the downloaded Topografix XSD and the installed libxml2 validator. Cases include escaped names/emoji, tiny coordinates, longitude 180, and the poles.
- API suite: **122 passed, 1 unrelated PostgreSQL logout integration test skipped**. New tests cover ownership for ordinary/admin accounts, date and lake filtering, invalid filters, XML escaping, metadata inclusion/exclusion, coordinate normalization, 500+ catch exports, repeated points, empty exports, skipped counts and cancellation.
- All frontend test files passed. New API/download tests cover authenticated filters, Blob/content validation, response counts, server errors, empty exports, download initiation, invalid ranges and preserving filters on failure.
- Targeted ESLint, production build and whitespace checks passed. Existing Mapbox chunk-size warnings remain.
- A read-only development-database export query succeeded. There are no schema changes or migrations for export.

No destination app/device has been chosen. Standard schema validation is complete; an actual browser download and import into a chosen mapping app/GPS remain manual compatibility checks. Some destinations may impose their own waypoint/name/description limits. Full offline storage and GPX import remain out of scope.

## Deferred

Full offline catch logging, location import, heatmaps, bathymetry, automatic lake detection, bulk location deletion, and sharing are outside step one. Existing catches start without a location. The preference affects future captures and never deletes saved points.
