# Anglers Index

## Project Overview

Anglers Index is a fishing-focused web application being rebuilt from an older Next.js application. The goal of the application is to provide anglers a single spot to track fish catches and collect data for weather, lures, and locations. The app will then allow users to analyze data collected to improve catching fish. A secondary goal is the master angler program where the goal is to catch fish of a certain length and be recognized as a master angler with a certificate.

The existing application should be used as a reference for features, functionality, business logic, and general design, but this is a fresh Vue implementation rather than a direct React-to-Vue translation.

The existing backend API is already functional and should be reused. API changes can be made when necessary as the frontend is rebuilt.

## Tech Stack

- Vue 3 - Composition API
- Vite
- Vue Router
- JavaScript
- Lucide for icons (install if necessary)
- `<script setup>`
- Existing REST API

## Development Approach

Rebuild the application incrementally, one route or feature at a time.

Do not migrate additional routes unless explicitly asked.

If a feature is going to be used mutliple times like a table, a modal, a card, buttons, etc, create a reusable component so styling can be consistent.

When rebuilding an existing feature:

1. Review the old Next.js implementation.
2. Understand what the feature is intended to do.
3. Preserve important business logic and functionality.
4. Reimplement it using idiomatic Vue 3 patterns.
5. Use the existing API when possible.
6. Do not blindly translate React/Next.js code into Vue.

The old application is a reference, not a specification that must be copied exactly. Improvements to structure, UX, and implementation are encouraged when they make sense. There will be a lot of data fetched so performance is important when fetching data

## Vue Guidelines

Use Vue 3 Composition API with `<script setup>`.

Prefer simple and readable Vue components.

Use:

- `ref` and `reactive` for local reactive state
- `computed` for derived state
- `onMounted` and other lifecycle hooks when appropriate
- Composables when logic is genuinely reusable
- Vue Router for navigation

Avoid adding global state management unless the application actually needs it. If shared state becomes necessary, discuss whether Pinia should be introduced.

## Routing

Use Vue Router with explicitly defined routes.

Routes should live in the router configuration rather than being inferred from the filesystem.

Views belong in:

`src/views/`

Reusable components belong in:

`src/components/`

## API

The backend API already exists.

Prefer using the existing API rather than recreating functionality in the frontend.

Keep reusable API request logic separate from presentation components.

If an existing endpoint does not support what the new frontend needs, explain the issue before making significant API changes.

## Code Style

Prioritize:

- Readability
- Simplicity
- Maintainability
- Clear naming
- Small components with clear responsibilities

Avoid:

- Premature abstraction
- Unnecessary dependencies
- Over-engineering
- Large components that handle unrelated responsibilities
- Creating abstractions solely because they may be useful later

## Working With Codex

Do not make broad changes outside the scope of the current request.

When asked to rebuild a route, focus on that route and the shared components necessary to support it.

If an implementation requires a significant architectural decision, explain the options before making the decision.

Do not automatically continue to another route after completing the requested work.

## Security & Deployment Guidelines

This app will eventually be accessible over the internet, although it is currently intended primarily for personal use. Build features with that future deployment in mind.

- Never commit passwords, API keys, tokens, or other secrets. Use environment variables and keep `.env` files out of Git.
- Never put secrets in `VITE_*` variables because those values are exposed to the browser.
- Treat all frontend/user input as untrusted. Validate important input again in the API.
- Use Sequelize safely; do not build raw SQL by concatenating user input.
- Authentication and authorization must be enforced by the backend, not just Vue route guards.
- Design user-owned data with a `userId`/ownership relationship even while the app has only one user.
- Do not expose PostgreSQL directly to the internet.
- Do not expose unnecessary API, Docker, debug, or development ports.
- Do not return stack traces, database details, secrets, or internal server information to clients in production.
- Use HTTPS when the app is eventually deployed publicly.
- Use secure HTTP headers and reasonable rate limiting for internet-facing endpoints, especially authentication.
- Keep development and production configuration separate.

### Photo Uploads

The app will eventually store fishing/catch photos on the home server.

When implementing photo uploads:

- Treat uploaded files as untrusted.
- Restrict uploads to supported image formats and reasonable file sizes.
- Verify file types instead of trusting filenames/extensions.
- Generate unique server-side filenames.
- Never allow user-provided filenames to control filesystem paths.
- Optimize/resize large phone photos when appropriate.
- Strip unnecessary EXIF metadata, especially embedded GPS coordinates.
- Store image files on persistent storage, not inside a disposable Docker container.
- Store image metadata/path information in PostgreSQL rather than storing the image itself in PostgreSQL.
- Design photo storage so it can later be moved to another disk or storage provider without redesigning the application.

### General Rule

When implementing a feature, prefer the approach that would remain safe if the application were publicly reachable. Do not add unnecessary complexity solely for hypothetical future requirements, but flag security-sensitive design decisions before implementing an unsafe shortcut.
