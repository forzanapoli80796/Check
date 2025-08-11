# ForzaCheck - Checklist Management System

## Overview

ForzaCheck is a checklist management system designed for retail stores to track task completion across different work areas. The application features role-based access with three user types: employees, managers (Betriebsleiter), and administrators. It provides an intuitive workflow for employees to complete checklists and comprehensive dashboards for supervisors to monitor progress.

## User Preferences

Preferred communication style: Simple, everyday language.
Logo usage: Only use the official ForzaCheck logo (FORZACHECK1_black_1753816621910.png) provided by the user.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with TanStack Query for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Data Storage**: In-memory storage fallback with interface for easy database migration
- **API Design**: RESTful endpoints with JSON responses
- **Development**: Vite for development server and hot module replacement

### Build System
- **Bundler**: Vite for frontend, esbuild for backend
- **TypeScript**: Strict mode with path mapping for clean imports
- **Package Manager**: npm with lockfile for reproducible builds

## Key Components

### Database Schema
- **Categories**: Work areas like Terminal, Kitchen, Driver, Inventory, Deep Cleaning
  - **useShifts** field: Boolean to determine if category uses shift-based workflow (added 2025-08-11)
  - Categories with simple checklist mode (useShifts=false): "Samstag Reinigung 3", "Betriebsleiter" (updated 2025-08-11)
- **Tasks**: Individual checklist items assigned to categories with priority levels and store-specific assignments (stores array field added 2025-08-09)
- **Checklists**: Completed task submissions with employee and store information
- **Teig Production**: Daily dough ball quantity targets per store with weekly planning capability

### User Roles
- **Mitarbeiter (Employee)**: Complete checklists through guided workflow
- **Teig (Dough Production)**: View daily production targets and quantities by store
- **Betriebsleiter (Manager)**: Complete management-specific tasks and checklist workflow (managed via Admin)
- **Admin**: Full system management including category and task configuration, weekly dough production planning

### Core Features
- **Employee Workflow**: Step-by-step process (Store → Area → Details → Tasks → Success)
  - Store-specific task filtering: Only shows tasks assigned to the selected store (added 2025-08-09)
- **Teig Dashboard**: Daily production overview showing required dough ball quantities by store
- **Betriebsleiter Workflow**: Management-specific task checklist workflow (Store → Details → Tasks → Submit)
- **Admin Dashboard**: Comprehensive management of categories, tasks, submissions, and weekly dough production planning
  - Store selection for tasks: Admin can assign tasks to specific stores (JP23, KP5, TS17) during creation/editing
- **Real-time Updates**: TanStack Query for optimistic updates and cache management
- **Consistent Branding**: Official ForzaCheck logo integrated across all pages with header component

## Data Flow

### Employee Journey
1. Select store location (JP23, KP5, TS17)
2. Choose work area (Terminal, Kitchen, Driver, etc.)
3. Enter employee name and shift type
4. Complete assigned tasks with checkboxes
5. Submit completed checklist

### Admin Management
1. Manage categories with icons and descriptions
2. Create and organize tasks by category
3. Set task priorities and estimated completion times
4. View and filter submitted checklists
5. Delete outdated submissions

### Data Persistence
- Drizzle ORM handles database operations with PostgreSQL
- Memory storage provides fallback during development
- Automatic UUID generation for all entities
- Timestamp tracking for audit trails
- Teig production data stored with date-based indexing for efficient weekly planning queries

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with migration support
- **@tanstack/react-query**: Server state management and caching
- **zod**: Schema validation for forms and API endpoints

### UI Components
- **@radix-ui/***: Accessible, unstyled UI primitives
- **lucide-react**: Consistent icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Fast development server and build tool
- **tsx**: TypeScript execution for development
- **wouter**: Lightweight routing solution

## Deployment Strategy

### Development Environment
- Uses Vite dev server with HMR for frontend
- Express server with tsx for backend hot reloading
- Environment variables for database configuration
- Replit-specific plugins for development experience

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- esbuild compiles backend to single ESM file
- Static file serving through Express
- Database migrations via Drizzle Kit

### Deployment Warnings
- **CRITICAL**: MemStorage data is not persistent in Replit deployments
- All categories, tasks, and checklists will reset on each deploy
- Production environment sets `NODE_ENV=production` and `REPLIT_DEPLOYMENT=1`
- Consider PostgreSQL for production to maintain data persistence

### Database Management
- PostgreSQL schema defined in `shared/schema.ts`
- Drizzle migrations stored in `./migrations`
- Push schema changes with `npm run db:push`
- Environment variable `DATABASE_URL` required for connection

### Architecture Benefits
- **Type Safety**: Full-stack TypeScript with shared schema types
- **Scalability**: Clean separation between storage interface and implementation
- **Maintainability**: Component-based UI with consistent design system
- **Developer Experience**: Fast development with hot reloading and type checking