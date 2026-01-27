# Phase 3 Execution Plan: Refactor Stores to TypeScript

**Status**: 🔴 Ready to Execute  
**Date**: 2026-01-28  
**Goal**: Rewrite stores to TypeScript with clear responsibilities and single source of truth

---

## 📊 Current State Analysis

### Existing Stores

#### 1. projectStore.js (JavaScript)
**Location**: `frontend/NovelAnimeDesktop/src/renderer/stores/project.js`  
**Problems**:
- Mixed with ProjectManager class (unnecessary abstraction)
- No type safety
- Unclear data flow
- Multiple data sources (API + ProjectManager cache)

#### 2. navigationStore.js (JavaScript)
**Location**: `frontend/NovelAnimeDesktop/src/renderer/stores/navigation.js`  
**Problems**:
- ✅ workflowState deleted (Phase 1)
- Still has mixed responsibilities
- No type safety
- Stores UI state + workflow state + panel context

#### 3. SessionManager.ts (TypeScript) ✅
**Location**: `frontend/NovelAnimeDesktop/src/renderer/utils/SessionManager.ts`  
**Status**: Good - already TypeScript, clear responsibilities

---

## 🎯 Refactoring Strategy

### Goals
1. **Type Safety**: All stores in TypeScript with proper interfaces
2. **Single Source of Truth**: Backend is the only authority
3. **Clear Responsibilities**: Each store has one clear purpose
4. **No Caching**: Remove all client-side caching logic
5. **Simple API**: Easy to use, hard to misuse

### New Store Architecture

```
stores/
├── project.ts (NEW) - Project data management
├── session.ts (NEW) - Session/localStorage management
├── navigation.ts (REFACTOR) - UI navigation state only
├── ui.ts (EXISTING) - UI state (notifications, modals)
└── auth.ts (EXISTING) - Authentication state
```

---

## 📋 Implementation Steps

### Step 1: Create project.ts (TypeScript) - 3 hours

**Goal**: Replace project.js with clean TypeScript implementation

**Actions**:
1. Create `project.ts` with TypeScript interfaces
2. Define clear state interface
3. Implement actions (no ProjectManager)
4. Direct API calls only
5. Use SessionManager for session data
6. Remove all caching logic

**Interfaces**:
```typescript
interface Project {
  id: string
  projectId: string
  name: string
  description?: string
  status: ProjectStatus
  progress?: number
  createdAt: string
  updatedAt: string
}

type ProjectStatus = 
  | 'active' 
  | 'importing' 
  | 'imported' 
  | 'analyzing' 
  | 'analyzed' 
  | 'parsing' 
  | 'parsed' 
  | 'characters_confirmed' 
  | 'generating' 
  | 'completed'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
}
```

**Actions**:
```typescript
// Fetch projects from backend
async fetchProjects(): Promise<void>

// Create new project
async createProject(data: CreateProjectData): Promise<Project | null>

// Delete project
async deleteProject(projectId: string): Promise<boolean>

// Set current project
setCurrentProject(project: Project | null): void

// Clear current project
clearCurrentProject(): void
```

**Files**:
- Create: `frontend/NovelAnimeDesktop/src/renderer/stores/project.ts`
- Delete: `frontend/NovelAnimeDesktop/src/renderer/stores/project.js`

---

### Step 2: Create session.ts (TypeScript) - 1 hour

**Goal**: Centralize session/localStorage management

**Actions**:
1. Create `session.ts` with TypeScript
2. Move session logic from navigationStore
3. Use SessionManager internally
4. Provide simple API for components

**Interfaces**:
```typescript
interface SessionState {
  currentProjectId: string | null
  currentNovelId: string | null
  lastRoute: string | null
}
```

**Actions**:
```typescript
// Set current project ID
setCurrentProjectId(projectId: string | null): void

// Set current novel ID
setCurrentNovelId(novelId: string | null): void

// Get current project ID
getCurrentProjectId(): string | null

// Get current novel ID
getCurrentNovelId(): string | null

// Clear session data
clearSession(): void
```

**Files**:
- Create: `frontend/NovelAnimeDesktop/src/renderer/stores/session.ts`

---

### Step 3: Refactor navigation.ts - 2 hours

**Goal**: Simplify navigationStore to only handle UI navigation state

**Actions**:
1. Rename `navigation.js` → `navigation.ts`
2. Remove all session management (move to session.ts)
3. Remove all workflow state (deleted in Phase 1)
4. Keep only panelContext and UI navigation
5. Add TypeScript interfaces

**Interfaces**:
```typescript
interface PanelContext {
  dashboard?: DashboardContext
  workflow?: WorkflowContext
  characters?: CharactersContext
  assets?: AssetsContext
}

interface DashboardContext {
  viewType?: 'status' | 'shortcut' | 'project' | null
  selectedProject?: string | null
  statusFilter?: string | null
  shortcutType?: string | null
}

interface NavigationState {
  panelContext: PanelContext
  currentPanel: string
}
```

**Actions**:
```typescript
// Update panel context
updatePanelContext(panel: string, context: any): void

// Get panel context
getPanelContext(panel: string): any

// Clear panel context
clearPanelContext(panel: string): void
```

**Files**:
- Rename: `navigation.js` → `navigation.ts`
- Refactor: Remove session logic, add types

---

### Step 4: Update All Imports - 1 hour

**Goal**: Update all components to use new stores

**Actions**:
1. Find all imports of old stores
2. Update to new TypeScript stores
3. Update API calls (projectStore methods)
4. Test each component after update

**Files to Update**:
- `DashboardView.vue`
- `DashboardPanel.vue`
- `ProjectList.vue`
- `WorkflowEditor.vue`
- `CharactersView.vue`
- Any other files importing stores

**Search Pattern**:
```bash
grep -r "useProjectStore" src/renderer/
grep -r "useNavigationStore" src/renderer/
grep -r "from '../stores/project" src/renderer/
```

---

### Step 5: Testing & Validation - 2 hours

**Goal**: Ensure all functionality works with new stores

**Test Cases**:
1. ✅ Fetch projects from backend
2. ✅ Create new project
3. ✅ Delete project
4. ✅ Set current project
5. ✅ Clear current project
6. ✅ Session persistence (localStorage)
7. ✅ Navigation state management
8. ✅ Panel context updates
9. ✅ All components work correctly
10. ✅ No console errors
11. ✅ No type errors
12. ✅ Build succeeds

---

## 📊 Expected Results

### Before Refactoring
```
stores/
├── project.js (JavaScript, 500+ lines)
│   ├── ProjectManager class (unnecessary)
│   ├── Caching logic (problematic)
│   └── Mixed responsibilities
├── navigation.js (JavaScript, 300+ lines)
│   ├── UI navigation
│   ├── Session management
│   └── Workflow state (deleted)
└── SessionManager.ts (TypeScript, 100 lines) ✅
```

### After Refactoring
```
stores/
├── project.ts (TypeScript, 200 lines)
│   ├── Clear interfaces
│   ├── Direct API calls
│   └── No caching
├── session.ts (TypeScript, 80 lines)
│   ├── Session management
│   └── localStorage wrapper
├── navigation.ts (TypeScript, 150 lines)
│   ├── UI navigation only
│   └── Panel context
└── SessionManager.ts (TypeScript, 100 lines) ✅
```

### Benefits
1. ✅ **Type Safety**: Catch errors at compile time
2. ✅ **Clarity**: Each store has one purpose
3. ✅ **Simplicity**: Easier to understand and use
4. ✅ **Reliability**: Single source of truth (backend)
5. ✅ **Maintainability**: Easier to modify and extend

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Impact**: HIGH  
**Mitigation**:
- Update one store at a time
- Test after each store update
- Keep git commits small
- Easy to rollback if needed

### Risk 2: Type Errors
**Impact**: MEDIUM  
**Mitigation**:
- Define interfaces first
- Use strict TypeScript
- Fix type errors incrementally
- Use `any` temporarily if needed (then fix)

### Risk 3: Missing Functionality
**Impact**: MEDIUM  
**Mitigation**:
- Review all existing store methods
- Ensure all are migrated
- Test all user workflows
- Check for console errors

---

## 📝 Checklist

### Pre-Refactoring
- [x] Phase 1 complete (workflowState deleted)
- [x] Phase 2 complete (DashboardView refactored)
- [ ] Review existing store code
- [ ] Identify all store methods
- [ ] Identify all store consumers
- [ ] Create backup branch

### During Refactoring
- [ ] Step 1: Create project.ts
- [ ] Step 2: Create session.ts
- [ ] Step 3: Refactor navigation.ts
- [ ] Step 4: Update all imports
- [ ] Step 5: Testing & Validation

### Post-Refactoring
- [ ] All tests pass
- [ ] No console errors
- [ ] No type errors
- [ ] Build succeeds
- [ ] All functionality works
- [ ] Code review
- [ ] Update documentation

---

## 🚀 Next Steps

**Ready to begin Phase 3 refactoring.**

**Estimated Time**: 9 hours total (1-1.5 days)

**User Decision Required**:
1. ✅ Approve Phase 3 execution?
2. ✅ Any specific concerns or requirements?
3. ✅ Preferred order of store refactoring?

---

**Status**: 🔴 Ready to Execute - Awaiting User Approval  
**Last Updated**: 2026-01-28
