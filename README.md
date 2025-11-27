# Interactive Roadmap

A modern web application for visualizing and managing Azure DevOps features through interactive roadmap and stage gate views. Built for product managers, team leads, and stakeholders who need clear visibility into feature planning and workflow progression.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)

## ✨ Features

### 📊 Interactive Roadmap
- **Timeline Visualization** - View features on a calendar timeline with start and target dates
- **Epic Swimlanes** - Features automatically grouped by parent Epic with color coding
- **Scheduled vs Unscheduled** - Clear separation of planned features from backlog items
- **Direct Navigation** - Click any feature to open directly in Azure DevOps

### 🎯 Stage Gate Board
- **Kanban-Style View** - Visualize features across 5 workflow stages (Intake → Discovery → Development → Testing → Complete)
- **Drag & Drop Prioritization** - Reorder features in the Intake stage to set priorities
- **Auto-sync to ADO** - Priority changes automatically update Azure DevOps Priority field
- **Collapsible Sections** - Minimize Intake and Complete stages for focused view

### 👁️ Feature Visibility Controls
- **Selective Display** - Toggle visibility of individual features from roadmap and stage gate views
- **Centralized Management** - Settings page shows all features with easy on/off toggles
- **Persistent Preferences** - Visibility settings saved to SQLite database

### 📋 Backlog View
- **Hierarchical Tree** - Visual parent-child relationships (Epic → Feature → User Story → Task)
- **Expandable Nodes** - Click to expand/collapse branches
- **Work Item Details** - View state, assignee, and quick stats
- **Direct ADO Links** - Open any work item in Azure DevOps

### 📤 Export to HTML
- **Self-Contained Files** - Export roadmap or stage gate as standalone HTML files
- **Full Interactivity** - Click features to view descriptions, acceptance criteria, and details
- **No Server Required** - Open exported files directly in any browser, works offline
- **Shareable** - Email to stakeholders or upload to SharePoint - no deployment needed
- **Print-Friendly** - Optimized styles for printing

### ⚙️ Azure DevOps Integration
- **Direct API Integration** - Connects directly to Azure DevOps REST API
- **Secure Credential Storage** - All credentials encrypted in SQLite (not in files)
- **Multiple Process Templates** - Supports Basic, Agile, Scrum, and CMMI templates
- **Real-time Sync** - Refresh button fetches latest data from ADO

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Azure DevOps account with Personal Access Token (PAT)

### Installation

```bash
# Clone the repository
git clone https://github.com/jordansepetys/InteractiveRoadmap.git
cd InteractiveRoadmap

# Install all dependencies
npm install
```

### Configuration

1. Start the application:
```bash
npm run dev
```

2. Navigate to **Settings** (gear icon in sidebar)

3. Configure your Azure DevOps connection:
   - **Organization URL**: `https://dev.azure.com/yourorg`
   - **Project Name**: Your ADO project name
   - **Personal Access Token**: Create one at `https://dev.azure.com/[yourorg]/_usersSettings/tokens`
     - Required scopes: `Work Items (Read & Write)`
   - **Area Path** (optional): Filter to specific area
   - **Iteration Path** (optional): Filter to specific iteration

4. Click **Save Settings** and then **Test ADO Connection** to verify

### Usage

The app will automatically open to the Roadmap view. Use the sidebar to navigate:

- **Roadmap** - Timeline visualization of scheduled features
- **Stage Gate** - Kanban board with workflow stages
- **Backlog** - Hierarchical tree view of all work items
- **Settings** - Configure ADO credentials and feature visibility

## 📁 Project Structure

```
interactive-roadmap/
├── packages/
│   ├── frontend/              # React frontend application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page-level components
│   │   │   ├── stores/        # Zustand state management
│   │   │   └── utils/         # Helper functions
│   │   └── package.json
│   │
│   └── backend/               # Node.js backend API
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── services/      # Business logic
│       │   ├── database/      # SQLite schema and migrations
│       │   └── utils/         # ADO API client
│       └── package.json
│
├── package.json               # Root workspace configuration
└── README.md                  # This file
```

## 🛠️ Tech Stack

**Frontend:**
- React 19 - Modern UI framework
- Vite 6 - Fast build tool and dev server
- Zustand - Lightweight state management
- React Router - Client-side routing
- Tailwind CSS - Utility-first styling
- @dnd-kit - Drag and drop functionality
- Axios - HTTP client

**Backend:**
- Node.js + Express - RESTful API server
- SQLite (better-sqlite3) - Embedded database
- Azure DevOps REST API - Direct integration
- CORS - Cross-origin resource sharing

**Development:**
- ESLint - Code linting
- Concurrently - Run frontend/backend together
- Hot Module Replacement - Fast development

## 🔧 Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3001

# Build for production
npm run build
```

## 📊 API Endpoints

### Settings
- `GET /api/settings` - Get ADO configuration
- `POST /api/settings` - Save ADO configuration
- `POST /api/settings/test-ado` - Test ADO connection

### Roadmap
- `GET /api/roadmap/features` - Get features with dates for timeline

### Stage Gate
- `GET /api/stagegate/features` - Get features grouped by stage
- `GET /api/stagegate/feature/:id` - Get feature details
- `POST /api/stagegate/update-priorities` - Bulk update priorities

### Feature Visibility
- `GET /api/feature-visibility` - Get all features with visibility status
- `POST /api/feature-visibility/update` - Update single feature visibility
- `POST /api/feature-visibility/bulk-update` - Update multiple features

### Export
- `GET /api/export/roadmap-html` - Download roadmap as self-contained HTML
- `GET /api/export/stagegate-html` - Download stage gate as self-contained HTML

### Backlog
- `GET /api/ado/backlog` - Get hierarchical backlog tree

## 🔒 Security

- **Credentials**: All Azure DevOps credentials are stored encrypted in SQLite, never in code or .env files
- **Local Database**: SQLite database is gitignored and never committed
- **Token Safety**: Personal Access Tokens are not exposed in browser or logs
- **CORS**: Configured to only allow requests from frontend origin

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Azure DevOps REST API documentation
- React and Vite communities

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Note**: This application requires an active Azure DevOps account and valid Personal Access Token to function.
