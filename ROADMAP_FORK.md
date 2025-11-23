# Roadmap Fork - Project Documentation

## Vision & Goal

Transform Aiba from an AI-powered conversational work item creator into a **streamlined roadmap and workflow management tool** that directly integrates with Azure DevOps for portfolio planning and prioritization.

### Key Objectives
- **Remove AI chatbot dependency** - Eliminate conversational UI in favor of direct ADO integration
- **Focus on visualization** - Emphasize timeline-based roadmap view showing feature schedules
- **Enable prioritization** - Allow drag-and-drop reordering that syncs with ADO Priority field
- **Simplify interaction** - Click items to open directly in ADO instead of preview panels

---

## What We Changed

### 1. Removed AI/Chatbot Features

#### Frontend Deletions
- **Pages:**
  - `ChatPage.jsx` - Conversational work item creation
  - `StatusUpdatePage.jsx` - AI-powered status report generation

- **Components:**
  - `ProgressTracker.jsx` - Chat conversation progress indicator
  - `Message.jsx` - Chat message bubble component
  - `DuplicateAlert.jsx` - AI-powered duplicate detection alerts
  - `WorkItemPreview.jsx` - Work item preview in chat
  - `StatusPreviewPanel.jsx` - Status update preview panel
  - `FeatureDetailsPanel.jsx` - Feature detail modal/panel

- **Stores:**
  - `chatStore.js` - Chat conversation state management
  - `statusStore.js` - Status update conversation state

- **Routes:**
  - Removed `/chat/:conversationId?` route
  - Removed `/status` route

#### Backend Deletions
- **Services:**
  - `aiService.js` - Claude AI integration for work item extraction
  - `conversationService.js` - Chat conversation persistence
  - `historyService.js` - Work item creation history
  - `statusAiService.js` - AI-powered status updates
  - `statusConversationService.js` - Status conversation management

- **Routes:**
  - `chat.js` - Chat conversation endpoints
  - `conversations.js` - Conversation CRUD operations
  - `history.js` - Work item history endpoints
  - `status.js` - Status update endpoints

- **Utilities:**
  - `statusAdoHelper.js` - Status update ADO integration

#### Database Schema Changes
- **Removed Tables:**
  - `conversations` - Chat sessions for work items
  - `messages` - Chat messages within conversations
  - `created_history` - Recently created work item history
  - `status_conversations` - Status update chat sessions
  - `status_messages` - Status conversation messages
  - `status_updates` - Generated status reports
  - `status_templates` - Status update templates

- **Kept Tables:**
  - `settings` - ADO and configuration (cleaned up AI fields)
  - `field_mappings` - Work item field mappings
  - `work_items_cache` - Cached ADO work items for performance

### 2. Updated Landing Page
- **Changed:** Title from "Greetings" to "Aiba"
- **Changed:** Tagline to "Manage your Azure DevOps roadmap and workflow"
- **Removed:** "Start New Conversation" button
- **Removed:** Recently created items display (no longer tracked)
- **Kept:** Navigation to Backlog, Stage Gate, Roadmap, and Settings

---

## What We Built/Enhanced

### 1. Roadmap Page Enhancements
✅ **Timeline View** (already existed)
- Horizontal timeline spanning 12 months (6 before, 6 after today)
- Features displayed as bars based on Start Date and Target Date fields
- Grouped by parent Epic with swimlanes
- Orphaned features (no parent) shown in separate section
- Unscheduled features (no dates) shown below timeline

✅ **Direct ADO Navigation**
- **Changed:** Click feature → Opens ADO work item in new tab
- **Removed:** Modal detail panel
- **Format:** `{org_url}/{project}/_workitems/edit/{id}`

### 2. Stage Gate Page Enhancements
✅ **Collapsible Sections**
- **Intake** column is collapsible (click header to toggle)
- **Complete** column is collapsible (click header to toggle)
- Visual indicator (chevron icon) shows collapse state
- Other columns (Discovery, Development, Testing) remain static

✅ **Drag-and-Drop Prioritization**
- **Enabled in:** Intake column only
- **Functionality:** Drag features up/down to reorder
- **Backend Sync:** Updates `Microsoft.VSTS.Common.Priority` field in ADO
- **Priority Assignment:** Top = 1, second = 2, etc.
- **Auto-refresh:** Reloads data after priority update to sync with ADO

✅ **Direct ADO Navigation**
- **Changed:** Click feature → Opens ADO work item in new tab
- **Removed:** Feature details side panel
- **Format:** `{org_url}/{project}/_workitems/edit/{id}`

### 3. Feature Detail Page (Stakeholder Communication Layer)
🚧 **IN PROGRESS** - Beautiful feature landing page for stakeholder communication

**The Problem:**
- Stakeholders ask "where is this feature?" and "why are we building it?"
- Current solution: Direct link to ADO (technical, not stakeholder-friendly)
- Missing: The storytelling layer that answers "why" and "what's the status"

**The Solution:**
- New route: `/feature/:id` - Shareable, bookmarkable feature page
- Pulls from `System.Description` field in ADO (PO controls content)
- Beautiful, readable HTML rendering of feature description
- Metadata sidebar: status, dates, owner, parent epic, child items
- Action buttons: View in ADO, View Wiki (if exists), Share URL
- Updates all click handlers across Roadmap, Stage Gate, and Backlog

**Implementation:**
- ✅ Component: `FeatureDetailPage.jsx` - Main feature page layout
- ✅ Route: Add `/feature/:id` to React Router
- ✅ API: `GET /api/ado/work-items/:id` - Fetch full work item with description
- ✅ API: `GET /api/ado/feature/:id/wiki` - Check if wiki page exists
- ✅ Click Handlers: Update all views to navigate to feature page instead of ADO
- ✅ HTML Rendering: Safely render ADO description HTML with sanitization
- ✅ Styling: Match current design system (dark sidebar, clean cards, professional)

**User Flow:**
```
Click Feature (Roadmap/Stage Gate/Backlog)
  ↓
Beautiful Feature Page (/feature/12345)
  ↓
Links to: ADO Work Item, Wiki Page (if exists)
```

**Benefits:**
- POs control messaging via ADO Description field (no new fields needed)
- Stakeholders get readable, shareable view of feature rationale
- Links are bookmarkable/shareable in Slack/email
- Wiki integration still available for deep documentation

### 4. Technical Improvements
✅ **New Backend Endpoint**
- `POST /api/stagegate/update-priorities`
- Accepts array of `{ id, priority }` updates
- Bulk updates ADO work items using PATCH operations
- Returns success/failure results for each update

✅ **Drag-and-Drop Implementation**
- Uses `@dnd-kit/core` and `@dnd-kit/sortable` (already installed)
- `SortableFeatureCard` component wraps feature cards
- `DndContext` with sensors for mouse and keyboard interaction
- `arrayMove` utility for reordering array on drag end

✅ **Code Cleanup**
- Removed ~2000+ lines of AI/conversation code
- Simplified state management (removed chat/status stores)
- Streamlined routing (4 routes instead of 7)
- Reduced database complexity (3 tables instead of 11)

---

## What Remains / Future Enhancements

### High Priority (Functional Gaps)

#### 1. **ADO Wiki Integration**
- **Current:** Click opens ADO work item page
- **Desired:** Click opens ADO wiki page for that feature
- **Challenges:**
  - No standard mapping between work items and wiki pages
  - Would need custom field or naming convention
  - Fallback behavior if wiki doesn't exist
- **Implementation:**
  - Add wiki URL field to ADO Features
  - Or use naming convention (e.g., `/wiki/{feature-id}`)
  - Backend: Check if wiki exists via ADO API
  - Frontend: Show "No wiki found" toast if missing

#### 2. **Backlog Page Integration**
- **Status:** Not reviewed/updated in this fork
- **Potential:** May still have AI/chat references or old behaviors
- **Action Needed:** Review and align with new direct-navigation approach

#### 3. **Settings Page Cleanup**
- **Current:** Still has AI API key configuration fields
- **Action Needed:** Remove Claude/OpenAI API key settings
- **Keep:** ADO organization, project, PAT, area path, iteration path

### Medium Priority (User Experience)

#### 4. **Visual Drag Indicator**
- **Enhancement:** Add visual feedback during drag (e.g., ghost placeholder)
- **Current:** Item opacity changes but no drop zone indicator
- **Library Support:** `@dnd-kit` supports this via overlay components

#### 5. **Priority Display**
- **Enhancement:** Show current priority number on feature cards in Intake
- **Benefit:** Users can see current order before dragging
- **Implementation:** Fetch priority field from ADO, display badge on card

#### 6. **Multi-Column Drag**
- **Current:** Only Intake supports drag-and-drop
- **Potential:** Allow dragging between columns to change state
- **Complexity:** Would need to update ADO State field, not just priority
- **Design Question:** Should state changes be this easy, or require approval?

#### 7. **Roadmap Filtering**
- **Enhancement:** Filter by Epic, date range, assigned person
- **Current:** Shows all non-closed features
- **Implementation:** Add filter controls in header, update API query

#### 8. **Stage Gate Sorting**
- **Current:** Features ordered by creation date (from API)
- **Enhancement:** Support sorting by priority, date, assignee
- **Impact:** Would show proper priority-based order in Intake

### Low Priority (Polish)

#### 9. **Loading States**
- **Enhancement:** Better loading indicators during drag priority updates
- **Current:** Toast notification after save, auto-refresh after 1s
- **Improvement:** Optimistic updates or skeleton loaders

#### 10. **Error Handling**
- **Current:** Basic toast notifications for errors
- **Enhancement:** More detailed error messages, retry options
- **Example:** "Failed to update 2 of 5 items. Retry?"

#### 11. **Keyboard Shortcuts**
- **Enhancement:** Add keyboard navigation for power users
- **Examples:**
  - `R` - Refresh current view
  - `G` then `R` - Go to Roadmap
  - `G` then `S` - Go to Stage Gate
  - Arrow keys - Navigate between features in Stage Gate

#### 12. **Responsive Design**
- **Current:** Works on desktop, may have issues on mobile
- **Enhancement:** Test and optimize for tablet/mobile viewing
- **Specific:** Stage Gate grid may need different layout on small screens

---

## Technical Debt & Maintenance

### Database
- **Action:** Run migration to drop removed tables from existing databases
- **File:** Could create `packages/backend/src/database/migrations/001_remove_chat_tables.sql`

### Dependencies
- **Review:** Check if any npm packages are no longer needed
- **Candidates:**
  - AI SDK packages (if any were installed)
  - Markdown parsing (if only used for chat)
- **Keep:** `@dnd-kit/*`, `axios`, `react-router-dom`, etc.

### Testing
- **Status:** No tests currently in codebase
- **Future:** Add tests for:
  - Drag-and-drop reordering logic
  - ADO API priority update endpoint
  - Timeline calculation for roadmap view

---

## Migration Guide (For Existing Users)

If you were using the chatbot version and want to migrate to roadmap-focused version:

### Data Preservation
- **Work items:** All work items created via chat remain in ADO (unchanged)
- **Settings:** ADO configuration preserved
- **Lost Data:** Conversation history, chat messages, status updates

### Steps
1. **Backup:** Export any important chat conversations if needed (before switching)
2. **Switch Branch:** `git checkout roadmap-fork`
3. **Install:** `npm install` (in case dependencies changed)
4. **Database:** Optionally run migration to clean up old tables
5. **Test:** Verify ADO connection in Settings page
6. **Use:** Navigate to Roadmap or Stage Gate to start using new features

### Rollback
If you need chatbot features back:
```bash
git checkout main
npm install
npm run dev
```

---

## Branch Information

- **Main Branch:** Original Aiba with AI chatbot features
- **Fork Branch:** `roadmap-fork` - Roadmap-focused version (this document)
- **Created:** 2025-11-21
- **Status:** Ready for testing and further development

---

## Development Setup

```bash
# Switch to roadmap fork
git checkout roadmap-fork

# Install dependencies
npm install

# Start backend (from root)
npm run dev

# Start frontend (from packages/frontend)
cd packages/frontend
npm run dev

# Access app
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## API Changes Summary

### Removed Endpoints
- `POST /api/chat/message`
- `GET /api/conversations`
- `GET /api/history`
- `POST /api/status/message`
- All conversation-related endpoints

### Added Endpoints
- `POST /api/stagegate/update-priorities` - Bulk update work item priorities

### Unchanged Endpoints
- `GET /api/settings`
- `POST /api/settings`
- `GET /api/ado/*` - ADO integration endpoints
- `GET /api/stagegate/features`
- `GET /api/roadmap/features`

---

## Questions for User

Before finalizing this fork, consider:

1. **Wiki Integration:** Do your ADO Features have wiki pages? How are they mapped?
2. **Priority Field:** Does your ADO project use the Priority field? Any constraints?
3. **State Workflow:** Are the state→stage mappings correct for your process?
4. **Multi-Drag:** Should users be able to drag between columns to change state?
5. **Backlog Page:** Should we review/update the Backlog page behavior too?
6. **Settings:** Remove AI API key fields entirely or hide them?

---

## Conclusion

This fork successfully transforms Aiba from an AI-powered chatbot into a focused roadmap and workflow management tool. The core functionality is complete and ready for use, with several enhancements identified for future development.

**Next Steps:**
1. Test drag-and-drop prioritization with real ADO data
2. Verify timeline calculations work with your feature date ranges
3. Determine wiki integration requirements
4. Review and update Backlog page if needed
5. Consider pushing to remote for team testing
