# Services Directory

This directory contains service classes for API communication and business logic.

## Structure

- `api/` - API service classes for backend communication
- `novel/` - Novel parsing and analysis services
- `character/` - Character system services
- `episode/` - Episode generation services
- `storyboard/` - Storyboard creation services
- `video/` - Video generation services
- `asset/` - Asset management services
- `workflow/` - Workflow orchestration services
- `validation/` - Data validation services

## Service Pattern

Each service should:
- Extend a base service class
- Handle API communication
- Provide error handling and retry logic
- Return typed responses
- Include proper logging