import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Settings,
  BarChart3,
  Bell,
  Search,
  Menu as MenuIcon,
  X,
  Layers,
  Activity,
  Box,
  Zap,
  Sun,
  Moon,
  Home,
  Layout,
  FileText,
  PieChart,
  LogOut,
  User,
  ChevronDown,
  MessageSquare,
  Shield,
  Inbox,
  History,
  Truck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

// Import the separated components
import Dashboard from '../components/AdminDashboard/Dashboard';
import ClientsManagement from '../components/AdminDashboard/ClientsManagement';
import SalesManagement from '../components/AdminDashboard/SalesManagement';
import ModerationPanel from '../components/AdminDashboard/ModerationPanel';
import ComponentsLibrary from '../components/AdminDashboard/ComponentsLibrary';
import FormsAndTables from '../components/AdminDashboard/FormsAndTables';
import AnalyticsDashboard from '../components/AdminDashboard/AnalyticsDashboard';
import SettingsPanel from '../components/AdminDashboard/SettingsPanel';
import RequestsPanel from '../components/AdminDashboard/RequestsPanel';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isDark = theme === 'dark';

  const baseClasses = {
    background: isDark ? 'bg-[#1B365D]' : 'bg-gray-50',
    sidebar: isDark ? 'bg-[#142845]' : 'bg-white',
    card: isDark ? 'bg-[#1D4275]' : 'bg-white',
    border: isDark ? 'border-[#2A5A9C]' : 'border-gray-200',
    text: isDark ? 'text-[#F0F8FF]' : 'text-gray-900',
    input: isDark ? 'bg-[#2A5A9C] text-[#F0F8FF]' : 'bg-gray-50 text-gray-900',
    accent: 'bg-[#4A90E2] text-white',
    yellow: 'bg-[#fff224] text-[#1B365D]'
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard' },
    { icon: Users, label: 'Clients', id: 'clients' },
    { icon: Calendar, label: 'Ventes', id: 'sales' },
    { icon: Truck, label: 'Livraison', id: 'delivery' },
    { icon: History, label: 'Historique', id: 'history' },
    { icon: PieChart, label: 'Analytics', id: 'analytics' },
    { icon: Settings, label: 'Settings', id: 'settings' }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className={`min-h-screen ${baseClasses.background} ${baseClasses.text} flex`}>
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 top-24 z-50 w-64 ${baseClasses.sidebar} transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 border-r ${baseClasses.border}`}
      >
        <div className="h-full flex flex-col">
          <div className={`flex items-center justify-between px-6 py-4 border-b ${baseClasses.border}`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#fff224] rounded-lg flex items-center justify-center">
                <span className="text-[#1B365D] text-xl font-bold">H</span>
              </div>
              <h1 className="text-2xl font-bold text-[#fff224]">H&H</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center w-full px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? isDark
                        ? 'bg-[#4A90E2] text-white shadow-lg'
                        : 'bg-[#1B365D] text-white shadow-lg'
                      : `text-gray-400 hover:${isDark ? 'bg-[#2A5A9C]' : 'bg-gray-100'} hover:text-${isDark ? 'white' : 'gray-900'}`
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className={`p-4 m-4 rounded-lg ${isDark ? 'bg-[#0F1F35]' : 'bg-gray-100'}`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${baseClasses.yellow}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin Portal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Full access granted</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <nav className={`${baseClasses.sidebar} border-b ${baseClasses.border} sticky top-0 z-40`}>
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              
              <button
                onClick={toggleTheme}
                className={`p-2 text-gray-400 hover:text-${isDark ? 'white' : 'gray-900'} rounded-lg hover:${isDark ? 'bg-[#2A5A9C]' : 'bg-gray-100'}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button className="relative p-2 text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <User className="w-6 h-6 text-gray-400" />
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 mt-2 w-48 ${baseClasses.card} rounded-lg shadow-lg py-1 border ${baseClasses.border}`}
                  >
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-gray-400">Administrator</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {activeSection === 'dashboard' && <Dashboard isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'clients' && <ClientsManagement isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'sales' && <SalesManagement isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'history' && <ModerationPanel isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'components' && <ComponentsLibrary isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'forms' && <FormsAndTables isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'analytics' && <AnalyticsDashboard isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'settings' && <SettingsPanel isDark={isDark} baseClasses={baseClasses} />}
          {activeSection === 'requests' && <RequestsPanel isDark={isDark} baseClasses={baseClasses} />}
        </div>
      </main>
    </div>
  );
};