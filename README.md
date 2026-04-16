# Calendly Clone

A full-stack scheduling application inspired by [Calendly](https://calendly.com/). Built as part of the Scaler SDE Intern Fullstack Assignment.

![Tech Stack](https://img.shields.io/badge/React-20232A?style=flat&logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Express-000000?style=flat&logo=express)
![Tech Stack](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)

## Features

### Core Features
- ✅ **Event Types Management** — Create, edit, delete event types with name, duration, URL slug, color
- ✅ **Availability Settings** — Set available days/hours, timezone, multiple schedules
- ✅ **Public Booking Page** — Calendar view, time slot selection, booking form, double-booking prevention
- ✅ **Meetings Page** — View upcoming/past meetings, cancel meetings

### Bonus Features
- ✅ **Responsive Design** — Mobile, tablet, and desktop layouts
- ✅ **Multiple Availability Schedules** — Create and switch between schedules
- ✅ **Date-Specific Overrides** — Override availability for specific dates (holidays, special hours)
- ✅ **Rescheduling Flow** — Reschedule existing meetings to new times
- ✅ **Email Notifications** — Booking confirmation and cancellation emails (via Ethereal fake SMTP)
- ✅ **Buffer Time** — Configurable buffer before/after meetings
- ✅ **Custom Invitee Questions** — Add custom questions to booking forms

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React.js (Vite) | Modern, fast build tool, component-based UI |
| Backend | Node.js + Express.js | Lightweight REST API framework |
| Database | MySQL | Relational DB ideal for scheduling data |
| Styling | Vanilla CSS | Full control, no extra dependencies |
| HTTP Client | Axios | Promise-based, auto JSON parsing |
| Date Utils | date-fns | Tree-shakeable, lightweight date library |
| Email | Nodemailer | Standard email sending for Node.js |

## Prerequisites

- **Node.js** v18+ 
- **MySQL** v8+ (running locally)
- **npm** v9+

## Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd calendly-clone
```

### 2. Configure environment variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your MySQL password:
# DB_PASSWORD=your_mysql_password
```

### 3. Set up the database
Make sure MySQL is running, then:
```bash
# The server auto-creates the database and tables on first run
# Or manually run:
cd server
node -e "require('./config/db').initializeDatabase()"
```

### 4. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 5. Seed sample data
```bash
cd server
npm run seed
```

This creates:
- Default user: John Doe (john@example.com)
- 3 event types (30min, 60min, 15min)
- Availability: Mon-Fri 9AM-5PM (IST)
- 5 sample meetings

### 6. Start the application
```bash
# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Public Booking**: http://localhost:5173/book/30-minute-meeting

## Project Structure

```
calendly-clone/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/index.js       # Axios API service
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── utils/             # Helper functions
│   │   ├── App.jsx            # Router setup
│   │   └── App.css            # Global styles
│   └── index.html
├── server/                    # Express backend
│   ├── config/db.js           # MySQL connection pool
│   ├── routes/                # API route handlers
│   ├── middleware/             # Error handling
│   ├── utils/                 # Slot generation, email
│   ├── schema.sql             # Database schema
│   ├── seed.js                # Sample data seeder
│   └── server.js              # Entry point
├── docs/DOCUMENTATION.md      # Detailed code documentation
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Database Schema

See `server/schema.sql` for the complete schema. Key tables:
- `users` — Default user (no auth)
- `event_types` — Meeting types with duration, slug, color
- `availability_schedules` — Named schedules (e.g., "Working Hours")
- `availability_rules` — Weekly rules (day + time range)
- `date_overrides` — Date-specific availability overrides
- `meetings` — Booked meetings with status tracking
- `custom_questions` / `meeting_answers` — Custom booking form fields

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types` | List all event types |
| POST | `/api/event-types` | Create event type |
| PUT | `/api/event-types/:id` | Update event type |
| DELETE | `/api/event-types/:id` | Delete event type |
| GET | `/api/availability` | List schedules |
| PUT | `/api/availability/:id` | Update schedule |
| GET | `/api/booking/:slug` | Get event type (public) |
| GET | `/api/booking/:slug/slots?date=YYYY-MM-DD` | Available slots |
| POST | `/api/booking/:slug` | Book a meeting |
| GET | `/api/meetings?filter=upcoming\|past` | List meetings |
| PUT | `/api/meetings/:id/cancel` | Cancel meeting |
| PUT | `/api/meetings/:id/reschedule` | Reschedule meeting |

## Assumptions

1. **No Authentication** — A default user (id=1) is assumed to be logged in for the admin side
2. **Single User** — The app operates for a single user (as per assignment spec)
3. **Timezone** — Default timezone is Asia/Kolkata (IST)
4. **Email** — Uses Ethereal fake SMTP in development (no real emails sent)
5. **Slot Duration** — Time slots are generated at intervals matching the event duration (e.g., 30 min event = slots at :00 and :30)

## Deployment

### Deploy to Render (Backend + Frontend) + Aiven (Free MySQL)

#### Step 1: Create free MySQL database on Aiven
1. Go to [aiven.io](https://aiven.io) and sign up (free)
2. Create a new **MySQL** service (select "Free" plan)
3. Once created, copy the connection details:
   - Host, Port, User, Password, Database name

#### Step 2: Deploy to Render
1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
5. Add environment variables in Render dashboard:
   - `DB_HOST` = (from Aiven)
   - `DB_USER` = (from Aiven)
   - `DB_PASSWORD` = (from Aiven)
   - `DB_NAME` = (from Aiven)
   - `DB_PORT` = (from Aiven, usually 3306)
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
6. Deploy!

#### Step 3: Seed the deployed database
After deployment, go to Render → Shell and run:
```bash
cd server && node seed.js
```

## Documentation

For detailed code documentation explaining every design decision, see [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).
