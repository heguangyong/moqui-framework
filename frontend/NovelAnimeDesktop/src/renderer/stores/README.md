# Stores Directory

This directory contains Pinia stores for state management.

## Structure

- `novel.ts` - Novel data and parsing state
- `character.ts` - Character system state
- `episode.ts` - Episode generation state
- `storyboard.ts` - Storyboard creation state
- `video.ts` - Video generation state
- `asset.ts` - Asset library state
- `workflow.ts` - Workflow and pipeline state
- `ui.ts` - UI state (panels, notifications, etc.)
- `auth.ts` - Authentication state
- `user.ts` - User profile state (combines UserAccount and NovelAnimeUser data)

## Store Pattern

Each store should:
- Use Pinia composition API
- Include proper TypeScript typing
- Provide actions for state mutations
- Include getters for computed values
- Handle async operations properly