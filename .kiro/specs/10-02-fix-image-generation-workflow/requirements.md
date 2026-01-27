# Requirements Document

## Introduction

This specification addresses two critical issues preventing the Novel-to-Anime workflow from generating images and videos correctly. The system currently references outdated service endpoints and displays incorrect provider information in the frontend configuration interface.

## Glossary

- **Workflow_Execution_Service**: The backend service responsible for orchestrating the novel-to-anime conversion workflow
- **Image_Generation_Node**: The workflow step that generates images from scene descriptions
- **Multi_Provider_Service**: The new service interface that supports multiple AI image generation providers
- **Pollinations_AI**: A free AI image generation service that requires no API key
- **Settings_Interface**: The frontend configuration panel where users manage AI service settings
- **Zhipu_AI**: The legacy AI service provider (GLM-4) that is no longer used

## Requirements

### Requirement 1: Update Workflow Image Generation

**User Story:** As a user, I want the workflow execution to generate images using the current Pollinations AI service, so that I can see visual outputs when converting novels to anime.

#### Acceptance Criteria

1. WHEN the workflow executes an image generation node, THE Workflow_Execution_Service SHALL call the Multi_Provider_Service endpoint
2. WHEN the Multi_Provider_Service is invoked, THE Workflow_Execution_Service SHALL pass the correct parameters for Pollinations AI
3. WHEN the image generation completes, THE Workflow_Execution_Service SHALL store the generated image URL in the workflow context
4. THE Workflow_Execution_Service SHALL NOT call the legacy Zhipu_AI service endpoint

### Requirement 2: Update Frontend Provider Display

**User Story:** As a user, I want the settings interface to display the correct AI provider information, so that I understand which service is being used.

#### Acceptance Criteria

1. WHEN the settings interface loads, THE Settings_Interface SHALL display "Pollinations AI (免费)" as the image generation provider
2. THE Settings_Interface SHALL NOT display "智谱AI (GLM-4)" as an available option
3. WHEN displaying provider information, THE Settings_Interface SHALL indicate that no API key is required for Pollinations AI
4. THE Settings_Interface SHALL reflect the actual service configuration used by the backend

### Requirement 3: Maintain Backward Compatibility

**User Story:** As a developer, I want the changes to maintain compatibility with existing workflow definitions, so that previously created projects continue to work.

#### Acceptance Criteria

1. WHEN existing workflow definitions are loaded, THE Workflow_Execution_Service SHALL execute them without errors
2. WHEN the service endpoint is updated, THE Workflow_Execution_Service SHALL maintain the same input/output interface
3. IF a workflow references the old service name, THEN THE Workflow_Execution_Service SHALL handle it gracefully with appropriate logging

### Requirement 4: Verify End-to-End Image Generation

**User Story:** As a user, I want to verify that images are actually generated when I run the workflow, so that I can confirm the fix is working.

#### Acceptance Criteria

1. WHEN a user imports a novel and executes the workflow, THE system SHALL generate at least one image per scene
2. WHEN images are generated, THE system SHALL display them in the project view
3. WHEN the workflow completes, THE system SHALL log successful image generation events
4. IF image generation fails, THEN THE system SHALL provide clear error messages indicating the failure reason
