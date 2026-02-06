# MailFlow Scheduler

Production-grade monorepo for scheduling and managing email delivery with BullMQ, PostgreSQL, and Prisma.

## Project Structure

```
MailFlow-Scheduler/
├── backend/          # Express.js API server
├── frontend/         # Next.js dashboard
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Queue**: BullMQ (Redis-backed)
- **Database**: PostgreSQL + Prisma ORM
- **Email**: Nodemailer (Ethereal for testing)
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Language**: TypeScript

### Infrastructure
- **PostgreSQL**: Data persistence
- **Redis**: Queue and rate limiting
- **Docker**: Containerization

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL client (optional, for local development)

### Using Docker Compose

1. **Clone and setup**
   ```bash
   cd MailFlow-Scheduler
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Configure environment variables**
   - Update `backend/.env` with your Ethereal email credentials or SMTP settings

3. **Start services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - API: http://localhost:3000/api

### Local Development

#### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Email Routes
- `POST /api/email/schedule` - Schedule an email
- `GET /api/email/stats` - Get queue statistics
- `GET /api/email/job/:jobId` - Get job status

### Auth Routes
- `GET /api/auth/health` - Health check

### Health
- `GET /health` - Server health check

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@postgres:5432/mailflow
REDIS_URL=redis://redis:6379
PORT=3000
NODE_ENV=development
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100
QUEUE_CONCURRENCY=5
QUEUE_NAME=email_jobs
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Database Schema

### User
- `id`: String (primary key)
- `email`: String (unique)
- `name`: String (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Email
- `id`: String (primary key)
- `userId`: String (foreign key)
- `to`: String
- `subject`: String
- `body`: String
- `html`: String (optional)
- `status`: String (pending, sent, failed)
- `jobId`: String (unique, optional)
- `scheduledAt`: DateTime
- `sentAt`: DateTime (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Features

### Implemented
- ✅ Express.js health check endpoint
- ✅ BullMQ queue with Redis
- ✅ Email worker with configurable concurrency
- ✅ Nodemailer email sending service
- ✅ Redis-based rate limiter
- ✅ Prisma schema with migrations
- ✅ Next.js dashboard with Tailwind CSS
- ✅ Email scheduling API
- ✅ Queue statistics endpoint
- ✅ Docker Compose setup

### TODO
- 🔄 JWT authentication implementation
- 🔄 Email list fetching and display
- 🔄 WebSocket real-time updates
- 🔄 Advanced job filtering and search
- 🔄 Email templates
- 🔄 Batch email scheduling
- 🔄 Analytics and reporting

## Development

### Code Structure

**Backend Clean Architecture**
- `api/`: Route handlers
- `services/`: Business logic
- `queues/`: BullMQ queue configuration
- `workers/`: Job processors
- `db/`: Database client
- `utils/`: Helpers and configuration

**Frontend Structure**
- `app/`: Next.js pages
- `components/`: Reusable React components
- `lib/`: Utilities and API client

### Running Tests
```bash
# Backend (TODO)
cd backend
npm test

# Frontend (TODO)
cd frontend
npm test
```

## Production Deployment

1. Build images:
   ```bash
   docker-compose build
   ```

2. Push to registry:
   ```bash
   docker tag mailflow-scheduler-backend your-registry/backend:latest
   docker push your-registry/backend:latest
   ```

3. Deploy with orchestration (Kubernetes, ECS, etc.)

## Rate Limiting

The service includes Redis-based rate limiting with an hourly window:
- **Window**: 3600000ms (1 hour) - configurable
- **Max Requests**: 100 per window - configurable
- **Key Format**: `rate-limit:{userId}`

## Error Handling

All errors are logged in JSON format with:
- `level`: info, warn, error, debug
- `message`: Human-readable message
- `timestamp`: ISO 8601 timestamp
- `data`: Additional context

## Performance Considerations

- BullMQ provides efficient job queuing with Redis
- Prisma enables optimized database queries
- Rate limiting prevents resource exhaustion
- Worker concurrency is configurable (default: 5)
- Connection pooling for database and Redis

## Security

TODO:
- Implement JWT authentication
- Add request validation middleware
- Implement CORS properly
- Add rate limiting middleware
- Secure sensitive environment variables
- Add input sanitization

## Contributing

1. Create a feature branch
2. Implement changes with TypeScript
3. Add TODO comments for incomplete sections
4. Submit pull request

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
