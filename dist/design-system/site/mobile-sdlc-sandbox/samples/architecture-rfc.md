# Architecture RFC — Gullak-style mobile app

## Overview

Offline-first Android client (iOS in v1.5) with background sync when connectivity returns.

## Modules

| Module | Responsibility |
|--------|----------------|
| `core/auth` | OTP login, session refresh |
| `core/sync` | SQLite queue, conflict resolution |
| `features/expenses` | CRUD, categories, Marathi labels |
| `features/goals` | Savings pockets, progress |
| `features/insights` | Weekly spend summaries |

## Non-functional

- Max install size: 25 MB
- Min Android: API 26 (Oreo)
- Push: FCM for payment reminders
- Analytics: privacy-preserving event batching

## Open decisions

- [ ] Biometric lock on cold start?
- [ ] Shared family account in v1?
