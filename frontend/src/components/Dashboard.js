import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Target, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import ProductivityChart from './ProductivityChart';
import TopSites from './TopSites';

const Dashboard = () => {
  const [todayStats, setTodayStats] = useState({
    totalTime: 0,
    productiveTime: 0,
    distractingTime: 0,
    productivityScore: 0
  });
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [topSites, setTopSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's summary
      const today = new Date().toDateString();
      const summaryResponse = await axios.get(`http://localhost:5001/api/time/summary?date=${today}`);
      
      // Fetch weekly trends
      const trendsResponse = await axios.get('http://localhost:5001/api/time/trends?days=7');
      
      // Fetch recent reports for productivity score
      const reportsResponse = await axios.get('http://localhost:5001/api/reports/daily?limit=1');
      
      // Process data
      const siteData = summaryResponse.data.data || [];
      const trends = trendsResponse.data.data || [];
      const reports = reportsResponse.data.data || [];
      
      // Calculate today's stats
      const totalTime = siteData.reduce((sum, site) => sum + site.totalTime, 0);
      const productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
      const distractingSites = ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];
      
      let productiveTime = 0;
      let distractingTime = 0;
      
      siteData.forEach(site => {
        if (productiveSites.some(ps => site._id.includes(ps))) {
          productiveTime += site.totalTime;
        } else if (distractingSites.some(ds => site._id.includes(ds))) {
          distractingTime += site.totalTime;
        }
      });
      
      const productivityScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
      
      setTodayStats({
        totalTime,
        productiveTime,
        distractingTime,
        productivityScore
      });
      
      setWeeklyTrend(trends);
      setTopSites(siteData.slice(0, 10));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(todayStats.totalTime)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-success-600">Productive Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(todayStats.productiveTime)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-danger-600">Distracting Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(todayStats.distractingTime)}
              </p>
            </div>
            <Target className="w-8 h-8 text-danger-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Productivity Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayStats.productivityScore}%
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              todayStats.productivityScore >= 70 ? 'bg-success-100' :
              todayStats.productivityScore >= 40 ? 'bg-warning-100' : 'bg-danger-100'
            }`}>
              <Calendar className={`w-5 h-5 ${
                todayStats.productivityScore >= 70 ? 'text-success-600' :
                todayStats.productivityScore >= 40 ? 'text-warning-600' : 'text-danger-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Productivity Trend</h2>
          <ProductivityChart data={weeklyTrend} />
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Sites Today</h2>
          <TopSites sites={topSites} formatTime={formatTime} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary">Start Focus Session</button>
          <button className="btn btn-secondary">Export Data</button>
          <button className="btn btn-secondary">View Full Report</button>
          <button className="btn btn-secondary">Sync with Extension</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
