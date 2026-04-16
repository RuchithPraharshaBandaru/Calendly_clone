# Calendly Clone — Code Documentation

This document explains the architectural decisions, code patterns, and rationale behind every part of the codebase. It's designed so you can read it and fully understand the implementation during an evaluation interview.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Why This Tech Stack?](#2-why-this-tech-stack)
3. [Database Design](#3-database-design)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Key Algorithms](#6-key-algorithms)
7. [Error Handling Strategy](#7-error-handling-strategy)
8. [Security Considerations](#8-security-considerations)
9. [Performance Considerations](#9-performance-considerations)

---

## 1. Architecture Overview

The app follows a **client-server architecture**:

```
┌─────────────┐     HTTP/JSON      ┌─────────────┐      SQL        ┌──────────┐
│   React     │ ──────────────────→ │  Express    │ ──────────────→ │  MySQL   │
│   (Vite)    │ ←────────────────── │  (Node.js)  │ ←────────────── │  Server  │
│  Port 5173  │    REST API         │  Port 5000  │    Queries      │ Port 3306│
└─────────────┘                     └─────────────┘                 └──────────┘
```

**Why this separation?**
- Frontend and backend can be developed, tested, and deployed independently
- Clear API contract between the two
- Backend can serve multiple clients (web, mobile) in the future
- Follows industry-standard patterns

**Alternative considered**: Server-side rendering with Next.js
- **Rejected because**: The assignment says React.js SPA. Next.js adds complexity (SSR, server components) that's unnecessary for this scope. Vite is simpler and faster for development.

---

## 2. Why This Tech Stack?

### React.js via Vite (Frontend)
- **Why React?**: Assignment requirement. Component-based architecture makes it easy to build reusable UI elements.
- **Why Vite over Create React App?**: CRA is deprecated. Vite is the modern standard — it's faster (HMR in <50ms), lighter, and uses native ES modules.
- **Alternative**: Next.js — adds SSR which we don't need. Vite is simpler.

### Node.js + Express (Backend)
- **Why Express?**: Assignment requirement. It's minimal (no magic), has the largest middleware ecosystem, and is the most widely-used Node.js framework.
- **Alternative**: Fastify (2-3x faster benchmarks) — Express is more conventional and the performance difference is irrelevant at this scale.

### MySQL (Database)
- **Why MySQL?**: Assignment requirement. Scheduling data is inherently relational (users → event types → meetings). SQL constraints (UNIQUE, FOREIGN KEY) enforce data integrity.
- **Why raw SQL over Sequelize/Prisma?**: Raw SQL demonstrates understanding of database design. ORMs abstract away the SQL, which could be a negative in an evaluation that specifically assesses database design skills.
- **Alternative**: Prisma ORM — cleaner API but adds a build step and hides the actual queries.

### Axios (HTTP Client)
- **Why over fetch()?**: Auto JSON parsing, request/response interceptors (useful for auth tokens later), better error handling (rejects on 4xx/5xx), and request timeout support.

### date-fns (Date Library)
- **Why over Moment.js?**: Moment is 300KB+, mutable, and deprecated. date-fns is <10KB (tree-shakeable), immutable, and functional.
- **Alternative**: Luxon — similar to date-fns but heavier. For our simple formatting needs, date-fns is ideal.

### Vanilla CSS (Styling)
- **Why over Tailwind/CSS-in-JS?**: No extra dependency, no build tool config, full control over every style, and demonstrates CSS competency.
- **Alternative**: TailwindCSS — great for rapid prototyping but adds complexity (PostCSS, purging) and can make JSX harder to read.

### Nodemailer (Email)
- **Why?**: It's the standard email library for Node.js. With Ethereal, we can test email sending without configuring a real SMTP server.
- **Alternative**: SendGrid/AWS SES API — requires account setup. Ethereal is simpler for development.

---

## 3. Database Design

### Design Principles
1. **Normalization**: Each table represents one entity. No data duplication.
2. **Referential Integrity**: Foreign keys with CASCADE on delete.
3. **Flexibility**: Schema supports features beyond the minimum (multiple schedules, custom questions, overrides).

### Table-by-Table Breakdown

#### `users`
- Stores the default user. No auth table needed since we assume a single logged-in user.
- `timezone` field: Used to interpret availability times correctly.

#### `event_types`
- Core table. Each row represents a bookable event type.
- `slug` is UNIQUE — used in the public booking URL (/book/:slug).
- `color` — visual identifier on the dashboard (Calendly uses this pattern).
- `buffer_before` / `buffer_after` — minutes of blocked time around meetings.
- `schedule_id` — links to an availability schedule. NULL means "use the default schedule".
- `is_active` — soft-disable instead of delete (keeps historical data).

#### `availability_schedules` + `availability_rules`
- **Why two tables?**: A schedule (e.g., "Working Hours") can have multiple rules (Mon 9-5, Tue 9-5, etc.). This is a 1-to-many relationship.
- `day_of_week` uses 0-6 (Sun-Sat) — matches JavaScript's `Date.getDay()`.
- Times stored as TIME type — MySQL handles time comparison natively.

#### `date_overrides`
- Override availability for a specific date (e.g., "Dec 25 — unavailable").
- If `start_time` is NULL, the entire day is blocked.
- If `start_time`/`end_time` are set, they replace the normal hours for that day.
- **Why a separate table?**: Overrides are exceptions, not rules. Mixing them in the rules table would complicate queries.

#### `meetings`
- `status` ENUM: 'scheduled', 'cancelled', 'rescheduled' — tracks the lifecycle.
- `cancel_reason` — optional text for cancellation context.
- Both `start_time` and `end_time` are stored (not computed from duration) for reliable querying.

#### `custom_questions` + `meeting_answers`
- **Why two tables?**: Questions belong to event types (1-to-many), answers belong to meetings (many-to-many through meeting_answers).
- `question_type` ENUM: 'text', 'textarea', 'select' — determines the input type in the form.
- `options` JSON field: Stores dropdown options for 'select' type. JSON is appropriate here because options are unstructured and only read as a whole.

### Why Not a NoSQL Database?
Scheduling data has clear relationships (users → events → meetings). SQL constraints prevent data corruption (e.g., can't book for a non-existent event). NoSQL would require manual relationship management and risk data inconsistency.

---

## 4. Backend Architecture

### File Organization Pattern
```
server/
├── config/        # Infrastructure (DB connections)
├── routes/        # Controller layer (HTTP handling)
├── middleware/     # Cross-cutting concerns
├── utils/         # Business logic helpers
└── server.js      # App entry point
```

**Why this structure?**: Separation of concerns. Routes handle HTTP, utils handle logic, config handles infrastructure. Each file has a single responsibility.

**Alternative**: MVC pattern with separate `controllers/` and `models/` folders. For this project size, the simpler structure is sufficient. Adding controllers would just be thin proxies to routes.

### API Design Decisions

1. **RESTful endpoints**: Standard HTTP verbs (GET, POST, PUT, DELETE) mapping to CRUD operations. Easy to understand and test.

2. **Route-level error handling**: Each route handler is `async` and wraps its logic in try-catch. Errors are forwarded to the centralized `errorHandler` middleware via `next(error)`.

3. **No authentication middleware**: Assignment specifies no login. A production app would add JWT middleware here.

4. **User ID hardcoded to 1**: Since there's no auth, we always use `user_id = 1`. This would be replaced with `req.user.id` from an auth middleware in production.

### Booking Flow (Backend Side)
```
POST /api/booking/:slug
    ↓
1. Validate input (name, email, start_time)
    ↓
2. Look up event type by slug
    ↓
3. Calculate end_time = start_time + duration
    ↓
4. BEGIN TRANSACTION
    ↓
5. SELECT ... FOR UPDATE (lock conflicting meeting rows)
    ↓
6. If conflicts exist → ROLLBACK → return 409
    ↓
7. INSERT INTO meetings → COMMIT
    ↓
8. Send confirmation email (async, non-blocking)
    ↓
9. Return meeting data
```

---

## 5. Frontend Architecture

### File Organization
```
src/
├── api/           # Centralized HTTP calls
├── components/    # Reusable, presentational
├── pages/         # Route-level, connected to API
├── utils/         # Pure helper functions
├── App.jsx        # Router setup
└── App.css        # Global design system
```

### Component Design Principles

1. **Smart vs Dumb Components**: Pages fetch data and manage state ("smart"). Components receive props and render UI ("dumb"). This makes components reusable and testable.

2. **Collocated CSS**: Each component has its own `.css` file (e.g., `Calendar.jsx` + `Calendar.css`). This keeps styles close to the component that uses them.

3. **No state management library**: React's built-in `useState` and `useEffect` are sufficient for this app's complexity. Redux/Zustand would be overkill.

### Routing Strategy
- **React Router v6** with layout routes
- Admin pages share a `<AdminLayout>` with the `<Navbar>`
- Public booking pages have NO navbar (cleaner invitee experience)
- This pattern uses `<Outlet>` from React Router — it's the standard approach for shared layouts

### Styling Approach
- **CSS Variables** (custom properties) for consistent colors, fonts, radii, shadows
- **BEM-ish naming**: `.event-card`, `.event-card-header`, `.event-card-name` — descriptive, predictable
- **Mobile-first responsive**: CSS media queries for mobile (<768px), tablet (768-1024px), desktop (>1024px)

### Key Design Decisions in Components

**Calendar Component** — Built from scratch:
- Generates a grid of days for the current month
- Calculates first day offset and days in month using native Date API
- Disables past dates and (optionally) unavailable days
- Simple state: just `currentMonth` and `currentYear`

**TimeSlots Component** — Two-step selection:
- Click a slot → it becomes selected (dark background)
- A "Confirm" button appears next to it
- Second click confirms and proceeds to the booking form
- This matches Calendly's UX and reduces accidental bookings

**BookingForm Component** — Client-side validation:
- Name: required, trimmed
- Email: required, regex validation (`/\S+@\S+\.\S+/`)
- Custom questions: validate "required" questions
- Shows inline error messages immediately

---

## 6. Key Algorithms

### Slot Generation Algorithm (server/utils/slotGenerator.js)

This is the most complex piece of logic. Here's how it works:

```
Input: event slug, date (YYYY-MM-DD)

1. Load event type (duration, buffer times, schedule)
2. Get day of week from the date (0=Sun, 6=Sat)
3. Check date_overrides for this specific date
   → If found, use override times (or mark unavailable if NULL)
   → If not found, fall back to availability_rules for this day of week
4. Load all existing meetings for this date (excluding cancelled)
5. For each available time range:
   a. Start at range start time
   b. While current slot + duration fits in range:
      - Create slot [current, current + duration]
      - Skip if slot is in the past
      - Skip if slot conflicts with any existing meeting (including buffer)
      - If no conflicts, add to available slots
      - Move to next slot (increment by duration)
6. Return array of available slots
```

**Conflict detection** includes buffer time:
```
bufferedStart = meetingStart - buffer_before
bufferedEnd   = meetingEnd + buffer_after
conflict = slotStart < bufferedEnd AND slotEnd > bufferedStart
```

### Double Booking Prevention

Uses MySQL's `SELECT ... FOR UPDATE` within a transaction:
1. Begin transaction
2. Lock all meetings that OVERLAP with the requested time
3. If any locked rows exist → conflict → rollback
4. If no conflicts → insert → commit

This handles race conditions where two people try to book the same slot simultaneously. The first transaction gets the lock, inserts, and commits. The second transaction waits for the lock, then finds the conflict.

---

## 7. Error Handling Strategy

### Backend
- **Centralized error handler** (middleware/errorHandler.js) catches all errors
- Custom errors include a `status` property (400, 404, 409)
- MySQL-specific errors (ER_DUP_ENTRY, ER_NO_REFERENCED_ROW) are translated to user-friendly messages
- All errors return consistent JSON: `{ error: "...", message: "..." }`

### Frontend
- API calls use try-catch in async functions
- Errors shown as Toast notifications (auto-dismiss after 3s)
- Loading states with spinners prevent multiple submissions
- Form validation runs client-side before making API calls

---

## 8. Security Considerations

In this prototype (no auth requirement), we've focused on:
1. **SQL Injection Prevention**: Using parameterized queries (`?` placeholders) throughout
2. **CORS**: Configured to only allow the frontend origin
3. **Input Validation**: Required fields checked on both client and server
4. **Transaction Isolation**: Prevents double-booking race conditions

**Not implemented (would be added for production)**:
- Authentication (JWT/sessions)
- Rate limiting
- CSRF protection
- Input sanitization (XSS prevention)
- HTTPS enforcement

---

## 9. Performance Considerations

1. **Connection Pooling**: MySQL pool reuses connections (max 10). Much faster than creating a new connection per request.
2. **Non-blocking Email**: Booking confirmation emails are sent asynchronously (`sendBookingConfirmation().catch(...)`) — the user doesn't wait for the email to send.
3. **Indexed Queries**: `slug` is UNIQUE indexed. Meeting conflict checks use `start_time` and `end_time` which should be indexed in production.
4. **Frontend**: Vite handles tree-shaking and code splitting automatically. date-fns only imports the functions we use.
5. **API Proxy**: Vite's proxy avoids CORS preflight requests in development, reducing HTTP overhead.
