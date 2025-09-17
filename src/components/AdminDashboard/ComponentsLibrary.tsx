import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Layout, 
  Copy, 
  CheckCircle, 
  Plus, 
  Minus, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Info,
  Bell,
  Users
} from 'lucide-react';

interface ComponentsLibraryProps {
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

export const ComponentsLibrary: React.FC<ComponentsLibraryProps> = ({ isDark, baseClasses }) => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<number | null>(0);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Components Library</h1>
          <p className="text-gray-500 dark:text-gray-400">Reusable UI components for the platform</p>
        </div>
      </div>

      {/* Component Categories */}
      <div className="flex flex-wrap gap-2">
        {['buttons', 'cards', 'alerts', 'forms', 'modals', 'navigation'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Components Display */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
        {activeTab === 'buttons' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Buttons</h2>
            
            {/* Primary Buttons */}
            <div>
              <h3 className="text-lg font-medium mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg`}>
                  Primary Button
                </button>
                <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg flex items-center`}>
                  <Plus className="w-4 h-4 mr-2" />
                  With Icon
                </button>
                <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg opacity-50 cursor-not-allowed`}>
                  Disabled
                </button>
                <button className={`px-4 py-2 ${baseClasses.yellow} rounded-lg`}>
                  Secondary
                </button>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
  Primary Button
</button>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
  Primary Button
</button>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
  Primary Button
</button>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Outline Buttons */}
            <div>
              <h3 className="text-lg font-medium mb-3">Outline Buttons</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <button className={`px-4 py-2 border border-vibees-accent text-vibees-accent rounded-lg hover:bg-vibees-accent hover:text-white transition-colors`}>
                  Outline Button
                </button>
                <button className={`px-4 py-2 border border-vibees-yellow text-vibees-yellow rounded-lg hover:bg-vibees-yellow hover:text-vibees-navy transition-colors`}>
                  Outline Secondary
                </button>
                <button className={`px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors`}>
                  Danger Outline
                </button>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<button className="px-4 py-2 border border-vibees-accent text-vibees-accent rounded-lg hover:bg-vibees-accent hover:text-white transition-colors">
  Outline Button
</button>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<button className="px-4 py-2 border border-vibees-accent text-vibees-accent rounded-lg hover:bg-vibees-accent hover:text-white transition-colors">
  Outline Button
</button>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<button className="px-4 py-2 border border-vibees-accent text-vibees-accent rounded-lg hover:bg-vibees-accent hover:text-white transition-colors">
  Outline Button
</button>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Icon Buttons */}
            <div>
              <h3 className="text-lg font-medium mb-3">Icon Buttons</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <button className={`p-2 ${baseClasses.accent} rounded-full`}>
                  <Plus className="w-5 h-5" />
                </button>
                <button className={`p-2 bg-red-500 text-white rounded-full`}>
                  <X className="w-5 h-5" />
                </button>
                <button className={`p-2 bg-green-500 text-white rounded-full`}>
                  <Check className="w-5 h-5" />
                </button>
                <button className={`p-2 ${baseClasses.yellow} rounded-full`}>
                  <Bell className="w-5 h-5" />
                </button>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<button className="p-2 bg-vibees-accent text-white rounded-full">
  <Plus className="w-5 h-5" />
</button>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<button className="p-2 bg-vibees-accent text-white rounded-full">
  <Plus className="w-5 h-5" />
</button>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<button className="p-2 bg-vibees-accent text-white rounded-full">
  <Plus className="w-5 h-5" />
</button>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Cards</h2>
            
            {/* Basic Card */}
            <div>
              <h3 className="text-lg font-medium mb-3">Basic Card</h3>
              <div className="mb-4">
                <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6 max-w-md`}>
                  <h4 className="text-lg font-semibold mb-2">Card Title</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">This is a basic card component that can be used throughout the application.</p>
                  <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg`}>
                    Action Button
                  </button>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6">
  <h4 className="text-lg font-semibold mb-2">Card Title</h4>
  <p className="text-gray-500 dark:text-gray-400 mb-4">Card content goes here.</p>
  <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
    Action Button
  </button>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6">
  <h4 className="text-lg font-semibold mb-2">Card Title</h4>
  <p className="text-gray-500 dark:text-gray-400 mb-4">Card content goes here.</p>
  <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
    Action Button
  </button>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6">
  <h4 className="text-lg font-semibold mb-2">Card Title</h4>
  <p className="text-gray-500 dark:text-gray-400 mb-4">Card content goes here.</p>
  <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
    Action Button
  </button>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Stat Card */}
            <div>
              <h3 className="text-lg font-medium mb-3">Stat Card</h3>
              <div className="mb-4">
                <motion.div
                  whileHover={{ y: -5 }}
                  className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border} max-w-md`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                      <h3 className="text-2xl font-bold mt-1">1,234</h3>
                      <p className="text-xs text-green-500 mt-1 flex items-center">
                        <ChevronUp className="w-3 h-3 mr-1" />
                        12% increase
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<motion.div
  whileHover={{ y: -5 }}
  className="${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
      <h3 className="text-2xl font-bold mt-1">1,234</h3>
      <p className="text-xs text-green-500 mt-1 flex items-center">
        <ChevronUp className="w-3 h-3 mr-1" />
        12% increase
      </p>
    </div>
    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
  </div>
</motion.div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<motion.div
  whileHover={{ y: -5 }}
  className="${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
      <h3 className="text-2xl font-bold mt-1">1,234</h3>
      <p className="text-xs text-green-500 mt-1 flex items-center">
        <ChevronUp className="w-3 h-3 mr-1" />
        12% increase
      </p>
    </div>
    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
  </div>
</motion.div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<motion.div
  whileHover={{ y: -5 }}
  className="${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
      <h3 className="text-2xl font-bold mt-1">1,234</h3>
      <p className="text-xs text-green-500 mt-1 flex items-center">
        <ChevronUp className="w-3 h-3 mr-1" />
        12% increase
      </p>
    </div>
    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
  </div>
</motion.div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            
            {/* Success Alert */}
            <div>
              <h3 className="text-lg font-medium mb-3">Success Alert</h3>
              <div className="mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Success!</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Your changes have been saved successfully.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg">
  <div className="flex">
    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
    <div>
      <p className="font-medium text-green-800 dark:text-green-200">Success!</p>
      <p className="text-sm text-green-700 dark:text-green-300">Your changes have been saved successfully.</p>
    </div>
  </div>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg">
  <div className="flex">
    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
    <div>
      <p className="font-medium text-green-800 dark:text-green-200">Success!</p>
      <p className="text-sm text-green-700 dark:text-green-300">Your changes have been saved successfully.</p>
    </div>
  </div>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg">
  <div className="flex">
    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
    <div>
      <p className="font-medium text-green-800 dark:text-green-200">Success!</p>
      <p className="text-sm text-green-700 dark:text-green-300">Your changes have been saved successfully.</p>
    </div>
  </div>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Error Alert */}
            <div>
              <h3 className="text-lg font-medium mb-3">Error Alert</h3>
              <div className="mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Error!</p>
                      <p className="text-sm text-red-700 dark:text-red-300">There was a problem processing your request.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
  <div className="flex">
    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
    <div>
      <p className="font-medium text-red-800 dark:text-red-200">Error!</p>
      <p className="text-sm text-red-700 dark:text-red-300">There was a problem processing your request.</p>
    </div>
  </div>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
  <div className="flex">
    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
    <div>
      <p className="font-medium text-red-800 dark:text-red-200">Error!</p>
      <p className="text-sm text-red-700 dark:text-red-300">There was a problem processing your request.</p>
    </div>
  </div>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
  <div className="flex">
    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
    <div>
      <p className="font-medium text-red-800 dark:text-red-200">Error!</p>
      <p className="text-sm text-red-700 dark:text-red-300">There was a problem processing your request.</p>
    </div>
  </div>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Info Alert */}
            <div>
              <h3 className="text-lg font-medium mb-3">Info Alert</h3>
              <div className="mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Information</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">This is an informational message for the user.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
  <div className="flex">
    <Info className="h-5 w-5 text-blue-500 mr-3" />
    <div>
      <p className="font-medium text-blue-800 dark:text-blue-200">Information</p>
      <p className="text-sm text-blue-700 dark:text-blue-300">This is an informational message for the user.</p>
    </div>
  </div>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
  <div className="flex">
    <Info className="h-5 w-5 text-blue-500 mr-3" />
    <div>
      <p className="font-medium text-blue-800 dark:text-blue-200">Information</p>
      <p className="text-sm text-blue-700 dark:text-blue-300">This is an informational message for the user.</p>
    </div>
  </div>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
  <div className="flex">
    <Info className="h-5 w-5 text-blue-500 mr-3" />
    <div>
      <p className="font-medium text-blue-800 dark:text-blue-200">Information</p>
      <p className="text-sm text-blue-700 dark:text-blue-300">This is an informational message for the user.</p>
    </div>
  </div>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forms' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Form Elements</h2>
            
            {/* Text Input */}
            <div>
              <h3 className="text-lg font-medium mb-3">Text Input</h3>
              <div className="mb-4 max-w-md">
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                />
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<label className="block text-sm font-medium mb-1">Username</label>
<input
  type="text"
  placeholder="Enter your username"
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
/>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<label className="block text-sm font-medium mb-1">Username</label>
<input
  type="text"
  placeholder="Enter your username"
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
/>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<label className="block text-sm font-medium mb-1">Username</label>
<input
  type="text"
  placeholder="Enter your username"
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
/>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Select Input */}
            <div>
              <h3 className="text-lg font-medium mb-3">Select Input</h3>
              <div className="mb-4 max-w-md">
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                >
                  <option value="">Select a role</option>
                  <option value="admin">Admin</option>
                  <option value="organizer">Organizer</option>
                  <option value="speaker">Speaker</option>
                  <option value="attendee">Attendee</option>
                </select>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<label className="block text-sm font-medium mb-1">Role</label>
<select
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
>
  <option value="">Select a role</option>
  <option value="admin">Admin</option>
  <option value="organizer">Organizer</option>
  <option value="speaker">Speaker</option>
  <option value="attendee">Attendee</option>
</select>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<label className="block text-sm font-medium mb-1">Role</label>
<select
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
>
  <option value="">Select a role</option>
  <option value="admin">Admin</option>
  <option value="organizer">Organizer</option>
  <option value="speaker">Speaker</option>
  <option value="attendee">Attendee</option>
</select>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<label className="block text-sm font-medium mb-1">Role</label>
<select
  className="w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent"
>
  <option value="">Select a role</option>
  <option value="admin">Admin</option>
  <option value="organizer">Organizer</option>
  <option value="speaker">Speaker</option>
  <option value="attendee">Attendee</option>
</select>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Checkbox */}
            <div>
              <h3 className="text-lg font-medium mb-3">Checkbox</h3>
              <div className="mb-4 max-w-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm">
                    Remember me
                  </label>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="flex items-center">
  <input
    type="checkbox"
    id="remember"
    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
  />
  <label htmlFor="remember" className="ml-2 block text-sm">
    Remember me
  </label>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="flex items-center">
  <input
    type="checkbox"
    id="remember"
    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
  />
  <label htmlFor="remember" className="ml-2 block text-sm">
    Remember me
  </label>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="flex items-center">
  <input
    type="checkbox"
    id="remember"
    className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
  />
  <label htmlFor="remember" className="ml-2 block text-sm">
    Remember me
  </label>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modals' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Modals</h2>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Basic Modal</h3>
              <div className="mb-4">
                <div className={`${baseClasses.card} rounded-xl shadow-xl border ${baseClasses.border} p-0 max-w-md mx-auto`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Modal Title</h3>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      This is the modal content. You can put any elements here.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                        Cancel
                      </button>
                      <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg`}>
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="${baseClasses.card} rounded-xl shadow-xl border ${baseClasses.border} p-0">
  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Modal Title</h3>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
  <div className="p-6">
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      This is the modal content. You can put any elements here.
    </p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="${baseClasses.card} rounded-xl shadow-xl border ${baseClasses.border} p-0">
  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Modal Title</h3>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
  <div className="p-6">
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      This is the modal content. You can put any elements here.
    </p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="${baseClasses.card} rounded-xl shadow-xl border ${baseClasses.border} p-0">
  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Modal Title</h3>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
  <div className="p-6">
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      This is the modal content. You can put any elements here.
    </p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-vibees-accent text-white rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Navigation</h2>
            
            {/* Tabs */}
            <div>
              <h3 className="text-lg font-medium mb-3">Tabs</h3>
              <div className="mb-4">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-4">
                    <button className="px-4 py-2 border-b-2 border-vibees-accent text-vibees-accent">
                      Active Tab
                    </button>
                    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      Inactive Tab
                    </button>
                    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      Another Tab
                    </button>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="border-b border-gray-200 dark:border-gray-700">
  <div className="flex space-x-4">
    <button className="px-4 py-2 border-b-2 border-vibees-accent text-vibees-accent">
      Active Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Inactive Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Another Tab
    </button>
  </div>
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="border-b border-gray-200 dark:border-gray-700">
  <div className="flex space-x-4">
    <button className="px-4 py-2 border-b-2 border-vibees-accent text-vibees-accent">
      Active Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Inactive Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Another Tab
    </button>
  </div>
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="border-b border-gray-200 dark:border-gray-700">
  <div className="flex space-x-4">
    <button className="px-4 py-2 border-b-2 border-vibees-accent text-vibees-accent">
      Active Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Inactive Tab
    </button>
    <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
      Another Tab
    </button>
  </div>
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Accordion */}
            <div>
              <h3 className="text-lg font-medium mb-3">Accordion</h3>
              <div className="mb-4 space-y-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className={`${baseClasses.card} rounded-lg border ${baseClasses.border} overflow-hidden`}>
                    <button
                      onClick={() => setAccordionOpen(accordionOpen === index ? null : index)}
                      className="w-full flex justify-between items-center p-4"
                    >
                      <span className="font-medium">Accordion Item {index + 1}</span>
                      {accordionOpen === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    {accordionOpen === index && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                          This is the content for accordion item {index + 1}. You can put any content here.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} relative`}>
                <pre className="text-sm overflow-x-auto">
                  {`<div className="${baseClasses.card} rounded-lg border ${baseClasses.border} overflow-hidden">
  <button
    onClick={() => setAccordionOpen(accordionOpen === index ? null : index)}
    className="w-full flex justify-between items-center p-4"
  >
    <span className="font-medium">Accordion Item</span>
    {accordionOpen === index ? (
      <ChevronUp className="w-5 h-5" />
    ) : (
      <ChevronDown className="w-5 h-5" />
    )}
  </button>
  {accordionOpen === index && (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400">
        This is the content for the accordion item. You can put any content here.
      </p>
    </div>
  )}
</div>`}
                </pre>
                <button 
                  onClick={() => handleCopy(`<div className="${baseClasses.card} rounded-lg border ${baseClasses.border} overflow-hidden">
  <button
    onClick={() => setAccordionOpen(accordionOpen === index ? null : index)}
    className="w-full flex justify-between items-center p-4"
  >
    <span className="font-medium">Accordion Item</span>
    {accordionOpen === index ? (
      <ChevronUp className="w-5 h-5" />
    ) : (
      <ChevronDown className="w-5 h-5" />
    )}
  </button>
  {accordionOpen === index && (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400">
        This is the content for the accordion item. You can put any content here.
      </p>
    </div>
  )}
</div>`)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copiedCode === `<div className="${baseClasses.card} rounded-lg border ${baseClasses.border} overflow-hidden">
  <button
    onClick={() => setAccordionOpen(accordionOpen === index ? null : index)}
    className="w-full flex justify-between items-center p-4"
  >
    <span className="font-medium">Accordion Item</span>
    {accordionOpen === index ? (
      <ChevronUp className="w-5 h-5" />
    ) : (
      <ChevronDown className="w-5 h-5" />
    )}
  </button>
  {accordionOpen === index && (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400">
        This is the content for the accordion item. You can put any content here.
      </p>
    </div>
  )}
</div>` ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentsLibrary;