# Project Structure

## Root Layout

```
moqui/
├── framework/          # Moqui Framework core
├── runtime/            # Runtime configuration and components
├── frontend/           # Vue.js/Quasar mobile frontend
├── docker/             # Docker deployment configs
├── docs/               # Project documentation
└── testing-tools/      # Debug and test scripts
```

## Framework (`framework/`)

Core Moqui Framework - generally not modified.

```
framework/
├── src/main/           # Java/Groovy source code
├── entity/             # Core entity definitions (XML)
├── service/            # Core service definitions (XML)
├── screen/             # Framework screens (XML)
├── data/               # Seed data (XML)
└── xsd/                # XML Schema definitions
```

## Runtime (`runtime/`)

Application runtime - main development area.

```
runtime/
├── component/          # Application components (main dev area)
│   ├── moqui-marketplace/   # Supply-demand marketplace
│   ├── moqui-mcp/           # MCP AI integration
│   ├── HiveMind/            # Project management
│   ├── SimpleScreens/       # Common UI screens
│   ├── mantle-udm/          # Universal Data Model
│   └── mantle-usl/          # Universal Service Library
├── conf/               # Configuration files
│   ├── MoquiDevConf.xml     # Development config
│   └── MoquiProductionConf.xml
├── db/                 # Database files (H2)
└── log/                # Application logs
```

## Component Structure

Each component follows this pattern:

```
component-name/
├── entity/             # Entity definitions (*.xml)
├── service/            # Service definitions (*.xml)
├── screen/             # Screen definitions (*.xml)
├── data/               # Seed/demo data (*.xml)
└── MoquiConf.xml       # Component configuration
```

## Frontend (`frontend/moqui-ai-mobile/`)

Vue 3 + Quasar mobile application.

```
frontend/moqui-ai-mobile/
├── src/
│   ├── components/     # Reusable Vue components
│   ├── pages/          # Page components (routes)
│   ├── views/          # View components
│   ├── router/         # Vue Router config
│   ├── stores/         # Pinia state stores
│   ├── services/       # API service layer
│   ├── styles/         # SCSS styles
│   └── utils/          # Utility functions
├── public/             # Static assets
└── vite.config.ts      # Vite configuration
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `runtime/conf/MoquiDevConf.xml` | Development configuration, AI API keys |
| `build.gradle` | Root Gradle build script |
| `myaddons.xml` | Custom component dependencies |
| `frontend/*/vite.config.ts` | Frontend build configuration |
