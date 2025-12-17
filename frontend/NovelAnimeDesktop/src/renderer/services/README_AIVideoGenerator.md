# AIVideoGenerator Service

## Overview

The `AIVideoGenerator` service is responsible for converting storyboards into actual video content using AI video generation services. It integrates with multiple AI platforms (RunwayML, Pika Labs, Stable Video Diffusion) to create high-quality animated videos while maintaining character design consistency throughout the generation process.

## Key Features

### 🎬 Multi-Platform AI Integration
- **RunwayML**: High-quality video generation with advanced camera controls
- **Pika Labs**: Fast generation with good character consistency
- **Stable Video Diffusion**: Open-source alternative with customizable models
- **Automatic Fallback**: Seamlessly switches to backup service if primary fails

### 🎭 Character Design Consistency
- **Design Caching**: Maintains consistent character appearances across shots
- **Visual Reference System**: Uses locked character profiles for consistency
- **Consistency Validation**: Scores and reports character consistency issues
- **Cross-Shot Tracking**: Ensures characters look the same throughout episodes

### 🎯 Intelligent Prompt Generation
- **Context-Aware Prompts**: Builds comprehensive prompts from storyboard data
- **Technical Specifications**: Includes camera angles, shot types, and lighting
- **Style Consistency**: Applies consistent visual style across all generations
- **Character Integration**: Seamlessly incorporates character descriptions

### 🎨 Visual Style Coherence System
- **Style Consistency Enforcement**: Maintains consistent artistic style across all video segments
- **Visual Element Validation**: Analyzes and validates visual coherence between segments
- **Smart Transition Enhancement**: Generates smooth transitions based on visual compatibility
- **Quality Metrics**: Provides detailed scoring for visual consistency and transition smoothness

### 🔄 Comprehensive Error Handling & Reporting
- **Intelligent Error Classification**: Automatically categorizes errors by type (network, API, validation, etc.)
- **Detailed Error Reports**: Provides comprehensive error analysis with context and suggestions
- **Smart Retry Logic**: Exponential backoff with jitter for optimal retry timing
- **Recovery Suggestions**: AI-powered correction suggestions based on error type and context
- **Error Statistics**: Tracks error patterns and success rates for system optimization

## Architecture

```typescript
AIVideoGenerator
├── Configuration Management
│   ├── Service Selection (Primary/Fallback)
│   ├── API Key Management
│   └── Quality Settings
├── Character Consistency System
│   ├── Design Caching
│   ├── Visual Reference Tracking
│   └── Consistency Validation
├── Video Generation Pipeline
│   ├── Prompt Building
│   ├── Service Integration
│   └── Segment Creation
├── Visual Style Coherence System
│   ├── Style Feature Extraction
│   ├── Consistency Enforcement
│   ├── Visual Compatibility Analysis
│   └── Style Correction
├── Enhanced Video Combination
│   ├── Smart Transition Generation
│   ├── Compatibility-Based Enhancement
│   ├── Smoothness Optimization
│   └── Quality Metrics Calculation
├── Comprehensive Error Handling
│   ├── Error Classification & Analysis
│   ├── Intelligent Retry Logic
│   ├── Recovery Suggestion Engine
│   └── Error Statistics & Monitoring
└── Quality Assurance
    ├── Visual Coherence Validation
    ├── Transition Smoothness Scoring
    ├── Detailed Error Reporting
    └── Performance Analytics
```

## Usage Examples

### Basic Video Generation

```typescript
import { AIVideoGenerator } from './AIVideoGenerator';

const config = {
  primaryService: 'runwayml',
  fallbackService: 'pikalabs',
  apiKeys: {
    runwayml: 'your-runway-api-key',
    pikalabs: 'your-pika-api-key'
  },
  resolution: '1920x1080',
  outputFormat: 'mp4',
  visualStyle: 'anime',
  maxRetries: 3,
  timeout: 30000
};

const generator = new AIVideoGenerator(config);
const result = await generator.generateVideo(storyboard);

if (result.success) {
  console.log(`Video generated: ${result.videoUrl}`);
  console.log(`Character consistency: ${result.characterConsistency.score}`);
} else {
  console.error(`Generation failed: ${result.error}`);
}
```

### Advanced Configuration

```typescript
// High-quality production settings
const productionConfig = {
  primaryService: 'runwayml',
  fallbackService: 'stablevideo',
  apiKeys: {
    runwayml: process.env.RUNWAY_API_KEY,
    stablevideo: process.env.STABLE_API_KEY
  },
  resolution: '4K',
  outputFormat: 'mp4',
  visualStyle: 'high-quality anime with detailed backgrounds',
  maxRetries: 5,
  timeout: 60000
};

// Fast preview settings
const previewConfig = {
  primaryService: 'pikalabs',
  resolution: '720p',
  outputFormat: 'webm',
  visualStyle: 'anime sketch style',
  maxRetries: 2,
  timeout: 15000
};
```

### Character Consistency Management

```typescript
// Clear character cache for new project
generator.clearCharacterCache();

// Monitor character consistency
const result = await generator.generateVideo(storyboard);
const consistency = result.characterConsistency;

if (consistency.score < 0.8) {
  console.warn('Low character consistency detected:');
  consistency.issues.forEach(issue => console.warn(`- ${issue}`));
}
  consistency.issues.forEach(issue => console.warn(`- ${issue}`));
}
```

### Visual Style Coherence

```typescript
// Generate video with enhanced visual coherence
const result = await generator.generateVideo(storyboard);

// Check visual coherence metrics
if (result.visualCoherence) {
  console.log(`Visual coherence score: ${result.visualCoherence.overallScore}`);
  
  if (result.visualCoherence.overallScore < 0.7) {
    console.warn('Visual coherence issues detected:');
    result.visualCoherence.issues.forEach(issue => console.warn(`- ${issue}`));
    
    console.log('Recommendations:');
    result.visualCoherence.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
}

// Check overall quality metrics
if (result.qualityMetrics) {
  console.log(`Visual consistency: ${result.qualityMetrics.visualConsistency}`);
  console.log(`Transition smoothness: ${result.qualityMetrics.transitionSmoothness}`);
  console.log(`Overall quality: ${result.qualityMetrics.overallQuality}`);
}
```

### Manual Style Enforcement

```typescript
// Manually enforce style consistency on existing segments
const segments = await getVideoSegments(); // Your existing segments
const consistentSegments = await generator.enforceStyleConsistency(segments);

// Validate coherence before using segments
const coherenceReport = generator.validateVisualCoherence(consistentSegments);

if (coherenceReport.overallScore > 0.8) {
  console.log('Segments are visually coherent');
} else {
  console.warn('Style inconsistencies detected, consider regeneration');
}
```

### Enhanced Error Handling

```typescript
// Generate video with comprehensive error handling
const result = await generator.generateVideoWithErrorHandling(storyboard);

if (!result.success && result.errorReport) {
  const report = result.errorReport;
  
  console.error(`Error: ${report.message}`);
  console.log(`Error Type: ${report.type}`);
  console.log(`Severity: ${report.severity}`);
  console.log(`Recoverable: ${report.isRecoverable}`);
  
  if (report.suggestions.length > 0) {
    console.log('Suggested actions:');
    report.suggestions.forEach(suggestion => {
      console.log(`- ${suggestion}`);
    });
  }
  
  if (report.retryRecommended) {
    console.log(`Retry recommended. Estimated recovery time: ${report.estimatedRecoveryTime}s`);
  }
}
```

### Custom Retry Configuration

```typescript
// Execute with custom retry settings
const customOperation = async () => {
  return await generator.generateVideo(storyboard);
};

const context = {
  operation: 'custom_generation',
  service: 'runwayml',
  retryCount: 0,
  fallbackUsed: false,
  timestamp: new Date().toISOString()
};

try {
  const result = await generator.executeWithRetry(customOperation, context, {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  });
  
  console.log('Operation succeeded:', result);
} catch (error) {
  if (error instanceof DetailedError) {
    console.error('Detailed error report:', error.errorReport);
  }
}
```

### Error Statistics and Monitoring

```typescript
// Get error statistics for monitoring
const stats = generator.getErrorStatistics();

console.log(`Total errors: ${stats.totalErrors}`);
console.log(`Average retry count: ${stats.averageRetryCount}`);
console.log(`Success rate after retry: ${stats.successRateAfterRetry * 100}%`);

// Most common error types
Object.entries(stats.errorsByType).forEach(([type, count]) => {
  console.log(`${type}: ${count} occurrences`);
});

// Most common suggestions
stats.mostCommonSuggestions.forEach(suggestion => {
  console.log(`Common suggestion: ${suggestion}`);
});
```

## API Reference

### Constructor

```typescript
constructor(config: AIVideoConfig)
```

Creates a new AIVideoGenerator instance with the specified configuration.

### Methods

#### `generateVideo(storyboard: Storyboard): Promise<VideoGenerationResult>`

Generates a complete video from a storyboard.

**Parameters:**
- `storyboard`: Complete storyboard with shots, characters, and transitions

**Returns:**
- `VideoGenerationResult`: Contains video URL, segments, metadata, and consistency report

#### `updateConfig(newConfig: Partial<AIVideoConfig>): void`

Updates the generator configuration.

**Parameters:**
- `newConfig`: Partial configuration object with properties to update

#### `clearCharacterCache(): void`

Clears the character design cache. Useful when starting a new project or updating character designs.

#### `getQueueStatus(): { pending: number; processing: boolean }`

Returns the current generation queue status.

**Returns:**
- Object with pending count and processing status

## Configuration Options

### AIVideoConfig Interface

```typescript
interface AIVideoConfig {
  primaryService: string;           // Primary AI service ('runwayml', 'pikalabs', 'stablevideo')
  fallbackService?: string;         // Fallback service for redundancy
  apiKeys?: {                       // API keys for services
    runwayml?: string;
    pikalabs?: string;
    stablevideo?: string;
  };
  resolution: string;               // Output resolution ('720p', '1080p', '4K')
  outputFormat: string;             // Video format ('mp4', 'webm', 'mov')
  visualStyle: string;              // Style description for AI generation
  maxRetries: number;               // Maximum retry attempts per shot
  timeout: number;                  // Timeout in milliseconds
}
```

### Service-Specific Features

#### RunwayML
- **Strengths**: High quality, advanced camera controls, good character consistency
- **Best For**: Production-quality videos, complex scenes
- **Limitations**: Higher cost, slower generation

#### Pika Labs
- **Strengths**: Fast generation, good balance of quality and speed
- **Best For**: Rapid prototyping, preview generation
- **Limitations**: Limited advanced features

#### Stable Video Diffusion
- **Strengths**: Open-source, customizable, cost-effective
- **Best For**: Custom models, budget-conscious projects
- **Limitations**: Requires more technical setup

## Error Handling

### Common Error Scenarios

1. **API Key Missing**: Service-specific API key not configured
2. **Service Unavailable**: AI service temporarily down or overloaded
3. **Invalid Storyboard**: Missing required storyboard data
4. **Generation Timeout**: Video generation exceeds timeout limit
5. **Character Inconsistency**: Low character consistency score

### Error Recovery Strategies

```typescript
// Automatic fallback to secondary service
if (primaryServiceFails) {
  tryFallbackService();
}

// Retry with exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await generateShot(shot);
  } catch (error) {
    if (attempt === maxRetries) throw error;
    await delay(Math.pow(2, attempt) * 1000);
  }
}
```

## Performance Optimization

### Caching Strategies
- **Character Design Cache**: Reuses character descriptions across shots
- **Prompt Template Cache**: Caches common prompt patterns
- **Service Response Cache**: Caches successful API responses (optional)

### Parallel Processing
- Multiple shots can be generated simultaneously
- Queue management prevents API rate limiting
- Priority-based processing for important shots

### Quality vs Speed Trade-offs
- **High Quality**: Use RunwayML with detailed prompts
- **Balanced**: Use Pika Labs with optimized prompts
- **Fast Preview**: Use lower resolution and simplified prompts

## Integration Points

### With StoryboardCreator
```typescript
const storyboard = storyboardCreator.createStoryboard(episode);
const video = await aiVideoGenerator.generateVideo(storyboard);
```

### With Character System
```typescript
// Character consistency is automatically maintained
const characters = characterSystem.getLockedProfiles();
// Characters are cached and used for consistency
```

### With Pipeline Orchestrator
```typescript
// Integrates into the overall processing pipeline
pipeline.addStage('video_generation', aiVideoGenerator);
```

## Testing

The service includes comprehensive unit tests covering:

- ✅ Configuration management and validation
- ✅ Video generation with various storyboard types
- ✅ Service integration and fallback mechanisms
- ✅ Character consistency tracking and validation
- ✅ Error handling and recovery scenarios
- ✅ Prompt generation and optimization
- ✅ Video segment creation and combination
- ✅ Queue management and status tracking

Run tests with:
```bash
npm test AIVideoGenerator.test.ts
```

## Future Enhancements

### Planned Features
- **Real-time Generation**: Stream video generation progress
- **Custom Model Support**: Integration with fine-tuned models
- **Advanced Transitions**: AI-generated transition effects
- **Quality Enhancement**: Post-processing for improved quality
- **Batch Processing**: Efficient handling of large projects

### Integration Roadmap
- **Voice Synthesis**: Automatic voice generation for dialogue
- **Music Integration**: AI-generated background music
- **Effect Library**: Pre-built visual effects and filters
- **Cloud Processing**: Distributed generation across multiple services

## Troubleshooting

### Common Issues

**Issue**: Low character consistency scores
**Solution**: Ensure character profiles are locked and detailed

**Issue**: Generation timeouts
**Solution**: Increase timeout or reduce video complexity

**Issue**: API rate limiting
**Solution**: Implement queue management and respect rate limits

**Issue**: Poor video quality
**Solution**: Use higher resolution settings and detailed prompts

### Debug Mode

Enable debug logging for detailed generation information:

```typescript
const config = {
  ...baseConfig,
  debug: true,
  logLevel: 'verbose'
};
```

## Support

For issues and questions:
- Check the test files for usage examples
- Review error messages for specific guidance
- Consult service-specific documentation for API details
- Monitor character consistency scores for quality issues