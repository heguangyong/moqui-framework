# Design Document

## Overview

本设计文档描述了 Novel Anime Desktop 应用的小说处理流水线系统架构。该系统实现从小说导入到集数生成的完整三步处理流程，包括AI驱动的文本分析、角色提取、场景分析等核心功能。

系统采用前后端分离架构，前端使用 Vue 3 + Electron 提供桌面应用体验，后端基于 Moqui Framework 提供 RESTful API 和 AI 服务集成。

## Architecture

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Vue/Electron)│    │   (Moqui)       │    │   (Zhipu AI)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Project UI    │◄──►│ • REST APIs     │◄──►│ • Text Analysis │
│ • Import Dialog │    │ • Entity Mgmt   │    │ • Character Ext │
│ • Progress View │    │ • Pipeline Mgmt │    │ • Scene Analysis│
│ • Character UI  │    │ • Credit System │    │ • NLP Processing│
│ • Scene Editor  │    │ • File Storage  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 处理流水线架构

```
Input Novel Text
       │
       ▼
┌─────────────────┐
│  Step 2: Import │
│  • Text Parse   │
│  • File Upload  │
│  • Validation   │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Step 3: Extract │
│ • AI Character  │
│ • Role Classify │
│ • Relationship  │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Step 4: Analyze │
│ • Scene Visual  │
│ • Episode Group │
│ • Script Gen    │
└─────────────────┘
       │
       ▼
Ready for Storyboard
```

## Components and Interfaces

### Frontend Components

#### 1. Project Creation Component
```typescript
interface ProjectCreationProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}

interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdDate: Date;
  status: ProjectStatus;
}
```

#### 2. Novel Import Component
```typescript
interface NovelImportProps {
  projectId: string;
  onImportComplete: (novel: Novel) => void;
}

interface NovelImportData {
  title: string;
  author?: string;
  content: string;
  source: 'text' | 'file';
  filename?: string;
}
```

#### 3. Processing Pipeline Component
```typescript
interface PipelineViewProps {
  novelId: string;
  onStageComplete: (stage: ProcessingStage) => void;
}

interface ProcessingStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  errorMessage?: string;
}
```

#### 4. Character Gallery Component
```typescript
interface CharacterGalleryProps {
  novelId: string;
  characters: Character[];
  onCharacterEdit: (character: Character) => void;
  onCharacterLock: (characterId: string) => void;
}

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  appearance: string;
  personality: string;
  relationships: CharacterRelationship[];
  isLocked: boolean;
}
```

#### 5. Scene Editor Component
```typescript
interface SceneEditorProps {
  novelId: string;
  scenes: Scene[];
  onSceneEdit: (scene: Scene) => void;
  onSceneApprove: (sceneId: string) => void;
}

interface Scene {
  id: string;
  chapterId: string;
  content: string;
  setting: string;
  mood: string;
  visualDescription: string;
  characters: string[];
  timeOfDay?: string;
  weather?: string;
}
```

### Backend API Interfaces

#### 1. Project Management API
```
POST /rest/s1/novel-anime/projects
GET  /rest/s1/novel-anime/projects/{projectId}
PUT  /rest/s1/novel-anime/projects/{projectId}
DELETE /rest/s1/novel-anime/projects/{projectId}
```

#### 2. Novel Import API
```
POST /rest/s1/novel-anime/novels/import-text
POST /rest/s1/novel-anime/novels/import-file
GET  /rest/s1/novel-anime/novels/{novelId}/status
POST /rest/s1/novel-anime/novels/{novelId}/analyze-structure
```

#### 3. Character Extraction API
```
POST /rest/s1/novel-anime/novels/{novelId}/extract-characters
GET  /rest/s1/novel-anime/novels/{novelId}/characters
PUT  /rest/s1/novel-anime/characters/{characterId}
POST /rest/s1/novel-anime/characters/{characterId}/lock
POST /rest/s1/novel-anime/characters/merge
```

#### 4. Scene Analysis API
```
POST /rest/s1/novel-anime/novels/{novelId}/analyze-scenes
GET  /rest/s1/novel-anime/novels/{novelId}/scenes
PUT  /rest/s1/novel-anime/scenes/{sceneId}
POST /rest/s1/novel-anime/scenes/{sceneId}/approve
POST /rest/s1/novel-anime/scenes/{sceneId}/re-analyze
```

#### 5. Episode Generation API
```
POST /rest/s1/novel-anime/novels/{novelId}/generate-episodes
GET  /rest/s1/novel-anime/novels/{novelId}/episodes
PUT  /rest/s1/novel-anime/episodes/{episodeId}
POST /rest/s1/novel-anime/episodes/{episodeId}/finalize
```

## Data Models

### Core Entities

#### Novel Entity
```xml
<entity entity-name="Novel" package="novel.anime">
    <field name="novelId" type="id" is-pk="true"/>
    <field name="projectId" type="id"/>
    <field name="title" type="text-medium"/>
    <field name="author" type="text-medium"/>
    <field name="originalText" type="text-very-long"/>
    <field name="wordCount" type="number-integer"/>
    <field name="status" type="text-short"/>
    <field name="sourceType" type="text-short"/>
    <field name="filename" type="text-medium"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdated" type="date-time"/>
</entity>
```

#### Processing Pipeline Entity
```xml
<entity entity-name="ProcessingPipeline" package="novel.anime">
    <field name="pipelineId" type="id" is-pk="true"/>
    <field name="novelId" type="id"/>
    <field name="status" type="text-short"/>
    <field name="currentStage" type="text-short"/>
    <field name="totalStages" type="number-integer"/>
    <field name="completedStages" type="number-integer"/>
    <field name="configuration" type="text-very-long"/>
    <field name="creditsReserved" type="number-integer"/>
    <field name="creditsUsed" type="number-integer"/>
    <field name="startedDate" type="date-time"/>
    <field name="completedDate" type="date-time"/>
    <field name="estimatedDuration" type="number-integer"/>
</entity>
```

#### Character Entity (Enhanced)
```xml
<entity entity-name="Character" package="novel.anime">
    <field name="characterId" type="id" is-pk="true"/>
    <field name="novelId" type="id"/>
    <field name="name" type="text-medium"/>
    <field name="role" type="text-short"/>
    <field name="description" type="text-long"/>
    <field name="appearance" type="text-long"/>
    <field name="personality" type="text-long"/>
    <field name="firstMention" type="text-medium"/>
    <field name="mentionCount" type="number-integer"/>
    <field name="isLocked" type="text-indicator"/>
    <field name="extractionConfidence" type="number-decimal"/>
    <field name="createdDate" type="date-time"/>
</entity>
```

#### Scene Entity (Enhanced)
```xml
<entity entity-name="Scene" package="novel.anime">
    <field name="sceneId" type="id" is-pk="true"/>
    <field name="chapterId" type="id"/>
    <field name="sceneNumber" type="number-integer"/>
    <field name="content" type="text-very-long"/>
    <field name="setting" type="text-medium"/>
    <field name="mood" type="text-short"/>
    <field name="visualDescription" type="text-long"/>
    <field name="timeOfDay" type="text-short"/>
    <field name="weather" type="text-short"/>
    <field name="analysisStatus" type="text-short"/>
    <field name="isApproved" type="text-indicator"/>
</entity>
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I identified several areas where properties can be consolidated:

- Properties related to entity creation (novel, character, scene, episode) can be combined into comprehensive creation properties
- Properties related to UI display can be grouped by component type
- Properties related to validation can be consolidated into input validation properties
- Properties related to processing stages can be combined into workflow properties

### Core Processing Properties

**Property 1: Novel Import Validation**
*For any* novel import request with text content and metadata, the system should validate minimum length requirements, create a Novel entity with "importing" status, and deduct appropriate credits based on word count
**Validates: Requirements 2.2, 2.3, 2.4**

**Property 2: File Processing Round Trip**
*For any* supported file format (.txt, .docx, .pdf), uploading and extracting content should preserve the original text content and auto-populate metadata fields
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 3: Structure Analysis Completeness**
*For any* imported novel text, AI parsing should either successfully create Chapter and Scene entities with proper relationships, or create a single chapter containing the entire content as fallback
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 4: Processing Pipeline Consistency**
*For any* novel processing session, the Processing_Pipeline should accurately track stage progress, update status consistently, and maintain credit accounting throughout the workflow
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Character Extraction Properties

**Property 5: Character Extraction Completeness**
*For any* novel with completed structure analysis, character extraction should identify all named characters, classify their roles, and create Character entities with relationship mappings
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

**Property 6: Character Management Consistency**
*For any* character in the system, editing operations should preserve data integrity, merging should combine all references correctly, and locking should prevent further AI modifications
**Validates: Requirements 11.3, 11.4, 11.5**

### Scene Analysis Properties

**Property 7: Scene Analysis Enhancement**
*For any* scene with completed character extraction, scene analysis should identify visual elements, generate composition suggestions, and update Scene entities with setting and mood information
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

**Property 8: Episode Generation Workflow**
*For any* novel with completed scene analysis, episode generation should group scenes logically, create Episode entities with scripts, and update the processing pipeline to "ready for storyboard"
**Validates: Requirements 14.1, 14.2, 14.4, 14.5**

### User Interface Properties

**Property 9: Project Management Operations**
*For any* user project, all CRUD operations (create, read, update, delete) should maintain data consistency, show appropriate confirmations, and update the UI state correctly
**Validates: Requirements 1.2, 6.2, 6.3, 6.4**

**Property 10: Cost Calculation Accuracy**
*For any* novel import, credit cost estimation should be calculated based on word count, show stage breakdowns, handle insufficient credits appropriately, and refund unused credits after processing
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Workflow Management Properties

**Property 11: Workflow Visualization Consistency**
*For any* processing pipeline, the workflow display should accurately reflect current stage status, allow interaction with completed stages, and provide appropriate retry options for failures
**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

**Property 12: Large File Processing Reliability**
*For any* novel larger than 100,000 words, the system should process in chunks, maintain responsiveness, support resume functionality, and handle memory efficiently
**Validates: Requirements 8.1, 8.2, 8.4**

## Error Handling

### Error Categories

1. **Input Validation Errors**
   - Invalid file formats
   - Text too short/long
   - Missing required fields
   - Invalid characters in input

2. **Processing Errors**
   - AI service failures
   - Network timeouts
   - Resource exhaustion
   - Parsing failures

3. **System Errors**
   - Database connection issues
   - File system errors
   - Memory limitations
   - Service unavailability

### Error Recovery Strategies

1. **Graceful Degradation**
   - Fallback to manual input when AI fails
   - Single chapter creation when parsing fails
   - Basic character list when extraction fails

2. **Retry Mechanisms**
   - Exponential backoff for API calls
   - User-initiated retry for failed stages
   - Automatic retry for transient failures

3. **Credit Protection**
   - Reserve credits before processing
   - Refund on failures
   - Partial refunds for incomplete processing

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on:
- API endpoint validation and response formatting
- Entity creation and relationship management
- Credit calculation and transaction logic
- File processing and text extraction
- Error handling and edge cases

### Property-Based Testing Approach

Property-based tests will use **fast-check** library for JavaScript/TypeScript with minimum 100 iterations per test. Each property-based test will be tagged with comments referencing the design document properties.

Key property test areas:
- Novel import validation across various text sizes and formats
- Character extraction consistency across different novel structures
- Scene analysis accuracy across various content types
- Credit calculation correctness across different processing scenarios
- Workflow state transitions across all possible stage combinations

### Integration Testing

Integration tests will verify:
- End-to-end processing pipeline from import to episode generation
- Frontend-backend API integration
- AI service integration and fallback handling
- Credit system integration with processing stages
- File upload and processing workflows

### Performance Testing

Performance tests will validate:
- Large file processing (100,000+ words)
- Concurrent user processing
- Memory usage during text analysis
- Response times for API endpoints
- Database query performance under load