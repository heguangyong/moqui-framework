// Core data model interfaces for the Novel-to-Anime Video Generator

export interface NovelStructure {
  title: string
  author: string
  chapters: Chapter[]
  metadata: NovelMetadata
}

export interface NovelMetadata {
  wordCount: number
  genre?: string
  language?: string
  publishedDate?: string
  description?: string
}

export interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  scenes: Scene[]
}

export interface Scene {
  id: string
  chapterId: string
  sceneNumber: number
  content: string
  setting: string
  mood?: string
  characters: string[] // Character IDs present in this scene
}

export interface Character {
  id: string
  name: string
  role: CharacterRole
  attributes: CharacterAttributes
  relationships: Relationship[]
  appearances: Appearance[]
}

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor'

export interface CharacterAttributes {
  appearance: string
  personality: string
  age?: number
  gender?: string
  occupation?: string
  background?: string
}

export interface LockedProfile {
  characterId: string
  lockedAttributes: CharacterAttributes
  visualReference?: ImageReference
  consistencyRules: ValidationRule[]
  isLocked: boolean
}

export interface Relationship {
  id: string
  fromCharacterId: string
  toCharacterId: string
  relationshipType: string
  description: string
  strength?: number // 1-10 scale
}

export interface Appearance {
  id: string
  characterId: string
  sceneId: string
  description: string
  importance: 'major' | 'minor' | 'background'
}

export interface Episode {
  id: string
  episodeNumber: number
  title: string
  summary: string
  scenes: Scene[]
  duration: number
  keyEvents: KeyEvent[]
  status: EpisodeStatus
}

export type EpisodeStatus = 'draft' | 'script_ready' | 'storyboard_ready' | 'video_generated' | 'completed'

export interface KeyEvent {
  id: string
  episodeId: string
  eventType: 'plot_point' | 'character_development' | 'conflict' | 'resolution'
  description: string
  importance: 'critical' | 'major' | 'minor'
  timestamp?: number // Position within episode
}

export interface Screenplay {
  id: string
  episodeId: string
  content: string
  format: 'fountain' | 'final_draft' | 'custom'
  scenes: ScreenplayScene[]
  dialogueBlocks: DialogueBlock[]
  sceneDescriptions: SceneDescription[]
}

export interface ScreenplayScene {
  id: string
  sceneNumber: number
  heading: string
  content: string
  characters: string[]
  setting: string
}

export interface DialogueBlock {
  id: string
  characterId: string
  text: string
  emotion?: string
  direction?: string
}

export interface SceneDescription {
  id: string
  sceneId: string
  visualDescription: string
  actionDescription: string
  mood: string
}

export interface Storyboard {
  id: string
  episodeId: string
  shots: ShotSpecification[]
  totalDuration: number
  transitionSpecs: TransitionSpecification[]
}

export interface ShotSpecification {
  shotId: string
  shotNumber: number
  duration: number
  cameraAngle: CameraAngle
  shotType: ShotType
  characters: CharacterInShot[]
  setting: Setting
  visualDescription: string
  aiPrompt: string
  emotionalBeat?: string
}

export type CameraAngle = 'high' | 'eye_level' | 'low' | 'birds_eye' | 'worms_eye' | 'dutch'
export type ShotType = 'extreme_wide' | 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'over_shoulder'

export interface CharacterInShot {
  characterId: string
  position: string
  expression: string
  action: string
  prominence: 'foreground' | 'midground' | 'background'
}

export interface Setting {
  location: string
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'
  weather?: string
  lighting: string
  atmosphere: string
}

export interface TransitionSpecification {
  id: string
  fromShotId: string
  toShotId: string
  transitionType: TransitionType
  duration: number
  description?: string
}

export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'pan'

export interface VideoSegment {
  id: string
  shotId: string
  filePath: string
  duration: number
  status: VideoStatus
  generatedDate: Date
  metadata?: VideoMetadata
}

export type VideoStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'needs_review'

export interface VideoMetadata {
  resolution: string
  frameRate: number
  codec: string
  fileSize: number
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

export interface Asset {
  id: string
  assetType: AssetType
  name: string
  description: string
  filePath: string
  metadata: AssetMetadata
  version: string
  isShared: boolean
  createdDate: Date
  tags: string[]
}

export type AssetType = 'character' | 'scene' | 'template' | 'style' | 'audio' | 'effect'

export interface AssetMetadata {
  fileSize: number
  format: string
  dimensions?: { width: number; height: number }
  duration?: number
  creator?: string
  project?: string
  [key: string]: any
}

export interface AssetVersion {
  id: string
  assetId: string
  versionNumber: string
  filePath: string
  changeDescription: string
  createdDate: Date
}

export interface SearchCriteria {
  query?: string
  assetType?: AssetType
  tags?: string[]
  project?: string
  dateRange?: { start: Date; end: Date }
  creator?: string
}

export interface ProcessingPipeline {
  id: string
  novelId: string
  status: PipelineStatus
  currentStage: PipelineStage
  configuration: PipelineConfiguration
  stages: ProcessingStage[]
  startedDate: Date
  completedDate?: Date
  progress: number // 0-100
}

export type PipelineStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type PipelineStage = 'parsing' | 'character_analysis' | 'plot_analysis' | 'episode_generation' | 
                           'script_conversion' | 'storyboard_creation' | 'video_generation' | 'post_processing'

export interface PipelineConfiguration {
  targetEpisodeDuration: number
  videoQuality: 'low' | 'medium' | 'high' | 'ultra'
  parallelProcessing: boolean
  autoRetry: boolean
  maxRetries: number
  customSettings: Record<string, any>
}

export interface ProcessingStage {
  id: string
  pipelineId: string
  stageName: PipelineStage
  status: StageStatus
  progress: number
  errorMessage?: string
  startedDate?: Date
  completedDate?: Date
  estimatedTimeRemaining?: number
}

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
  suggestion?: string
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  validator: (value: any) => ValidationResult
  isActive: boolean
}

export interface ImageReference {
  id: string
  filePath: string
  description: string
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
  }
}

export interface PlotStructure {
  id: string
  novelId: string
  mainPlotline: PlotPoint[]
  subplots: Subplot[]
  themes: string[]
  narrativeArc: NarrativeArc
}

export interface PlotPoint {
  id: string
  type: 'exposition' | 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution'
  description: string
  chapterIds: string[]
  importance: 'critical' | 'major' | 'minor'
  isImmutable: boolean
}

export interface Subplot {
  id: string
  name: string
  description: string
  plotPoints: PlotPoint[]
  relatedCharacters: string[]
}

export interface NarrativeArc {
  setup: PlotPoint[]
  confrontation: PlotPoint[]
  resolution: PlotPoint[]
}

// UI and Workflow specific interfaces
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  configuration: WorkflowConfiguration
}

export interface WorkflowNode {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  configuration: NodeConfig
  status: NodeStatus
}

export type NodeStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused'

export interface NodeConfig {
  [key: string]: any
}

export interface WorkflowConnection {
  id: string
  fromNodeId: string
  toNodeId: string
  condition?: string
}

export interface WorkflowConfiguration {
  autoStart: boolean
  parallelExecution: boolean
  errorHandling: 'stop' | 'continue' | 'retry'
  maxRetries: number
}

export interface VisualPipeline {
  id: string
  workflowId: string
  renderData: any
  layout: PipelineLayout
}

export interface PipelineLayout {
  nodes: NodeLayout[]
  connections: ConnectionLayout[]
}

export interface NodeLayout {
  nodeId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: NodeStyle
}

export interface ConnectionLayout {
  connectionId: string
  path: string
  style: ConnectionStyle
}

export interface NodeStyle {
  backgroundColor: string
  borderColor: string
  textColor: string
  borderWidth: number
}

export interface ConnectionStyle {
  strokeColor: string
  strokeWidth: number
  strokeDasharray?: string
}

export interface ProgressStatus {
  pipelineId: string
  overallProgress: number
  currentStage: string
  stageProgress: number
  estimatedTimeRemaining?: number
  message?: string
}

// Panel and UI Layout interfaces following Kiro's patterns
export interface PanelLayout {
  panels: Panel[]
  layout: LayoutConfiguration
}

export interface Panel {
  id: string
  title: string
  component: string
  position: PanelPosition
  size: PanelSize
  isVisible: boolean
  isDockable: boolean
  isResizable: boolean
}

export interface PanelPosition {
  x: number
  y: number
  dock?: 'left' | 'right' | 'top' | 'bottom' | 'center'
}

export interface PanelSize {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface LayoutConfiguration {
  theme: 'light' | 'dark'
  primaryColor: string
  secondaryColor: string
  spacing: number
}

export interface CommandPalette {
  isVisible: boolean
  commands: Command[]
  filteredCommands: Command[]
  searchQuery: string
}

export interface Command {
  id: string
  name: string
  description: string
  category: string
  shortcut?: string
  action: () => void
}

export interface NotificationMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}

// Error and Exception interfaces
export interface ProcessingError {
  code: string
  message: string
  stage: PipelineStage
  timestamp: Date
  details?: any
  isRecoverable: boolean
  suggestedActions: string[]
}

export interface ConsistencyReport {
  characterId: string
  violations: ConsistencyViolation[]
  score: number // 0-100
  recommendations: string[]
}

export interface ConsistencyViolation {
  type: 'visual' | 'behavioral' | 'dialogue'
  description: string
  severity: 'low' | 'medium' | 'high'
  affectedScenes: string[]
}

export interface IntegrityReport {
  plotStructureId: string
  violations: IntegrityViolation[]
  missingElements: string[]
  score: number // 0-100
}

export interface IntegrityViolation {
  type: 'missing_plot_point' | 'character_inconsistency' | 'timeline_error'
  description: string
  severity: 'low' | 'medium' | 'high'
  affectedEpisodes: string[]
}
// AI Generation Compatibility interfaces
export interface AIVideoGenerationData {
  projectId: string
  episodeId: string
  totalDuration: number
  shots: AIShotData[]
  transitions: AITransitionData[]
  metadata: AIMetadata
}

export interface AIShotData {
  id: string
  sequence: number
  duration: number
  camera: {
    angle: CameraAngle
    shotType: ShotType
    movement: string
  }
  scene: {
    location: string
    timeOfDay: string
    lighting: string
    atmosphere: string
    weather?: string
  }
  characters: Array<{
    id: string
    position: string
    prominence: string
    expression: string
    action: string
  }>
  prompts: {
    primary: string
    detailed: string
    negative: string
    style: string
  }
  technical: {
    aspectRatio: string
    resolution: string
    frameRate: number
    quality: string
  }
}

export interface AITransitionData {
  id: string
  fromShotId: string
  toShotId: string
  type: TransitionType
  duration: number
  description: string
  parameters: Record<string, any>
}

export interface AIMetadata {
  generatedAt: string
  version: string
  format: string
  compatibility: string[]
}

export interface AICompatibilityReport {
  isCompatible: boolean
  qualityScore: number
  issues: string[]
  warnings: string[]
  recommendations: string[]
  supportedPlatforms: string[]
  validatedAt: string
}

export interface PlatformSpecificData {
  platform: 'runwayml' | 'pika-labs' | 'stable-video' | 'gen-2'
  format: string
  data: Record<string, any>
}

// AI Video Generator interfaces
export interface AIVideoConfig {
  primaryService: string
  fallbackService?: string
  apiKeys?: {
    runwayml?: string
    pikalabs?: string
    stablevideo?: string
  }
  resolution: string
  outputFormat: string
  visualStyle: string
  maxRetries: number
  timeout: number
}

export interface VideoGenerationResult {
  success: boolean
  videoUrl?: string
  segments: VideoSegment[]
  metadata: VideoGenerationMetadata
  characterConsistency: CharacterConsistencyReport
  visualCoherence?: VisualCoherenceReport
  qualityMetrics?: QualityMetrics
  error?: string
  errorReport?: DetailedErrorReport
}

export interface VideoGenerationMetadata {
  duration: number
  resolution: string
  format: string
  generatedAt: string
  service: string
}

export interface CharacterConsistencyReport {
  score: number
  issues: string[]
}

export interface Shot {
  id: string
  visualDescription: string
  duration: number
  characters?: string[]
  cameraAngle?: string
  shotType?: string
}

export interface VideoSegment {
  id: string
  videoUrl: string
  duration: number
  startTime: number
  endTime: number
  prompt: string
  service: string
  characterAppearances: string[]
  qualityScore: number
}

// Visual Style Coherence System interfaces
export interface StyleFeatures {
  colorPalette: ColorPalette
  lightingStyle: LightingStyle
  artStyle: ArtStyle
  composition: Composition
  visualEffects: VisualEffects
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
}

export interface LightingStyle {
  type: string
  intensity: string
  direction: string
}

export interface ArtStyle {
  technique: string
  detail: string
  texture: string
}

export interface Composition {
  layout: string
  focus: string
  balance: string
}

export interface VisualEffects {
  effects: string[]
  intensity: string
}

export interface VisualCoherenceReport {
  overallScore: number
  issues: string[]
  recommendations: string[]
  segmentScores: number[]
}

export interface SegmentCompatibility {
  visualSimilarity: number
  colorCompatibility: number
  lightingCompatibility: number
  styleCompatibility: number
  overallCompatibility: number
}

export interface EnhancedTransition {
  id: string
  fromShotId: string
  toShotId: string
  transitionType: TransitionType
  duration: number
  description?: string
  compatibility: SegmentCompatibility
  smoothnessScore: number
  parameters: Record<string, any>
}

export interface CombinedVideoResult {
  videoUrl: string
  duration: number
  segments: VideoSegment[]
  transitions: EnhancedTransition[]
  coherenceReport: VisualCoherenceReport
  qualityMetrics: QualityMetrics
}

export interface QualityMetrics {
  visualConsistency: number
  transitionSmoothness: number
  overallQuality: number
}

// Comprehensive Error Handling and Reporting interfaces
export interface DetailedErrorReport {
  id: string
  timestamp: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  context: ErrorContext
  suggestions: string[]
  isRecoverable: boolean
  retryRecommended: boolean
  estimatedRecoveryTime: number // seconds, -1 for manual intervention
}

export type ErrorType = 
  | 'network'
  | 'api' 
  | 'rate_limit'
  | 'configuration'
  | 'validation'
  | 'processing'
  | 'resource'
  | 'quality'
  | 'unknown'

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ErrorContext {
  operation: string
  storyboard?: string
  service?: string
  retryCount: number
  fallbackUsed: boolean
  timestamp: string
  additionalData?: Record<string, any>
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  jitter: boolean
}

export interface ErrorStatistics {
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsByService: Record<string, number>
  averageRetryCount: number
  successRateAfterRetry: number
  mostCommonSuggestions: string[]
  lastUpdated: string
}

export class DetailedError extends Error {
  constructor(message: string, public errorReport: DetailedErrorReport) {
    super(message);
    this.name = 'DetailedError';
  }
}

// Visual Element Caching System interfaces
export interface VisualElementCache {
  id: string
  type: VisualElementType
  key: string
  data: CachedVisualElement
  metadata: CacheMetadata
  createdAt: string
  lastAccessed: string
  accessCount: number
  size: number // bytes
}

export type VisualElementType = 
  | 'character_design'
  | 'background_scene'
  | 'lighting_setup'
  | 'camera_angle'
  | 'visual_effect'
  | 'color_palette'
  | 'style_template'
  | 'transition_effect'

export interface CachedVisualElement {
  prompt: string
  generatedUrl?: string
  styleFeatures: StyleFeatures
  qualityScore: number
  generationParameters: GenerationParameters
  variations?: VisualVariation[]
}

export interface GenerationParameters {
  service: string
  resolution: string
  duration?: number
  seed?: number
  steps?: number
  guidance?: number
  model?: string
  additionalParams?: Record<string, any>
}

export interface VisualVariation {
  id: string
  url: string
  parameters: Partial<GenerationParameters>
  qualityScore: number
  description: string
}

export interface CacheMetadata {
  tags: string[]
  project?: string
  episode?: string
  character?: string
  scene?: string
  expiresAt?: string
  priority: CachePriority
  reusabilityScore: number // 0-1, how likely this element can be reused
}

export type CachePriority = 'low' | 'medium' | 'high' | 'critical'

export interface CacheConfiguration {
  maxSize: number // bytes
  maxEntries: number
  defaultTTL: number // seconds
  cleanupInterval: number // seconds
  compressionEnabled: boolean
  persistToDisk: boolean
  evictionPolicy: EvictionPolicy
}

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'priority'

export interface CacheStatistics {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  lastCleanup: string
  entriesByType: Record<VisualElementType, number>
  sizeByType: Record<VisualElementType, number>
  topReusedElements: CacheEntry[]
}

export interface CacheEntry {
  key: string
  type: VisualElementType
  accessCount: number
  lastAccessed: string
  size: number
}

export interface CacheQuery {
  type?: VisualElementType
  tags?: string[]
  project?: string
  episode?: string
  character?: string
  scene?: string
  minQualityScore?: number
  maxAge?: number // seconds
  similarityThreshold?: number // 0-1 for fuzzy matching
}

export interface CacheSearchResult {
  matches: VisualElementCache[]
  exactMatches: VisualElementCache[]
  similarMatches: Array<{
    cache: VisualElementCache
    similarity: number
  }>
  totalFound: number
}

export interface CacheOptimizationReport {
  currentSize: number
  maxSize: number
  utilizationRate: number
  fragmentationLevel: number
  recommendedActions: CacheOptimizationAction[]
  potentialSavings: number
  performanceImpact: PerformanceImpact
}

export interface CacheOptimizationAction {
  type: 'cleanup' | 'compress' | 'evict' | 'defragment' | 'expand'
  description: string
  estimatedSavings: number
  priority: 'low' | 'medium' | 'high'
  riskLevel: 'safe' | 'moderate' | 'risky'
}

export interface PerformanceImpact {
  cacheHitImprovement: number // percentage
  generationTimeReduction: number // seconds
  bandwidthSavings: number // bytes
  costSavings: number // estimated monetary savings
}