# Aiba - AI Work Tracking Assistant

## 🎯 Current Status (Updated 2025-11-07)

**Working Features:**
- ✅ Chat interface with Claude Sonnet 4.5 AI
- ✅ Natural language work item extraction
- ✅ Preview and edit before creation
- ✅ Create work items in Azure DevOps
- ✅ **Duplicate detection** - Auto-detects similar work items
- ✅ **Parent/Epic selection** - Link to epics and features
- ✅ **Dynamic Process Template Support** - Auto-adapts to Basic/Agile/Scrum/CMMI
- ✅ History of created items
- ✅ Settings management for ADO/AI credentials
- ✅ **Backlog Management** - Visual backlog with 4 view modes
- ✅ **Drag-and-Drop** - Move items between states and sprints (process-template aware!)
- ✅ **Filtering & Search** - Filter by type, state, assignee, and search titles
- ✅ **Toast Notifications** - Beautiful slide-in notifications (no more ugly alerts!)
- ✅ **Auto Cache Refresh** - Backlog data refreshes hourly automatically

**🎉 POC COMPLETE - READY TO USE!**
The core loop is fully functional: have a conversation, get warned about duplicates, select parent epic/feature, review everything, and push to Azure DevOps! The system automatically detects your ADO process template and adapts accordingly. Manage your backlog with 4 view modes (Grouped, List, Kanban, Sprint) with drag-and-drop support. Toast notifications provide smooth feedback, and data stays fresh with hourly auto-refresh!

**What's Next (Optional):**
- Post-POC: Polish items before showing to team (see Post-POC Enhancements section)
- Phase 1.5: Security & Enterprise Prep (required before company deployment)
- Optional: Advanced backlog features (work item details modal, bulk actions)

---

## Project Overview

**Problem:** As the sole Business Analyst on a tight budget, you're bottlenecked by story creation. Developers, QA, and other team members need to create work items but lack the BA expertise to format them properly. **More importantly, technical jargon and complex forms prevent non-technical team members from contributing their ideas.**

**Solution:** **Aiba** is a friendly AI assistant that makes work tracking feel like having a conversation with a helpful colleague. Anyone can share their ideas, report bugs, or suggest features using everyday language - Aiba handles all the technical details automatically.

**Core Philosophy:**
- **Welcoming to Everyone** - No technical knowledge required, no agile terminology
- **Intelligent & Invisible** - AI automatically detects work type (bug/feature/task), no user input needed
- **Beautiful & Minimal** - Clean, centered chat interface inspired by Claude.ai
- **Natural Conversation** - Warm, friendly dialogue that makes people feel heard

**Key Features:**
- 💬 **Smart Work Type Detection** - Aiba automatically figures out if it's a bug, feature, or task
- 🤝 **Welcoming Language** - Uses everyday words instead of "acceptance criteria", "story points", etc.
- 🎨 **Sleek Minimal UI** - "Greetings." header, centered chat, beautiful gradients
- 🤖 **Claude Sonnet 4.5 AI** - Latest Anthropic model for intelligent conversations
- 🔄 **Seamless ADO Integration** - Automatically syncs to Azure DevOps backlog
- 📊 **Progress Tracking** - Shows how complete the idea is without technical jargon

**Tech Stack:**
- **Frontend:** React 19, Vite 6, Zustand, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express, SQLite, Anthropic Claude Sonnet 4.5
- **AI Model:** claude-sonnet-4-5-20250929 (latest as of Jan 2025)
- **Architecture:** Monorepo with npm workspaces, REST API, local database

**Target Users:** **Anyone** on the team - developers, QA, designers, product managers, stakeholders - regardless of technical knowledge

---

## Phase 1: Foundation & Setup
**Goal:** Monorepo structure with ADO connectivity

### Checkpoint 1.1: Project Scaffolding ✅
- [x] Create monorepo structure with npm workspaces
  - [x] `/frontend` - React 19 + Vite 7
  - [x] `/backend` - Node.js + Express
  - [ ] `/shared` - Shared types/constants (optional - skipped for POC)
- [x] Initialize Vite with React + Tailwind
- [x] Set up Express server with basic routes
- [x] Configure concurrently for dev scripts
- [x] Add ESLint configuration

**Implementation Notes:**
- Created monorepo with workspaces in `packages/frontend` and `packages/backend`
- Frontend: Vite 6, React 19, Tailwind CSS, React Router with placeholder pages (Home, Chat, Backlog, Settings)
- Backend: Express server with route structure for all planned endpoints (settings, ADO, chat, conversations, history)
- Storage directory: `packages/backend/storage/` (with .gitkeep)
- All route handlers are placeholders returning "not implemented yet" messages

### Checkpoint 1.2: Database & Storage Setup ✅
- [x] Create SQLite schema
  ```sql
  - settings (ado_org_url, ado_project, ado_pat, ai_provider, ai_api_key, area_path, iteration_path)
  - field_mappings (work_item_type, logical_field, ado_field_name)
  - work_items_cache (id, title, type, state, parent_id, created_date, last_fetched)
  - conversations (id, created_at, work_item_type, completed, ado_item_id)
  - messages (id, conversation_id, role, content, timestamp)
  - created_history (id, ado_item_id, title, type, created_at, ado_url)
  ```
- [x] Create database initialization script
- [x] Set up storage directories for any temp files

**Implementation Notes:**
- Database: `packages/backend/storage/storyforge.db` (60KB SQLite database)
- Schema: Created all 6 tables + indexes via `src/database/schema.sql`
- Initialization: `src/database/init.js` - auto-runs on server startup
- Connection utility: `src/database/db.js` - singleton pattern with graceful shutdown
- Field mapper: `src/utils/fieldMapper.js` - converts logical fields to ADO field references
- Seeded 52 field mappings for all work item types (Bug, User Story, Task, Epic, Feature)
- Database initialized successfully on first run

### Checkpoint 1.3: Backend API Structure (Partially Complete)
- [x] Create Express routes:
  - [x] `POST /api/settings` - Save configuration (placeholder)
  - [x] `GET /api/settings` - Get configuration (placeholder)
  - [x] `POST /api/settings/test-ado` - Test ADO connection (placeholder)
  - [x] `GET /api/ado/epics` - Get epics/features (placeholder)
  - [x] `GET /api/ado/work-items/recent` - Get last 6 months (placeholder)
  - [x] `POST /api/ado/work-items` - Create work item (placeholder)
  - [x] `POST /api/ado/search` - Search for duplicates (placeholder)
  - [x] `POST /api/chat` - Send message to AI (placeholder)
  - [x] `GET /api/conversations/:id` - Get conversation (placeholder)
  - [x] `GET /api/history` - Get recent created items (placeholder)
- [x] Add CORS configuration
- [x] Set up error handling middleware
- [ ] Create Axios instance for ADO API calls (pending - will do in Phase 2)

**Implementation Notes:**
- All route files created in `src/routes/` with placeholder handlers
- Route structure complete, implementations will be added in subsequent phases
- CORS enabled for all origins (will restrict in Phase 1.5)
- Error handling middleware properly positioned after routes

### Checkpoint 1.4: Frontend Setup (Partially Complete)
- [x] Create React Router structure:
  - [x] `/` - Landing page (placeholder)
  - [x] `/chat/:conversationId?` - Chat interface (placeholder)
  - [x] `/settings` - Settings page (placeholder)
  - [x] `/backlog` - Backlog management view (placeholder)
- [ ] Set up Zustand store:
  ```js
  - settingsStore (ado config, ai config) - pending
  - conversationStore (messages, progress, workItemData) - pending
  - historyStore (recentItems) - pending
  - backlogStore (workItems, filters, viewMode) - pending
  ```
- [x] Configure Axios for backend API calls (via Vite proxy)
- [x] Create base layout components (navigation header)

**Implementation Notes:**
- React Router with all 4 routes configured in `App.jsx`
- Basic navigation header with links to all pages
- Vite proxy configured to forward `/api/*` to backend (port 3001)
- Placeholder components for each page
- Zustand stores will be created as features are implemented

---

## Phase 1.5: Security & Enterprise Prep
**Goal:** Harden for company deployment (do AFTER POC works)

### Checkpoint 1.5.1: OAuth Implementation
- [ ] Install `passport-azure-ad` or similar OAuth library
- [ ] Create OAuth flow for Azure DevOps
  - [ ] Required scopes: `vso.work`, `vso.work_write`, `vso.identity`
  - [ ] Redirect URI configuration
  - [ ] Token refresh logic
- [ ] Replace PAT storage with OAuth tokens
- [ ] Implement HTTP-only cookies with short TTL sessions
- [ ] Add session management (express-session + secure store)
- [ ] Create logout endpoint

### Checkpoint 1.5.2: Field Mapping Configuration
- [ ] Add `field_mappings` table to SQLite:
  ```sql
  field_mappings (
    work_item_type VARCHAR,
    logical_field VARCHAR,
    ado_field_name VARCHAR
  )
  ```
- [ ] Create field mapping UI in settings:
  - [ ] Map "Acceptance Criteria" → ADO field reference
  - [ ] Map "Repro Steps" → ADO field reference
  - [ ] Map "Expected Result" → ADO field reference
  - [ ] Map "Actual Result" → ADO field reference
  - [ ] Allow custom field additions
- [ ] Backend: Fetch available fields from ADO Work Item Type Definition API
- [ ] Backend: Translate logical fields to ADO field references in payload
- [ ] Validation: Ensure required fields are mapped before allowing work item creation

### Checkpoint 1.5.3: Security Hardening
- [ ] Add CSRF protection middleware (`csurf`)
- [ ] Lock CORS to specific frontend origin (no wildcards)
- [ ] Set secure cookie flags:
  - [ ] `HttpOnly: true`
  - [ ] `Secure: true` (HTTPS only)
  - [ ] `SameSite: 'Lax'`
- [ ] Input sanitization for all user inputs
- [ ] Rate limiting on API endpoints (`express-rate-limit`)
- [ ] Add security headers (`helmet`)

### Checkpoint 1.5.4: HTML Conversion
- [ ] Backend utility to convert Markdown → HTML using `marked`
- [ ] Apply conversion before pushing to ADO (descriptions, acceptance criteria, etc.)
- [ ] Sanitize HTML output to prevent XSS (`DOMPurify` or similar)
- [ ] Preview component shows HTML rendering (not just markdown)

---

## Phase 2: Settings & Configuration ✅
**Goal:** Secure settings management

### Checkpoint 2.1: Settings Backend ✅
- [x] Implement settings CRUD endpoints
- [x] Create ADO API wrapper utility
  - [x] Authentication with PAT
  - [x] Test connection function
  - [x] Error handling for 401/403/404
- [ ] Add encryption for stored PAT (deferred to Phase 1.5)
- [x] Validate settings before saving

**Implementation Notes:**
- Settings service: `src/services/settingsService.js` - CRUD operations for settings table
- Settings routes: `src/routes/settings.js` - GET/POST endpoints with validation
- ADO API wrapper: `src/utils/adoApi.js` - Axios client with Basic Auth (PAT)
- Test connection: Validates PAT by fetching project info from ADO API
- Error handling: Handles 401 (unauthorized), 403 (forbidden), 404 (not found), network errors
- Sanitized responses: Never returns PAT or API keys in GET requests
- Database: Single-row settings table enforced with CHECK constraint

### Checkpoint 2.2: Settings Frontend ✅
- [x] Build settings page UI with Tailwind
  - [x] Form with all configuration fields
  - [x] Password-type inputs for tokens
  - [x] "Test Connection" button with loading state
  - [x] Save button with success/error feedback
- [x] Connect to Zustand settings store
- [x] Add form validation
- [x] Handle test connection results

**Implementation Notes:**
- Settings page: `src/pages/SettingsPage.jsx` - Full-featured form with validation
- Zustand store: `src/stores/settingsStore.js` - State management for settings
- Form validation: Client-side validation for required fields, URL format
- Visual feedback: Success/error messages, loading states, configured indicators
- Security: Password fields don't show stored values, placeholder for updates
- ADO test: Displays project name, state, and connection status
- Fields: ado_org_url, ado_project, ado_pat, ai_provider, ai_api_key, area_path, iteration_path

### Checkpoint 2.3: Dynamic Work Item Types ✅
- [x] Backend: Fetch work item types from ADO API
  - [x] Add `getWorkItemTypes()` function to adoApi.js
  - [x] Call `GET /:project/_apis/wit/workitemtypes?api-version=7.1`
  - [x] Parse response to extract available work item types
- [x] Database: Store work item types in settings
  - [x] Add `available_work_item_types` TEXT column (JSON array)
  - [x] Add `process_template` TEXT column (Basic/Agile/Scrum/CMMI)
  - [x] Update schema with migration
- [x] Backend: Auto-detect process template on connection test
  - [x] Modify `testAdoConnection()` to fetch and store work item types
  - [x] Store as JSON array in settings table
  - [x] Infer process template from work item types present
- [x] Backend: Use dynamic types throughout
  - [x] Update `getRecentWorkItems()` WIQL to use dynamic types
  - [x] Update `getEpicsAndFeatures()` WIQL to use dynamic types
  - [x] Update `getAllActiveWorkItems()` WIQL to use dynamic types
  - [x] Cache service automatically uses dynamic types
- [x] AI Service: Dynamic system prompt
  - [x] Modify `getSystemPrompt()` to use available types
  - [x] Generate work type list from settings
  - [x] Update extraction prompt with dynamic types
- [x] Testing: Ready for cross-template testing
  - [x] Default types: Epic, Issue, Task (Basic template)
  - [x] Auto-detects types on connection test
  - [x] System adapts to any process template

**Benefits:**
- ✅ No more errors when creating PBIs in Basic template projects
- ✅ Automatically adapts to any ADO process template (Basic/Agile/Scrum/CMMI)
- ✅ Future-proof for custom process templates
- ✅ Better UX - Claude only suggests valid work item types
- ✅ Smarter duplicate detection - searches only valid types

**Implementation Notes:**
- Work Item Types API: `GET https://dev.azure.com/{org}/{project}/_apis/wit/workitemtypes?api-version=7.1`
- Response includes: name, referenceName, description, color, icon, fields, transitions
- Process templates have distinct work item type sets:
  - **Basic**: Epic, Issue, Task
  - **Agile**: Epic, Feature, User Story, Task, Bug, Issue (optional)
  - **Scrum**: Epic, Feature, Product Backlog Item, Task, Bug, Impediment
  - **CMMI**: Epic, Feature, Requirement, Task, Bug, Issue, Risk, Review, Change Request
- Store types as JSON array in settings for easy querying
- Refresh types whenever connection settings are updated

**Files Modified:**
- `packages/backend/src/database/schema.sql` - Added `available_work_item_types` and `process_template` columns
- `packages/backend/src/database/init.js` - Added migration logic to update existing databases
- `packages/backend/src/utils/adoApi.js` - Added `getWorkItemTypes()` and `inferProcessTemplate()` functions, updated all WIQL queries
- `packages/backend/src/services/settingsService.js` - Added `updateWorkItemTypes()` and `getAvailableWorkItemTypes()` functions
- `packages/backend/src/routes/settings.js` - Updated test connection endpoint to fetch and store work item types
- `packages/backend/src/services/aiService.js` - Updated system prompt and extraction prompt to use dynamic types

**How It Works:**
1. When user clicks "Test Connection" in Settings, backend fetches work item types from ADO
2. System infers process template based on type names (e.g., "Issue" = Basic, "User Story" = Agile, "Product Backlog Item" = Scrum)
3. Types stored in settings table as JSON array
4. All WIQL queries dynamically build type lists from settings
5. AI system prompt adapts to show only valid work item types
6. No more errors when trying to create PBIs in Basic template or User Stories in Basic template!

---

## Phase 3: Core Chat Interface ✅ COMPLETE
**Goal:** Welcoming conversational experience for everyone

### Checkpoint 3.1: Backend Chat Logic ✅
- [x] Integrate Anthropic SDK (Claude Sonnet 4.5)
- [x] Create conversation management:
  - [x] Initialize new conversation in DB
  - [x] Store messages in DB
  - [x] Maintain conversation context
- [x] Build prompt engineering system:
  - [x] **Friendly "Aiba" persona** - warm, encouraging, no jargon
  - [x] **Auto-detect work item type** - no user selection needed
  - [x] **Conversational extraction** - asks about "what needs to be done" not "acceptance criteria"
  - [x] Uses everyday language instead of technical terms
- [x] Implement `/api/chat` endpoints:
  - [x] `POST /api/chat/start` - Auto-starts conversation with greeting
  - [x] `POST /api/chat/:id/message` - Send message, get AI response
  - [x] `GET /api/chat/:id` - Load conversation history
  - [x] `POST /api/chat/:id/extract` - Extract structured data
  - [x] Parse AI response for structured data
  - [x] Auto-update work item type when detected
  - [x] Track completeness percentage

**Implementation Notes:**
- AI Service: `src/services/aiService.js` - Claude Sonnet 4.5 integration
- Conversation Service: `src/services/conversationService.js` - Full CRUD for conversations/messages
- System prompt focuses on being welcoming and translating technical concepts to everyday language
- Work type auto-detection: Bug, Feature, Task, or User Story based on conversation content
- Extraction returns: workItemType, title, description, acceptance criteria, priority, effort, story points, tags, business value

### Checkpoint 3.2: Frontend Chat UI ✅
- [x] Create minimal, beautiful chat interface
- [x] **"Greetings." header** - clean, welcoming entry point
- [x] Build message components:
  - [x] User messages: Blue bubbles on right
  - [x] Aiba messages: White bubbles on left
  - [x] Timestamps on messages
- [x] Implement input field:
  - [x] Rounded full-width input bar
  - [x] Send button (icon)
  - [x] Loading indicator (animated dots)
  - [x] Auto-focus on mount
- [x] Beautiful gradient background (gray → blue → purple)
- [x] Auto-scroll to latest message
- [x] Typing indicator with bouncing dots
- [x] **Claude.ai-style centered layout** - starts centered, moves top after first message

**Implementation Notes:**
- ChatPage: `src/pages/ChatPage.jsx` - Full chat interface with dual layout modes
- Chat Store: `src/stores/chatStore.js` - Zustand state management
- Centered layout: Large "Greetings." header (lines 80-165), shown when messages.length === 0
- Normal layout: Compact header at top (lines 169-349), shown after first message
- NO navbar, NO technical UI elements - just pure conversation
- Auto-starts conversation on page load (no button click needed)
- Home and Settings buttons appear in top corners during conversation

### Checkpoint 3.3: Progress Tracker Component ⏸️ (Deferred)
- [ ] Progress tracking is invisible for now to keep UI minimal
- [ ] Will add subtle, non-technical progress indicator later
- [ ] Focus on conversation first, tracking second

**Design Decision:**
Removed complex progress tracking UI to keep experience simple and welcoming. The AI tracks progress internally, but we don't overwhelm users with checklists and percentages. May add a subtle "We're almost done!" message later.

---

## Phase 4: Smart Features ✅ COMPLETE
**Goal:** Duplicate detection & intelligent placement

### Checkpoint 4.1: Backend Duplicate Detection ✅
- [x] Create `/api/ado/search` endpoint
- [x] Fetch recent work items (last 6 months, Active/New states)
- [x] Cache work items in SQLite
- [x] Implement similarity algorithm:
  - [x] Title keyword matching
  - [x] Description text similarity (Jaccard similarity)
  - [x] Keyword extraction with common word filtering
  - [x] Similarity scoring (0-100)
- [x] Return ranked results with similarity scores

**Implementation Notes:**
- Cache service: `src/services/cacheService.js` - Full implementation with similarity algorithm
- Search endpoint: `src/routes/ado.js` - POST `/api/ado/search`
- Cache refresh: POST `/api/ado/cache/refresh` - Manual refresh endpoint
- Cache stats: GET `/api/ado/cache/stats` - View cache statistics
- Automatic refresh on server startup (2 second delay)
- work_items_cache table stores: id, title, type, state, parent_id, created_date, description
- Similarity threshold: 30% minimum to show matches

### Checkpoint 4.2: Frontend Duplicate UI ✅
- [x] Create "Similar items found" component
- [x] Display when bot detects possible duplicates
- [x] Show each match with:
  - [x] Title, ID, state
  - [x] Similarity score with progress bar
  - [x] Similarity reason (common keywords)
  - [x] Description preview
  - [x] Action button: View in ADO
- [x] Handle user dismissal ("This is Different" button)

**Implementation Notes:**
- DuplicateAlert component: `src/components/DuplicateAlert.jsx`
- Yellow/orange gradient alert design
- Shows similarity percentage with color-coded progress bar (red >70%, orange >50%, yellow <50%)
- Integrated into ChatPage - appears above messages
- Auto-triggers when extractedData contains a title
- Dismissible - user can hide duplicates and continue

### Checkpoint 4.3: Smart Parent Selection ✅
- [x] Backend: `/api/ado/epics` endpoint to fetch hierarchy
- [x] Fetch epics and features from ADO
- [x] Frontend: Dropdown/select component for parent
- [x] Backend: Include parent in work item creation

**Implementation Notes:**
- getEpicsAndFeatures: `src/utils/adoApi.js` - Fetches Epic and Feature work items
- Epics endpoint: GET `/api/ado/epics` - Returns all active epics/features
- Parent selection UI: Added to WorkItemPreview component
- Dropdown shows: 📦 Epic or ⭐ Feature icon, work item ID, and title
- Backend creates parent link via System.Parent field
- Optional - user can leave as "No parent (standalone item)"

---

## Phase 5: Preview & Creation ✅
**Goal:** Final review and ADO push

### Checkpoint 5.1: Preview Component ✅
- [x] Build preview card component
- [x] Display formatted work item with all fields
- [x] Show as it will appear in ADO
- [x] Add inline edit capability for each field
- [x] Format according to BA standards

**Implementation Notes:**
- WorkItemPreview: `src/components/WorkItemPreview.jsx` - Full preview card with inline editing
- EditableField component: Supports text and textarea with Save/Cancel buttons
- Work item type icons: 📋 Issue, 🐛 Bug, ✓ Task, 📦 Epic, 📖 User Story, ⭐ Feature
- Priority colors: Red (High), Orange (Medium), Yellow (Low), Gray (Very Low)
- Beautiful gradient header with "Create in Azure DevOps" button
- Shows conditionally in ChatPage when extractedData exists

### Checkpoint 5.2: Work Item Creation ✅
- [x] Backend: `/api/ado/work-items` POST endpoint
- [x] Build ADO work item creation payload
- [x] Handle all field mappings (title, description, parent, etc.)
- [x] Return created item ID and URL
- [x] Store in `created_history` table
- [x] Frontend: "Push to ADO" button
  - [x] Loading state during creation
  - [x] Success modal with link to ADO item
  - [x] Error handling with retry option

**Implementation Notes:**
- Backend route: `src/routes/ado.js` - POST `/api/ado/work-items` (lines 28-154)
- ADO API wrapper: `src/utils/adoApi.js` - `createWorkItem()` function with proper URL encoding
- Field mappings: Title, Description, Priority, Acceptance Criteria, Repro Steps, Severity, Story Points, Tags
- Links conversation to work item via `conversationService.linkWorkItem()`
- Adds to history via `historyService.addToHistory()`
- Success modal: Green gradient banner with "View in ADO" button (ChatPage.jsx lines 288-309)
- Loading state: Animated spinner during creation

### Checkpoint 5.3: History & Landing Page ✅
- [x] Backend: `/api/history` endpoint for recent items
- [x] Frontend: Landing page with:
  - [x] "Start new conversation" button
  - [x] Recent created items list (last 10)
  - [x] Click to view in ADO
- [x] Auto-refresh on new item creation

**Implementation Notes:**
- History service: `src/services/historyService.js` - addToHistory(), getRecentItems(), cleanOldHistory()
- History route: `src/routes/history.js` - GET `/api/history?limit=10`
- Landing page: `src/pages/LandingPage.jsx` - "Greetings." header with recent items list
- Recent items: Shows type icon, ID, title, and relative time ("2m ago", "3h ago", "5d ago")
- Cards link directly to ADO URLs
- Beautiful gradient background matching chat interface
- Settings button in top right corner

---

## Phase 6: Polish & Optimization ✅ POC COMPLETE
**Goal:** Production-ready experience (POC essentials implemented, remaining items postponed)

### Checkpoint 6.1: Background Processing ✅ COMPLETE
- [x] Add node-cron job for cache refresh:
  - [x] Refresh work items cache every hour
  - [ ] Clean up old conversations (> 30 days) - **POSTPONED TO POST-POC**
- [ ] Implement request queuing for ADO API (rate limiting) - **POSTPONED TO POST-POC**
- [ ] Add retry logic with exponential backoff - **POSTPONED TO POST-POC**

### Checkpoint 6.2: Error Handling & UX ✅ CORE COMPLETE
- [ ] Global error boundary in React - **POSTPONED TO POST-POC**
- [ ] User-friendly error messages - **POSTPONED TO POST-POC**
- [ ] Loading states for all async operations - **POSTPONED TO POST-POC**
- [x] Toast notifications for actions (success/error)
- [ ] Confirmation dialogs for destructive actions - **POSTPONED TO POST-POC**
- [ ] Keyboard shortcuts (Ctrl+Enter to send, etc.) - **POSTPONED TO POST-POC**

### Checkpoint 6.3: Testing & Deployment - **POSTPONED TO POST-POC**
- [ ] Test all work item types (Bug, Story, Task)
- [ ] Test duplicate detection accuracy
- [ ] Verify ADO integration end-to-end
- [ ] Test with invalid/missing settings
- [ ] Browser compatibility (Chrome, Edge, Firefox)
- [ ] Build production bundle (`npm run build`)
- [ ] Create deployment README

**POC Status:** Phase 6 essentials complete! Hourly cache refresh and toast notifications implemented. Remaining items moved to Post-POC phase.

---

## Phase 7: Backlog Management View ✅ CORE COMPLETE
**Goal:** Visual backlog organization with drag-and-drop

### Checkpoint 7.1: Backend Backlog API ✅
- [x] Create `/api/ado/backlog` endpoint
  - [x] Fetch all work items for current iteration/sprint
  - [x] Group by Epic/Feature hierarchy
  - [x] Include state, priority, assigned to, etc.
- [x] Create `/api/ado/work-items/:id/update` endpoint
  - [x] Update work item fields (priority, parent, state, iteration, etc.)
  - [x] JSON Patch operations for ADO API
- [x] Add `/api/ado/work-items/:id/move` endpoint
  - [x] Change parent (move between epics/features)
  - [x] Update iteration path for sprint planning

**Implementation Notes:**
- Backend routes: `src/routes/ado.js` - PATCH endpoints for update and move operations
- Field mapping: Logical fields (title, state, priority, etc.) → ADO field references
- Update endpoint: Handles state, priority, assignedTo, title, description, acceptanceCriteria, iterationPath
- Move endpoint: Handles parent relationship and iteration path changes
- All updates use JSON Patch format required by ADO API

### Checkpoint 7.2: Backlog View UI ✅
- [x] Create new route `/backlog`
- [x] Build backlog layout options:
  - [x] **List view** - Traditional flat list with sortable columns
  - [x] **Grouped view** - Group by Epic/Feature with collapsible sections
  - [x] **Kanban board** - Columns by state with drag-and-drop
  - [x] **Sprint planning** - Backlog vs Current Sprint two-column layout
- [x] Add view toggle (List/Grouped/Kanban/Sprint)
- [x] Implement filters:
  - [x] By type (Story/Bug/Task/Epic/Feature)
  - [x] By state
  - [x] By assigned to
  - [x] Search by title

**Implementation Notes:**
- BacklogPage: `src/pages/BacklogPage.jsx` - Main page with view mode switching
- BacklogFilters: `src/components/BacklogFilters.jsx` - Filter dropdowns and search
- ListView: `src/components/ListView.jsx` - Sortable table with clickable headers
- KanbanView: `src/components/KanbanView.jsx` - State-based columns with drag-and-drop
- SprintView: `src/components/SprintView.jsx` - Two-column sprint planning layout
- Grouped view: Built into BacklogPage - shows hierarchy with expandable groups
- Active filter badges with individual clear buttons
- All views share same filter state

### Checkpoint 7.3: Drag-and-Drop Implementation (Simplified) ✅
- [x] Install `@dnd-kit/core` and `@dnd-kit/sortable` (modern, accessible DnD)
- [x] Implement draggable work item cards
- [x] Create drop zones for SIMPLE operations only:
  - [x] Move between states (Kanban: New → Active → Resolved via state change)
  - [x] Move to/from sprint (Sprint view: change iteration path)
- [x] Add drag preview/ghost element (DragOverlay)
- [x] Optimistic UI updates (immediate visual feedback)
- [x] Handle drag failure with error alerts
- [x] Refresh data after successful drag operations
- [x] **Note:** Skip arbitrary stack rank reordering (complex ADO API constraints)

**Implementation Notes:**
- @dnd-kit: Using core, sortable, and utilities packages
- KanbanView drag: Detects target state from column, updates via `/api/ado/work-items/:id/update`
- SprintView drag: Moves items between backlog and sprint via iteration path updates
- DragOverlay: Shows semi-transparent card preview during drag
- Pointer sensor with 8px activation distance (prevents accidental drags)
- Error handling: Alerts user if ADO update fails
- Auto-refresh: Calls onRefresh() after successful move

### Checkpoint 7.4: Backlog Actions & Quick Edit (Optional - Future Enhancement)
- [ ] Click work item card to view details in modal/side panel
- [ ] Quick edit inline:
  - [ ] Title
  - [ ] Assigned to
  - [ ] Priority
  - [ ] State
  - [ ] Effort/Story points
- [ ] Bulk actions:
  - [ ] Select multiple items (checkboxes)
  - [ ] Bulk move to epic/feature
  - [ ] Bulk update state/priority
  - [ ] Bulk assign
- [ ] Context menu (right-click):
  - [ ] View in ADO
  - [ ] Edit
  - [ ] Delete
  - [ ] Clone/duplicate
- [ ] Add "Create new work item" button (quick create without full chat)

**Status:** Deferred - Core backlog functionality is working. These are nice-to-have enhancements for future phases.

### Checkpoint 7.5: Backlog Visualization ✅
- [x] Epic/Feature cards show:
  - [x] Progress bar (completed vs total items)
  - [x] Item count by type (with icons)
  - [x] Effort total (story points sum)
- [x] Color coding:
  - [x] By priority (P1=red, P2=orange, P3=yellow, P4=gray)
  - [x] By work item type (Epic=📦, Feature=⭐, Story=📖, Bug=🐛, Task=✓, Issue=📋)
  - [x] By state (New=blue, Active=orange, Resolved=green, Done=green)
- [x] Add "refresh" button to sync with ADO
- [x] Show last sync timestamp

**Implementation Notes:**
- Grouped view progress bars: `calculateProgress()` in BacklogPage.jsx
  - Counts completed children (Done, Resolved, Closed states)
  - Calculates percentage and shows visual progress bar
  - Color-coded: green when >50%, yellow when >0%, gray when 0%
- Effort totals: Sum of Microsoft.VSTS.Scheduling.StoryPoints for all children
- Sprint view effort: Shows story points for backlog and sprint columns
- Work item type icons: Consistent across all views
- Priority colors: Border-left styling in Kanban cards
- State badges: Color-coded in List and Sprint views
- Refresh button: Fetches fresh data from ADO via cache refresh

### Checkpoint 7.6: Sprint Planning Features ✅
- [x] Two-column layout: Backlog | Current Sprint
- [x] Drag items from backlog into sprint
- [x] Sprint effort tracking:
  - [x] Current sprint effort total (story points)
  - [x] Backlog effort total (story points)
  - [x] Item counts for both columns
- [ ] Advanced capacity tracking (Future):
  - [ ] Team velocity
  - [ ] Sprint capacity vs effort comparison
  - [ ] Warn when overcommitted
  - [ ] Sprint burndown mini-chart

**Implementation Notes:**
- SprintView: Two-column layout with drag-and-drop between columns
- Uses settings.iteration_path to determine current sprint
- Items with matching iteration path go to sprint column, others to backlog
- Drag from sprint → backlog: Removes iteration path (sets to empty string)
- Drag from backlog → sprint: Sets iteration path and optionally activates state
- Effort totals: Sum of story points displayed in column headers
- Item counts: Shows number of items in each column
- Requires iteration_path configured in Settings page

---

## Phase 8: Status Update Generation
**Goal:** AI-powered status updates at multiple detail levels (detailed, executive, hybrid)

### Overview
Transform Aiba into a status update assistant that helps users quickly generate well-formatted project status updates through natural conversation. The AI will gather information about progress, blockers, accomplishments, and next steps, then generate formatted updates at multiple detail levels suitable for different audiences.

**Key Features:**
- 💬 **Conversational data gathering** - Natural dialogue about project progress
- 📊 **Multi-level output** - Detailed (team), Executive (leadership), Hybrid (both)
- 🔄 **ADO integration** - Auto-pull work item progress from Azure DevOps
- 📋 **Template system** - Save and reuse status update templates
- 📧 **Export options** - Copy to clipboard, email format, markdown, HTML
- 🎯 **Smart suggestions** - AI suggests what to include based on ADO data

### Checkpoint 8.1: Database Schema Extensions
- [ ] Create new tables:
  ```sql
  status_conversations (
    id INTEGER PRIMARY KEY,
    created_at DATETIME,
    project_name TEXT,
    reporting_period TEXT,  -- "2025-11-01 to 2025-11-07"
    completed BOOLEAN DEFAULT 0,
    status_update_id INTEGER
  )

  status_messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER,
    role TEXT,  -- 'user' | 'assistant'
    content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (conversation_id) REFERENCES status_conversations(id)
  )

  status_updates (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER,
    project_name TEXT,
    reporting_period TEXT,

    -- Extracted structured data
    accomplishments TEXT,  -- JSON array
    in_progress TEXT,      -- JSON array
    blockers TEXT,         -- JSON array
    next_steps TEXT,       -- JSON array
    risks TEXT,            -- JSON array
    metrics TEXT,          -- JSON object

    -- Generated outputs
    detailed_update TEXT,
    executive_update TEXT,
    hybrid_update TEXT,

    created_at DATETIME,
    last_modified DATETIME,

    FOREIGN KEY (conversation_id) REFERENCES status_conversations(id)
  )

  status_templates (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    sections TEXT,  -- JSON array: ['accomplishments', 'blockers', 'next_steps', etc.]
    format_style TEXT,  -- 'bullets' | 'paragraphs' | 'mixed'
    created_at DATETIME
  )
  ```

### Checkpoint 8.2: Backend API Structure
- [ ] Create status update routes (`/api/status`):
  ```javascript
  POST   /api/status/start                    // Start new status conversation
  POST   /api/status/:id/message              // Send message, get AI response
  GET    /api/status/:id                      // Get conversation history
  POST   /api/status/:id/extract              // Extract structured data
  POST   /api/status/:id/generate             // Generate updates (all levels)
  GET    /api/status/:id/export/:level        // Export specific level

  // ADO integration for status updates
  GET    /api/status/ado/progress/:epic       // Get epic progress summary
  GET    /api/status/ado/closed-items         // Get recently closed items
  GET    /api/status/ado/active-items         // Get active items summary

  // Template management
  GET    /api/status/templates                // List all templates
  POST   /api/status/templates                // Create template
  GET    /api/status/templates/:id            // Get template
  PUT    /api/status/templates/:id            // Update template
  DELETE /api/status/templates/:id            // Delete template
  ```

### Checkpoint 8.3: AI Service Extensions
- [ ] Create status update prompt system (`src/services/statusAiService.js`):
  ```javascript
  // System prompt for status update conversations
  - Friendly, professional tone (business context, not casual)
  - Guides user through gathering: accomplishments, blockers, progress, risks
  - Asks about specific time period (this week, last sprint, etc.)
  - Suggests pulling recent ADO data for accuracy
  - Extracts structured data from conversation

  // Generation prompts for each level
  - Detailed: Full context, technical details, metrics, work item IDs
  - Executive: High-level summary, business impact, key decisions needed
  - Hybrid: Executive summary + detailed appendix

  // Smart suggestions based on ADO data
  - "I see Epic #4521 was completed this week - should we highlight that?"
  - "There are 3 items stuck in 'In Review' - are these blockers?"
  - "5 bugs were closed - worth mentioning?"
  ```

### Checkpoint 8.4: Frontend UI Components
- [ ] Create new route `/status/:conversationId?`
- [ ] Build StatusUpdatePage component:
  ```jsx
  // Layout similar to ChatPage but with status-specific UI
  - Status conversation area (left side, 60%)
  - Live preview panel (right side, 40%)
  - Tab switcher: Detailed | Executive | Hybrid
  - Export buttons: Copy, Email, Download MD, Download HTML

  // Features:
  - Auto-saves as user talks
  - Real-time preview of generated update
  - Toggle between levels without re-generating
  - ADO data pull suggestions (clickable prompts)
  - Template selector dropdown
  ```

- [ ] Create StatusPreviewPanel component:
  ```jsx
  // Shows formatted status update
  - Tabs for Detailed / Executive / Hybrid views
  - Syntax highlighting for markdown
  - Editable sections (inline editing)
  - Copy to clipboard button (per section or full update)
  - Word count and estimated read time
  ```

- [ ] Create StatusTemplateSelector component:
  ```jsx
  // Dropdown to select saved templates
  - "Default (Full Status)"
  - "Weekly Sprint Update"
  - "Executive Summary Only"
  - "Risk-Focused Update"
  - "+ Create New Template"
  ```

### Checkpoint 8.5: ADO Data Integration for Status
- [ ] Backend utilities for status-relevant ADO queries:
  ```javascript
  // src/utils/statusAdoHelper.js

  async getEpicProgress(epicId) {
    // Returns: total items, completed, in progress, blocked
    // Calculates: % complete, velocity, estimated completion
  }

  async getRecentlyClosedItems(dateRange) {
    // Returns: list of items closed in date range
    // Grouped by: Epic/Feature, then by type
  }

  async getActiveItemsSummary() {
    // Returns: items by state (New, Active, In Review, etc.)
    // Highlights: stuck items, overdue items, unassigned items
  }

  async getBlockedItems() {
    // Returns: items with 'Blocked' tag or in blocked state
    // Includes: blocker description, duration blocked
  }

  async getSprintSummary(iterationPath) {
    // Returns: sprint progress, burndown data, capacity vs actual
  }
  ```

### Checkpoint 8.6: Status Update Generation Logic
- [ ] Create status generation service (`src/services/statusGeneratorService.js`):
  ```javascript
  // Format options
  const formatters = {
    detailed: generateDetailedUpdate,
    executive: generateExecutiveUpdate,
    hybrid: generateHybridUpdate
  };

  // Detailed format includes:
  - Full accomplishments list with work item IDs and links
  - Detailed blocker descriptions with mitigation plans
  - Comprehensive next steps with owners and dates
  - Metrics table (velocity, story points, bug count, etc.)
  - Risk assessment with impact and likelihood

  // Executive format includes:
  - 3-5 sentence summary (status: on track / at risk / blocked)
  - Top 3 accomplishments (business value focus)
  - Critical blockers only (those requiring exec attention)
  - Key decision points or asks
  - Overall health indicator (🟢 🟡 🔴)

  // Hybrid format includes:
  - Executive summary at top (1 paragraph)
  - Expandable detailed sections below
  - "TL;DR" callout boxes for key points
  ```

### Checkpoint 8.7: Export Functionality
- [ ] Create export utilities (`src/utils/statusExporter.js`):
  ```javascript
  // Export formats:
  - Plain text (copy to clipboard)
  - Markdown (GitHub/ADO Wiki compatible)
  - HTML (email-ready with styling)
  - PDF (future enhancement)

  // Email format generation:
  - Subject line suggestion
  - Proper greeting/signature placeholders
  - Optimized for Outlook/Gmail rendering
  - Inline CSS for consistent styling
  ```

### Checkpoint 8.8: Template System
- [ ] Template CRUD operations
- [ ] Template editor UI with section toggles
- [ ] Save custom templates with default values
- [ ] Share templates (export/import JSON)

### Implementation Notes

**Conversation Flow Example:**
```
Aiba: "Hi! Let's create your status update. What time period are we covering?"
User: "This week, Nov 1-7"

Aiba: "Great! I can pull recent data from Azure DevOps to make this easier.
       Should I fetch completed items from this week?"
User: "Yes please"

Aiba: "I found 8 completed items including Epic #4521 (Mobile Experience).
       What were the key accomplishments this week?"
User: "We finished the mobile login flow and fixed 3 critical bugs"

Aiba: "Excellent! Any blockers or risks I should know about?"
User: "Yes, waiting on API keys from vendor for payment integration"

Aiba: "Got it. What's next for the coming week?"
User: "Start payment gateway integration and begin user testing"

Aiba: "Perfect! I've generated your status update in three formats.
       Check the preview panel on the right →"
```

**Integration Points:**
- Uses existing `settingsStore` for ADO configuration
- Leverages existing `adoApi` utilities with new helper functions
- Shares AI service patterns with chat feature
- Reuses toast notification system
- Extends existing database with new tables

**Benefits:**
- ✅ Saves hours on weekly status reporting
- ✅ Ensures consistent format across all updates
- ✅ Reduces risk of forgetting important details
- ✅ Automatically includes ADO data and links
- ✅ Tailors message to audience (team vs executives)
- ✅ Creates audit trail of project progress over time

---

## Phase 9: ServiceNow Integration
**Goal:** Bidirectional integration with ServiceNow for project context and updates

### Overview
Extend Aiba to integrate with ServiceNow's Project Portfolio Management (PPM) and Project Management modules. This enables Aiba to pull project details, understand project context when writing status updates, post updates directly to ServiceNow, and answer questions about projects using ServiceNow as the source of truth.

**Key Features:**
- 🔗 **ServiceNow connectivity** - OAuth or API key authentication
- 📊 **Project context awareness** - Pull project metadata, milestones, resources
- 📝 **Status update posting** - Push updates directly to ServiceNow project records
- 💬 **Q&A about projects** - Ask Aiba questions, get answers from ServiceNow data
- 🔄 **Sync with ADO** - Map ServiceNow projects to ADO projects for unified view
- 📈 **Portfolio insights** - Aggregate data across multiple projects

### Checkpoint 9.1: Database Schema Extensions
- [ ] Create ServiceNow integration tables:
  ```sql
  servicenow_settings (
    id INTEGER PRIMARY KEY,
    instance_url TEXT,           -- https://yourcompany.service-now.com
    auth_type TEXT,               -- 'oauth' | 'basic' | 'api_key'
    api_key TEXT,                 -- Encrypted
    oauth_token TEXT,             -- Encrypted OAuth token
    oauth_refresh_token TEXT,     -- Encrypted
    token_expires_at DATETIME,
    default_table TEXT,           -- 'pm_project' or custom table
    last_sync_at DATETIME
  )

  servicenow_projects (
    id INTEGER PRIMARY KEY,
    sys_id TEXT UNIQUE,           -- ServiceNow sys_id
    number TEXT,                  -- Project number (e.g., PRJ0001234)
    name TEXT,
    short_description TEXT,
    description TEXT,
    state TEXT,                   -- active, planning, closed, etc.
    priority TEXT,
    percent_complete DECIMAL,
    start_date DATE,
    end_date DATE,
    project_manager TEXT,
    portfolio TEXT,
    business_unit TEXT,

    -- ADO mapping
    mapped_ado_project TEXT,
    mapped_ado_area_path TEXT,

    -- Cached data
    last_fetched DATETIME,
    raw_data TEXT                 -- JSON blob of full ServiceNow record
  )

  servicenow_status_updates (
    id INTEGER PRIMARY KEY,
    project_sys_id TEXT,
    status_update_id INTEGER,     -- Links to status_updates table
    snow_record_sys_id TEXT,      -- ServiceNow update note sys_id
    posted_at DATETIME,
    posted_by TEXT,

    FOREIGN KEY (status_update_id) REFERENCES status_updates(id)
  )

  servicenow_milestones (
    id INTEGER PRIMARY KEY,
    project_sys_id TEXT,
    sys_id TEXT,
    name TEXT,
    due_date DATE,
    state TEXT,
    percent_complete DECIMAL,
    description TEXT,
    last_fetched DATETIME,

    FOREIGN KEY (project_sys_id) REFERENCES servicenow_projects(sys_id)
  )
  ```

### Checkpoint 9.2: ServiceNow API Integration
- [ ] Create ServiceNow API client (`src/utils/snowApi.js`):
  ```javascript
  // Authentication
  async authenticateOAuth()
  async refreshOAuthToken()
  async authenticateBasic(username, password)
  async authenticateApiKey(apiKey)
  async testConnection()

  // Project queries
  async getProject(sysId)
  async listProjects(filters)
  async searchProjects(query)
  async getProjectDetails(sysId)  // Includes milestones, tasks, etc.

  // Project updates
  async updateProject(sysId, updates)
  async addProjectNote(sysId, note)  // Post status update as project note
  async updateProjectStatus(sysId, status, percentComplete)

  // Milestone queries
  async getProjectMilestones(projectSysId)
  async updateMilestone(sysId, updates)

  // Task/Work queries (if using ServiceNow for task management)
  async getProjectTasks(projectSysId)
  async getTaskDetails(sysId)

  // Portfolio/Program queries
  async getPortfolioProjects(portfolioSysId)
  async getProgramProjects(programSysId)

  // Custom table support
  async queryTable(tableName, query)
  async getRecord(tableName, sysId)
  async updateRecord(tableName, sysId, updates)
  ```

### Checkpoint 9.3: Backend API Routes
- [ ] Create ServiceNow routes (`/api/servicenow`):
  ```javascript
  // Settings & authentication
  POST   /api/servicenow/settings              // Save ServiceNow config
  GET    /api/servicenow/settings              // Get ServiceNow config
  POST   /api/servicenow/test                  // Test connection
  POST   /api/servicenow/oauth/authorize       // Start OAuth flow
  GET    /api/servicenow/oauth/callback        // OAuth callback

  // Project operations
  GET    /api/servicenow/projects              // List projects
  GET    /api/servicenow/projects/:sysId       // Get project details
  POST   /api/servicenow/projects/sync         // Sync projects from ServiceNow
  GET    /api/servicenow/projects/:sysId/milestones

  // Status update posting
  POST   /api/servicenow/projects/:sysId/status-update
         // Post status update as project note

  // Project Q&A
  POST   /api/servicenow/ask                   // Ask question about projects
         // Body: { question: "What's the status of Project X?" }
         // Returns: AI-generated answer based on ServiceNow data

  // ADO mapping
  POST   /api/servicenow/projects/:sysId/map-ado
         // Map ServiceNow project to ADO project
  GET    /api/servicenow/projects/:sysId/ado-items
         // Get ADO items for mapped project

  // Portfolio views
  GET    /api/servicenow/portfolio/:id/summary
         // Aggregate status across portfolio projects
  ```

### Checkpoint 9.4: AI Service for ServiceNow Q&A
- [ ] Create ServiceNow Q&A service (`src/services/snowQaService.js`):
  ```javascript
  // System prompt for ServiceNow Q&A
  - You are a project management assistant with access to ServiceNow data
  - Answer questions about projects, milestones, resources, budgets
  - Provide specific data points with sys_ids and links
  - Suggest related information user might want to know
  - Format answers clearly with bullet points and tables

  // Example interactions:
  Q: "What's the status of the Mobile App Redesign project?"
  A: "The Mobile App Redesign (PRJ0001234) is currently 65% complete:
      • Status: Active
      • Due date: 2025-12-15 (5 weeks remaining)
      • Project Manager: Jane Smith
      • Recent update (11/5): UI designs approved, dev in progress
      • Risk: API integration delayed by 1 week
      [View in ServiceNow →]"

  Q: "Which projects are behind schedule?"
  A: "3 projects are currently behind schedule:
      1. 🔴 Payment Integration (PRJ0001235) - 2 weeks overdue
      2. 🟡 Customer Portal v2 (PRJ0001240) - 1 week behind
      3. 🟡 Analytics Dashboard (PRJ0001243) - 3 days behind
      Would you like details on any of these?"

  // Features:
  - Multi-turn conversations (follow-up questions)
  - Aggregate queries across projects
  - Time-series analysis (trends over time)
  - Comparison queries (Project A vs Project B)
  ```

### Checkpoint 9.5: Frontend UI Components
- [ ] Add ServiceNow section to Settings page:
  ```jsx
  // Settings additions
  - ServiceNow instance URL
  - Authentication method selector (OAuth / Basic / API Key)
  - OAuth authorize button
  - Test connection button
  - Default project table name
  - Auto-sync toggle (enable/disable background sync)
  ```

- [ ] Create Projects page (`/projects`):
  ```jsx
  // Main projects view
  - List of ServiceNow projects (synced from ServiceNow)
  - Filter by: state, priority, portfolio, business unit
  - Search by: project name, number, description
  - Sort by: start date, end date, % complete, priority

  // Project cards show:
  - Project number and name
  - Progress bar (% complete)
  - Status badge (Active / Planning / On Hold / Closed)
  - Priority indicator
  - Key dates (start, end, next milestone)
  - Project manager
  - Link to ServiceNow
  - Link to mapped ADO project (if mapped)

  // Actions:
  - Click card → View project details
  - "Write Status Update" button → Starts status conversation with project context
  - "Ask About Project" button → Opens Q&A modal
  - "View in ServiceNow" button → External link
  - "Map to ADO" button → Opens ADO mapping dialog
  ```

- [ ] Create ProjectDetailsModal component:
  ```jsx
  // Full project details in modal
  - All project fields from ServiceNow
  - Milestones list with progress
  - Recent status updates (from ServiceNow notes)
  - Linked ADO work items (if mapped)
  - Edit project fields (updates ServiceNow)
  - Add status update button
  ```

- [ ] Create ProjectMappingDialog component:
  ```jsx
  // Map ServiceNow project to ADO
  - ServiceNow project details (read-only)
  - ADO project dropdown (list from settings)
  - ADO area path dropdown
  - ADO iteration path (optional)
  - Preview: "This will link work items in ADO area path X to ServiceNow project Y"
  - Save mapping button
  ```

- [ ] Create ServiceNowQA component:
  ```jsx
  // Q&A interface for ServiceNow data
  - Chat-style interface (similar to ChatPage)
  - Pre-built question prompts:
    • "Show me all active projects"
    • "Which projects are at risk?"
    • "What's due this week?"
    • "Portfolio health summary"
  - Answers include:
    • Structured data (tables, lists)
    • Links to ServiceNow records
    • Visualizations (progress bars, status icons)
    • Follow-up question suggestions
  ```

### Checkpoint 9.6: Status Update Integration
- [ ] Enhance status update generation with ServiceNow context:
  ```javascript
  // When creating status update:
  1. User selects ServiceNow project (dropdown)
  2. Aiba pulls project details from ServiceNow
  3. Conversation includes project context:
     - Project name, number, manager
     - Current % complete and milestones
     - Recent ServiceNow notes
     - Mapped ADO work items (if mapped)
  4. Generated status update includes:
     - ServiceNow project link
     - Milestone progress
     - ADO work item progress (if mapped)
  5. After generation, offer to:
     - Post to ServiceNow as project note
     - Update project % complete
     - Update project status field
  ```

- [ ] Add "Post to ServiceNow" button in StatusPreviewPanel:
  ```jsx
  // After generating status update
  - "Post to ServiceNow" button
  - Modal asks:
    • Which project? (dropdown)
    • Update project status? (Yes/No)
    • Update % complete? (input field)
    • Add as project note? (Yes/No)
  - Shows success with link to ServiceNow record
  ```

### Checkpoint 9.7: Project-ADO Mapping Logic
- [ ] Create mapping service (`src/services/projectMappingService.js`):
  ```javascript
  // Mapping operations
  async createMapping(snowProjectSysId, adoProject, adoAreaPath)
  async getMapping(snowProjectSysId)
  async updateMapping(mappingId, updates)
  async deleteMapping(mappingId)

  // Aggregate views
  async getProjectWithAdoItems(snowProjectSysId) {
    // Returns:
    // - ServiceNow project details
    // - All mapped ADO work items
    // - Combined progress calculation
    // - Risk assessment based on both systems
  }

  async syncProjectProgress(snowProjectSysId) {
    // Calculate % complete from ADO work items
    // Update ServiceNow project % complete field
    // Post automatic status note about progress
  }
  ```

### Checkpoint 9.8: Background Sync & Caching
- [ ] Extend cron jobs for ServiceNow sync:
  ```javascript
  // node-cron jobs
  - Every hour: Refresh ServiceNow projects cache
  - Every 6 hours: Sync milestones
  - Every 12 hours: Update project progress from ADO (for mapped projects)
  - Daily: Clean up old ServiceNow data (> 90 days)
  ```

- [ ] Cache management:
  ```javascript
  // Cache strategy
  - Store full ServiceNow project data as JSON blob
  - Index key fields in dedicated columns for fast queries
  - Refresh individual project on-demand (when user views details)
  - Batch refresh all projects on schedule
  - Invalidate cache when user makes changes
  ```

### Checkpoint 9.9: Portfolio Dashboard (Optional Enhancement)
- [ ] Create portfolio view (`/portfolio`):
  ```jsx
  // Aggregate view across all projects
  - Portfolio health at a glance
    • Total projects by state (pie chart)
    • Projects at risk (count with red indicator)
    • Overall portfolio % complete (average)
    • Budget utilization (if available in ServiceNow)

  - Timeline view
    • Gantt-style chart of project timelines
    • Milestone markers
    • Color-coded by status (on track / at risk / blocked)

  - Capacity view
    • Projects by team/business unit
    • Resource allocation (if available)
    • Upcoming deliverables (next 30 days)

  - Quick actions
    • "Generate Portfolio Status Update" (executive summary)
    • "Ask Portfolio Questions" (Q&A across all projects)
    • "Export Portfolio Report" (PDF/Excel)
  ```

### Implementation Notes

**ServiceNow API Details:**
- Uses REST API: `https://instance.service-now.com/api/now/table/{table}`
- Common tables:
  - `pm_project` - Projects
  - `pm_project_task` - Project tasks
  - `pm_milestone` - Milestones
  - `pm_program` - Programs
  - `pm_portfolio` - Portfolios
- Query syntax: `sysparm_query` (encoded query string)
- Response format: JSON with `result` array
- Pagination: `sysparm_limit` and `sysparm_offset`
- Field selection: `sysparm_fields` (specify fields to return)

**OAuth Flow:**
1. Register OAuth application in ServiceNow
2. Redirect user to ServiceNow authorization URL
3. ServiceNow redirects back with auth code
4. Exchange auth code for access token + refresh token
5. Store tokens securely (encrypted in database)
6. Refresh token before expiration (typically 60 minutes)

**Security Considerations:**
- Encrypt ServiceNow credentials at rest
- Use OAuth instead of Basic Auth in production
- Validate SSL certificates for ServiceNow connections
- Implement rate limiting for ServiceNow API calls
- Log all ServiceNow API interactions for audit
- Respect ServiceNow field-level permissions (ACLs)

**Benefits:**
- ✅ Single source of truth for project data
- ✅ Eliminates manual data entry into ServiceNow
- ✅ Unified view of project (ServiceNow + ADO)
- ✅ Automated status update posting
- ✅ AI-powered project insights and Q&A
- ✅ Portfolio-level visibility and reporting
- ✅ Reduces context switching between tools

**Integration with Phase 8:**
When generating status updates with ServiceNow integration:
1. Pull project metadata from ServiceNow
2. Pull work item progress from ADO
3. Combine both data sources in conversation
4. Generate unified status update
5. Post back to both ServiceNow (as note) and ADO (optional wiki page)

---

## UI Concepts

### Backlog List/Grouped View
```
┌─────────────────────────────────────────────────────────┐
│  StoryForge          [Chat] [Backlog] [Settings]        │
├─────────────────────────────────────────────────────────┤
│  Backlog  [List|Grouped|Kanban|Sprint] 🔄 Last: 2m ago  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Filters: [All Types▼] [All States▼] 🔍 Search  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📦 Epic: Mobile Experience (12 items, 45% complete)   │
│  ├─ [DRAG] 🐛 #4521 Login button unresponsive          │
│  ├─ [DRAG] 📋 #4520 Add biometric auth                 │
│  └─ [DRAG] ✓ #4519 Improve onboarding flow             │
│                                                         │
│  📦 Epic: API Integration (8 items, 20% complete)      │
│  ├─ [DRAG] 📋 #4518 Connect to payment gateway         │
│  └─ [DRAG] 🐛 #4517 API timeout on slow connections    │
│                                                         │
│  [+ Create New Work Item]                              │
└─────────────────────────────────────────────────────────┘
```

### Kanban View
```
┌──────────────┬──────────────┬──────────────┬──────────┐
│ New (5)      │ Active (8)   │ Resolved (3) │ Closed   │
├──────────────┼──────────────┼──────────────┼──────────┤
│ [DRAG]       │ [DRAG]       │ [DRAG]       │          │
│ 🐛 #4521     │ 📋 #4520     │ ✓ #4519      │          │
│ Login issue  │ Biometric... │ Onboarding   │          │
│              │              │              │          │
│ [DRAG]       │ [DRAG]       │              │          │
│ 📋 #4518     │ 🐛 #4517     │              │          │
│ Payment...   │ Timeout...   │              │          │
└──────────────┴──────────────┴──────────────┴──────────┘
```

---

## Tech Stack Implementation Details

**Frontend (`/frontend`)**
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "axios": "^1.x",
    "marked": "^12.x",
    "date-fns": "^3.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x"
  },
  "devDependencies": {
    "vite": "^7.x",
    "tailwindcss": "^3.x",
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

**Backend (`/backend`)**
```json
{
  "dependencies": {
    "express": "^4.x",
    "better-sqlite3": "^11.x",
    "@anthropic-ai/sdk": "^0.x",
    "openai": "^4.x",
    "axios": "^1.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "node-cron": "^3.x",
    "passport-azure-ad": "^4.x",
    "express-session": "^1.x",
    "csurf": "^1.x",
    "helmet": "^7.x",
    "express-rate-limit": "^7.x",
    "dompurify": "^3.x",
    "jsdom": "^24.x"
  },
  "devDependencies": {
    "nodemon": "^3.x",
    "concurrently": "^8.x"
  }
}
```

**Root `package.json`**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend"
  },
  "workspaces": ["frontend", "backend"]
}
```

---

## Environment Variables

**Backend `.env`**
```
PORT=3001
NODE_ENV=development
DB_PATH=./storage/storyforge.db
```

*Note: ADO and AI credentials stored in SQLite, not env vars*

---

## Post-POC Enhancements
**Goal:** Polish the POC before showing to team/stakeholders

These items from Phase 6 are postponed but recommended before wider adoption:

### Error Handling & Resilience
- [ ] Global error boundary in React (catch unexpected errors gracefully)
- [ ] User-friendly error messages (translate technical errors)
- [ ] Loading states for all async operations (better UX feedback)
- [ ] Retry logic with exponential backoff (handle transient ADO API failures)
- [ ] Request queuing for ADO API (rate limiting protection)

### UX Improvements
- [ ] Confirmation dialogs for destructive actions (prevent accidents)
- [ ] Keyboard shortcuts (Ctrl+Enter to send messages, Esc to close modals)

### Maintenance & Cleanup
- [ ] Clean up old conversations (> 30 days) via cron job
- [ ] Conversation history management UI (delete old chats)

### Testing & Quality
- [ ] Test all work item types (Bug, Issue, Task, Epic)
- [ ] Test duplicate detection accuracy
- [ ] Verify ADO integration end-to-end
- [ ] Test with invalid/missing settings
- [ ] Browser compatibility (Chrome, Edge, Firefox)

### Deployment
- [ ] Build production bundle (`npm run build`)
- [ ] Create deployment README with setup instructions
- [ ] Environment variable documentation

**Recommendation:** Implement these before showing the tool to your team. They add polish without changing core functionality.

---

## Optional Future Enhancements
*(Post-Production, based on user feedback and team needs)*

- [ ] Batch story creation mode
- [ ] Export conversation as markdown
- [ ] Attachment support for bugs (store in backend/storage/)
- [ ] Voice-only mode (continuous dictation)
- [ ] Azure Speech API for enterprise dictation (vs Web Speech API)
- [ ] Custom story templates per team
- [ ] Analytics dashboard (stories created, avg time, etc.)
- [ ] Multi-user support with auth
- [ ] Integration with Teams/Slack for notifications
- [ ] Calendar view for sprint timeline
- [ ] Dependency tracking between work items
- [ ] AI-suggested acceptance criteria improvements
- [ ] Work item cloning with smart defaults
- [ ] Bulk import from CSV/Excel

**Note:** Phase 1.5 (Security & Enterprise Prep) is NOT optional for company deployment - it's required before showing to anyone beyond yourself.

---

## POC vs Production Roadmap

### 🚀 POC Phase (Just You - 2-4 weeks) ✅ COMPLETE
**Goal:** Prove the concept works and is valuable

**Build:**
- ✅ Phase 1: Foundation & Setup - COMPLETE
- ✅ Phase 2: Settings & Configuration - COMPLETE
- ✅ Phase 3: Core Chat Interface - COMPLETE
- ✅ Phase 4: Smart Features (duplicate detection, parent selection) - COMPLETE
- ✅ Phase 5: Preview & Creation - COMPLETE
- ✅ Phase 6: Polish & optimization (essentials) - COMPLETE
- ✅ Phase 7: Backlog Management - COMPLETE
- ✅ PAT-based authentication (simple, fast)
- ✅ SQLite database (zero config)
- ✅ Toast notifications (no more ugly alerts!)
- ✅ Auto cache refresh (hourly)
- ⏸️ Markdown descriptions (convert to HTML on push) - OPTIONAL

**Skipped (Not needed for POC):**
- ❌ OAuth (not needed for single user)
- ❌ Field mapping UI (fields work with Basic template)
- ❌ Advanced security (CSRF, etc.)

**Current Status:**
- ✅ POC IS COMPLETE AND READY TO USE!
- ✅ Core value loop: Chat → Extract → Preview → Create in ADO
- ✅ Smart features: Duplicate detection + Parent selection
- ✅ Backlog management: 4 view modes with drag-and-drop
- ✅ Process template aware: Auto-adapts to Basic/Agile/Scrum/CMMI
- ✅ Polish: Toast notifications + auto refresh

**Success Criteria:**
- ✅ Can create a properly formatted work item via conversation in < 2 minutes
- ✅ Duplicate detection catches similar work items
- ✅ Parent/epic linking works
- ✅ Backlog management with drag-and-drop works
- ✅ System adapts to your ADO process template
- ✅ Ready to use daily for personal work item creation!

---

### 🏢 Pre-Company Phase (Before Demo - 1-2 weeks)
**Goal:** Harden for enterprise deployment

**Add (Required before company deployment):**
- [ ] Post-POC Enhancements (see section above)
  - [ ] Error handling & resilience
  - [ ] UX improvements (keyboard shortcuts, confirmations)
  - [ ] Testing & quality assurance
- [ ] Phase 1.5 (Security & Enterprise Prep)
- [ ] OAuth 2.0 with Azure AD
- [ ] Field mapping configuration UI
- [ ] CSRF protection + security headers
- ✅ Proper CORS configuration
- ✅ Session management

**Test:**
- Real ADO data with your team's process template
- Multiple work item types (Story, Bug, Task)
- Edge cases (missing fields, duplicate detection, failures)

**Success Criteria:**
- Security team approves the authentication approach
- Works with your company's ADO customizations
- No credentials stored insecurely

---

### 🎯 Production Phase (Company Adoption - Ongoing)
**Goal:** Scale to team/organization

**Upgrade:**
- ✅ Phase 6 (Polish & Optimization)
- ✅ Phase 7 (Backlog Management - simplified)
- ✅ Migrate SQLite → PostgreSQL (if multi-user)
- ✅ Add proper job queue (BullMQ/Redis instead of node-cron)
- ✅ Incremental cache sync (WIQL + ETags)
- ✅ Azure Functions deployment (optional)
- ✅ Monitoring & logging (Application Insights)
- ✅ Usage analytics dashboard

**Optional Enhancements:**
- Multi-tenant support
- Custom story templates per team
- Integration with Teams/Slack
- Azure Speech API for dictation
- Batch creation mode

**Success Criteria:**
- 50%+ team adoption rate
- Average story creation time < 3 minutes
- 90%+ stories have all required fields
- Zero security incidents

---

## Development Workflow

### POC Build Order (Recommended)
1. **Phase 1** - Foundation (monorepo, database, API structure)
2. **Phase 2** - Settings (validate ADO connectivity works)
3. **Phase 3** - Chat interface (core value proposition)
4. **Phase 4** - Smart features (duplicate detection, parent suggestion)
5. **Phase 5** - Preview & creation (complete the loop)
6. **Test & validate** - Use it yourself for 1-2 weeks

### Pre-Company Build Order
1. **Phase 1.5** - Security & enterprise prep (OAuth, field mapping, hardening)
2. **Phase 6** - Polish & optimization (error handling, UX refinements)
3. **Security audit** - Get approval from your security team

### Production Build Order
1. **Infrastructure upgrade** - Postgres, job queue, monitoring
2. **Phase 7** - Backlog management (if needed)
3. **Scale testing** - Multiple users, large backlogs
4. **Ongoing maintenance** - Bug fixes, feature requests

**Key Principle:** Build → Validate → Harden → Scale

Don't over-engineer the POC. Prove it works first, then make it production-ready.

---

## Success Metrics

- **Time saved:** Measure avg time to create a work item (vs manual ADO entry)
- **Adoption rate:** # of team members using the tool
- **Quality improvement:** % of stories with all required fields filled
- **Duplicate prevention:** # of duplicates caught before creation
- **User satisfaction:** Simple thumbs up/down after each creation

---

## Security Considerations

### POC Phase (Single User)
- PAT tokens stored in SQLite (acceptable for testing)
- Use limited-scope PATs (Work Items: Read & Write only)
- No authentication required (single-user local tool)
- All API calls go through backend (no direct ADO calls from frontend)

### Production Phase (Multi-User / Company Deployment)
- **Authentication:** OAuth 2.0 with Azure AD
  - Required scopes: `vso.work`, `vso.work_write`, `vso.identity`
  - HTTP-only cookies with short TTL sessions
  - Token refresh flow implemented
  - Secure logout endpoint
- **Authorization:** Token storage server-side only (never in browser)
- **CSRF Protection:** Use `csurf` middleware on all state-changing endpoints
- **CORS:** Lock to specific frontend origin (no wildcards)
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Lax` flags
- **Input Sanitization:** Sanitize all user input before sending to AI or ADO
- **Rate Limiting:** Prevent API abuse with `express-rate-limit`
- **Security Headers:** Use `helmet` middleware
- **HTML Sanitization:** Sanitize HTML output to prevent XSS attacks
- **Secrets Management:** Consider Azure Key Vault for production secrets
- **Audit Logging:** Log all work item creation/updates with user attribution

### Data Privacy
- Conversations stored in SQLite (consider encryption at rest for sensitive data)
- Regular cleanup of old conversations (30+ days)
- No PII sent to AI models without user consent
- Comply with company data retention policies

---

**Ready to build!** Start with Phase 1 and iterate from there. Good luck! 🚀