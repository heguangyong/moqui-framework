# Frontend Projects

This directory contains all frontend applications for the Moqui AI-driven ecosystem.

## Project Structure

```
frontend/
├── moqui-ai-mobile/     # Quasar Framework mobile app
├── web-admin/           # Admin dashboard (optional)
├── shared/              # Shared resources and utilities
│   ├── api/            # Shared API clients
│   ├── components/     # Shared Vue components
│   ├── utils/          # Shared utilities
│   └── types/          # TypeScript type definitions
└── docs/               # Frontend-specific documentation
```

## Development Workflow

### Mobile App Development
```bash
cd frontend/moqui-ai-mobile
npm run dev          # Development server
npm run build        # Production build
quasar dev -m ios     # iOS development
quasar dev -m android # Android development
```

### Shared Resources
- API clients for Moqui backend integration
- Common UI components
- Utility functions
- TypeScript type definitions

## Backend Integration

### API Endpoints
- Base URL: `http://localhost:8080`
- Authentication: JWT Bearer tokens
- REST API: `/rest/s1/`
- MCP AI Services: `/rest/s1/mcp/`

### Key Services
- **Authentication**: `/rest/s1/moqui/auth/`
- **HiveMind**: `/rest/s1/hivemind/`
- **Commerce**: `/rest/s1/commerce/`
- **Marketplace**: `/rest/s1/marketplace/`
- **MCP AI**: `/rest/s1/mcp/`