# Overview

This is a personal finance management application built as a mobile-first web app for Arabic-speaking users. The application allows users to track income and expenses, set financial goals, analyze spending patterns, and manage transactions through both manual input and voice commands. The interface is fully localized in Arabic with right-to-left (RTL) layout support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built using React with TypeScript and follows a component-based architecture:
- **React with TypeScript**: Modern type-safe frontend development
- **Wouter**: Lightweight client-side routing for SPA navigation  
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built component library
- **React Hook Form + Zod**: Form management with schema validation
- **TanStack Query**: Server state management and caching
- **Recharts**: Data visualization for analytics charts

## Backend Architecture
The server follows a RESTful API pattern with Express.js:
- **Express.js**: Node.js web framework for API endpoints
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Zod**: Runtime type validation for API inputs
- **In-memory storage fallback**: Development storage using Map-based collections

## Data Storage Solutions
- **PostgreSQL**: Primary database using Neon serverless
- **Drizzle ORM**: Database schema definition and migrations
- **LocalStorage fallback**: Client-side storage for development/offline scenarios
- **Session management**: PostgreSQL-backed sessions with connect-pg-simple

## Key Features
- **Multi-language support**: Arabic primary with RTL layout
- **Voice input**: Speech recognition for transaction entry
- **Mobile-first design**: Responsive UI optimized for mobile devices
- **Real-time analytics**: Category-based spending analysis and goal tracking
- **Offline capability**: LocalStorage manager for client-side data persistence

## Database Schema
The application uses four main entities:
- **Transactions**: Financial records with amount, type, category, and timestamps
- **Categories**: Predefined income/expense categories with Arabic names and icons
- **Goals**: Financial targets with periods and progress tracking
- **Users**: User authentication and profile management (schema defined but not fully implemented)

# External Dependencies

## Core Framework Dependencies
- **React ecosystem**: React, React DOM, React Hook Form, TanStack Query
- **UI components**: Radix UI primitives, shadcn/ui components, Lucide icons
- **Styling**: Tailwind CSS, class-variance-authority, clsx

## Backend Dependencies  
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **Validation**: Zod, drizzle-zod
- **Development**: Vite, TypeScript, ESBuild

## Browser APIs
- **Speech Recognition**: Web Speech API for voice input (webkit prefixed)
- **LocalStorage**: Browser storage for offline functionality
- **Date/Time**: date-fns for date manipulation and formatting

## Development Tools
- **Replit integration**: Vite plugins for development environment
- **Build tools**: Vite for frontend bundling, ESBuild for server compilation
- **Database tools**: Drizzle Kit for schema management and migrations