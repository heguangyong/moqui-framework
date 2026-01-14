# Implementation Plan

- [x] 1. Modify NovelAnimeUser entity definition
  - [x] 1.1 Remove redundant fields from NovelAnimeUser entity
    - Remove email, username, passwordHash, authProvider fields
    - Remove NAU_EMAIL_IDX index (no longer needed)
    - Add relationship to moqui.security.UserAccount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ]* 1.2 Write property test for entity structure
    - **Property 1: Auto-creation of NovelAnimeUser**
    - **Validates: Requirements 2.3**

- [x] 2. Update authentication services to use Moqui auth
  - [x] 2.1 Modify login service to use Moqui authentication
    - Replace custom password verification with ec.user.loginUser()
    - Add auto-creation logic for NovelAnimeUser after successful auth
    - Update lastLoginDate on login
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Modify profile service to join UserAccount and NovelAnimeUser
    - Fetch username, emailAddress, userFullName from UserAccount
    - Fetch credits, avatarUrl, status from NovelAnimeUser
    - Return combined user profile
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 2.3 Write property test for profile data consistency
    - **Property 2: Profile data consistency**
    - **Validates: Requirements 3.2, 3.3**

- [x] 3. Update OAuth services to work with new structure
  - [x] 3.1 Modify OAuth login flow
    - Ensure UserAccount is created/linked first
    - Then create/link NovelAnimeUser
    - Return unified profile response
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Checkpoint - Backend changes complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create frontend user store
  - [x] 5.1 Create userStore (Pinia)
    - Define state: userId, username, email, fullName, credits, avatarUrl, status, isLoggedIn
    - Implement fetchProfile action
    - Implement login action
    - Implement logout action
    - Add localStorage persistence for session
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ]* 5.2 Write property test for user store synchronization
    - **Property 3: User store synchronization**
    - **Validates: Requirements 4.2**

- [x] 6. Update frontend components to use userStore
  - [x] 6.1 Modify App.vue to use userStore
    - Import and use userStore
    - Pass user data from store to ContextPanel
    - Fetch user profile on app mount (if logged in)
    - _Requirements: 4.1, 4.3_
  - [x] 6.2 Modify ContextPanel to display dynamic user data
    - Remove hardcoded user-name and user-email props
    - Display data from userStore
    - _Requirements: 4.3_
  - [x] 6.3 Update login page to use userStore
    - Call userStore.login() on form submit
    - Navigate to dashboard on success
    - _Requirements: 4.1, 4.2_

- [x] 7. Update existing services that reference old NovelAnimeUser fields
  - [x] 7.1 Update NovelAnimeRestServices.xml
    - Remove references to email, username, passwordHash fields
    - Update user creation logic to not set removed fields
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 7.2 Update NovelAnimeAuthServices.xml
    - Remove custom password hashing logic
    - Use Moqui authentication instead
    - Update user lookup to use UserAccount
    - _Requirements: 2.1, 2.2_
  - [x] 7.3 Update NovelAnimeCreditsServices.xml
    - Update user lookup to handle new structure
    - Ensure credits operations still work
    - _Requirements: 3.4_

- [x] 8. Final Checkpoint - All changes complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add user profile update service
  - [x] 9.1 Create update#UserProfile service
    - Accept fullName and avatarUrl parameters
    - Update UserAccount.userFullName if fullName provided
    - Update NovelAnimeUser.avatarUrl if avatarUrl provided
    - Return updated combined user profile
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 9.2 Write property test for profile update consistency
    - **Property 4: Profile update consistency**
    - **Validates: Requirements 6.3**

- [x] 10. Add password change service
  - [x] 10.1 Create change#Password service
    - Verify current password using Moqui's password verification
    - Reject if current password is incorrect
    - Hash new password using Moqui's password hashing
    - Update UserAccount.currentPassword and passwordSetDate
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 10.2 Write property test for password change security
    - **Property 5: Password change security**
    - **Validates: Requirements 7.1, 7.2**

- [x] 11. Add REST API endpoints for profile management
  - [x] 11.1 Add PUT /auth/profile endpoint
    - Map to update#UserProfile service
    - Require JWT authentication
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 11.2 Add POST /auth/change-password endpoint
    - Map to change#Password service
    - Require JWT authentication
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Update frontend userStore with profile editing actions
  - [x] 12.1 Add updateProfile action to userStore
    - Call PUT /auth/profile API
    - Update local state on success
    - _Requirements: 8.3_
  - [x] 12.2 Add changePassword action to userStore
    - Call POST /auth/change-password API
    - Return success/error status
    - _Requirements: 8.4_

- [x] 13. Create profile editing UI components
  - [x] 13.1 Create ProfileEditDialog component
    - Display current user info as defaults
    - Allow editing fullName and avatarUrl
    - Submit changes via userStore.updateProfile()
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 13.2 Create ChangePasswordDialog component
    - Input fields for current and new password
    - Submit via userStore.changePassword()
    - Show success/error feedback
    - _Requirements: 8.4_
  - [x] 13.3 Integrate dialogs into ContextPanel user menu
    - Add "编辑资料" menu item to open ProfileEditDialog
    - Add "修改密码" menu item to open ChangePasswordDialog
    - _Requirements: 8.1_

- [x] 14. Final Checkpoint - User editing complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Fix login flow and user menu
  - [x] 15.1 Change login form to use username instead of email
    - Changed label from "邮箱" to "用户名 / 邮箱"
    - Changed form field from `email` to `username`
    - Updated userStore.login() to accept usernameOrEmail
    - Updated authApi LoginRequest interface
  - [x] 15.2 Remove "系统设置" from user menu
    - User menu now only has: 编辑资料, 修改密码, 积分记录, 退出登录

- [x] 16. Improve avatar upload experience
  - [x] 16.1 Add avatar upload backend service
    - Created upload#Avatar service in NovelAnimeAuthServices.xml
    - Accepts base64 image data, saves to dbresource
    - Updates NovelAnimeUser.avatarUrl automatically
    - Added POST /auth/avatar REST endpoint
  - [x] 16.2 Add avatar upload frontend support
    - Added uploadAvatar method to authApi.ts
    - Added uploadAvatar action to userStore
  - [x] 16.3 Update ProfileEditDialog for image upload
    - Changed from URL input to click/drag-drop image upload
    - Added file type validation (PNG, JPG, GIF, WebP)
    - Added file size validation (max 2MB)
    - Added image preview before save
