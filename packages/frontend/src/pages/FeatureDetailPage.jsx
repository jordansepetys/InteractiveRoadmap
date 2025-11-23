import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import useSettingsStore from '../stores/settingsStore';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function FeatureDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, fetchSettings } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [workItem, setWorkItem] = useState(null);
  const [wiki, setWiki] = useState(null);
  const [childItems, setChildItems] = useState([]);
  const [parentItem, setParentItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const fetchFeatureDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch complete feature details
        const response = await axios.get(`/api/ado/feature/${id}`);

        if (response.data.success) {
          setWorkItem(response.data.workItem);
          setWiki(response.data.wiki);
          setChildItems(response.data.childItems || []);

          // If there's a parent, fetch its details
          const parentId = response.data.workItem.fields['System.Parent'];
          if (parentId) {
            try {
              const parentResponse = await axios.get(`/api/ado/work-items/${parentId}`);
              setParentItem(parentResponse.data.workItem);
            } catch (parentError) {
              console.error('Failed to fetch parent:', parentError);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching feature details:', err);
        setError(err.response?.data?.error || 'Failed to load feature details');
        toast.error('Failed to load feature details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFeatureDetails();
    }
  }, [id]);

  const getAdoUrl = (itemId) => {
    if (!settings?.ado_org_url || !settings?.ado_project) return '#';
    const baseUrl = settings.ado_org_url.replace(/\/$/, '');
    return `${baseUrl}/${settings.ado_project}/_workitems/edit/${itemId}`;
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  // Calculate health indicator based on days in state
  const getHealthStatus = () => {
    if (!workItem) return 'healthy';
    const changedDate = workItem.fields['System.ChangedDate'];
    if (!changedDate) return 'healthy';

    const days = differenceInDays(new Date(), parseISO(changedDate));
    if (days > 30) return 'critical';
    if (days > 14) return 'warning';
    return 'healthy';
  };

  const healthColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    healthy: 'bg-green-100 text-green-800 border-green-300'
  };

  const healthLabels = {
    critical: 'At Risk',
    warning: 'Needs Attention',
    healthy: 'On Track'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-sm text-slate-500">Loading feature details...</p>
        </div>
      </div>
    );
  }

  if (error || !workItem) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Error loading feature</h3>
          <p className="text-slate-500 mb-6">{error || 'Feature not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fields = workItem.fields;
  const workItemType = fields['System.WorkItemType'];
  const title = fields['System.Title'];
  const state = fields['System.State'];
  const description = fields['System.Description'];
  const assignedTo = fields['System.AssignedTo'];
  const priority = fields['Microsoft.VSTS.Common.Priority'];
  const startDate = fields['Microsoft.VSTS.Scheduling.StartDate'];
  const targetDate = fields['Microsoft.VSTS.Scheduling.TargetDate'];
  const tags = fields['System.Tags'];
  const createdBy = fields['System.CreatedBy'];
  const createdDate = fields['System.CreatedDate'];
  const health = getHealthStatus();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={copyShareLink}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Share
              </button>
              {wiki && (
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  View Wiki
                </a>
              )}
              <a
                href={getAdoUrl(workItem.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                View in ADO
              </a>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-500">#{workItem.id}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  {workItemType}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border ${healthColors[health]}`}>
                  {healthLabels[health]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium">{state}</span>
                {assignedTo && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{assignedTo.displayName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Description</h2>
              {description ? (
                <div
                  className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">No description provided</p>
              )}
            </div>

            {/* Child Items */}
            {childItems.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">
                  Child Items ({childItems.length})
                </h2>
                <div className="space-y-2">
                  {childItems.map((child) => (
                    <Link
                      key={child.id}
                      to={`/feature/${child.id}`}
                      className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <span className="text-xs font-mono text-slate-500">#{child.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {child.fields['System.WorkItemType']}
                      </span>
                      <span className="flex-1 text-sm text-slate-900 group-hover:text-blue-700">
                        {child.fields['System.Title']}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {child.fields['System.State']}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right 1/3 */}
          <div className="space-y-4">
            {/* Overview */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Overview</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Status</dt>
                  <dd className="text-sm font-medium text-slate-900">{state}</dd>
                </div>

                {priority && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Priority</dt>
                    <dd className="text-sm font-medium text-slate-900">{priority}</dd>
                  </div>
                )}

                {assignedTo && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Owner</dt>
                    <dd className="text-sm font-medium text-slate-900">{assignedTo.displayName}</dd>
                  </div>
                )}

                {startDate && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Start Date</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {format(parseISO(startDate), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}

                {targetDate && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Target Date</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {format(parseISO(targetDate), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}

                {createdBy && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Created By</dt>
                    <dd className="text-sm font-medium text-slate-900">{createdBy.displayName}</dd>
                  </div>
                )}

                {createdDate && (
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Created On</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {format(parseISO(createdDate), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Parent Epic */}
            {parentItem && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h2 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Parent Epic</h2>
                <Link
                  to={`/feature/${parentItem.id}`}
                  className="block p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">#{parentItem.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                      {parentItem.fields['System.WorkItemType']}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                    {parentItem.fields['System.Title']}
                  </p>
                </Link>
              </div>
            )}

            {/* Tags */}
            {tags && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h2 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.split(';').map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
