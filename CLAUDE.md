# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Staka Livres** is a production-ready manuscript correction and editing platform built with React/TypeScript frontend, Node.js/Express backend, and MySQL database. The project uses a monorepo structure with comprehensive admin interface, dynamic pricing system, and real-time messaging capabilities.

## Architecture

### Monorepo Structure
- **frontend/**: React 18 + TypeScript + Vite + React Query v5 + Tailwind CSS
- **backend/**: Node.js + Express + TypeScript + Prisma ORM + JWT auth
- **shared/**: Common TypeScript types and utilities

### Key Technologies
- **Frontend**: React Query for server state management, Tailwind for styling, 80+ modular components
- **Backend**: 12 specialized controllers with 40+ REST endpoints, Prisma ORM, JWT authentication
- **Database**: MySQL 8 with 12 data models, comprehensive relations and constraints
- **Payment**: Stripe integration with automatic invoice generation and PDF creation
- **Testing**: Jest (backend), Vitest + Cypress (frontend) with 87% coverage

## Common Development Commands

### Setup and Installation
```bash
# Install all dependencies
npm run install:all

# Start development with Docker (recommended)
npm run docker:dev

# Start development locally
npm run dev
```

### Development Commands
```bash
# Frontend development
npm run dev:frontend          # Start frontend dev server
cd frontend && npm run lint    # Lint frontend code
cd frontend && npm run test    # Run frontend tests (Vitest)
cd frontend && npm run test:e2e # Run E2E tests (Cypress)
cd frontend && npm run test:unit # Run Jest unit tests

# Backend development
npm run dev:backend           # Start backend dev server
cd backend && npm run test    # Run backend tests (Jest)
cd backend && npm run db:migrate # Run database migrations
cd backend && npm run db:generate # Generate Prisma client
cd backend && npm run prisma:seed # Seed database with test data
```

### Building and Testing
```bash
# Build all packages
npm run build

# Run comprehensive tests
npm run test                  # Backend tests
cd frontend && npm run test:run # Frontend tests
cd frontend && npm run test:coverage # Test coverage report
```

### Database Management
```bash
# Generate Prisma client after schema changes
cd backend && npm run db:generate

# Run database migrations
cd backend && npm run db:migrate

# Seed database with test data (includes admin/user/corrector accounts)
cd backend && npm run prisma:seed

# Access Prisma Studio for database inspection
# Visit http://localhost:5555 when Docker is running
```

## Key Features and Implementation Details

### Authentication System
- JWT-based authentication with 7-day token expiration
- bcrypt password hashing (12 rounds)
- Role-based access control (USER, ADMIN, CORRECTOR)
- Rate limiting on authentication endpoints
- Protected routes with middleware validation

### Database Schema (12 Models)
- **User**: Authentication, roles, profiles with GDPR compliance
- **Commande**: Project management with status tracking and payment integration
- **Message**: Unified messaging system with conversation threading
- **Invoice**: Automatic PDF generation with S3 storage
- **File**: Document management with security controls
- **FAQ, Tarif, Page**: Content management systems
- **SupportRequest, PaymentMethod, Notification**: Supporting features

### React Query Implementation
- **5-minute cache** for pricing data with background refetching
- **30-second cache** for messaging with optimistic updates
- **Intelligent invalidation** for admin-to-public synchronization
- **Error handling** with retry logic and fallbacks
- **1000+ lines** of specialized hooks for complex state management

### Admin Interface (9 Complete Pages)
- **AdminUtilisateurs**: User management with GDPR-compliant deletion (625 lines)
- **AdminCommandes**: Project tracking with status management (964 lines)
- **AdminFactures**: Invoice management with PDF generation (1177 lines)
- **AdminMessagerie**: Messaging administration (215 lines)
- **AdminFAQ**: Knowledge base management (1130 lines)
- **AdminTarifs**: Dynamic pricing configuration (1233 lines)
- **AdminPages**: CMS for static pages (180 lines)
- **AdminStatistiques**: Analytics dashboard (394 lines)
- **Demo Mode**: Professional demonstration with mock data (453 lines)

### Dynamic Pricing System
- **Real-time synchronization** between admin and landing page
- **React Query cache invalidation** for instant updates
- **usePricing() hook** with intelligent caching (440 lines)
- **Fallback mechanisms** for error handling
- **15 comprehensive tests** (10 unit + 5 E2E)

### Payment Integration
- **Stripe Checkout** for PCI DSS compliance
- **Webhook handling** with signature verification
- **Automatic invoice generation** with PDFKit
- **AWS S3 integration** for file storage
- **SendGrid email notifications**

## Security Guidelines

### Authentication & Authorization
- JWT tokens with proper expiration handling
- bcrypt password hashing (never store plain text)
- Rate limiting on `/auth` endpoints
- Log all failed login attempts for security audit
- Validate inputs with Zod (backend) and form validation (frontend)

### GDPR Compliance
- **Cascade deletion** for account removal (all related data)
- **Data export functionality** in JSON/ZIP format
- **Consent tracking** in user registration
- **Confirmation tokens** for sensitive operations
- **Activity logging** for all sensitive actions

### Stripe Security
- **Signature verification** for all webhooks using STRIPE_WEBHOOK_SECRET
- **Never store card information** directly
- **Log all payment events** for audit trail
- **Use Stripe Checkout** for PCI DSS compliance

## Testing Strategy

### Backend Tests (87% Coverage)
- **Unit tests** for services and controllers
- **Integration tests** for API endpoints with real database
- **Webhook testing** with Stripe event simulation
- **Security tests** for authentication and authorization
- **Performance tests** ensuring < 1 second response times

### Frontend Tests
- **Unit tests** with Vitest for components and hooks
- **Integration tests** for React Query hooks and API calls
- **E2E tests** with Cypress (19 scenarios)
- **Visual regression tests** for UI consistency

### Test Data and Environments
- **Seed database** with realistic test data
- **Demo mode** with professional mock data
- **Test accounts**: admin@test.com, user@test.com, corrector@test.com (password: password)
- **Isolated test databases** for integration testing

## Performance Considerations

### React Query Configuration
- **5-minute stale time** for pricing data
- **30-second cache** for messaging
- **Background refetching** enabled
- **Optimistic updates** for mutations
- **Cache invalidation strategies** for real-time updates

### Database Optimizations
- **Indexed queries** for performance
- **Cascade deletes** for data integrity
- **Type-safe queries** with Prisma
- **Connection pooling** for production

## Development Patterns

### Component Architecture
- **Modular React components** with TypeScript
- **Custom hooks** for complex state management
- **Error boundaries** for graceful error handling
- **Consistent loading states** across UI

### Backend Architecture
- **Controller-Service pattern** for business logic separation
- **Middleware chain** for authentication and validation
- **Centralized error handling** with proper HTTP status codes
- **Structured logging** with Winston

### API Design
- **RESTful endpoints** with consistent naming
- **Zod validation** for request/response schemas
- **Proper HTTP status codes** and error responses
- **Comprehensive documentation** in separate guides

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# Authentication
JWT_SECRET="your_secure_jwt_secret"
NODE_ENV="development"

# Frontend
FRONTEND_URL="http://localhost:3000"
PORT=3001

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional services
SENDGRID_API_KEY="your_sendgrid_key"
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files"
```

### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555
- **Database**: localhost:3306

## Troubleshooting

### Common Issues
- **504 Optimize Dep Error**: Run `rm -rf node_modules/.vite` and restart
- **Docker MySQL Issues**: Ensure `--mysql-native-password=ON` in configuration
- **Database Migration Failures**: Check schema compatibility and run `db:generate`
- **React Query Cache Issues**: Use invalidation hooks provided in project

### Performance Issues
- **Webhook Duplication**: Clean up duplicate endpoints in payment controller
- **Admin Interface Slowness**: Enable demo mode for faster development
- **Database Query Optimization**: Use Prisma Studio to analyze query performance

## Documentation References

The project includes comprehensive documentation in `/docs`:
- **Admin Guide**: Complete admin interface documentation
- **Backend Guide**: API documentation and architecture
- **Frontend Guide**: Component architecture and patterns
- **Database Guide**: Complete schema and migration documentation
- **Billing Guide**: Payment integration and invoice generation
- **Testing Guide**: Comprehensive testing strategies
- **Webhook Guide**: Stripe integration and event handling

## Code Style and Security Rules

### Authentication Rules
- Use JWT with 30-minute expiration (refresh tokens planned)
- Hash passwords with bcrypt (12 rounds minimum)
- Implement rate limiting on authentication endpoints
- Log all failed login attempts with IP and timestamp

### GDPR Compliance Rules
- Account deletion must cascade to all related data
- Provide complete data export functionality
- Log all sensitive operations with timestamps
- Use confirmation tokens for destructive actions

### Stripe Security Rules
- Use Stripe Checkout for PCI DSS compliance
- Verify webhook signatures on all endpoints
- Never store card information directly
- Log all payment events for audit trail

## Development Workflow

1. **Setup**: Use Docker for consistent environment
2. **Database**: Run migrations and seed data
3. **Testing**: Write tests before implementing features
4. **Documentation**: Update relevant guides when adding features
5. **Security**: Follow established patterns for authentication and data protection
6. **Performance**: Use React Query patterns for optimal caching
7. **Deployment**: Use Docker compose for production environments

## Docker and Local Development Guidelines

### Key Development Principles
- **Always use docker and no local** for consistent development environments
- Ensure all dependencies and services are containerized
- Use Docker Compose for managing multi-container applications
- Maintain identical configurations between development and production