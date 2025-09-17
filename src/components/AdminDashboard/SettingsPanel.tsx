import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Server, 
  Mail, 
  Globe, 
  Save,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  isDark: boolean;
  baseClasses: {
    background: string;
    sidebar: string;
    card: string;
    border: string;
    text: string;
    input: string;
    accent: string;
    yellow: string;
  };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isDark, baseClasses }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // General settings
  const [siteName, setSiteName] = useState('Vibee\'s Events Platform');
  const [siteDescription, setSiteDescription] = useState('Professional virtual events platform');
  const [supportEmail, setSupportEmail] = useState('support@vibees.app');
  const [timeZone, setTimeZone] = useState('UTC');
  
  // Security settings
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Email settings
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('notifications@vibees.app');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [emailFrom, setEmailFrom] = useState('Vibee\'s Events <notifications@vibees.app>');
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real implementation, this would save to the database
      // For now, we'll just simulate a delay and show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure platform settings and preferences</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={saving}
          className={`flex items-center px-4 py-2 rounded-lg ${baseClasses.accent} disabled:opacity-50`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="md:w-64">
          <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-4`}>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'general'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="w-5 h-5 mr-3" />
                General
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'security'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Shield className="w-5 h-5 mr-3" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'email'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Mail className="w-5 h-5 mr-3" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'integrations'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Globe className="w-5 h-5 mr-3" />
                Integrations
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'database'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Database className="w-5 h-5 mr-3" />
                Database
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeTab === 'system'
                    ? 'bg-vibees-accent text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Server className="w-5 h-5 mr-3" />
                System
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">General Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Site Description</label>
                  <textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                    rows={3}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Default Time Zone</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenance_mode"
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="maintenance_mode" className="ml-2 block text-sm">
                    Enable Maintenance Mode
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Password Length</label>
                  <input
                    type="number"
                    value={passwordMinLength}
                    onChange={(e) => setPasswordMinLength(parseInt(e.target.value))}
                    min={6}
                    max={32}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="require_special_chars"
                    checked={requireSpecialChars}
                    onChange={(e) => setRequireSpecialChars(e.target.checked)}
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="require_special_chars" className="ml-2 block text-sm">
                    Require Special Characters
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="require_numbers"
                    checked={requireNumbers}
                    onChange={(e) => setRequireNumbers(e.target.checked)}
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="require_numbers" className="ml-2 block text-sm">
                    Require Numbers
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                    min={15}
                    max={1440}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="two_factor_auth"
                    checked={twoFactorAuth}
                    onChange={(e) => setTwoFactorAuth(e.target.checked)}
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="two_factor_auth" className="ml-2 block text-sm">
                    Enable Two-Factor Authentication
                  </label>
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Security Recommendation</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        We recommend enabling two-factor authentication for all admin accounts to enhance security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">Email Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">From Address</label>
                  <input
                    type="text"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="use_ssl"
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="use_ssl" className="ml-2 block text-sm">
                    Use SSL/TLS
                  </label>
                </div>
                
                <button className={`px-4 py-2 ${baseClasses.yellow} rounded-lg`}>
                  Test Email Configuration
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">System Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notify_new_user"
                        className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                        defaultChecked
                      />
                      <label htmlFor="notify_new_user" className="ml-2 block text-sm">
                        New User Registration
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_new_user_email"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_new_user_email" className="ml-2 block text-xs">
                          Email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_new_user_dashboard"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_new_user_dashboard" className="ml-2 block text-xs">
                          Dashboard
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notify_new_event"
                        className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                        defaultChecked
                      />
                      <label htmlFor="notify_new_event" className="ml-2 block text-sm">
                        New Event Created
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_new_event_email"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_new_event_email" className="ml-2 block text-xs">
                          Email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_new_event_dashboard"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_new_event_dashboard" className="ml-2 block text-xs">
                          Dashboard
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notify_flagged_content"
                        className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                        defaultChecked
                      />
                      <label htmlFor="notify_flagged_content" className="ml-2 block text-sm">
                        Flagged Content
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_flagged_content_email"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_flagged_content_email" className="ml-2 block text-xs">
                          Email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify_flagged_content_dashboard"
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                          defaultChecked
                        />
                        <label htmlFor="notify_flagged_content_dashboard" className="ml-2 block text-xs">
                          Dashboard
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium pt-4">Email Templates</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Welcome Email</span>
                    <button className="text-vibees-accent hover:underline text-sm">Edit Template</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Password Reset</span>
                    <button className="text-vibees-accent hover:underline text-sm">Edit Template</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Event Reminder</span>
                    <button className="text-vibees-accent hover:underline text-sm">Edit Template</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Registration Confirmation</span>
                    <button className="text-vibees-accent hover:underline text-sm">Edit Template</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">Integrations</h2>
              
              <div className="space-y-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${baseClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Facebook</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your Facebook account</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg text-sm`}>
                      Connect
                    </button>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${baseClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Twitter</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your Twitter account</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg text-sm`}>
                      Connect
                    </button>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${baseClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-9.5 15.6L10 19l1.4-2.5L10 14l2.5 1.4L15 14l-1.4 2.5L15 19l-2.5-1.4zM12 9c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Zoom</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your Zoom account</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-500">Connected</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${baseClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">YouTube</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your YouTube account</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg text-sm`}>
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">Database Settings</h2>
              
              <div className="space-y-6">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Warning</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Changing database settings may affect the platform's functionality. Proceed with caution.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Database Host</label>
                  <input
                    type="text"
                    value="db.vibees.app"
                    disabled
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent opacity-70`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Database Name</label>
                  <input
                    type="text"
                    value="vibees_production"
                    disabled
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent opacity-70`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Database User</label>
                  <input
                    type="text"
                    value="vibees_admin"
                    disabled
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent opacity-70`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Database Password</label>
                  <input
                    type="password"
                    value="••••••••••••••••"
                    disabled
                    className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent opacity-70`}
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">Database Maintenance</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                      Backup Database
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                      Optimize Tables
                    </button>
                    <button className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
              <h2 className="text-xl font-semibold mb-6">System Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">PHP Version</span>
                        <span className="text-sm font-medium">8.1.12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database Version</span>
                        <span className="text-sm font-medium">PostgreSQL 14.5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Server OS</span>
                        <span className="text-sm font-medium">Ubuntu 22.04 LTS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Web Server</span>
                        <span className="text-sm font-medium">Nginx 1.22.0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-medium">2.4 GB / 8 GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Disk Usage</span>
                        <span className="text-sm font-medium">45.2 GB / 100 GB</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Application Info</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Application Version</span>
                        <span className="text-sm font-medium">v2.5.0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Updated</span>
                        <span className="text-sm font-medium">May 15, 2025</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Environment</span>
                        <span className="text-sm font-medium">Production</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Debug Mode</span>
                        <span className="text-sm font-medium">Disabled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cache Driver</span>
                        <span className="text-sm font-medium">Redis</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Session Driver</span>
                        <span className="text-sm font-medium">Database</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">System Logs</h3>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${baseClasses.border} h-48 overflow-y-auto font-mono text-xs`}>
                    <div className="text-green-500">[2025-05-15 08:12:34] production.INFO: System started successfully</div>
                    <div className="text-gray-500">[2025-05-15 09:23:45] production.INFO: User login: admin@vibees.app</div>
                    <div className="text-gray-500">[2025-05-15 10:34:56] production.INFO: New event created: Tech Summit 2025</div>
                    <div className="text-yellow-500">[2025-05-15 11:45:12] production.WARNING: High memory usage detected</div>
                    <div className="text-gray-500">[2025-05-15 12:56:23] production.INFO: Database backup completed</div>
                    <div className="text-red-500">[2025-05-15 13:01:34] production.ERROR: Failed to send email: Connection timeout</div>
                    <div className="text-gray-500">[2025-05-15 14:12:45] production.INFO: Cache cleared successfully</div>
                    <div className="text-gray-500">[2025-05-15 15:23:56] production.INFO: User logout: admin@vibees.app</div>
                    <div className="text-gray-500">[2025-05-15 16:34:12] production.INFO: User login: organizer@vibees.app</div>
                    <div className="text-gray-500">[2025-05-15 17:45:23] production.INFO: Session updated: Marketing Workshop</div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button className="text-sm text-vibees-accent hover:underline">
                      View All Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;