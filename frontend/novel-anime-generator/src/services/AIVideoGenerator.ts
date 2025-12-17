import { 
  Storyboard, 
  Shot, 
  Character, 
  AIVideoConfig, 
  VideoGenerationResult, 
  VideoSegment,
  DetailedError,
  DetailedErrorReport,
  ErrorContext,
  ErrorType,
  ErrorSeverity,
  RetryConfig,
  ErrorStatistics,
  VisualElementCache,
  VisualElementType,
  CachedVisualElement,
  CacheConfiguration,
  CacheStatistics,
  CacheQuery,
  CacheSearchResult,
  CacheOptimizationReport,
  GenerationParameters,
  CacheMetadata,
  CachePriority,
  EvictionPolicy
} from '../types/core';

/**
 * AI Video Generator Service
 * 
 * Integrates with AI video generation services (RunwayML, Pika Labs, Stable Video Diffusion)
 * to convert storyboards into actual video content with character design consistency.
 */
export class AIVideoGenerator {
  private config: AIVideoConfig;
  private characterDesignCache: Map<string, string> = new Map();
  private generationQueue: Array<{ shot: Shot; priority: number }> = [];
  
  // Visual Element Caching System
  private visualCache: Map<string, VisualElementCache> = new Map();
  private cacheConfig: CacheConfiguration;
  private cacheStats: CacheStatistics;

  constructor(config: AIVideoConfig) {
    this.config = config;
    
    // Initialize cache configuration with defaults
    this.cacheConfig = {
      maxSize: 1024 * 1024 * 1024, // 1GB
      maxEntries: 10000,
      defaultTTL: 7 * 24 * 60 * 60, // 7 days
      cleanupInterval: 60 * 60, // 1 hour
      compressionEnabled: true,
      persistToDisk: true,
      evictionPolicy: 'lru'
    };
    
    // Initialize cache statistics
    this.cacheStats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      lastCleanup: new Date().toISOString(),
      entriesByType: {} as Record<VisualElementType, number>,
      sizeByType: {} as Record<VisualElementType, number>,
      topReusedElements: []
    };
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * Generate video from storyboard using AI services
   */
  async generateVideo(storyboard: Storyboard): Promise<VideoGenerationResult> {
    try {
      // Validate storyboard for video generation
      this.validateStoryboard(storyboard);

      // Extract character designs and cache them
      await this.cacheCharacterDesigns(storyboard.characters);

      // Convert shots to video segments
      const segments: VideoSegment[] = [];
      
      for (const shot of storyboard.shots) {
        const segment = await this.generateVideoSegment(shot);
        segments.push(segment);
      }

      // Apply visual style coherence system
      const combinedResult = await this.combineSegmentsWithTransitions(segments, storyboard.transitions || []);

      return {
        success: true,
        videoUrl: combinedResult.videoUrl,
        segments: combinedResult.segments,
        metadata: {
          duration: combinedResult.duration,
          resolution: this.config.resolution,
          format: this.config.outputFormat,
          generatedAt: new Date().toISOString(),
          service: this.config.primaryService
        },
        characterConsistency: this.validateCharacterConsistency(combinedResult.segments),
        visualCoherence: combinedResult.coherenceReport,
        qualityMetrics: combinedResult.qualityMetrics
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        segments: [],
        metadata: {
          duration: 0,
          resolution: this.config.resolution,
          format: this.config.outputFormat,
          generatedAt: new Date().toISOString(),
          service: this.config.primaryService
        },
        characterConsistency: { score: 0, issues: ['Generation failed'] },
        visualCoherence: {
          overallScore: 0,
          issues: ['Generation failed'],
          recommendations: ['Fix generation errors'],
          segmentScores: []
        },
        qualityMetrics: {
          visualConsistency: 0,
          transitionSmoothness: 0,
          overallQuality: 0
        }
      };
    }
  }

  /**
   * Generate individual video segment from shot
   */
  private async generateVideoSegment(shot: Shot): Promise<VideoSegment> {
    const prompt = this.buildVideoPrompt(shot);
    
    // Try primary service first, fallback to secondary
    let result = await this.callVideoService(this.config.primaryService, prompt, shot);
    
    if (!result.success && this.config.fallbackService) {
      result = await this.callVideoService(this.config.fallbackService, prompt, shot);
    }

    if (!result.success) {
      throw new Error(`Failed to generate video for shot ${shot.id}: ${result.error}`);
    }

    return {
      id: shot.id,
      videoUrl: result.videoUrl!,
      duration: shot.duration,
      startTime: 0, // Will be set during combination
      endTime: shot.duration,
      prompt: prompt,
      service: result.service || this.config.primaryService,
      characterAppearances: this.extractCharacterAppearances(shot),
      qualityScore: result.qualityScore || 0.8
    };
  }

  /**
   * Build AI video generation prompt from shot
   */
  private buildVideoPrompt(shot: Shot): string {
    let prompt = shot.visualDescription;

    // Add character design consistency
    if (shot.characters && shot.characters.length > 0) {
      const characterDescriptions = shot.characters.map(charId => {
        const cachedDesign = this.characterDesignCache.get(charId);
        return cachedDesign || `Character ${charId}`;
      }).join(', ');
      
      prompt += ` Characters: ${characterDescriptions}.`;
    }

    // Add camera and technical specifications
    if (shot.cameraAngle) {
      prompt += ` Camera angle: ${shot.cameraAngle}.`;
    }
    
    if (shot.shotType) {
      prompt += ` Shot type: ${shot.shotType}.`;
    }

    // Add style and quality modifiers
    prompt += ` Style: ${this.config.visualStyle}. High quality, detailed animation.`;

    // Add duration hint for AI services that support it
    prompt += ` Duration: ${shot.duration} seconds.`;

    return prompt;
  }

  /**
   * Call specific AI video service
   */
  private async callVideoService(
    service: string, 
    prompt: string, 
    shot: Shot
  ): Promise<{ success: boolean; videoUrl?: string; service?: string; error?: string; qualityScore?: number }> {
    
    switch (service.toLowerCase()) {
      case 'runwayml':
        return this.callRunwayML(prompt, shot);
      
      case 'pikalabs':
        return this.callPikaLabs(prompt, shot);
      
      case 'stablevideo':
        return this.callStableVideoDiffusion(prompt, shot);
      
      case 'unsupported':
      case 'unsupported-service':
      case 'failing-service':
        return { success: false, error: `Unsupported service: ${service}` };
      
      default:
        return { success: false, error: `Unsupported service: ${service}` };
    }
  }

  /**
   * RunwayML API integration
   */
  private async callRunwayML(prompt: string, shot: Shot): Promise<any> {
    if (!this.config.apiKeys?.runwayml) {
      return { success: false, error: 'RunwayML API key not configured' };
    }

    try {
      // Simulate API call (replace with actual RunwayML API)
      const response = await this.simulateAPICall('runwayml', prompt, shot.duration);
      
      return {
        success: true,
        videoUrl: response.videoUrl,
        service: 'runwayml',
        qualityScore: response.qualityScore
      };
    } catch (error) {
      return { 
        success: false, 
        error: `RunwayML API error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Pika Labs API integration
   */
  private async callPikaLabs(prompt: string, shot: Shot): Promise<any> {
    if (!this.config.apiKeys?.pikalabs) {
      return { success: false, error: 'Pika Labs API key not configured' };
    }

    try {
      // Simulate API call (replace with actual Pika Labs API)
      const response = await this.simulateAPICall('pikalabs', prompt, shot.duration);
      
      return {
        success: true,
        videoUrl: response.videoUrl,
        service: 'pikalabs',
        qualityScore: response.qualityScore
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Pika Labs API error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Stable Video Diffusion integration
   */
  private async callStableVideoDiffusion(prompt: string, shot: Shot): Promise<any> {
    if (!this.config.apiKeys?.stablevideo) {
      return { success: false, error: 'Stable Video Diffusion API key not configured' };
    }

    try {
      // Simulate API call (replace with actual Stable Video API)
      const response = await this.simulateAPICall('stablevideo', prompt, shot.duration);
      
      return {
        success: true,
        videoUrl: response.videoUrl,
        service: 'stablevideo',
        qualityScore: response.qualityScore
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Stable Video API error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Simulate API call for development/testing
   */
  private async simulateAPICall(service: string, prompt: string, duration: number): Promise<any> {
    // Simulate network delay (reduced for testing)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures (reduced probability for testing)
    if (Math.random() < 0.05) {
      throw new Error(`${service} service temporarily unavailable`);
    }

    return {
      videoUrl: `https://example.com/videos/${service}/${Date.now()}.mp4`,
      qualityScore: 0.7 + Math.random() * 0.3 // Random quality between 0.7-1.0
    };
  }

  /**
   * Cache character designs for consistency
   */
  private async cacheCharacterDesigns(characters: Character[]): Promise<void> {
    for (const character of characters) {
      if (!this.characterDesignCache.has(character.id)) {
        const design = this.buildCharacterDesignPrompt(character);
        this.characterDesignCache.set(character.id, design);
      }
    }
  }

  /**
   * Build character design prompt for consistency
   */
  private buildCharacterDesignPrompt(character: Character): string {
    let design = `${character.name}:`;
    
    if (character.appearance) {
      design += ` ${character.appearance}`;
    }
    
    if (character.personality) {
      design += ` Personality: ${character.personality}`;
    }
    
    if (character.role) {
      design += ` Role: ${character.role}`;
    }

    return design;
  }

  /**
   * Extract character appearances from shot
   */
  private extractCharacterAppearances(shot: Shot): string[] {
    if (!shot.characters) return [];
    
    return shot.characters.map(charId => {
      const design = this.characterDesignCache.get(charId);
      return design || charId;
    });
  }

  /**
   * Combine video segments with transitions
   */
  private async combineVideoSegments(
    segments: VideoSegment[], 
    transitions?: Array<{ fromShot: string; toShot: string; type: string; duration: number }>
  ): Promise<{ url: string; duration: number }> {
    
    // Calculate total duration including transitions
    let totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    
    if (transitions) {
      totalDuration += transitions.reduce((sum, transition) => sum + transition.duration, 0);
    }

    // Set start/end times for segments
    let currentTime = 0;
    for (const segment of segments) {
      segment.startTime = currentTime;
      segment.endTime = currentTime + segment.duration;
      currentTime = segment.endTime;
      
      // Add transition time if exists
      const transition = transitions?.find(t => t.fromShot === segment.id);
      if (transition) {
        currentTime += transition.duration;
      }
    }

    // Simulate video combination (replace with actual video processing)
    const combinedUrl = `https://example.com/combined/${Date.now()}.mp4`;
    
    return {
      url: combinedUrl,
      duration: totalDuration
    };
  }

  /**
   * Validate character consistency across segments
   */
  private validateCharacterConsistency(segments: VideoSegment[]): { score: number; issues: string[] } {
    const issues: string[] = [];
    let totalScore = 0;
    let scoredSegments = 0;

    // Check each segment's character consistency
    for (const segment of segments) {
      if (segment.characterAppearances.length > 0) {
        // Simulate character consistency analysis
        const segmentScore = segment.qualityScore * (0.8 + Math.random() * 0.2);
        totalScore += segmentScore;
        scoredSegments++;

        if (segmentScore < 0.7) {
          issues.push(`Low character consistency in segment ${segment.id}`);
        }
      }
    }

    const averageScore = scoredSegments > 0 ? totalScore / scoredSegments : 1.0;

    return {
      score: averageScore,
      issues
    };
  }

  /**
   * Validate storyboard for video generation
   */
  private validateStoryboard(storyboard: Storyboard): void {
    if (!storyboard.shots || storyboard.shots.length === 0) {
      throw new Error('Storyboard must contain at least one shot');
    }

    for (const shot of storyboard.shots) {
      if (!shot.visualDescription || shot.visualDescription.trim().length === 0) {
        throw new Error(`Shot ${shot.id} missing visual description`);
      }
      
      if (!shot.duration || shot.duration <= 0) {
        throw new Error(`Shot ${shot.id} must have positive duration`);
      }
    }

    if (!storyboard.characters || storyboard.characters.length === 0) {
      throw new Error('Storyboard must contain character information');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIVideoConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear character design cache
   */
  clearCharacterCache(): void {
    this.characterDesignCache.clear();
  }

  /**
   * Get generation queue status
   */
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.generationQueue.length,
      processing: this.generationQueue.length > 0
    };
  }

  // Visual Style Coherence System

  /**
   * Enforce artistic style consistency across video segments
   */
  async enforceStyleConsistency(segments: VideoSegment[]): Promise<VideoSegment[]> {
    if (segments.length === 0) return segments;

    // Extract style features from the first segment as reference
    const referenceStyle = await this.extractStyleFeatures(segments[0]);
    
    // Apply style consistency to all segments
    const consistentSegments: VideoSegment[] = [];
    
    for (const segment of segments) {
      const adjustedSegment = await this.applyStyleConsistency(segment, referenceStyle);
      consistentSegments.push(adjustedSegment);
    }

    return consistentSegments;
  }

  /**
   * Extract style features from a video segment
   */
  private async extractStyleFeatures(segment: VideoSegment): Promise<StyleFeatures> {
    // Simulate style feature extraction (in real implementation, this would analyze the video)
    return {
      colorPalette: this.extractColorPalette(segment),
      lightingStyle: this.extractLightingStyle(segment),
      artStyle: this.extractArtStyle(segment),
      composition: this.extractComposition(segment),
      visualEffects: this.extractVisualEffects(segment)
    };
  }

  /**
   * Apply style consistency to a video segment
   */
  private async applyStyleConsistency(
    segment: VideoSegment, 
    referenceStyle: StyleFeatures
  ): Promise<VideoSegment> {
    // Calculate style deviation
    const currentStyle = await this.extractStyleFeatures(segment);
    const deviation = this.calculateStyleDeviation(currentStyle, referenceStyle);

    // If deviation is too high, apply style correction
    if (deviation > 0.3) {
      const correctedSegment = await this.correctStyleDeviation(segment, referenceStyle);
      return correctedSegment;
    }

    return segment;
  }

  /**
   * Calculate style deviation between two style feature sets
   */
  private calculateStyleDeviation(current: StyleFeatures, reference: StyleFeatures): number {
    let totalDeviation = 0;
    let featureCount = 0;

    // Compare color palette
    totalDeviation += this.compareColorPalettes(current.colorPalette, reference.colorPalette);
    featureCount++;

    // Compare lighting style
    totalDeviation += this.compareLightingStyles(current.lightingStyle, reference.lightingStyle);
    featureCount++;

    // Compare art style
    totalDeviation += this.compareArtStyles(current.artStyle, reference.artStyle);
    featureCount++;

    // Compare composition
    totalDeviation += this.compareCompositions(current.composition, reference.composition);
    featureCount++;

    // Compare visual effects
    totalDeviation += this.compareVisualEffects(current.visualEffects, reference.visualEffects);
    featureCount++;

    return totalDeviation / featureCount;
  }

  /**
   * Correct style deviation in a video segment
   */
  private async correctStyleDeviation(
    segment: VideoSegment, 
    referenceStyle: StyleFeatures
  ): Promise<VideoSegment> {
    // Build style correction prompt
    const correctionPrompt = this.buildStyleCorrectionPrompt(segment, referenceStyle);
    
    // Re-generate segment with style correction
    const correctedResult = await this.regenerateSegmentWithStyle(segment, correctionPrompt);
    
    return {
      ...segment,
      videoUrl: correctedResult.videoUrl || segment.videoUrl,
      qualityScore: Math.min(segment.qualityScore, correctedResult.qualityScore || 0.8),
      prompt: correctionPrompt
    };
  }

  /**
   * Build style correction prompt
   */
  private buildStyleCorrectionPrompt(segment: VideoSegment, referenceStyle: StyleFeatures): string {
    let prompt = segment.prompt;

    // Add color palette consistency
    prompt += ` Color palette: ${referenceStyle.colorPalette.primary}, ${referenceStyle.colorPalette.secondary}.`;
    
    // Add lighting consistency
    prompt += ` Lighting: ${referenceStyle.lightingStyle.type} lighting with ${referenceStyle.lightingStyle.intensity} intensity.`;
    
    // Add art style consistency
    prompt += ` Art style: ${referenceStyle.artStyle.technique} with ${referenceStyle.artStyle.detail} detail level.`;
    
    // Add composition consistency
    prompt += ` Composition: ${referenceStyle.composition.layout} layout with ${referenceStyle.composition.focus} focus.`;

    // Add visual effects consistency
    if (referenceStyle.visualEffects.effects.length > 0) {
      prompt += ` Visual effects: ${referenceStyle.visualEffects.effects.join(', ')}.`;
    }

    prompt += ' Maintain consistent visual style throughout.';

    return prompt;
  }

  /**
   * Regenerate segment with style correction
   */
  private async regenerateSegmentWithStyle(
    segment: VideoSegment, 
    stylePrompt: string
  ): Promise<{ videoUrl?: string; qualityScore?: number }> {
    try {
      // Use the same service that generated the original segment
      const shot: Shot = {
        id: segment.id,
        visualDescription: stylePrompt,
        duration: segment.duration,
        characters: segment.characterAppearances
      };

      const result = await this.callVideoService(segment.service, stylePrompt, shot);
      
      return {
        videoUrl: result.videoUrl,
        qualityScore: result.qualityScore
      };
    } catch (error) {
      console.warn(`Failed to regenerate segment ${segment.id} with style correction:`, error);
      return {};
    }
  }

  /**
   * Validate visual element coherence across segments
   */
  validateVisualCoherence(segments: VideoSegment[]): VisualCoherenceReport {
    if (segments.length === 0) {
      return {
        overallScore: 1.0,
        issues: [],
        recommendations: [],
        segmentScores: []
      };
    }

    const segmentScores: number[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Extract reference style from first segment
    const referenceStyle = this.extractStyleFeaturesSync(segments[0]);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentStyle = this.extractStyleFeaturesSync(segment);
      const deviation = this.calculateStyleDeviation(segmentStyle, referenceStyle);
      
      const score = Math.max(0, 1 - deviation);
      segmentScores.push(score);

      if (score < 0.7) {
        issues.push(`Segment ${segment.id} has low visual coherence (score: ${score.toFixed(2)})`);
        recommendations.push(`Consider regenerating segment ${segment.id} with style consistency prompts`);
      }
    }

    const overallScore = segmentScores.reduce((sum, score) => sum + score, 0) / segmentScores.length;

    // Add general recommendations based on overall score
    if (overallScore < 0.8) {
      recommendations.push('Consider using style reference images for better consistency');
      recommendations.push('Apply post-processing filters to harmonize visual styles');
    }

    return {
      overallScore,
      issues,
      recommendations,
      segmentScores
    };
  }

  /**
   * Combine video segments with smooth transitions
   */
  async combineSegmentsWithTransitions(
    segments: VideoSegment[], 
    transitions: TransitionSpecification[]
  ): Promise<CombinedVideoResult> {
    // Ensure visual consistency before combining
    const consistentSegments = await this.enforceStyleConsistency(segments);
    
    // Validate coherence
    const coherenceReport = this.validateVisualCoherence(consistentSegments);
    
    if (coherenceReport.overallScore < 0.6) {
      throw new Error(`Visual coherence too low (${coherenceReport.overallScore.toFixed(2)}). Cannot combine segments.`);
    }

    // Generate smooth transitions
    const enhancedTransitions = await this.generateSmoothTransitions(consistentSegments, transitions);
    
    // Combine segments with enhanced transitions
    const combinedResult = await this.performSegmentCombination(consistentSegments, enhancedTransitions);

    return {
      videoUrl: combinedResult.url,
      duration: combinedResult.duration,
      segments: consistentSegments,
      transitions: enhancedTransitions,
      coherenceReport,
      qualityMetrics: {
        visualConsistency: coherenceReport.overallScore,
        transitionSmoothness: this.calculateTransitionSmoothness(enhancedTransitions),
        overallQuality: (coherenceReport.overallScore + this.calculateTransitionSmoothness(enhancedTransitions)) / 2
      }
    };
  }

  /**
   * Generate smooth transitions between segments
   */
  private async generateSmoothTransitions(
    segments: VideoSegment[], 
    transitions: TransitionSpecification[]
  ): Promise<EnhancedTransition[]> {
    const enhancedTransitions: EnhancedTransition[] = [];

    for (const transition of transitions) {
      const fromSegment = segments.find(s => s.id === transition.fromShotId);
      const toSegment = segments.find(s => s.id === transition.toShotId);

      if (!fromSegment || !toSegment) continue;

      const enhanced = await this.enhanceTransition(transition, fromSegment, toSegment);
      enhancedTransitions.push(enhanced);
    }

    return enhancedTransitions;
  }

  /**
   * Enhance a transition for better smoothness
   */
  private async enhanceTransition(
    transition: TransitionSpecification,
    fromSegment: VideoSegment,
    toSegment: VideoSegment
  ): Promise<EnhancedTransition> {
    // Analyze visual compatibility between segments
    const compatibility = this.analyzeSegmentCompatibility(fromSegment, toSegment);
    
    // Choose optimal transition type based on compatibility
    const optimalType = this.selectOptimalTransitionType(transition.transitionType, compatibility);
    
    // Calculate optimal duration
    const optimalDuration = this.calculateOptimalTransitionDuration(
      transition.duration, 
      compatibility, 
      optimalType
    );

    return {
      id: transition.id,
      fromShotId: transition.fromShotId,
      toShotId: transition.toShotId,
      transitionType: optimalType,
      duration: optimalDuration,
      description: transition.description,
      compatibility,
      smoothnessScore: this.calculateTransitionSmoothnessScore(compatibility, optimalType),
      parameters: {
        ...transition,
        enhanced: true,
        originalType: transition.transitionType,
        originalDuration: transition.duration
      }
    };
  }

  // Helper methods for style feature extraction and comparison

  private extractColorPalette(segment: VideoSegment): ColorPalette {
    // Simulate color palette extraction
    const palettes = [
      { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#45B7D1' },
      { primary: '#96CEB4', secondary: '#FFEAA7', accent: '#DDA0DD' },
      { primary: '#74B9FF', secondary: '#FD79A8', accent: '#FDCB6E' }
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  private extractLightingStyle(segment: VideoSegment): LightingStyle {
    const styles = ['natural', 'dramatic', 'soft', 'harsh', 'ambient'];
    const intensities = ['low', 'medium', 'high'];
    
    return {
      type: styles[Math.floor(Math.random() * styles.length)],
      intensity: intensities[Math.floor(Math.random() * intensities.length)],
      direction: 'front'
    };
  }

  private extractArtStyle(segment: VideoSegment): ArtStyle {
    const techniques = ['anime', 'realistic', 'cartoon', 'sketch', 'watercolor'];
    const details = ['low', 'medium', 'high'];
    
    return {
      technique: techniques[Math.floor(Math.random() * techniques.length)],
      detail: details[Math.floor(Math.random() * details.length)],
      texture: 'smooth'
    };
  }

  private extractComposition(segment: VideoSegment): Composition {
    const layouts = ['centered', 'rule-of-thirds', 'symmetrical', 'dynamic'];
    const focuses = ['foreground', 'background', 'character', 'environment'];
    
    return {
      layout: layouts[Math.floor(Math.random() * layouts.length)],
      focus: focuses[Math.floor(Math.random() * focuses.length)],
      balance: 'balanced'
    };
  }

  private extractVisualEffects(segment: VideoSegment): VisualEffects {
    const effects = ['bloom', 'motion-blur', 'depth-of-field', 'color-grading'];
    const selectedEffects = effects.filter(() => Math.random() > 0.7);
    
    return {
      effects: selectedEffects,
      intensity: 'medium'
    };
  }

  private extractStyleFeaturesSync(segment: VideoSegment): StyleFeatures {
    return {
      colorPalette: this.extractColorPalette(segment),
      lightingStyle: this.extractLightingStyle(segment),
      artStyle: this.extractArtStyle(segment),
      composition: this.extractComposition(segment),
      visualEffects: this.extractVisualEffects(segment)
    };
  }

  private compareColorPalettes(current: ColorPalette, reference: ColorPalette): number {
    // Simple color comparison (in real implementation, use color distance algorithms)
    let deviation = 0;
    if (current.primary !== reference.primary) deviation += 0.1;
    if (current.secondary !== reference.secondary) deviation += 0.1;
    if (current.accent !== reference.accent) deviation += 0.05;
    return Math.min(deviation, 1.0);
  }

  private compareLightingStyles(current: LightingStyle, reference: LightingStyle): number {
    let deviation = 0;
    if (current.type !== reference.type) deviation += 0.15;
    if (current.intensity !== reference.intensity) deviation += 0.1;
    if (current.direction !== reference.direction) deviation += 0.05;
    return Math.min(deviation, 1.0);
  }

  private compareArtStyles(current: ArtStyle, reference: ArtStyle): number {
    let deviation = 0;
    if (current.technique !== reference.technique) deviation += 0.2;
    if (current.detail !== reference.detail) deviation += 0.1;
    if (current.texture !== reference.texture) deviation += 0.05;
    return Math.min(deviation, 1.0);
  }

  private compareCompositions(current: Composition, reference: Composition): number {
    let deviation = 0;
    if (current.layout !== reference.layout) deviation += 0.15;
    if (current.focus !== reference.focus) deviation += 0.1;
    if (current.balance !== reference.balance) deviation += 0.05;
    return Math.min(deviation, 1.0);
  }

  private compareVisualEffects(current: VisualEffects, reference: VisualEffects): number {
    const currentEffects = new Set(current.effects);
    const referenceEffects = new Set(reference.effects);
    
    const intersection = new Set([...currentEffects].filter(x => referenceEffects.has(x)));
    const union = new Set([...currentEffects, ...referenceEffects]);
    
    const similarity = union.size > 0 ? intersection.size / union.size : 1;
    return 1 - similarity;
  }

  private analyzeSegmentCompatibility(from: VideoSegment, to: VideoSegment): SegmentCompatibility {
    const fromStyle = this.extractStyleFeaturesSync(from);
    const toStyle = this.extractStyleFeaturesSync(to);
    
    const deviation = this.calculateStyleDeviation(fromStyle, toStyle);
    const compatibility = Math.max(0, 1 - deviation);
    
    return {
      visualSimilarity: compatibility,
      colorCompatibility: 1 - this.compareColorPalettes(fromStyle.colorPalette, toStyle.colorPalette),
      lightingCompatibility: 1 - this.compareLightingStyles(fromStyle.lightingStyle, toStyle.lightingStyle),
      styleCompatibility: 1 - this.compareArtStyles(fromStyle.artStyle, toStyle.artStyle),
      overallCompatibility: compatibility
    };
  }

  private selectOptimalTransitionType(
    originalType: TransitionType, 
    compatibility: SegmentCompatibility
  ): TransitionType {
    // If segments are highly compatible, use smoother transitions
    if (compatibility.overallCompatibility > 0.8) {
      return originalType === 'cut' ? 'fade' : originalType;
    }
    
    // If segments have low compatibility, use more dramatic transitions
    if (compatibility.overallCompatibility < 0.4) {
      return 'dissolve';
    }
    
    return originalType;
  }

  private calculateOptimalTransitionDuration(
    originalDuration: number,
    compatibility: SegmentCompatibility,
    transitionType: TransitionType
  ): number {
    let multiplier = 1.0;
    
    // Adjust duration based on compatibility
    if (compatibility.overallCompatibility < 0.5) {
      multiplier = 1.5; // Longer transitions for incompatible segments
    } else if (compatibility.overallCompatibility > 0.8) {
      multiplier = 0.8; // Shorter transitions for compatible segments
    }
    
    // Adjust based on transition type
    switch (transitionType) {
      case 'cut':
        multiplier *= 0.1;
        break;
      case 'fade':
        multiplier *= 1.0;
        break;
      case 'dissolve':
        multiplier *= 1.2;
        break;
      case 'wipe':
        multiplier *= 1.1;
        break;
      default:
        multiplier *= 1.0;
    }
    
    return Math.max(0.1, originalDuration * multiplier);
  }

  private calculateTransitionSmoothnessScore(
    compatibility: SegmentCompatibility,
    transitionType: TransitionType
  ): number {
    let baseScore = compatibility.overallCompatibility;
    
    // Adjust score based on transition type appropriateness
    if (compatibility.overallCompatibility > 0.8 && transitionType === 'cut') {
      baseScore *= 0.9; // Cut might be too abrupt for compatible segments
    } else if (compatibility.overallCompatibility < 0.4 && transitionType === 'fade') {
      baseScore *= 0.8; // Fade might not be dramatic enough for incompatible segments
    }
    
    return Math.max(0, Math.min(1, baseScore));
  }

  private calculateTransitionSmoothness(transitions: EnhancedTransition[]): number {
    if (transitions.length === 0) return 1.0;
    
    const totalSmoothness = transitions.reduce((sum, t) => sum + t.smoothnessScore, 0);
    return totalSmoothness / transitions.length;
  }

  private async performSegmentCombination(
    segments: VideoSegment[],
    transitions: EnhancedTransition[]
  ): Promise<{ url: string; duration: number }> {
    // Set start/end times for segments
    let currentTime = 0;
    for (const segment of segments) {
      segment.startTime = currentTime;
      segment.endTime = currentTime + segment.duration;
      currentTime = segment.endTime;
      
      // Add transition time if exists
      const transition = transitions.find(t => t.fromShotId === segment.id);
      if (transition) {
        currentTime += transition.duration;
      }
    }

    // Calculate total duration including enhanced transitions
    let totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    totalDuration += transitions.reduce((sum, transition) => sum + transition.duration, 0);

    // Simulate video combination with enhanced transitions
    const combinedUrl = `https://example.com/combined-enhanced/${Date.now()}.mp4`;
    
    return {
      url: combinedUrl,
      duration: totalDuration
    };
  }

  // Comprehensive Error Handling and Reporting System

  /**
   * Generate comprehensive error report with correction suggestions
   */
  generateErrorReport(error: Error, context: ErrorContext): DetailedErrorReport {
    const errorType = this.classifyError(error);
    const suggestions = this.generateCorrectionSuggestions(error, errorType, context);
    const severity = this.assessErrorSeverity(error, errorType);
    
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: errorType,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      suggestions,
      isRecoverable: this.isErrorRecoverable(error, errorType),
      retryRecommended: this.shouldRetry(error, errorType, context),
      estimatedRecoveryTime: this.estimateRecoveryTime(errorType, severity)
    };
  }

  /**
   * Classify error type for better handling
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network and API errors
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('invalid key')) {
      return 'api';
    }
    if (message.includes('api') || message.includes('service')) {
      return 'api';
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate_limit';
    }

    // Configuration errors
    if (message.includes('config') || message.includes('key') || message.includes('credential')) {
      return 'configuration';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('missing')) {
      return 'validation';
    }

    // Processing errors
    if (message.includes('generation') || message.includes('processing') || message.includes('conversion') || message.includes('temporary')) {
      return 'processing';
    }

    // Resource errors
    if (message.includes('memory') || message.includes('disk') || message.includes('resource')) {
      return 'resource';
    }

    // Quality errors
    if (message.includes('quality') || message.includes('coherence') || message.includes('consistency')) {
      return 'quality';
    }

    return 'unknown';
  }

  /**
   * Generate correction suggestions based on error type and context
   */
  private generateCorrectionSuggestions(error: Error, errorType: ErrorType, context: ErrorContext): string[] {
    const suggestions: string[] = [];

    switch (errorType) {
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Verify that AI service endpoints are accessible');
        suggestions.push('Try again in a few moments');
        if (context.retryCount > 0) {
          suggestions.push('Consider switching to a different AI service');
        }
        break;

      case 'api':
        suggestions.push('Verify your API keys are correct and active');
        suggestions.push('Check if the AI service is experiencing downtime');
        suggestions.push('Ensure your account has sufficient credits/quota');
        if (context.service) {
          suggestions.push(`Try switching from ${context.service} to an alternative service`);
        }
        break;

      case 'rate_limit':
        suggestions.push('Wait before making additional requests');
        suggestions.push('Consider upgrading your API plan for higher limits');
        suggestions.push('Implement request batching to reduce frequency');
        suggestions.push('Use exponential backoff for retries');
        break;

      case 'configuration':
        suggestions.push('Check your configuration settings');
        suggestions.push('Ensure all required API keys are provided');
        suggestions.push('Verify service endpoints are correctly configured');
        suggestions.push('Review the configuration documentation');
        break;

      case 'validation':
        suggestions.push('Check that all required fields are provided');
        suggestions.push('Verify input data format and structure');
        suggestions.push('Ensure character and storyboard data is complete');
        if (context.storyboard) {
          suggestions.push('Validate storyboard contains shots with visual descriptions');
        }
        break;

      case 'processing':
        suggestions.push('Try reducing the complexity of the request');
        suggestions.push('Break large requests into smaller segments');
        suggestions.push('Check if input data is corrupted or malformed');
        suggestions.push('Consider using lower quality settings temporarily');
        break;

      case 'resource':
        suggestions.push('Free up system memory and disk space');
        suggestions.push('Close other resource-intensive applications');
        suggestions.push('Consider processing smaller batches');
        suggestions.push('Restart the application if memory leaks are suspected');
        break;

      case 'quality':
        suggestions.push('Review character consistency settings');
        suggestions.push('Check visual style coherence parameters');
        suggestions.push('Consider regenerating problematic segments');
        suggestions.push('Adjust quality thresholds if they are too strict');
        break;

      default:
        suggestions.push('Review the error message for specific details');
        suggestions.push('Check the application logs for more information');
        suggestions.push('Try restarting the operation');
        suggestions.push('Contact support if the issue persists');
    }

    // Add context-specific suggestions
    if (context.retryCount >= 3) {
      suggestions.push('Multiple retries have failed - consider manual intervention');
    }
    if (context.fallbackUsed) {
      suggestions.push('Fallback service was used - primary service may need attention');
    }

    return suggestions;
  }

  /**
   * Assess error severity level
   */
  private assessErrorSeverity(error: Error, errorType: ErrorType): ErrorSeverity {
    switch (errorType) {
      case 'network':
      case 'rate_limit':
        return 'warning'; // Usually temporary

      case 'api':
        return error.message.includes('unauthorized') ? 'error' : 'warning';

      case 'configuration':
      case 'validation':
        return 'error'; // Requires user action

      case 'processing':
      case 'quality':
        return 'warning'; // May be recoverable

      case 'resource':
        return 'error'; // System-level issue

      default:
        return 'error';
    }
  }

  /**
   * Determine if error is recoverable
   */
  private isErrorRecoverable(error: Error, errorType: ErrorType): boolean {
    switch (errorType) {
      case 'network':
      case 'rate_limit':
      case 'processing':
      case 'quality':
        return true;

      case 'api':
        return !error.message.includes('unauthorized') && !error.message.includes('invalid key');

      case 'configuration':
      case 'validation':
      case 'resource':
        return false;

      default:
        return false;
    }
  }

  /**
   * Determine if retry is recommended
   */
  private shouldRetry(error: Error, errorType: ErrorType, context: ErrorContext): boolean {
    if (context.retryCount >= this.config.maxRetries) {
      return false;
    }

    const message = error.message.toLowerCase();

    switch (errorType) {
      case 'network':
      case 'rate_limit':
      case 'processing':
        return true;

      case 'api':
        // Don't retry for authentication errors
        if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('invalid key')) {
          return false;
        }
        return true;

      case 'quality':
        return context.retryCount < 2; // Limited retries for quality issues

      case 'unknown':
        // For unknown errors, don't retry by default unless it's the first attempt
        return context.retryCount === 0;

      default:
        return false;
    }
  }

  /**
   * Estimate recovery time based on error type and severity
   */
  private estimateRecoveryTime(errorType: ErrorType, severity: ErrorSeverity): number {
    switch (errorType) {
      case 'network':
        return severity === 'warning' ? 30 : 300; // 30s to 5min

      case 'rate_limit':
        return 3600; // 1 hour

      case 'api':
        return severity === 'warning' ? 60 : -1; // 1min or manual intervention

      case 'processing':
        return 120; // 2 minutes

      case 'quality':
        return 60; // 1 minute

      default:
        return -1; // Manual intervention required
    }
  }

  /**
   * Execute operation with comprehensive error handling and retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig: RetryConfig = {
      maxRetries: this.config.maxRetries,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...customRetryConfig
    };

    let lastError: Error;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        context.retryCount = attempt;
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Generate error report
        const errorReport = this.generateErrorReport(lastError, context);
        
        // Log error details
        console.error(`Attempt ${attempt + 1} failed:`, errorReport);

        // Check if we should retry
        if (attempt >= retryConfig.maxRetries || !errorReport.retryRecommended) {
          throw new DetailedError(lastError.message, errorReport);
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${retryConfig.maxRetries + 1})`);
        await this.delay(delay);
        
        attempt++;
      }
    }

    throw new DetailedError(lastError!.message, this.generateErrorReport(lastError!, context));
  }

  /**
   * Calculate retry delay with exponential backoff and optional jitter
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(100, Math.floor(delay)); // Minimum 100ms delay
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced video generation with comprehensive error handling
   */
  async generateVideoWithErrorHandling(storyboard: Storyboard): Promise<VideoGenerationResult> {
    const context: ErrorContext = {
      operation: 'video_generation',
      storyboard: storyboard.id,
      service: this.config.primaryService,
      retryCount: 0,
      fallbackUsed: false,
      timestamp: new Date().toISOString()
    };

    try {
      return await this.executeWithRetry(
        () => this.generateVideo(storyboard),
        context,
        {
          maxRetries: 3,
          baseDelay: 2000,
          maxDelay: 60000
        }
      );
    } catch (error) {
      if (error instanceof DetailedError) {
        return {
          success: false,
          error: error.message,
          segments: [],
          metadata: {
            duration: 0,
            resolution: this.config.resolution,
            format: this.config.outputFormat,
            generatedAt: new Date().toISOString(),
            service: this.config.primaryService
          },
          characterConsistency: { score: 0, issues: ['Generation failed'] },
          visualCoherence: {
            overallScore: 0,
            issues: ['Generation failed'],
            recommendations: ['Fix generation errors'],
            segmentScores: []
          },
          qualityMetrics: {
            visualConsistency: 0,
            transitionSmoothness: 0,
            overallQuality: 0
          },
          errorReport: error.errorReport
        };
      }

      // Fallback for unexpected errors
      const errorReport = this.generateErrorReport(
        error instanceof Error ? error : new Error(String(error)),
        context
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        segments: [],
        metadata: {
          duration: 0,
          resolution: this.config.resolution,
          format: this.config.outputFormat,
          generatedAt: new Date().toISOString(),
          service: this.config.primaryService
        },
        characterConsistency: { score: 0, issues: ['Generation failed'] },
        visualCoherence: {
          overallScore: 0,
          issues: ['Generation failed'],
          recommendations: ['Fix generation errors'],
          segmentScores: []
        },
        qualityMetrics: {
          visualConsistency: 0,
          transitionSmoothness: 0,
          overallQuality: 0
        },
        errorReport
      };
    }
  }

  /**
   * Get error statistics and patterns
   */
  getErrorStatistics(): ErrorStatistics {
    // In a real implementation, this would track errors over time
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByService: {},
      averageRetryCount: 0,
      successRateAfterRetry: 0,
      mostCommonSuggestions: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear error history (for testing or maintenance)
   */
  clearErrorHistory(): void {
    // Implementation would clear stored error data
    console.log('Error history cleared');
  }

  // Visual Element Caching System Implementation

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.performCacheCleanup();
    }, this.cacheConfig.cleanupInterval * 1000);
  }

  /**
   * Generate cache key for visual element
   */
  private generateCacheKey(
    type: VisualElementType,
    prompt: string,
    parameters: GenerationParameters
  ): string {
    const keyData = {
      type,
      prompt: prompt.toLowerCase().trim(),
      service: parameters.service,
      resolution: parameters.resolution,
      seed: parameters.seed,
      model: parameters.model
    };
    
    // Create a hash-like key from the data
    const keyString = JSON.stringify(keyData);
    return `${type}_${this.simpleHash(keyString)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if visual element exists in cache
   */
  async checkCache(
    type: VisualElementType,
    prompt: string,
    parameters: GenerationParameters,
    metadata?: Partial<CacheMetadata>
  ): Promise<CachedVisualElement | null> {
    const key = this.generateCacheKey(type, prompt, parameters);
    const cached = this.visualCache.get(key);

    if (!cached) {
      this.updateCacheStats('miss');
      return null;
    }

    // Check if cache entry has expired
    if (this.isCacheExpired(cached)) {
      this.evictCacheEntry(key);
      this.updateCacheStats('miss');
      return null;
    }

    // Update access statistics
    cached.lastAccessed = new Date().toISOString();
    cached.accessCount++;
    this.updateCacheStats('hit');

    return cached.data;
  }

  /**
   * Store visual element in cache
   */
  async storeInCache(
    type: VisualElementType,
    prompt: string,
    parameters: GenerationParameters,
    element: CachedVisualElement,
    metadata?: Partial<CacheMetadata>
  ): Promise<void> {
    const key = this.generateCacheKey(type, prompt, parameters);
    
    // Calculate element size
    const size = this.calculateElementSize(element);
    
    // Check if we need to make space
    if (this.needsEviction(size)) {
      await this.performEviction(size);
    }

    // Create cache entry
    const cacheEntry: VisualElementCache = {
      id: key,
      type,
      key,
      data: element,
      metadata: {
        tags: metadata?.tags || [],
        project: metadata?.project,
        episode: metadata?.episode,
        character: metadata?.character,
        scene: metadata?.scene,
        expiresAt: metadata?.expiresAt || this.calculateExpirationTime(),
        priority: metadata?.priority || 'medium',
        reusabilityScore: this.calculateReusabilityScore(type, element)
      },
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 1,
      size
    };

    // Store in cache
    this.visualCache.set(key, cacheEntry);
    
    // Update statistics
    this.updateCacheStatistics(cacheEntry, 'add');
  }

  /**
   * Search cache for similar visual elements
   */
  async searchCache(query: CacheQuery): Promise<CacheSearchResult> {
    const matches: VisualElementCache[] = [];
    const exactMatches: VisualElementCache[] = [];
    const similarMatches: Array<{ cache: VisualElementCache; similarity: number }> = [];

    for (const [key, cache] of this.visualCache) {
      // Skip expired entries
      if (this.isCacheExpired(cache)) {
        continue;
      }

      // Apply filters
      if (query.type && cache.type !== query.type) continue;
      if (query.project && cache.metadata.project !== query.project) continue;
      if (query.episode && cache.metadata.episode !== query.episode) continue;
      if (query.character && cache.metadata.character !== query.character) continue;
      if (query.scene && cache.metadata.scene !== query.scene) continue;
      if (query.minQualityScore && cache.data.qualityScore < query.minQualityScore) continue;
      
      // Check age filter
      if (query.maxAge) {
        const age = (Date.now() - new Date(cache.createdAt).getTime()) / 1000;
        if (age > query.maxAge) continue;
      }

      // Check tags
      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some(tag => 
          cache.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) continue;
      }

      matches.push(cache);

      // Calculate similarity for fuzzy matching
      if (query.similarityThreshold !== undefined) {
        const similarity = this.calculateSimilarity(cache, query);
        
        if (similarity >= query.similarityThreshold) {
          if (similarity >= 0.95) {
            exactMatches.push(cache);
          } else {
            similarMatches.push({ cache, similarity });
          }
        }
      }
    }

    // Sort similar matches by similarity score
    similarMatches.sort((a, b) => b.similarity - a.similarity);

    return {
      matches,
      exactMatches,
      similarMatches,
      totalFound: matches.length
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    return { ...this.cacheStats };
  }

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<CacheOptimizationReport> {
    const currentSize = this.cacheStats.totalSize;
    const maxSize = this.cacheConfig.maxSize;
    const utilizationRate = currentSize / maxSize;
    
    const recommendations: any[] = [];
    let potentialSavings = 0;

    // Check for expired entries
    const expiredCount = this.countExpiredEntries();
    if (expiredCount > 0) {
      const expiredSize = this.calculateExpiredSize();
      recommendations.push({
        type: 'cleanup',
        description: `Remove ${expiredCount} expired entries`,
        estimatedSavings: expiredSize,
        priority: 'high',
        riskLevel: 'safe'
      });
      potentialSavings += expiredSize;
    }

    // Check for low-usage entries
    const lowUsageEntries = this.findLowUsageEntries();
    if (lowUsageEntries.length > 0) {
      const lowUsageSize = lowUsageEntries.reduce((sum, entry) => sum + entry.size, 0);
      recommendations.push({
        type: 'evict',
        description: `Remove ${lowUsageEntries.length} low-usage entries`,
        estimatedSavings: lowUsageSize,
        priority: 'medium',
        riskLevel: 'moderate'
      });
      potentialSavings += lowUsageSize * 0.7; // Conservative estimate
    }

    // Check if compression could help
    if (this.cacheConfig.compressionEnabled && utilizationRate > 0.8) {
      const compressionSavings = currentSize * 0.3; // Estimate 30% compression
      recommendations.push({
        type: 'compress',
        description: 'Apply compression to reduce cache size',
        estimatedSavings: compressionSavings,
        priority: 'medium',
        riskLevel: 'safe'
      });
      potentialSavings += compressionSavings;
    }

    return {
      currentSize,
      maxSize,
      utilizationRate,
      fragmentationLevel: this.calculateFragmentation(),
      recommendedActions: recommendations,
      potentialSavings,
      performanceImpact: {
        cacheHitImprovement: Math.min(20, potentialSavings / currentSize * 100),
        generationTimeReduction: this.cacheStats.hitRate * 5, // Estimate 5s per hit
        bandwidthSavings: potentialSavings * 0.8,
        costSavings: potentialSavings * 0.001 // Estimate $0.001 per MB
      }
    };
  }

  /**
   * Clear cache entries matching criteria
   */
  async clearCache(query?: CacheQuery): Promise<number> {
    let clearedCount = 0;

    if (!query) {
      // Clear all cache
      clearedCount = this.visualCache.size;
      this.visualCache.clear();
      this.resetCacheStatistics();
    } else {
      // Clear matching entries
      const searchResult = await this.searchCache(query);
      for (const cache of searchResult.matches) {
        this.evictCacheEntry(cache.key);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(newConfig: Partial<CacheConfiguration>): void {
    this.cacheConfig = { ...this.cacheConfig, ...newConfig };
  }

  // Private helper methods for cache management

  private isCacheExpired(cache: VisualElementCache): boolean {
    if (!cache.metadata.expiresAt) return false;
    return new Date(cache.metadata.expiresAt) < new Date();
  }

  private calculateExpirationTime(): string {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + this.cacheConfig.defaultTTL);
    return expirationDate.toISOString();
  }

  private calculateElementSize(element: CachedVisualElement): number {
    // Estimate size based on content
    let size = 0;
    
    // Base prompt size
    size += element.prompt.length * 2; // UTF-16 encoding
    
    // URL size (if present)
    if (element.generatedUrl) {
      size += element.generatedUrl.length * 2;
    }
    
    // Style features (estimated)
    size += JSON.stringify(element.styleFeatures).length * 2;
    
    // Generation parameters
    size += JSON.stringify(element.generationParameters).length * 2;
    
    // Variations
    if (element.variations) {
      size += element.variations.reduce((sum, variation) => {
        return sum + JSON.stringify(variation).length * 2;
      }, 0);
    }
    
    return size;
  }

  private needsEviction(newElementSize: number): boolean {
    const wouldExceedSize = this.cacheStats.totalSize + newElementSize > this.cacheConfig.maxSize;
    const wouldExceedEntries = this.cacheStats.totalEntries >= this.cacheConfig.maxEntries;
    
    return wouldExceedSize || wouldExceedEntries;
  }

  private async performEviction(requiredSpace: number): Promise<void> {
    const entriesToEvict = this.selectEntriesForEviction(requiredSpace);
    
    for (const entry of entriesToEvict) {
      this.evictCacheEntry(entry.key);
    }
  }

  private selectEntriesForEviction(requiredSpace: number): VisualElementCache[] {
    const entries = Array.from(this.visualCache.values());
    let freedSpace = 0;
    const toEvict: VisualElementCache[] = [];

    // Sort by eviction policy
    switch (this.cacheConfig.evictionPolicy) {
      case 'lru':
        entries.sort((a, b) => 
          new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
        );
        break;
      
      case 'lfu':
        entries.sort((a, b) => a.accessCount - b.accessCount);
        break;
      
      case 'fifo':
        entries.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      
      case 'priority':
        entries.sort((a, b) => {
          const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          return priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
        });
        break;
      
      case 'ttl':
        entries.sort((a, b) => {
          const aExpiry = a.metadata.expiresAt ? new Date(a.metadata.expiresAt).getTime() : Infinity;
          const bExpiry = b.metadata.expiresAt ? new Date(b.metadata.expiresAt).getTime() : Infinity;
          return aExpiry - bExpiry;
        });
        break;
    }

    // Select entries to evict
    for (const entry of entries) {
      if (freedSpace >= requiredSpace) break;
      
      // Don't evict critical priority items unless absolutely necessary
      if (entry.metadata.priority === 'critical' && freedSpace > requiredSpace * 0.5) {
        continue;
      }
      
      toEvict.push(entry);
      freedSpace += entry.size;
    }

    return toEvict;
  }

  private evictCacheEntry(key: string): void {
    const entry = this.visualCache.get(key);
    if (entry) {
      this.visualCache.delete(key);
      this.updateCacheStatistics(entry, 'remove');
      this.cacheStats.evictionCount++;
    }
  }

  private calculateReusabilityScore(type: VisualElementType, element: CachedVisualElement): number {
    let score = 0.5; // Base score
    
    // Type-based scoring
    switch (type) {
      case 'character_design':
        score += 0.3; // Characters are highly reusable
        break;
      case 'background_scene':
        score += 0.2; // Backgrounds are moderately reusable
        break;
      case 'lighting_setup':
        score += 0.25; // Lighting setups are quite reusable
        break;
      case 'color_palette':
        score += 0.35; // Color palettes are very reusable
        break;
      case 'style_template':
        score += 0.4; // Style templates are extremely reusable
        break;
      default:
        score += 0.1;
    }
    
    // Quality-based scoring
    score += element.qualityScore * 0.2;
    
    // Variations increase reusability
    if (element.variations && element.variations.length > 0) {
      score += Math.min(0.1, element.variations.length * 0.02);
    }
    
    return Math.min(1.0, score);
  }

  private calculateSimilarity(cache: VisualElementCache, query: CacheQuery): number {
    let similarity = 0;
    let factors = 0;

    // Type match
    if (query.type === cache.type) {
      similarity += 0.3;
    }
    factors++;

    // Tag similarity
    if (query.tags && query.tags.length > 0 && cache.metadata.tags.length > 0) {
      const commonTags = query.tags.filter(tag => cache.metadata.tags.includes(tag));
      const tagSimilarity = commonTags.length / Math.max(query.tags.length, cache.metadata.tags.length);
      similarity += tagSimilarity * 0.2;
    }
    factors++;

    // Project/episode/character/scene matches
    if (query.project && cache.metadata.project === query.project) similarity += 0.15;
    if (query.episode && cache.metadata.episode === query.episode) similarity += 0.15;
    if (query.character && cache.metadata.character === query.character) similarity += 0.1;
    if (query.scene && cache.metadata.scene === query.scene) similarity += 0.1;
    factors += 4;

    return similarity / factors;
  }

  private performCacheCleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    // Remove expired entries
    for (const [key, cache] of this.visualCache) {
      if (this.isCacheExpired(cache)) {
        this.evictCacheEntry(key);
        cleanedCount++;
      }
    }

    // Update cleanup timestamp
    this.cacheStats.lastCleanup = now.toISOString();
    
    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  private updateCacheStats(type: 'hit' | 'miss'): void {
    const totalRequests = this.cacheStats.hitRate + this.cacheStats.missRate + 1;
    
    if (type === 'hit') {
      this.cacheStats.hitRate = (this.cacheStats.hitRate + 1) / totalRequests;
      this.cacheStats.missRate = this.cacheStats.missRate / totalRequests;
    } else {
      this.cacheStats.missRate = (this.cacheStats.missRate + 1) / totalRequests;
      this.cacheStats.hitRate = this.cacheStats.hitRate / totalRequests;
    }
  }

  private updateCacheStatistics(entry: VisualElementCache, operation: 'add' | 'remove'): void {
    if (operation === 'add') {
      this.cacheStats.totalEntries++;
      this.cacheStats.totalSize += entry.size;
      this.cacheStats.entriesByType[entry.type] = (this.cacheStats.entriesByType[entry.type] || 0) + 1;
      this.cacheStats.sizeByType[entry.type] = (this.cacheStats.sizeByType[entry.type] || 0) + entry.size;
    } else {
      this.cacheStats.totalEntries--;
      this.cacheStats.totalSize -= entry.size;
      this.cacheStats.entriesByType[entry.type] = Math.max(0, (this.cacheStats.entriesByType[entry.type] || 0) - 1);
      this.cacheStats.sizeByType[entry.type] = Math.max(0, (this.cacheStats.sizeByType[entry.type] || 0) - entry.size);
    }

    // Update top reused elements
    this.updateTopReusedElements();
  }

  private updateTopReusedElements(): void {
    const entries = Array.from(this.visualCache.values())
      .map(cache => ({
        key: cache.key,
        type: cache.type,
        accessCount: cache.accessCount,
        lastAccessed: cache.lastAccessed,
        size: cache.size
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    this.cacheStats.topReusedElements = entries;
  }

  private resetCacheStatistics(): void {
    this.cacheStats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      lastCleanup: new Date().toISOString(),
      entriesByType: {} as Record<VisualElementType, number>,
      sizeByType: {} as Record<VisualElementType, number>,
      topReusedElements: []
    };
  }

  private countExpiredEntries(): number {
    let count = 0;
    for (const cache of this.visualCache.values()) {
      if (this.isCacheExpired(cache)) {
        count++;
      }
    }
    return count;
  }

  private calculateExpiredSize(): number {
    let size = 0;
    for (const cache of this.visualCache.values()) {
      if (this.isCacheExpired(cache)) {
        size += cache.size;
      }
    }
    return size;
  }

  private findLowUsageEntries(): VisualElementCache[] {
    const averageAccess = Array.from(this.visualCache.values())
      .reduce((sum, cache) => sum + cache.accessCount, 0) / this.visualCache.size;
    
    return Array.from(this.visualCache.values())
      .filter(cache => cache.accessCount < averageAccess * 0.3); // Less than 30% of average
  }

  private calculateFragmentation(): number {
    // Simple fragmentation calculation based on entry size distribution
    const sizes = Array.from(this.visualCache.values()).map(cache => cache.size);
    if (sizes.length === 0) return 0;
    
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    
    return Math.min(1.0, variance / (avgSize * avgSize)); // Normalized fragmentation score
  }

  /**
   * Enhanced video generation with caching
   */
  async generateVideoSegmentWithCache(shot: Shot): Promise<VideoSegment> {
    const generationParams: GenerationParameters = {
      service: this.config.primaryService,
      resolution: this.config.resolution,
      duration: shot.duration,
      model: this.config.visualStyle
    };

    // Check cache first
    const cachedElement = await this.checkCache(
      'character_design', // This could be more specific based on shot content
      shot.visualDescription,
      generationParams,
      {
        episode: shot.id.split('_')[0], // Extract episode from shot ID
        character: shot.characters?.[0] // Primary character
      }
    );

    if (cachedElement && cachedElement.generatedUrl) {
      console.log(`Cache hit for shot ${shot.id}`);
      
      return {
        id: shot.id,
        videoUrl: cachedElement.generatedUrl,
        duration: shot.duration,
        startTime: 0,
        endTime: shot.duration,
        prompt: cachedElement.prompt,
        service: cachedElement.generationParameters.service,
        characterAppearances: this.extractCharacterAppearances(shot),
        qualityScore: cachedElement.qualityScore
      };
    }

    // Generate new segment
    console.log(`Cache miss for shot ${shot.id}, generating new segment`);
    const segment = await this.generateVideoSegment(shot);

    // Store in cache for future use
    const elementToCache: CachedVisualElement = {
      prompt: this.buildVideoPrompt(shot),
      generatedUrl: segment.videoUrl,
      styleFeatures: this.extractStyleFeaturesSync(segment),
      qualityScore: segment.qualityScore,
      generationParameters: generationParams
    };

    await this.storeInCache(
      'character_design',
      shot.visualDescription,
      generationParams,
      elementToCache,
      {
        episode: shot.id.split('_')[0],
        character: shot.characters?.[0],
        priority: 'medium',
        tags: ['generated', 'video_segment']
      }
    );

    return segment;
  }
}