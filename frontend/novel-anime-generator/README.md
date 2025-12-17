# Novel-to-Anime Generator

An AI-powered system that converts complete novels into serialized animated short videos while maintaining story consistency, character integrity, and narrative flow.

## Features

- **Novel Parser**: Upload and analyze novel structure
- **Character System**: Identify and maintain character consistency
- **Plot Analyzer**: Preserve main storyline and key plot points
- **Episode Generator**: Create episodic content for short video platforms
- **Script Converter**: Transform narrative to screenplay format
- **Storyboard Creator**: Generate detailed visual descriptions
- **AI Video Generator**: Create animated video content
- **Workflow Editor**: Visual pipeline management
- **Asset Library**: Manage and reuse visual assets

## Technology Stack

- **Frontend**: Vue 3 + TypeScript + Quasar
- **Build Tool**: Vite
- **State Management**: Pinia
- **Testing**: Vitest + fast-check (Property-Based Testing)
- **Backend**: Moqui Framework (Java/Groovy)

## Development Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check
```

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── views/          # Page components
├── stores/         # Pinia state stores
├── services/       # API services
├── types/          # TypeScript type definitions
├── styles/         # SCSS stylesheets
├── router/         # Vue Router configuration
└── test/           # Test files
    ├── property-tests/  # Property-based tests
    └── setup.ts         # Test setup
```

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: Universal properties using fast-check

Property tests run with minimum 100 iterations and are tagged with:
`**Feature: novel-anime-generator, Property {number}: {property_text}**`

## Design Principles

- Follows Kiro's design patterns and UI conventions
- Maintains character consistency across all generated content
- Preserves source material fidelity
- Provides comprehensive error handling and recovery
- Supports efficient processing of large novels

## API Integration

The frontend communicates with the Moqui backend through REST APIs:

- Novel parsing and analysis
- Character identification and management
- Episode generation
- Video processing pipeline
- Asset storage and retrieval

## Contributing

1. Follow the established TypeScript and Vue 3 patterns
2. Write both unit tests and property-based tests for new features
3. Maintain consistency with Kiro's design system
4. Document all public APIs and interfaces

## License

This project is part of the Moqui ecosystem and follows the same licensing terms.