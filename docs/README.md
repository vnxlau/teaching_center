# Teaching Center Management System

A comprehensive web application for managing teaching centers with financial tracking, academic progress monitoring, and multi-user access.

## Features

### 🏢 **Administrative Management**
- **Financial Tracking**: Monitor student payment status, monthly fees, and billing history
- **Student Profiles**: Comprehensive student information management
- **Teaching Plans**: Create and manage personalized teaching plans
- **Reports & Analytics**: Generate detailed reports on financial and academic performance

### 📚 **Academic Management**
- **Progress Tracking**: Monitor student academic growth and development
- **Test Scheduling**: Schedule and manage tests and examinations
- **Grade Management**: Track grades, test scores, and academic performance
- **Important Dates**: Manage delivery dates and academic milestones
- **Student Files**: Maintain comprehensive academic records

### 👥 **Multi-User Access**
- **Admin Portal**: Full system access for teaching center staff
- **Student Portal**: Students can view their progress, grades, and information
- **Parent Portal**: Parents can communicate with staff and view student updates
- **Role-Based Permissions**: Secure access based on user roles

### 📅 **School Year Management**
- **Year-Based Views**: All data organized by school year
- **Historical Data**: Access to previous years' records and notes
- **Academic Calendar**: Manage important academic dates and events

### 💬 **Communication Features**
- **Messaging System**: Secure communication between staff, students, and parents
- **Notifications**: Automated alerts for important events and deadlines
- **Notes & Comments**: Add notes to student profiles and academic records

## Technology Stack

- **Frontend**: Next.js 15+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for modern, responsive design
- **Database**: (To be configured - PostgreSQL or MongoDB)
- **Authentication**: (To be implemented - NextAuth.js or similar)
- **Development**: Turbopack for fast development builds

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
teaching-center/
├── src/                    # Source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # Reusable React components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility libraries and configurations
│   ├── providers/         # Context providers
│   ├── types/             # TypeScript type definitions
│   └── messages/          # Internationalization files
├── prisma/                # Database schema and migrations
├── tests/                 # All test files (unit, integration, e2e)
├── scripts/               # Shell scripts and automation tools
├── docs/                  # Documentation and guides
├── database/              # Database setup and migration scripts
├── docker/                # Docker configuration files
├── backups/               # Project backup files
├── logs/                  # Application logs
├── config/                # Additional configuration files
├── tools/                 # Development tools and utilities
├── .env*                  # Environment configuration files
├── package.json           # Node.js dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── .eslintrc.json         # ESLint configuration
```

## File Organization Guide

### Where to Find Files

- **Source Code**: All application code is in `src/`
- **Tests**: All test files are in `tests/`
- **Scripts**: Automation and utility scripts are in `scripts/`
- **Documentation**: All guides and docs are in `docs/`
- **Database Files**: SQL scripts and migrations are in `database/`
- **Docker Config**: Container configurations are in `docker/`
- **Backups**: Project backups are stored in `backups/`
- **Logs**: Application logs are in `logs/`

### Development Workflow

1. **Add new features**: Place code in appropriate `src/` subdirectories
2. **Write tests**: Add test files to `tests/` directory
3. **Create scripts**: Place automation scripts in `scripts/` directory
4. **Write documentation**: Add guides to `docs/` directory
5. **Database changes**: Put SQL scripts in `database/` directory
6. **Docker changes**: Update files in `docker/` directory

## Design Principles

- **Simple & Intuitive**: Designed for non-tech-savvy users
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessible**: Follows WCAG guidelines for accessibility
- **Secure**: Implements proper authentication and data protection
- **Scalable**: Modular architecture for easy expansion

## Roadmap

### Phase 1: Core Setup ✅
- [x] Project initialization
- [x] Basic routing structure
- [x] UI framework setup (Tailwind CSS)
- [x] TypeScript configuration

### Phase 2: Authentication & Database
- [ ] Database schema design
- [ ] User authentication system
- [ ] Role-based access control
- [ ] Database integration

### Phase 3: Core Features
- [ ] Student management system
- [ ] Financial tracking
- [ ] Academic progress monitoring
- [ ] Basic reporting

### Phase 4: Advanced Features
- [ ] Communication system
- [ ] Advanced analytics
- [ ] Automated notifications
- [ ] Mobile responsiveness optimization

### Phase 5: Enhancement
- [ ] Performance optimization
- [ ] Advanced security features
- [ ] Integration capabilities
- [ ] Advanced reporting and analytics

## Contributing

This is a private project for a teaching center management system. Please follow the established coding standards and submit pull requests for any improvements.

## License

Private - All rights reserved

## Support

For support and questions about this teaching center management system, please contact the development team.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
