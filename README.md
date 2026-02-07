# MailFlow Scheduler

Production-grade email scheduling service with BullMQ, PostgreSQL, and Next.js dashboard. Built for ReachInbox assignment.

## 🎯 Project Overview

A complete email scheduling system that:
- Accepts email scheduling requests via REST APIs
- Schedules emails using **BullMQ + Redis** (no cron jobs)
- Sends emails via **Ethereal Email** (SMTP)
- Survives server restarts without losing jobs
- Provides a modern dashboard for email management

## 📁 Project Structure

```
MailFlow-Scheduler/
├── backend/          # Express.js API server with BullMQ
├── frontend/         # Next.js 14 dashboard
├── docker-compose.yml
└── README.md
```

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Queue**: BullMQ (Redis-backed, persistent)
- **Database**: PostgreSQL + Prisma ORM
- **Email**: Nodemailer with Ethereal SMTP
- **Auth**: JWT + Passport.js (Google OAuth)
- **Rate Limiting**: Redis-based counters

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: React Context API
- **HTTP**: Axios
- **Language**: TypeScript

### Infrastructure
- **PostgreSQL**: Persistent data storage
- **Redis**: Queue management + rate limiting
- **Docker**: Containerized services

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Google Cloud Console project (for OAuth)

### Using Docker Compose

1. **Clone and setup**
   ```bash
   git clone https://github.com/singghaa13/MailFlow-Scheduler.git
   cd MailFlow-Scheduler
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Configure environment variables**
   
   **Backend (.env)**:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/mailflow
   REDIS_URL=redis://localhost:6379
   PORT=3000
   NODE_ENV=development
   
   # SMTP (Ethereal Email)
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=your_ethereal_email
   SMTP_PASS=your_ethereal_password
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # JWT
   JWT_SECRET=your_secret_key_here
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=3600000
   RATE_LIMIT_MAX_REQUESTS=100
   QUEUE_CONCURRENCY=5
   ```
   
   **Frontend (.env)**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Start services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

### Local Development

#### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Email Scheduling
- `POST /api/email/schedule` - Schedule single email
- `POST /api/email/batch-schedule` - Schedule batch emails
- `GET /api/email` - List emails (with filters)
- `GET /api/email/:id` - Get email details
- `GET /api/email/stats` - Queue statistics
- `GET /api/email/job/:jobId` - Job status
- `PUT /api/email/:id/star` - Toggle favorite

### Templates
- `POST /api/template` - Create email template
- `GET /api/template` - List templates
- `GET /api/template/:id` - Get template
- `PUT /api/template/:id` - Update template
- `DELETE /api/template/:id` - Delete template

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/hourly` - Hourly email stats

## 🗄 Database Schema

### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  name      String?
  avatar    String?
  googleId  String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  emails    Email[]
}
```

### Email
```prisma
model Email {
  id          String    @id @default(cuid())
  userId      String
  to          String
  subject     String
  body        String
  html        String?
  status      String    @default("pending")
  jobId       String?   @unique
  isStarred   Boolean   @default(false)
  scheduledAt DateTime
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id])
}
```

## ✨ Features

### ✅ Fully Implemented

#### Backend
- ✅ **BullMQ Scheduler** - Redis-backed delayed jobs (no cron)
- ✅ **Persistent Jobs** - Survive server restarts
- ✅ **Rate Limiting** - Redis-based per-user hourly limits
- ✅ **Worker Concurrency** - Configurable parallel processing (default: 5)
- ✅ **Email Delays** - Configurable delay between sends
- ✅ **Batch Scheduling** - CSV upload for multiple recipients
- ✅ **Google OAuth** - Full Passport.js integration
- ✅ **JWT Authentication** - Email/password fallback
- ✅ **Email Templates** - Reusable email templates
- ✅ **Analytics** - Email statistics and reporting
- ✅ **Idempotency** - Prevent duplicate sends

#### Frontend
- ✅ **Google Login** - One-click OAuth authentication
- ✅ **Dashboard** - Scheduled & sent emails view
- ✅ **Compose Page** - Rich email editor with:
  - Manual email entry
  - CSV file upload
  - Subject & body inputs
  - Scheduling options (send now/later)
  - Delay & hourly limit configuration
  - File attachment UI
- ✅ **Email Lists** - Filterable, searchable tables
- ✅ **Email Details** - Full email view on click
- ✅ **Star/Favorite** - Mark important emails
- ✅ **Profile Management** - Update name & avatar
- ✅ **Loading States** - Spinners and skeletons
- ✅ **Empty States** - User-friendly placeholders
- ✅ **Error Handling** - Toast notifications
- ✅ **TypeScript** - Full type safety

### Rate Limiting & Concurrency

#### Worker Concurrency
- Configured via `QUEUE_CONCURRENCY` (default: 5)
- Multiple jobs process in parallel safely

#### Delay Between Emails
- Configurable per-request via `delaySeconds` parameter
- Prevents SMTP throttling

#### Hourly Rate Limiting
- Per-user limits via `hourlyLimit` parameter
- Redis-backed counters (safe across workers)
- Jobs automatically delayed to next hour when limit reached
- No jobs dropped - all preserved and rescheduled

## 🔒 Security

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Google OAuth 2.0
- ✅ User-scoped data access
- ✅ Environment variable protection
- ✅ CORS configuration
- ✅ Input validation

## 📊 Performance

- **BullMQ**: Efficient Redis-backed job queue
- **Prisma**: Optimized database queries with connection pooling
- **Rate Limiting**: Prevents resource exhaustion
- **Worker Concurrency**: Parallel email processing
- **Persistent Storage**: PostgreSQL for reliability

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🧪 Testing

### Manual Testing
1. Register/login with Google or email
2. Navigate to Compose page
3. Enter email details or upload CSV
4. Set scheduling options
5. Click "Send Now" or "Send Later"
6. Check Scheduled/Sent tabs for status

### Ethereal Email
- All emails sent to Ethereal inbox
- View at: https://ethereal.email
- Login with SMTP credentials

## 📝 Environment Setup

### Get Ethereal Credentials
1. Visit https://ethereal.email
2. Click "Create Ethereal Account"
3. Copy SMTP credentials to `.env`

### Setup Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID & Secret to `.env`

## 🎯 Requirements Compliance

| Requirement | Status |
|------------|--------|
| TypeScript Backend | ✅ |
| Express.js | ✅ |
| BullMQ (No Cron) | ✅ |
| PostgreSQL/MySQL | ✅ PostgreSQL |
| Ethereal Email | ✅ |
| React/Next.js Frontend | ✅ Next.js 14 |
| Tailwind CSS | ✅ |
| Google OAuth | ✅ |
| Rate Limiting | ✅ |
| Worker Concurrency | ✅ |
| Email Delays | ✅ |
| Persistent Jobs | ✅ |
| Dashboard UI | ✅ |
| Compose Page | ✅ |
| Email Lists | ✅ |

**Completion: ~95%**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

ISC

## 👨‍💻 Author

**Ashutosh Kumar Singh**
- GitHub: [@singghaa13](https://github.com/singghaa13)
- Email: lushootosh@gmail.com

## 🙏 Acknowledgments

Built for **ReachInbox** assignment - Production-grade email scheduler demonstration.
