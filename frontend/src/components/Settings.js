import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2, Plus } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const [settings, setSettings] = useState({
    productiveSites: ['github.com', 'stackoverflow.com', 'docs.google.com'],
    distractingSites: ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'],
    blockedSites: [],
    notificationsEnabled: true,
    dailyGoal: 480 // 8 hours in minutes
  });
  
  const [newSite, setNewSite] = useState({ productive: '', distracting: '', blocked: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from local storage or API
      const savedSettings = localStorage.getItem('productivitySettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Save to local storage
      localStorage.setItem('productivitySettings', JSON.stringify(settings));
      
      // Sync with extension
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings
        });
      }
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const addSite = (category) => {
    const site = newSite[category].trim();
    if (site && !settings[`${category}Sites`].includes(site)) {
      setSettings(prev => ({
        ...prev,
        [`${category}Sites`]: [...prev[`${category}Sites`], site]
      }));
      setNewSite(prev => ({ ...prev, [category]: '' }));
    }
  };

  const removeSite = (category, index) => {
    setSettings(prev => ({
      ...prev,
      [`${category}Sites`]: prev[`${category}Sites`].filter((_, i) => i !== index)
    }));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setMessage('Settings imported successfully!');
          setTimeout(() => setMessage(''), 3000);
        } catch (error) {
          setMessage('Error importing settings');
        }
      };
      reader.readAsText(file);
    }
  };

  const SiteList = ({ title, category, sites = [], color }) => (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newSite[category] || ''}
          onChange={(e) => setNewSite(prev => ({ ...prev, [category]: e.target.value }))}
          placeholder="Enter website domain"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && addSite(category)}
        />
        <button
          onClick={() => addSite(category)}
          className="btn btn-primary flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sites && sites.length > 0 ? sites.map((site, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-900">{site}</span>
            <button
              onClick={() => removeSite(category, index)}
              className="text-danger-500 hover:text-danger-700 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )) : (
          <p className="text-gray-500 text-center py-4">No sites added yet</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Customize your productivity tracking preferences</p>
        </div>
        
        <div className="flex space-x-3">
          <label className="btn btn-secondary cursor-pointer flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <button
            onClick={exportSettings}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'
        }`}>
          {message}
        </div>
      )}

      {/* General Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Notifications</label>
              <p className="text-sm text-gray-500">Get notified about productivity insights and focus sessions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled || false}
                onChange={(e) => setSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Daily Goal (hours)
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={Math.round(settings.dailyGoal / 60) || 8}
              onChange={(e) => setSettings(prev => ({ ...prev, dailyGoal: (parseInt(e.target.value) || 8) * 60 }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Set your daily productivity goal</p>
          </div>
        </div>
      </div>

      {/* Site Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SiteList
          title="Productive Sites"
          category="productive"
          sites={settings.productiveSites}
          color="success"
        />
        
        <SiteList
          title="Distracting Sites"
          category="distracting"
          sites={settings.distractingSites}
          color="danger"
        />
        
        <SiteList
          title="Blocked Sites"
          category="blocked"
          sites={settings.blockedSites}
          color="warning"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="btn btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
