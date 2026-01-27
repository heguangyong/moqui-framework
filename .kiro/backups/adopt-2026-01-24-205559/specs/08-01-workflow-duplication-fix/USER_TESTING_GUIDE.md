# User Testing Guide

**Date**: 2026-01-22

---

## Fixed Issues

### ✅ Issue 1: Workflow 404 Error
**Status**: Enhanced logging added, awaiting user testing

**What was done**:
- Added detailed error logging in API calls
- Improved error interceptor to distinguish 401 vs 404
- Enhanced workflow selection logging

**How to test**:
1. Create a new project and workflow
2. Click the workflow in the middle panel
3. Check console logs for any errors
4. Verify you're not redirected to login page

**See**: `FIX_WORKFLOW_404.md` for details

---

### ✅ Issue 2: Delete Project Dialog
**Status**: Fixed - Ready for testing

**What was done**:
- Added complete CSS styles for confirmation dialog
- Fixed button spacing (12px gap)
- Added proper modal overlay and animations
- **Added backend API call to actually delete from server**
- **Updated store to call backend first, then local deletion**

**How to test**:
1. Go to "全部项目" (All Projects) view
2. Hover over a project card
3. Click the delete button (trash icon)
4. **Verify**:
   - [ ] Dialog appears centered on screen
   - [ ] Dialog has white background with shadow
   - [ ] "取消" and "删除" buttons are properly spaced
   - [ ] Clicking "取消" closes dialog without deleting
   - [ ] Clicking "删除" deletes the project
   - [ ] Clicking outside dialog (dark overlay) closes it
   - [ ] Project list refreshes after deletion
   - [ ] **Check console for "✅ Backend delete successful" message**
   - [ ] **Refresh page and verify project is still deleted (not reappearing)**

**See**: `FIX_DELETE_DIALOG.md` for technical details

---

## How to Start Testing

### Option 1: If dev server is already running
Just refresh the page in your browser

### Option 2: If dev server is not running
```bash
cd frontend/NovelAnimeDesktop
npm run dev
```

Then open http://localhost:5174/ in your browser

---

## What to Report

If you encounter any issues, please provide:

1. **What you did** (step by step)
2. **What you expected** to happen
3. **What actually happened**
4. **Console logs** (open DevTools with F12, check Console tab)
5. **Screenshots** (if applicable)

---

## Next Steps

After testing:
- If issues are fixed: Mark tasks as complete
- If issues persist: Provide feedback for further investigation
- If new issues found: Report them for analysis

---

**Files Modified**:
- `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue` (delete dialog CSS)
- `frontend/NovelAnimeDesktop/src/renderer/services/api.ts` (added deleteProject API method)
- `frontend/NovelAnimeDesktop/src/renderer/stores/project.js` (updated to call backend API)
- `frontend/NovelAnimeDesktop/src/renderer/services/api.ts` (workflow 404 logging)
- `frontend/NovelAnimeDesktop/src/renderer/stores/workflowStore.ts` (workflow selection logging)
