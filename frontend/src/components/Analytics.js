import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Target } from 'lucide-react';
import axios from 'axios';
import ProductivityChart from './ProductivityChart';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7');
  const [insights, setInsights] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [insightsResponse, weeklyResponse, trendsResponse] = await Promise.all([
        axios.get(`http://localhost:5001/api/reports/insights?days=${timeRange}`),
        axios.get('http://localhost:5001/api/reports/weekly'),
        axios.get(`http://localhost:5001/api/time/trends?days=${timeRange}`)
      ]);

      setInsights(insightsResponse.data.data);
      setWeeklyData(weeklyResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Deep insights into your productivity patterns</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Key Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Productivity Score</p>
                <p className="text-3xl font-bold text-gray-900">{insights.avgProductivityScore}%</p>
                <p className={`text-sm mt-1 ${
                  insights.productivityTrend === 'improving' ? 'text-success-600' : 'text-warning-600'
                }`}>
                  {insights.productivityTrend === 'improving' ? '↗ Improving' : '⚠ Needs attention'}
                </p>
              </div>
              <Target className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Time</p>
                <p className="text-3xl font-bold text-gray-900">{formatTime(insights.totalTime)}</p>
                <p className="text-sm text-gray-500 mt-1">Across {insights.totalDays} days</p>
              </div>
              <Clock className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productive Time</p>
                <p className="text-3xl font-bold text-success-600">{formatTime(insights.totalProductiveTime)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round((insights.totalProductiveTime / insights.totalTime) * 100)}% of total
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Productive Day</p>
                <p className="text-lg font-bold text-gray-900">
                  {insights.mostProductiveDay ? new Date(insights.mostProductiveDay).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Best performance</p>
              </div>
              <Calendar className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        </div>
      )}

      {/* Weekly Trends */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Productivity Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {weeklyData.map((week, index) => (
            <div key={week._id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Week {week._id}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Time:</span>
                  <span className="text-sm font-medium">{formatTime(week.totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Score:</span>
                  <span className="text-sm font-medium">{Math.round(week.avgProductivityScore)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Days:</span>
                  <span className="text-sm font-medium">{week.days}/7</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Sites Analysis */}
      {insights && insights.topSites && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Sites Analysis</h2>
          <div className="space-y-3">
            {insights.topSites.slice(0, 10).map((site, index) => (
              <div key={site.site} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{site.site}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{formatTime(site.time)}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${(site.time / insights.topSites[0].time) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
