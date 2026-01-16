<template>
  <div class="timeline-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">时间轴面板</q-toolbar-title>
        <q-btn flat round dense icon="play_arrow" @click="playTimeline" />
        <q-btn flat round dense icon="stop" @click="stopTimeline" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div v-if="timelineData" class="timeline-content">
        <div class="timeline-ruler">
          <div class="time-markers">
            <div
              v-for="marker in timeMarkers"
              :key="marker.time"
              class="time-marker"
              :style="{ left: marker.position + '%' }"
            >
              {{ marker.label }}
            </div>
          </div>
        </div>

        <div class="timeline-tracks">
          <div
            v-for="track in timelineData.tracks"
            :key="track.id"
            class="timeline-track"
          >
            <div class="track-header">
              <q-icon :name="track.icon" />
              <span class="track-name">{{ track.name }}</span>
            </div>
            <div class="track-content">
              <div
                v-for="clip in track.clips"
                :key="clip.id"
                class="timeline-clip"
                :style="{
                  left: (clip.startTime / timelineData.duration) * 100 + '%',
                  width: ((clip.endTime - clip.startTime) / timelineData.duration) * 100 + '%'
                }"
                :class="{ selected: selectedClip?.id === clip.id }"
                @click="selectClip(clip)"
              >
                <div class="clip-content">
                  <div class="clip-name">{{ clip.name }}</div>
                  <div class="clip-duration">{{ formatTime(clip.endTime - clip.startTime) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="timeline-controls">
          <div class="playhead" :style="{ left: playheadPosition + '%' }"></div>
        </div>
      </div>
      
      <div v-else class="no-timeline">
        <q-icon name="timeline" size="48px" color="grey-5" />
        <div class="text-grey-6">暂无时间轴数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
}

interface TimelineTrack {
  id: string;
  name: string;
  icon: string;
  clips: TimelineClip[];
}

interface TimelineData {
  duration: number;
  tracks: TimelineTrack[];
}

interface Props {
  timelineData?: TimelineData;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'timeline-changed': [timeline: TimelineData];
}>();

// State
const selectedClip = ref<TimelineClip | null>(null);
const playheadPosition = ref(0);
const isPlaying = ref(false);

// Computed
const timeMarkers = computed(() => {
  if (!props.timelineData) return [];
  
  const markers = [];
  const duration = props.timelineData.duration;
  const markerCount = 10;
  
  for (let i = 0; i <= markerCount; i++) {
    const time = (duration / markerCount) * i;
    markers.push({
      time,
      position: (time / duration) * 100,
      label: formatTime(time)
    });
  }
  
  return markers;
});

// Methods
const playTimeline = () => {
  isPlaying.value = true;
  console.log('播放时间轴');
};

const stopTimeline = () => {
  isPlaying.value = false;
  playheadPosition.value = 0;
  console.log('停止时间轴');
};

const selectClip = (clip: TimelineClip) => {
  selectedClip.value = clip;
  console.log('选择片段:', clip.name);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Lifecycle
onMounted(() => {
  // 时间轴数据应该通过 props 传入
  // 如果没有数据，显示空状态提示用户
  if (!props.timelineData) {
    console.log('时间轴面板：等待数据传入');
  }
});
</script>

<style scoped>
.timeline-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: auto;
}

.timeline-content {
  height: 100%;
  position: relative;
}

.timeline-ruler {
  height: 30px;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
  position: relative;
}

.time-markers {
  position: relative;
  height: 100%;
}

.time-marker {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 1px solid #ccc;
  padding-left: 4px;
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
}

.timeline-tracks {
  flex: 1;
}

.timeline-track {
  height: 60px;
  border-bottom: 1px solid #eee;
  display: flex;
}

.track-header {
  width: 120px;
  background: #f8f8f8;
  border-right: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  font-size: 13px;
}

.track-content {
  flex: 1;
  position: relative;
  background: #fafafa;
}

.timeline-clip {
  position: absolute;
  top: 8px;
  height: 44px;
  background: #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.timeline-clip:hover {
  background: #45a049;
}

.timeline-clip.selected {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
}

.clip-content {
  padding: 4px 8px;
  color: white;
  font-size: 11px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.clip-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clip-duration {
  opacity: 0.8;
  margin-top: 2px;
}

.timeline-controls {
  position: absolute;
  top: 0;
  left: 120px;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: #f44336;
  z-index: 10;
  transition: left 0.1s;
}

.playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -4px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 8px solid #f44336;
}

.no-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}
</style>