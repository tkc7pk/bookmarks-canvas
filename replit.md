# Bookmarks Canvas Application

## Overview

This is a full-stack bookmark management application that provides an interactive canvas interface for organizing and managing bookmarks. Users can create, edit, delete, and visually arrange bookmarks on a drag-and-drop canvas with grid positioning. The application features a modern React frontend with a Express.js backend and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing with authentication-based routing
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: Replit Auth integration with React hooks
- **UI Components**: Radix UI primitives with custom styling
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless)
- **API Style**: RESTful endpoints with authentication middleware
- **Validation**: Zod for request/response validation
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **Development**: Hot reload with tsx

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless (Active)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Session Storage**: PostgreSQL sessions with connect-pg-simple
- **User Authentication**: Replit Auth with user data isolation
- **Storage Implementation**: DatabaseStorage class with user-scoped operations

## Key Components

### Database Schema
The application uses three main entities:

1. **Users Table** (Replit Auth)
   - `id`: Primary key (Replit user ID)
   - `email`: User email address
   - `firstName`, `lastName`: User profile information
   - `profileImageUrl`: User avatar URL
   - `createdAt`, `updatedAt`: Timestamps

2. **Sessions Table** (Authentication)
   - `sid`: Session ID primary key
   - `sess`: Session data (JSON)
   - `expire`: Session expiration timestamp

3. **Bookmarks Table** (User-scoped)
   - `id`: Serial primary key
   - `userId`: Foreign key to users table
   - `title`: Bookmark display name
   - `url`: Target URL
   - `icon`: Emoji, base64 image data, or text
   - `iconType`: Either 'emoji', 'image', or 'text'
   - `x`, `y`: Canvas position coordinates
   - `isPlaced`: Boolean flag for canvas placement status

### API Endpoints
#### Authentication Endpoints
- `GET /api/login` - Initiate Replit Auth login flow
- `GET /api/callback` - Handle OAuth callback
- `GET /api/logout` - Sign out user
- `GET /api/auth/user` - Get current user information
- `POST /api/local/login` - Local user authentication
- `POST /api/local/logout` - Local user logout

#### Bookmark Endpoints (Protected)
- `GET /api/bookmarks` - Retrieve user's bookmarks
- `GET /api/bookmarks/:id` - Get specific user bookmark
- `POST /api/bookmarks` - Create new bookmark for user
- `PATCH /api/bookmarks/:id` - Update user's existing bookmark
- `DELETE /api/bookmarks/:id` - Remove user's bookmark

### Frontend Features
- **Interactive Canvas**: Drag-and-drop interface for bookmark positioning
- **Sidebar Management**: Collapsible sidebar for bookmark list and creation
- **Grid Toggle**: Optional grid overlay for precise positioning
- **Modal Forms**: Create and edit bookmarks with validation
- **File Upload**: Support for custom bookmark icons
- **Sticky Notes**: Customizable notes with colors, fonts, resizing, and positioning
- **Responsive Design**: Mobile-friendly interface with touch support

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **API Processing**: Express.js routes handle requests with Zod validation
3. **Database Operations**: Drizzle ORM performs type-safe database operations
4. **Response Handling**: Data flows back through the same chain with error handling
5. **UI Updates**: React components re-render based on query state changes

The application uses optimistic updates for better user experience, with automatic rollback on errors.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight client-side routing
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Development Environment
- Frontend: Vite dev server with HMR
- Backend: tsx with automatic restart
- Database: Neon Database development instance
- Build: Concurrent frontend and backend development

### Production Build
- Frontend: Static assets built with Vite
- Backend: Bundled with esbuild for Node.js runtime
- Database: Production Neon Database instance
- Deployment: Single Node.js server serving both API and static files

The application is configured for Replit deployment with environment-specific optimizations and development tooling integration.

## Changelog
- July 05, 2025: Initial setup with in-memory storage
- July 05, 2025: Migrated to PostgreSQL database with DatabaseStorage implementation
- July 06, 2025: Added dual authentication system with Replit Auth and local user accounts
- July 06, 2025: Created separate authentication pages - main landing (/), local auth (/auth)
- July 06, 2025: Created comprehensive user guide page (/guide) with interactive animations and multilingual support
- July 07, 2025: Added sticky notes feature with custom colors, fonts, resizing, drag-and-drop, and right-click editing
- July 07, 2025: Fixed SPA routing issues causing 404 errors on direct URL access by improving authentication flow and loading states
- July 09, 2025: Implemented dynamic canvas scrolling functionality - canvas automatically expands based on object positions and responds to window size changes

## User Preferences

Preferred communication style: Simple, everyday language.