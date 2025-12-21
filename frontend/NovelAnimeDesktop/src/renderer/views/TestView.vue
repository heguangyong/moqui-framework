<template>
  <div class="test-view">
    <div class="test-header">
      <h1>组件测试页面</h1>
      <p>测试新开发的小说处理组件</p>
    </div>

    <div class="test-sections">
      <!-- 小说导入组件测试 -->
      <section class="test-section">
        <h2>小说导入组件</h2>
        <div class="component-container">
          <NovelImporter 
            projectId="test-project-123"
            @cancel="handleCancel"
            @success="handleImportSuccess"
            @error="handleImportError"
          />
        </div>
      </section>

      <!-- 流水线状态组件测试 -->
      <section class="test-section">
        <h2>流水线状态组件</h2>
        <div class="component-container">
          <PipelineStatus 
            novelId="test-novel-123"
            @stageComplete="handleStageComplete"
            @pipelineComplete="handlePipelineComplete"
            @pipelineError="handlePipelineError"
            @viewResults="handleViewResults"
          />
        </div>
      </section>

      <!-- 角色画廊组件测试 -->
      <section class="test-section">
        <h2>角色画廊组件</h2>
        <div class="component-container">
          <CharacterGallery 
            novelId="test-novel-123"
            @characterSelected="handleCharacterSelected"
            @characterUpdated="handleCharacterUpdated"
            @characterDeleted="handleCharacterDeleted"
          />
        </div>
      </section>

      <!-- 场景编辑器组件测试 -->
      <section class="test-section">
        <h2>场景编辑器组件</h2>
        <div class="component-container">
          <SceneEditor 
            novelId="test-novel-123"
            @sceneSelected="handleSceneSelected"
            @sceneUpdated="handleSceneUpdated"
            @sceneApproved="handleSceneApproved"
          />
        </div>
      </section>

      <!-- 集数管理组件测试 -->
      <section class="test-section">
        <h2>集数管理组件</h2>
        <div class="component-container">
          <EpisodeManager 
            novelId="test-novel-123"
            @episodeSelected="handleEpisodeSelected"
            @episodeUpdated="handleEpisodeUpdated"
            @episodeDeleted="handleEpisodeDeleted"
          />
        </div>
      </section>
    </div>

    <!-- 事件日志 -->
    <div class="event-log">
      <h3>事件日志</h3>
      <div class="log-container">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="log-entry"
          :class="`log-${event.type}`"
        >
          <span class="log-time">{{ event.time }}</span>
          <span class="log-event">{{ event.event }}</span>
          <span class="log-data">{{ event.data }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NovelImporter from '../components/novel/NovelImporter.vue'
import PipelineStatus from '../components/pipeline/PipelineStatus.vue'
import CharacterGallery from '../components/character/CharacterGallery.vue'
import SceneEditor from '../components/scene/SceneEditor.vue'
import EpisodeManager from '../components/episode/EpisodeManager.vue'

// 事件日志
const eventLog = ref<Array<{
  time: string
  event: string
  data: string
  type: 'info' | 'success' | 'error'
}>>([])

// 添加日志条目
const addLogEntry = (event: string, data: any, type: 'info' | 'success' | 'error' = 'info') => {
  eventLog.value.unshift({
    time: new Date().toLocaleTimeString(),
    event,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data),
    type
  })
  
  // 限制日志条目数量
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

// 小说导入事件处理
const handleCancel = () => {
  addLogEntry('NovelImporter: Cancel', 'User cancelled import', 'info')
}

const handleImportSuccess = (result: any) => {
  addLogEntry('NovelImporter: Success', result, 'success')
}

const handleImportError = (error: string) => {
  addLogEntry('NovelImporter: Error', error, 'error')
}

// 流水线事件处理
const handleStageComplete = (stageName: string, results: any) => {
  addLogEntry('PipelineStatus: Stage Complete', { stageName, results }, 'success')
}

const handlePipelineComplete = (results: any) => {
  addLogEntry('PipelineStatus: Pipeline Complete', results, 'success')
}

const handlePipelineError = (error: string) => {
  addLogEntry('PipelineStatus: Pipeline Error', error, 'error')
}

const handleViewResults = (stageName?: string) => {
  addLogEntry('PipelineStatus: View Results', { stageName }, 'info')
}

// 角色画廊事件处理
const handleCharacterSelected = (character: any) => {
  addLogEntry('CharacterGallery: Character Selected', character, 'info')
}

const handleCharacterUpdated = (character: any) => {
  addLogEntry('CharacterGallery: Character Updated', character, 'success')
}

const handleCharacterDeleted = (characterId: string) => {
  addLogEntry('CharacterGallery: Character Deleted', { characterId }, 'info')
}

// 场景编辑器事件处理
const handleSceneSelected = (scene: any) => {
  addLogEntry('SceneEditor: Scene Selected', scene, 'info')
}

const handleSceneUpdated = (scene: any) => {
  addLogEntry('SceneEditor: Scene Updated', scene, 'success')
}

const handleSceneApproved = (scene: any) => {
  addLogEntry('SceneEditor: Scene Approved', scene, 'success')
}

// 集数管理器事件处理
const handleEpisodeSelected = (episode: any) => {
  addLogEntry('EpisodeManager: Episode Selected', episode, 'info')
}

const handleEpisodeUpdated = (episode: any) => {
  addLogEntry('EpisodeManager: Episode Updated', episode, 'success')
}

const handleEpisodeDeleted = (episodeId: string) => {
  addLogEntry('EpisodeManager: Episode Deleted', { episodeId }, 'info')
}

// 初始化日志
addLogEntry('TestView: Initialized', 'Component test page loaded', 'info')
</script>

<style scoped>
.test-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
}

.test-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section h2 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

.component-container {
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
}

.event-log {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-log h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  background: #fafbfc;
}

.log-entry {
  display: grid;
  grid-template-columns: 80px 200px 1fr;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #ecf0f1;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  align-items: start;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-info {
  background: #f8f9fa;
}

.log-success {
  background: #d4edda;
}

.log-error {
  background: #f8d7da;
}

.log-time {
  color: #6c757d;
  font-weight: 500;
}

.log-event {
  color: #495057;
  font-weight: 600;
}

.log-data {
  color: #6c757d;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-view {
    padding: 16px;
  }
  
  .log-entry {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .log-time::after {
    content: ' - ';
  }
}
</style>