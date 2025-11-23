# Aiba

AI Business Analyst - A conversational AI tool that guides anyone through creating properly formatted Azure DevOps work items.

## 🎯 Status: Core Features Complete!

The main conversation → extraction → preview → create workflow is **fully functional**. You can:
- 💬 Have a natural conversation with Claude AI about your work item
- 🤖 Automatically extract structured data (title, description, acceptance criteria, etc.)
- 👀 Preview and edit the work item before creation
- ✅ Create the work item in Azure DevOps with one click
- 📜 View history of recently created items

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed implementation status and roadmap.

## Project Structure

```
aiba/
├── packages/
│   ├── frontend/          # React 19 + Vite + Tailwind
│   └── backend/           # Node.js + Express + SQLite
├── package.json           # Root workspace configuration
└── PROJECT_PLAN.md        # Detailed implementation plan
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install all dependencies
npm install
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:3001
```

### Build

```bash
# Build frontend for production
npm run build
```

## Configuration

Backend configuration is in `packages/backend/.env`:
```
PORT=3001
NODE_ENV=development
DB_PATH=./storage/storyforge.db
```

Configure Azure DevOps and AI credentials through the Settings page in the application.

## Features

- **Conversational UI** - Natural language interface for describing work items
- **AI-Powered Extraction** - Automatic data extraction and validation using Claude AI
- **Azure DevOps Integration** - Direct API integration with ADO
- **Basic Process Support** - Works with Issue, Task, and Epic work item types
- **Conversation History** - SQLite database stores all conversations
- **Settings Management** - Easy configuration through web interface

## Tech Stack

**Frontend:**
- React 19
- Vite 6
- Zustand (state management)
- React Router (routing)
- Tailwind CSS (styling)
- Axios (HTTP client)

**Backend:**
- Node.js + Express
- SQLite (better-sqlite3)
- Anthropic Claude Sonnet 4.5
- Azure DevOps REST API

## License

MIT License - See LICENSE file for details
