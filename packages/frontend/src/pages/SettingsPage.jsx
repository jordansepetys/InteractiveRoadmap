import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSettingsStore from '../stores/settingsStore';
import useFeatureVisibilityStore from '../stores/featureVisibilityStore';

export default function SettingsPage() {
  const {
    settings,
    configured,
    loading,
    saving,
    testing,
    error,
    testResult,
    fetchSettings,
    saveSettings,
    testAdoConnection,
    clearError,
    clearTestResult
  } = useSettingsStore();

  const [formData, setFormData] = useState({
    ado_org_url: '',
    ado_project: '',
    ado_pat: '',
    area_path: '',
    iteration_path: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    features: visibilityFeatures,
    loading: visibilityLoading,
    saving: visibilitySaving,
    fetchFeatures,
    updateFeatureVisibility
  } = useFeatureVisibilityStore();

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
    fetchFeatures();
  }, [fetchSettings, fetchFeatures]);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        ado_org_url: settings.ado_org_url || '',
        ado_project: settings.ado_project || '',
        ado_pat: '', // Don't populate PAT for security
        area_path: settings.area_path || '',
        iteration_path: settings.iteration_path || ''
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    clearError();
    setShowSuccess(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.ado_org_url.trim()) {
      errors.ado_org_url = 'Organization URL is required';
    } else if (!formData.ado_org_url.startsWith('https://dev.azure.com/')) {
      errors.ado_org_url = 'Must start with https://dev.azure.com/';
    }

    if (!formData.ado_project.trim()) {
      errors.ado_project = 'Project name is required';
    }

    if (!formData.ado_pat.trim() && !configured) {
      errors.ado_pat = 'Personal Access Token is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    clearTestResult();
    setShowSuccess(false);

    if (!validateForm()) {
      return;
    }

    // Only send PAT if filled in
    const dataToSend = { ...formData };
    if (!dataToSend.ado_pat) delete dataToSend.ado_pat;

    const result = await saveSettings(dataToSend);

    if (result.success) {
      setShowSuccess(true);
      // Clear PAT field after successful save
      setFormData(prev => ({
        ...prev,
        ado_pat: ''
      }));
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const handleTestConnection = async () => {
    clearTestResult();
    await testAdoConnection();
  };

  const handleToggleFeatureVisibility = async (featureId, currentVisibility) => {
    await updateFeatureVisibility(featureId, !currentVisibility);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Chat
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure your Azure DevOps credentials
            </p>
          </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Azure DevOps Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Azure DevOps Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="ado_org_url" className="block text-sm font-medium text-gray-700">
                  Organization URL *
                </label>
                <input
                  type="text"
                  id="ado_org_url"
                  name="ado_org_url"
                  value={formData.ado_org_url}
                  onChange={handleChange}
                  placeholder="https://dev.azure.com/yourorg"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    formErrors.ado_org_url
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {formErrors.ado_org_url && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.ado_org_url}</p>
                )}
              </div>

              <div>
                <label htmlFor="ado_project" className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="ado_project"
                  name="ado_project"
                  value={formData.ado_project}
                  onChange={handleChange}
                  placeholder="MyProject"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    formErrors.ado_project
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {formErrors.ado_project && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.ado_project}</p>
                )}
              </div>

              <div>
                <label htmlFor="ado_pat" className="block text-sm font-medium text-gray-700">
                  Personal Access Token {!configured && '*'}
                </label>
                <input
                  type="password"
                  id="ado_pat"
                  name="ado_pat"
                  value={formData.ado_pat}
                  onChange={handleChange}
                  placeholder={configured ? '(hidden - leave blank to keep current)' : 'Enter PAT'}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    formErrors.ado_pat
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                {formErrors.ado_pat && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.ado_pat}</p>
                )}
                {configured && settings?.ado_pat_configured && (
                  <p className="mt-1 text-sm text-green-600">✓ PAT configured</p>
                )}
              </div>

              <div>
                <label htmlFor="area_path" className="block text-sm font-medium text-gray-700">
                  Area Path (optional)
                </label>
                <input
                  type="text"
                  id="area_path"
                  name="area_path"
                  value={formData.area_path}
                  onChange={handleChange}
                  placeholder="MyProject\\Area"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="iteration_path" className="block text-sm font-medium text-gray-700">
                  Iteration Path (optional)
                </label>
                <input
                  type="text"
                  id="iteration_path"
                  name="iteration_path"
                  value={formData.iteration_path}
                  onChange={handleChange}
                  placeholder="MyProject\\Sprint 1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Feature Visibility Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Feature Visibility
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Control which features are displayed on the Roadmap and Stage Gate pages
            </p>

            {visibilityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">Loading features...</div>
              </div>
            ) : visibilityFeatures.length === 0 ? (
              <div className="text-sm text-gray-500 italic py-4">
                No features found. Configure Azure DevOps settings and refresh to see available features.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feature Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visible
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibilityFeatures.map((feature) => (
                      <tr key={feature.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          #{feature.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {feature.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {feature.state}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleToggleFeatureVisibility(feature.id, feature.isVisible)}
                            disabled={visibilitySaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                              feature.isVisible ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                feature.isVisible ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">Settings saved successfully!</div>
                </div>
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-md p-4 ${testResult.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${testResult.success ? 'text-green-700' : 'text-yellow-700'}`}>
                    {testResult.message || testResult.error}
                    {testResult.project && (
                      <div className="mt-2">
                        <strong>Project:</strong> {testResult.project.name} ({testResult.project.state})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !configured}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test ADO Connection'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
