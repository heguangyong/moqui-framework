# Implementation Plan: Fix Image Generation Workflow

## Overview

This implementation plan addresses two configuration issues: updating the workflow execution service to call the correct image generation endpoint (Pollinations AI) and updating the frontend settings interface to display the correct provider information. Both changes are minimal, surgical updates to existing files.

## Tasks

- [x] 1. Update workflow execution service endpoint
  - [x] 1.1 Locate the image generation service call in NovelAnimeWorkflowExecutionServices.xml
    - Find the `<service-call>` element that references `McpImageGenerationServices.generate#Image`
    - Verify the current parameter mapping (in-map, out-map)
    - _Requirements: 1.1_
  
  - [x] 1.2 Replace service endpoint with multi-provider service
    - Change service name from `McpImageGenerationServices.generate#Image` to `McpMultiProviderImageServices.generate#ImageMultiProvider`
    - Ensure parameter mapping remains unchanged (imageGenParams → imageResult)
    - Add provider="pollinations" to the input parameters if not already defaulted
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.3 Write integration test for workflow service call
    - **Test Scenario 1: Workflow Service Endpoint Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - Test that workflow execution calls the correct service endpoint
    - Test that correct parameters are passed (including provider="pollinations")
    - Test that imageUrl is stored in workflow context after generation
    - Test that old Zhipu AI service is not called

- [x] 2. Update frontend settings interface
  - [x] 2.1 Update provider options in Settings.vue
    - Locate the image provider selection dropdown in Settings.vue
    - Replace "智谱AI (GLM-4)" option with "Pollinations AI (免费)"
    - Update the value attribute to "pollinations"
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Update default provider value
    - Change default value of `settings.imageProvider` to "pollinations"
    - Remove or hide API key input field for Pollinations provider
    - Add help text indicating no API key is required
    - _Requirements: 2.3_
  
  - [ ]* 2.3 Write component test for Settings UI
    - **Test Scenario 2: Settings UI Provider Display**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Test that component displays "Pollinations AI (免费)" option
    - Test that "智谱AI (GLM-4)" is not displayed
    - Test that help text indicates no API key required
    - Test that default value is "pollinations"

- [ ] 3. Checkpoint - Verify configuration changes
  - Ensure both files are updated correctly
  - Review changes for syntax errors
  - Ask the user if questions arise

- [ ] 4. Test backward compatibility
  - [ ] 4.1 Verify existing workflows execute without errors
    - Load a pre-existing workflow definition
    - Execute the workflow and verify it completes successfully
    - Check logs for any errors or warnings
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 4.2 Write backward compatibility test
    - **Test Scenario 3: Backward Compatibility**
    - **Validates: Requirements 3.1, 3.2**
    - Test that existing workflow definitions load and execute
    - Test that input/output interface remains unchanged
    - Test graceful handling if old service name is referenced

- [ ] 5. End-to-end verification
  - [ ] 5.1 Test complete workflow execution
    - Import a test novel with multiple scenes
    - Execute the workflow
    - Verify images are generated for each scene
    - Verify images are displayed in project view
    - Check logs for successful generation events
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 5.2 Test error handling
    - Simulate image generation failure (e.g., network error)
    - Verify clear error message is displayed
    - Verify workflow handles failure gracefully
    - _Requirements: 4.4_
  
  - [ ]* 5.3 Write end-to-end integration tests
    - **Test Scenario 4: End-to-End Image Generation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test complete flow from novel import to image display
    - Test that N scenes generate N images
    - Test that success events are logged
    - **Test Scenario 5: Error Handling**
    - **Validates: Requirements 4.4**
    - Test various failure scenarios
    - Test error message clarity and specificity

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Run all integration and component tests
  - Verify no regressions in existing functionality
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The changes are minimal (2 files, ~10 lines total)
- Focus on surgical updates to existing configuration
- Leverage existing Multi_Provider_Service from Spec 09-01
- Test scenarios validate configuration correctness rather than algorithmic properties
