# Design Document

## Overview

This design addresses two interconnected issues in the Novel-to-Anime system:

1. **Backend Issue**: The workflow execution service calls an outdated image generation endpoint (Zhipu AI) instead of the new multi-provider service (Pollinations AI)
2. **Frontend Issue**: The settings interface displays incorrect provider information that doesn't match the actual backend configuration

The fix involves updating service references in the workflow execution XML and correcting the provider display in the Vue settings component. Both changes are minimal, surgical updates that leverage existing infrastructure from Spec 09-01.

## Architecture

### Current Architecture (Problematic)

```
Workflow Execution Service
    ↓ (calls old endpoint)
McpImageGenerationServices.generate#Image (Zhipu AI - requires API key)
    ↓
❌ Fails due to missing API key
```

```
Settings.vue
    ↓ (displays)
"智谱AI (GLM-4)" ❌ Incorrect provider shown
```

### Target Architecture (Fixed)

```
Workflow Execution Service
    ↓ (calls new endpoint)
McpMultiProviderImageServices.generate#ImageMultiProvider (Pollinations AI)
    ↓
✅ Generates images successfully (no API key needed)
```

```
Settings.vue
    ↓ (displays)
"Pollinations AI (免费)" ✅ Correct provider shown
```

### Integration Points

- **Workflow Execution Service**: `NovelAnimeWorkflowExecutionServices.xml`
  - Location: `runtime/component/novel-anime-generator/service/`
  - Change: Update `<service-call>` element to reference new service

- **Frontend Settings**: `Settings.vue`
  - Location: `frontend/NovelAnimeDesktop/src/renderer/views/`
  - Change: Update provider display text and remove Zhipu AI references

## Components and Interfaces

### Component 1: Workflow Execution Service Update

**File**: `NovelAnimeWorkflowExecutionServices.xml`

**Current Implementation** (lines to change):
```xml
<service-call name="McpImageGenerationServices.generate#Image" 
              in-map="imageGenParams" 
              out-map="imageResult"/>
```

**New Implementation**:
```xml
<service-call name="McpMultiProviderImageServices.generate#ImageMultiProvider" 
              in-map="imageGenParams" 
              out-map="imageResult"/>
```

**Parameter Mapping**:
- Input parameters remain the same (prompt, size, quality)
- Output structure remains the same (imageUrl, status)
- The Multi_Provider_Service internally routes to Pollinations AI

**Service Interface** (already exists from Spec 09-01):
```xml
<service verb="generate" noun="ImageMultiProvider">
    <in-parameters>
        <parameter name="prompt" required="true"/>
        <parameter name="provider" default-value="pollinations"/>
        <parameter name="size" default-value="1024x1024"/>
        <parameter name="quality" default-value="standard"/>
    </in-parameters>
    <out-parameters>
        <parameter name="imageUrl"/>
        <parameter name="status"/>
    </out-parameters>
</service>
```

### Component 2: Frontend Settings Interface Update

**File**: `Settings.vue`

**Current Implementation** (lines to change):
```vue
<el-option label="智谱AI (GLM-4)" value="zhipu" />
```

**New Implementation**:
```vue
<el-option label="Pollinations AI (免费)" value="pollinations" />
```

**Additional Changes**:
- Remove any Zhipu AI references from the provider selection dropdown
- Update default value to "pollinations"
- Update help text to indicate no API key is required

**UI Component Structure**:
```vue
<el-form-item label="图像生成服务">
  <el-select v-model="settings.imageProvider">
    <el-option label="Pollinations AI (免费)" value="pollinations" />
  </el-select>
  <div class="help-text">使用免费的 Pollinations AI 服务，无需 API Key</div>
</el-form-item>
```

## Data Models

### Workflow Context Data

**Image Generation Parameters** (unchanged):
```javascript
{
  prompt: String,        // Scene description
  size: String,          // Image dimensions (e.g., "1024x1024")
  quality: String,       // Quality level (e.g., "standard")
  provider: String       // Provider name (defaults to "pollinations")
}
```

**Image Generation Result** (unchanged):
```javascript
{
  imageUrl: String,      // URL of generated image
  status: String,        // "success" or "error"
  errorMessage: String   // Error details if status is "error"
}
```

### Settings Data Model

**Current Model** (problematic):
```javascript
{
  imageProvider: "zhipu",  // ❌ Wrong default
  apiKey: ""               // ❌ Not needed for Pollinations
}
```

**Updated Model**:
```javascript
{
  imageProvider: "pollinations",  // ✅ Correct default
  // apiKey field can be removed or hidden
}
```

## Error Handling

### Workflow Execution Errors

**Scenario 1: Service Call Fails**
- **Detection**: Service call returns error status
- **Handling**: Log error with full context, store error in workflow state
- **User Impact**: Workflow shows failed status with descriptive message

**Scenario 2: Invalid Parameters**
- **Detection**: Multi_Provider_Service validates input parameters
- **Handling**: Return validation error with specific field information
- **User Impact**: Error message indicates which parameter is invalid

**Scenario 3: Network Timeout**
- **Detection**: HTTP request to Pollinations AI times out
- **Handling**: Retry once, then fail with timeout error
- **User Impact**: User sees "Image generation timed out" message

### Frontend Configuration Errors

**Scenario 1: Invalid Provider Selection**
- **Detection**: User selects non-existent provider (shouldn't happen with dropdown)
- **Handling**: Reset to default "pollinations" value
- **User Impact**: Selection reverts to Pollinations AI

**Scenario 2: Settings Save Fails**
- **Detection**: Backend API returns error when saving settings
- **Handling**: Show error notification, keep form editable
- **User Impact**: User can retry saving settings

## Testing Strategy

### Unit Tests

**Backend Service Tests**:
1. Test workflow execution calls correct service endpoint
2. Test parameter mapping to Multi_Provider_Service
3. Test error handling when image generation fails
4. Test workflow state updates after successful generation

**Frontend Component Tests**:
1. Test Settings.vue displays correct provider options
2. Test default provider is "pollinations"
3. Test API key field is hidden for Pollinations
4. Test settings save with new provider value

### Integration Tests

**End-to-End Workflow Test**:
1. Import a novel with multiple scenes
2. Execute the workflow
3. Verify images are generated for each scene
4. Verify images are displayed in the project view
5. Verify workflow completes successfully

**Settings Integration Test**:
1. Open settings interface
2. Verify Pollinations AI is shown as provider
3. Change settings and save
4. Verify backend receives correct provider value
5. Verify settings persist across app restarts

### Manual Testing Checklist

- [ ] Import a novel and run workflow
- [ ] Verify images appear in project view
- [ ] Check browser console for errors
- [ ] Open settings and verify provider display
- [ ] Verify no API key field is shown
- [ ] Check backend logs for correct service calls
- [ ] Verify workflow execution logs show Pollinations AI usage

### Property-Based Testing

This fix involves configuration updates rather than algorithmic logic, so property-based testing is not applicable. The focus is on integration testing to verify the correct services are called and the UI displays accurate information.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Configuration Correctness

This specification involves configuration updates rather than algorithmic logic. The correctness is verified through specific example tests rather than universal properties. The following test scenarios validate the requirements:

**Test Scenario 1: Workflow Service Endpoint Correctness**
*When* a workflow with image generation nodes is executed, the system should call `McpMultiProviderImageServices.generate#ImageMultiProvider` with provider="pollinations", and the workflow context should contain the generated imageUrl upon completion.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

**Test Scenario 2: Settings UI Provider Display**
*When* the Settings component is mounted, it should display "Pollinations AI (免费)" as the provider option, should not display "智谱AI (GLM-4)", and should show help text indicating no API key is required.
**Validates: Requirements 2.1, 2.2, 2.3**

**Test Scenario 3: Backward Compatibility**
*When* existing workflow definitions are loaded and executed, they should complete without errors, maintaining the same input/output interface as before the service endpoint change.
**Validates: Requirements 3.1, 3.2**

**Test Scenario 4: End-to-End Image Generation**
*When* a user imports a novel with N scenes and executes the workflow, the system should generate N images, display them in the project view, and log successful generation events.
**Validates: Requirements 4.1, 4.2, 4.3**

**Test Scenario 5: Error Handling**
*When* image generation fails for any reason, the system should provide a clear error message indicating the specific failure reason (e.g., "Network timeout", "Invalid prompt", "Service unavailable").
**Validates: Requirements 4.4**

### Testing Approach

Since this specification involves configuration changes rather than algorithmic logic, the testing strategy focuses on:

1. **Integration Tests**: Verify the workflow execution service calls the correct endpoint with correct parameters
2. **Component Tests**: Verify the Settings UI displays correct provider information
3. **End-to-End Tests**: Verify the complete flow from novel import to image generation works correctly
4. **Regression Tests**: Verify existing workflows continue to work after the changes

Property-based testing is not applicable here because we are not testing universal properties across generated inputs. Instead, we are verifying specific configuration changes and their effects on system behavior.
