# Technology Stack

## Backend

- **Framework**: Moqui Framework 3.1.0
- **Language**: Java 21 LTS, Groovy
- **Authentication**: JWT + Apache Shiro
- **Database**: H2 (dev) / MySQL (production)
- **Search**: OpenSearch 2.4.0 / ElasticSearch 7.10.2

## Frontend

- **Framework**: Vue.js 3.5.x + Quasar 2.18.x
- **Build Tool**: Vite 7.x
- **State Management**: Pinia 3.x
- **Routing**: Vue Router 4.x
- **Mobile**: Capacitor 7.x
- **Language**: TypeScript 5.9.x

## AI Integration

- **Primary Provider**: Zhipu AI (GLM-4, GLM-4V-Plus)
- **Capabilities**: Text generation, speech-to-text, image recognition

## Build System

- **Backend**: Gradle (Groovy DSL)
- **Frontend**: npm/Vite

## Common Commands

### Backend

```bash
# Start Moqui server
./gradlew run

# Build WAR file
./gradlew build

# Clean build artifacts
./gradlew clean

# Clean database
./gradlew cleanDb

# Start/Stop OpenSearch
./gradlew startElasticSearch
./gradlew stopElasticSearch

# Run tests
./gradlew test
```

### Frontend (from `frontend/moqui-ai-mobile/`)

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Lint and fix
npm run lint
```

## Requirements

- Java 21 LTS
- Node.js 20.19+ or 22.12+
- Minimum 8GB RAM
