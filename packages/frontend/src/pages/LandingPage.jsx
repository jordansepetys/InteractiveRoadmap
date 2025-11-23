import { Link } from 'react-router-dom';

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      {/* Settings Button - Top Right */}
      <Link
        to="/settings"
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-white/70 backdrop-blur-md hover:bg-white/90 rounded-full shadow-lg hover:shadow-xl transition-all z-20 border border-white/30"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Settings
      </Link>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-light text-slate-900 mb-4 drop-shadow-sm">
            Aiba
          </h1>
          <p className="text-slate-700 text-2xl font-light mb-8">
            Manage your Azure DevOps roadmap and workflow
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">

            <Link
              to="/backlog"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/70 backdrop-blur-md text-slate-800 font-semibold text-lg rounded-full shadow-lg hover:shadow-xl border border-white/40 hover:border-red-400/50 hover:bg-white/90 transition-all transform hover:scale-105"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              View Backlog
            </Link>

            <Link
              to="/stagegate"
              className="inline-flex items-center gap-3 px-8 py-4 bg-red-600/90 backdrop-blur-sm text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-red-600 transition-all transform hover:scale-105 border border-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Stage Gate
            </Link>

            <Link
              to="/roadmap"
              className="inline-flex items-center gap-3 px-8 py-4 bg-slate-700/90 backdrop-blur-sm text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all transform hover:scale-105 border border-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Roadmap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
