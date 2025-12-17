# Workflow Editor Service

## Overview

The Workflow Editor Service provides a comprehensive visual interface for managing and customizing the novel-to-anime conversion pipeline. It enables users to create, edit, and monitor complex workflows through an intuitive drag-and-drop interface with real-time status updates and configuration management.

## Key Features

### 1. Visual Workflow Management
- **Node-based Interface**: Drag-and-drop workflow creation with visual nodes
- **Real-time Rendering**: Dynamic visual pipeline representation
- **Interactive Editing**: Live editing with immediate visual feedback
- **Status Visualization**: Color-coded node states and progress indicators

### 2. Comprehensive Node System
- **Multiple Node Types**: Support for all pipeline components
  - Novel Parser
  - Character System
  - Plot Analyzer
  - Episode Generator
  - Script Converter
  - Storyboard Creator
  - AI Video Generator
- **Dynamic Sizing**: Node sizes adapt to content and type
- **Status Indicators**: Visual feedback for idle, running, completed, failed, and paused states

### 3. Advanced Connection Management
- **Smart Connections**: Automatic validation and conflict prevention
- **Conditional Logic**: Support for conditional connections with custom conditions
- **Visual Paths**: Curved connection paths with customizable styling
- **Dependency Tracking**: Automatic detection of circular dependencies

### 4. Configuration Management
- **Parameter Validation**: Real-time validation with detailed error reporting
- **Custom Rules**: Extensible validation system for different node types
- **Configuration Persistence**: Save and restore workflow configurations
- **Error Highlighting**: Visual indication of configuration issues

### 5. Workflow Validation
- **Structural Analysis**: Detection of isolated nodes and circular dependencies
- **Configuration Validation**: Comprehensive parameter checking
- **Error Reporting**: Detailed error messages with correction suggestions
- **Warning System**: Non-blocking warnings for optimization opportunities

### 6. Progress Monitoring
- **Real-time Updates**: Live progress tracking during workflow execution
- **Status Callbacks**: Event-driven progress notifications
- **Pipeline Monitoring**: Track overall pipeline progress and individual node status
- **Performance Metrics**: Execution time and resource usage tracking

### 7. Import/Export Functionality
- **JSON Serialization**: Complete workflow export to JSON format
- **Workflow Cloning**: Duplicate workflows with automatic ID generation
- **Import Validation**: Robust validation of imported workflow data
- **Version Management**: Support for workflow versioning and migration

## Core Classes and Interfaces

### WorkflowEditor
The main service class that manages all workflow operations.

```typescript
class WorkflowEditor {
  // Workflow Management
  createWorkflow(name: string, description: string): WorkflowDefinition
  loadWorkflow(workflow: WorkflowDefinition): void
  setActiveWorkflow(workflowId: string): boolean
  
  // Node Management
  addNode(type: string, name: string, position: {x: number, y: number}): WorkflowNode
  removeNode(nodeId: string): boolean
  updateNodeConfiguration(nodeId: string, config: NodeConfig): ValidationResult
  
  // Connection Management
  addConnection(fromNodeId: string, toNodeId: string): WorkflowConnection
  removeConnection(connectionId: string): boolean
  
  // Visual Rendering
  renderPipeline(workflowId?: string): VisualPipeline
  
  // Validation
  validateWorkflow(workflowId?: string): ValidationResult
  
  // Progress Monitoring
  monitorProgress(pipelineId: string, callback: Function): void
}
```

### Key Data Structures

#### WorkflowDefinition
```typescript
interface WorkflowDefinition {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  configuration: WorkflowConfiguration
}
```

#### WorkflowNode
```typescript
interface WorkflowNode {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  configuration: NodeConfig
  status: NodeStatus
}
```

#### VisualPipeline
```typescript
interface VisualPipeline {
  id: string
  workflowId: string
  renderData: any
  layout: PipelineLayout
}
```

## Usage Examples

### Creating a Basic Workflow

```typescript
const editor = new WorkflowEditor();

// Create a new workflow
const workflow = editor.createWorkflow(
  'My Novel Pipeline',
  'Custom pipeline for novel processing'
);

// Set as active workflow
editor.setActiveWorkflow(workflow.id);

// Add nodes
const parser = editor.addNode('novel_parser', 'Parse Novel', { x: 100, y: 100 });
const characters = editor.addNode('character_system', 'Extract Characters', { x: 300, y: 100 });
const generator = editor.addNode('ai_video_generator', 'Generate Video', { x: 500, y: 100 });

// Configure nodes
editor.updateNodeConfiguration(parser.id, {
  inputFormat: 'txt',
  maxFileSize: 5 * 1024 * 1024
});

// Connect nodes
editor.addConnection(parser.id, characters.id);
editor.addConnection(characters.id, generator.id);
```

### Visual Pipeline Rendering

```typescript
// Render the current workflow
const pipeline = editor.renderPipeline();

if (pipeline) {
  console.log(`Rendering workflow: ${pipeline.workflowId}`);
  
  // Access node layouts for rendering
  pipeline.layout.nodes.forEach(nodeLayout => {
    console.log(`Node ${nodeLayout.nodeId} at position (${nodeLayout.position.x}, ${nodeLayout.position.y})`);
    console.log(`Size: ${nodeLayout.size.width}x${nodeLayout.size.height}`);
    console.log(`Style:`, nodeLayout.style);
  });
  
  // Access connection paths for rendering
  pipeline.layout.connections.forEach(connLayout => {
    console.log(`Connection ${connLayout.connectionId} path: ${connLayout.path}`);
  });
}
```

### Workflow Validation

```typescript
// Validate the current workflow
const validation = editor.validateWorkflow();

if (validation.isValid) {
  console.log('Workflow is valid!');
} else {
  console.log('Validation errors:');
  validation.errors.forEach(error => {
    console.log(`- ${error.code}: ${error.message}`);
  });
}

if (validation.warnings.length > 0) {
  console.log('Validation warnings:');
  validation.warnings.forEach(warning => {
    console.log(`- ${warning.code}: ${warning.message}`);
  });
}
```

### Progress Monitoring

```typescript
// Monitor workflow execution progress
editor.monitorProgress('pipeline-123', (status) => {
  console.log(`Pipeline progress: ${status.overallProgress}%`);
  console.log(`Current stage: ${status.currentStage}`);
  console.log(`Stage progress: ${status.stageProgress}%`);
  
  if (status.message) {
    console.log(`Status: ${status.message}`);
  }
});

// Update node status during execution
editor.updateNodeStatus(parser.id, 'running');
editor.updateNodeStatus(parser.id, 'completed');
```

### Import/Export Operations

```typescript
// Export workflow to JSON
const jsonData = editor.exportWorkflow(workflow.id);
if (jsonData) {
  // Save to file or send to server
  localStorage.setItem('my-workflow', jsonData);
}

// Import workflow from JSON
const savedData = localStorage.getItem('my-workflow');
if (savedData) {
  const importedWorkflow = editor.importWorkflow(savedData);
  if (importedWorkflow) {
    console.log(`Imported workflow: ${importedWorkflow.name}`);
  }
}

// Clone an existing workflow
const cloned = editor.cloneWorkflow(workflow.id, 'Cloned Pipeline');
if (cloned) {
  console.log(`Created clone with ID: ${cloned.id}`);
}
```

## Node Types and Configurations

### Novel Parser Node
```typescript
{
  inputFormat: 'txt' | 'docx' | 'pdf',
  maxFileSize: number, // bytes
  encoding: 'utf-8' | 'ascii' | 'latin1',
  chapterDetection: boolean
}
```

### Character System Node
```typescript
{
  maxCharacters: number,
  enableRelationships: boolean,
  consistencyLevel: 'low' | 'medium' | 'high'
}
```

### AI Video Generator Node
```typescript
{
  service: 'runwayml' | 'pikalabs' | 'stablevideo',
  resolution: '720p' | '1080p' | '4k',
  quality: 'low' | 'medium' | 'high',
  style: string
}
```

## Validation Rules

### Built-in Validation
- **Required Fields**: Ensures all mandatory configuration fields are present
- **Type Checking**: Validates parameter types and formats
- **Range Validation**: Checks numeric values are within acceptable ranges
- **Dependency Validation**: Ensures required dependencies are met

### Custom Validation Rules
```typescript
// Register custom validation for a node type
editor.registerValidationRule('custom_node', (config) => {
  const errors = [];
  const warnings = [];
  
  if (!config.requiredField) {
    errors.push({
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Required field is missing',
      severity: 'error'
    });
  }
  
  if (config.optionalField && config.optionalField > 100) {
    warnings.push({
      code: 'HIGH_VALUE_WARNING',
      message: 'Value is unusually high',
      severity: 'warning'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
});
```

## Visual Styling

### Node Status Colors
- **Idle**: Light gray (`#f8f9fa`)
- **Running**: Light blue (`#e3f2fd`)
- **Completed**: Light green (`#e8f5e8`)
- **Failed**: Light red (`#ffebee`)
- **Paused**: Light orange (`#fff3e0`)

### Node Sizes
- **Basic Nodes**: 120x60 pixels
- **Processing Nodes**: 140x70 pixels
- **Complex Nodes**: 160x80 pixels

### Connection Styles
- **Normal Connections**: Solid lines (`#666666`)
- **Conditional Connections**: Dashed lines (`5,5` pattern)
- **Active Connections**: Highlighted with brighter colors

## Error Handling

### Validation Errors
- **MISSING_INPUT_FORMAT**: Required input format not specified
- **INVALID_MAX_CHARACTERS**: Character limit is invalid
- **CIRCULAR_DEPENDENCY**: Workflow contains circular references
- **ISOLATED_NODE**: Node is not connected to the workflow

### Runtime Errors
- **NO_ACTIVE_WORKFLOW**: No workflow is currently selected
- **NODE_NOT_FOUND**: Referenced node does not exist
- **INVALID_CONNECTION**: Connection cannot be created

## Performance Considerations

### Optimization Strategies
- **Lazy Rendering**: Only render visible portions of large workflows
- **Connection Caching**: Cache connection path calculations
- **Validation Debouncing**: Debounce validation during rapid configuration changes
- **Memory Management**: Clean up unused workflow data

### Scalability Limits
- **Maximum Nodes**: Recommended limit of 100 nodes per workflow
- **Maximum Connections**: Recommended limit of 200 connections per workflow
- **Rendering Performance**: Optimized for workflows up to 50 nodes

## Integration Points

### Pipeline Orchestrator
The Workflow Editor integrates with the Pipeline Orchestrator for:
- Workflow execution coordination
- Progress status updates
- Error reporting and recovery
- Resource management

### User Interface
Integration with the main UI system provides:
- Drag-and-drop functionality
- Context menus and toolbars
- Property panels for configuration
- Status bars and notifications

### Asset Library
Connection to the Asset Library enables:
- Template workflow storage
- Reusable node configurations
- Workflow versioning and history
- Cross-project workflow sharing

## Future Enhancements

### Planned Features
- **Visual Scripting**: Node-based scripting for custom logic
- **Workflow Templates**: Pre-built templates for common use cases
- **Collaborative Editing**: Multi-user workflow editing
- **Performance Analytics**: Detailed execution metrics and optimization suggestions
- **Auto-Layout**: Automatic node positioning and connection routing
- **Workflow Debugging**: Step-through debugging with breakpoints

### Extensibility
The system is designed for easy extension:
- Custom node types with specialized behavior
- Plugin system for third-party integrations
- Custom validation rules and error handling
- Themeable visual styling
- Configurable keyboard shortcuts and gestures