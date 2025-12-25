# Requirements Document

## Introduction

本文档定义了小说动漫生成器用户系统重构的需求。目标是将 `NovelAnimeUser` 表与 Moqui 框架的 `UserAccount` 表进行关联，去除冗余的认证字段，使 `NovelAnimeUser` 仅作为业务扩展表存储小说动漫场景特有的用户信息。

## Glossary

- **UserAccount**: Moqui 框架内置的用户账户实体，负责用户认证（用户名、密码、邮箱等）
- **NovelAnimeUser**: 小说动漫生成器的业务扩展用户实体，存储积分、头像等业务数据
- **Credits**: 用户积分，用于 AI 生成服务的消费
- **JWT**: JSON Web Token，用于前后端认证的令牌

## Requirements

### Requirement 1

**User Story:** As a system architect, I want NovelAnimeUser to reference UserAccount as the authentication source, so that user authentication is handled by Moqui's built-in system while business data remains separate.

#### Acceptance Criteria

1. WHEN the NovelAnimeUser entity is defined THEN the system SHALL include a relationship to moqui.security.UserAccount via userId field
2. WHEN NovelAnimeUser entity is modified THEN the system SHALL remove the email field (use UserAccount.emailAddress instead)
3. WHEN NovelAnimeUser entity is modified THEN the system SHALL remove the username field (use UserAccount.username instead)
4. WHEN NovelAnimeUser entity is modified THEN the system SHALL remove the passwordHash field (authentication handled by UserAccount)
5. WHEN NovelAnimeUser entity is modified THEN the system SHALL remove the authProvider field (OAuth handled separately)
6. WHEN NovelAnimeUser entity is modified THEN the system SHALL retain credits, avatarUrl, status, createdDate, and lastLoginDate fields

### Requirement 2

**User Story:** As a user, I want to log in using Moqui's authentication system, so that I can access the novel anime generator with a single unified account.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL authenticate against UserAccount using Moqui's built-in authentication
2. WHEN authentication succeeds THEN the system SHALL check if a corresponding NovelAnimeUser record exists
3. IF NovelAnimeUser record does not exist THEN the system SHALL create one with default credits (500) and link to UserAccount.userId
4. WHEN login completes THEN the system SHALL return combined user information from both UserAccount and NovelAnimeUser

### Requirement 3

**User Story:** As a frontend developer, I want the user profile API to return unified user information, so that the UI can display consistent user data.

#### Acceptance Criteria

1. WHEN the profile API is called THEN the system SHALL join UserAccount and NovelAnimeUser data
2. WHEN returning user profile THEN the system SHALL include username from UserAccount
3. WHEN returning user profile THEN the system SHALL include emailAddress from UserAccount
4. WHEN returning user profile THEN the system SHALL include credits from NovelAnimeUser
5. WHEN returning user profile THEN the system SHALL include avatarUrl from NovelAnimeUser
6. WHEN returning user profile THEN the system SHALL include status from NovelAnimeUser

### Requirement 4

**User Story:** As a user, I want the application header to display my actual account information, so that I can confirm I am logged in with the correct account.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL fetch current user information from the backend
2. WHEN user information is received THEN the system SHALL store it in a Pinia user store
3. WHEN displaying the header THEN the system SHALL read username and email from the user store (not hardcoded values)
4. WHEN user logs out THEN the system SHALL clear the user store

### Requirement 5

**User Story:** As a system administrator, I want OAuth accounts to remain linked to UserAccount, so that social login continues to work with the refactored system.

#### Acceptance Criteria

1. WHEN UserOAuthAccount entity is reviewed THEN the system SHALL maintain its relationship to NovelAnimeUser via userId
2. WHEN a user logs in via OAuth THEN the system SHALL first authenticate/create UserAccount, then link NovelAnimeUser
3. WHEN OAuth login succeeds THEN the system SHALL return the same unified user profile as regular login

### Requirement 6

**User Story:** As a user, I want to edit my profile information, so that I can keep my account details up to date.

#### Acceptance Criteria

1. WHEN a user updates their display name THEN the system SHALL update userFullName in UserAccount
2. WHEN a user updates their avatar THEN the system SHALL update avatarUrl in NovelAnimeUser
3. WHEN profile update succeeds THEN the system SHALL return the updated combined user profile
4. WHEN profile update fails THEN the system SHALL return an appropriate error message without modifying any data

### Requirement 7

**User Story:** As a user, I want to change my password securely, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN a user changes password THEN the system SHALL verify the current password first
2. WHEN current password is incorrect THEN the system SHALL reject the change and return an error
3. WHEN new password is valid THEN the system SHALL update currentPassword in UserAccount using Moqui's password hashing
4. WHEN password change succeeds THEN the system SHALL return a success confirmation

### Requirement 8

**User Story:** As a user, I want a profile editing interface in the frontend, so that I can easily update my information.

#### Acceptance Criteria

1. WHEN user clicks profile menu THEN the system SHALL display a profile editing dialog or page
2. WHEN editing profile THEN the system SHALL show current values as defaults in the form
3. WHEN user submits profile changes THEN the system SHALL call the update profile API and refresh the user store
4. WHEN user submits password change THEN the system SHALL call the change password API with current and new passwords
