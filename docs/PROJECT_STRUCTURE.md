# Project Structure

This document outlines the organized structure of the Teaching Center Management System following industry standards.

## Directory Structure

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
├── config/                # Additional configuration files (if needed)
├── tools/                 # Development tools and utilities
├── .env*                  # Environment configuration files
├── package.json           # Node.js dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── .eslintrc.json         # ESLint configuration
```

## Directory Purposes

### Core Directories
- **`src/`**: All application source code
- **`prisma/`**: Database schema, migrations, and seed files
- **`tests/`**: All test files organized by type

### Organization Directories
- **`scripts/`**: Shell scripts for deployment, setup, and maintenance
- **`docs/`**: All documentation, guides, and README files
- **`database/`**: SQL scripts for database setup and migrations
- **`docker/`**: Docker configuration and compose files

### Operational Directories
- **`backups/`**: Project backup files
- **`logs/`**: Application log files
- **`tools/`**: Development tools and utilities

## File Naming Conventions

- **Scripts**: `kebab-case.sh` (e.g., `deploy-production.sh`)
- **Tests**: `test-descriptive-name.js/ts` (e.g., `test-api.js`)
- **Documentation**: `Descriptive-Title.md` (e.g., `DEPLOYMENT-GUIDE.md`)
- **Database**: `action-description.sql` (e.g., `setup-database.sql`)

## Development Workflow

1. **Source Code**: Place in `src/` directory
2. **Tests**: Place in `tests/` directory
3. **Scripts**: Place in `scripts/` directory
4. **Documentation**: Place in `docs/` directory
5. **Database Changes**: Place in `database/` directory
6. **Backups**: Store in `backups/` directory
7. **Logs**: Store in `logs/` directory

## Benefits of This Structure

- **Clarity**: Easy to find files by purpose
- **Scalability**: Room for growth and new features
- **Industry Standards**: Follows modern web development best practices
- **Maintainability**: Clear separation of concerns
- **Collaboration**: Easier for team members to navigate</content>
<parameter name="filePath">/home/goncalo/projects/AI/teachingCenter/docs/PROJECT_STRUCTURE.md
