import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './components/layout/MainLayout'
import SettingsPage from './pages/SettingsPage'
import BacklogPage from './pages/BacklogPage'
import StageGatePage from './pages/StageGatePage'
import RoadmapPage from './pages/RoadmapPage'
import FeatureDetailPage from './pages/FeatureDetailPage'
import InnovationFunnelPage from './pages/InnovationFunnelPage'

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoadmapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/backlog" element={<BacklogPage />} />
          <Route path="/stagegate" element={<StageGatePage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/innovation" element={<InnovationFunnelPage />} />
          <Route path="/feature/:id" element={<FeatureDetailPage />} />
        </Route>
      </Routes>
    </Router>
  )
}


export default App
