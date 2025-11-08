---
name: quasar
description: Quasar Vue.js framework for building responsive web, mobile and desktop applications with a single codebase
---

# Quasar Skill

Comprehensive assistance with Quasar development, the Vue.js framework for creating responsive applications across multiple platforms with a single codebase.

## When to Use This Skill

This skill should be triggered when:
- **Creating new Quasar projects** - Setting up Vue.js apps with Quasar CLI
- **Working with Quasar components** - Using QBtn, QInput, QTable, QDialog, and other UI components
- **Building multi-platform apps** - Targeting web (SPA/SSR), mobile (Cordova/Capacitor), and desktop (Electron)
- **Implementing responsive layouts** - Using Quasar's grid system and breakpoint utilities
- **Configuring build modes** - Setting up SSR, PWA, mobile app, or desktop app builds
- **Debugging Quasar applications** - Troubleshooting component issues, build problems, or platform-specific bugs
- **Quasar CLI operations** - Running dev server, building for production, adding platforms
- **Using Quasar plugins and directives** - Implementing features like animations, touch gestures, or internationalization

## Quick Reference

### Project Setup

#### Create New Quasar Project
```bash
# Create project with Yarn
yarn create quasar

# Create project with NPM
npm create quasar

# Install global CLI (optional but recommended)
yarn global add @quasar/cli
# or
npm install -g @quasar/cli
```

#### Start Development Server
```bash
# Navigate to project folder
cd my-quasar-project

# Start dev server
quasar dev
# or
yarn quasar dev
# or
npm run dev
```

### Essential Components

#### Basic Button Usage
```vue
<template>
  <q-btn
    color="primary"
    label="Click me"
    @click="handleClick"
  />

  <q-btn
    color="secondary"
    icon="add"
    round
    @click="addItem"
  />
</template>
```

#### Form Input Components
```vue
<template>
  <q-input
    v-model="text"
    label="Your name"
    hint="Enter your full name"
    :rules="[val => !!val || 'Field is required']"
  />

  <q-select
    v-model="model"
    :options="options"
    label="Choose option"
    emit-value
    map-options
  />
</template>
```

#### Layout Structure
```vue
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>App Title</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" bordered>
      <q-list>
        <q-item clickable>
          <q-item-section>Menu Item</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
```

### Build Commands

#### Development and Production
```bash
# Development mode
quasar dev

# Build for production (SPA)
quasar build

# Build for SSR
quasar build -m ssr

# Build as PWA
quasar build -m pwa
```

#### Mobile App Development
```bash
# Add Cordova mode
quasar mode add cordova

# Add Capacitor mode
quasar mode add capacitor

# Develop for mobile
quasar dev -m cordova -T android
quasar dev -m capacitor -T ios

# Build mobile app
quasar build -m cordova -T android
quasar build -m capacitor -T ios
```

### Configuration Examples

#### Basic Quasar Config
```javascript
// quasar.config.js
module.exports = function (ctx) {
  return {
    framework: {
      config: {},
      plugins: ['Notify', 'Dialog']
    },

    build: {
      vueRouterMode: 'history',
      env: {
        API_URL: ctx.dev ? 'http://localhost:3000' : 'https://api.prod.com'
      }
    }
  }
}
```

## Key Concepts

### Multi-Platform Architecture
Quasar allows you to write once and deploy everywhere:
- **SPA** (Single Page Application) - Standard web app
- **SSR** (Server-Side Rendering) - SEO-friendly web app
- **PWA** (Progressive Web App) - App-like web experience
- **Mobile** - Native mobile apps via Cordova/Capacitor
- **Desktop** - Cross-platform desktop apps via Electron

### Quasar CLI vs Create Quasar
- **Quasar CLI**: Global installation for creating and managing projects
- **Create Quasar**: NPM/Yarn create command for quick project setup
- Both achieve the same result, CLI offers more advanced features

### Component System
Quasar provides 80+ Vue components following Material Design principles:
- All components are prefixed with `q-` (e.g., `q-btn`, `q-input`)
- Components are tree-shakable (only imported ones are bundled)
- Consistent API across all components with props, slots, and events

## Reference Files

This skill includes comprehensive documentation in `references/`:

- **components.md** - Components documentation
- **getting_started.md** - Getting Started documentation
- **layout.md** - Layout documentation
- **styling.md** - Styling documentation

Use `view` to read specific reference files when detailed information is needed.

## Working with This Skill

### For Beginners
1. Start with the **getting_started.md** reference file for project setup
2. Learn the basic layout structure using `q-layout`, `q-header`, `q-drawer`
3. Practice with simple components like `q-btn`, `q-input`, `q-card`
4. Understand the development workflow: create → develop → build

### For Intermediate Developers
1. Explore different build modes (SPA, SSR, PWA)
2. Learn component composition and custom components
3. Implement responsive designs using Quasar's grid system
4. Add plugins and configure the framework for your needs

### For Advanced Users
1. Set up multi-platform builds (mobile, desktop)
2. Create custom Quasar plugins and directives
3. Optimize bundle size and performance
4. Implement advanced patterns like state management integration

### Navigation Tips
- Always check the getting_started reference first for setup issues
- Use Quick Reference for common code patterns
- Reference files contain detailed API documentation and examples
- Look for "Prerequisites" sections to ensure proper environment setup

## Resources

### references/
Organized documentation extracted from official Quasar sources. These files contain:
- Detailed setup and configuration instructions
- Step-by-step tutorials for different features
- Code examples with proper Vue.js syntax
- Links to official Quasar documentation
- Platform-specific guides for mobile and desktop development

### scripts/
Add helper scripts here for common Quasar automation tasks:
- Build automation scripts
- Deployment helpers
- Development environment setup

### assets/
Add Quasar-related templates and boilerplate here:
- Component templates
- Layout examples
- Configuration files for different platforms

## Notes

- This skill focuses on Quasar Framework v2+ with Vue 3 composition API
- All code examples use modern Vue.js syntax and best practices
- Build commands assume you have Node.js ≥20 and npm/yarn installed
- Mobile development requires additional platform-specific SDKs (Android Studio, Xcode)
- Reference files preserve the structure and examples from official Quasar documentation

## Updating

To refresh this skill with updated Quasar documentation:
1. Re-run the scraper with the same configuration against latest Quasar docs
2. The skill will be rebuilt with the latest API changes and features
3. Check for breaking changes between Quasar versions when updating