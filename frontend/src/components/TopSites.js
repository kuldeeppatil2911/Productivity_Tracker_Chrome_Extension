import React from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

const TopSites = ({ sites, formatTime }) => {
  const productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
  const distractingSites = ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];

  const getSiteCategory = (domain) => {
    if (productiveSites.some(ps => domain.includes(ps))) return 'productive';
    if (distractingSites.some(ds => domain.includes(ds))) return 'distracting';
    return 'neutral';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'productive': return 'text-success-600 bg-success-100';
      case 'distracting': return 'text-danger-600 bg-danger-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'productive': return <TrendingUp className="w-4 h-4" />;
      case 'distracting': return <TrendingDown className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (!sites || sites.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <p>No site data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sites.map((site, index) => {
        const category = getSiteCategory(site._id);
        const colorClass = getCategoryColor(category);
        
        return (
          <div key={site._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{site._id}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                    {getCategoryIcon(category)}
                    <span className="ml-1 capitalize">{category}</span>
                  </span>
                  <span className="text-xs text-gray-500">{site.visits} visits</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatTime(site.totalTime)}</p>
              <p className="text-xs text-gray-500">
                Last: {new Date(site.lastVisit).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopSites;
