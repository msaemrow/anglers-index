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
