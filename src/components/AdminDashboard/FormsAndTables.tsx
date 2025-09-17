import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from 'lucide-react';

interface FormsAndTablesProps {
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

export const FormsAndTables: React.FC<FormsAndTablesProps> = ({ isDark, baseClasses }) => {
  const [activeTab, setActiveTab] = useState('tables');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for the table
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Organizer', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Speaker', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Attendee', status: 'Active' },
    { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'Exhibitor', status: 'Active' },
    { id: 6, name: 'Eva Wilson', email: 'eva@example.com', role: 'Moderator', status: 'Inactive' },
    { id: 7, name: 'Frank Miller', email: 'frank@example.com', role: 'Attendee', status: 'Active' },
    { id: 8, name: 'Grace Lee', email: 'grace@example.com', role: 'Speaker', status: 'Active' },
  ];

  const filteredData = tableData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRowSelection = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(row => row.id));
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'Inactive':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Forms & Tables</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage data with forms and tables</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'tables' 
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Tables
          </button>
          <button 
            onClick={() => setActiveTab('forms')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'forms' 
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Forms
          </button>
        </div>
      </div>

      {activeTab === 'tables' && (
        <>
          {/* Table Actions */}
          <div className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    className={`pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="speaker">Speaker</option>
                    <option value="attendee">Attendee</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg flex items-center`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-[#142845]' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                          onChange={toggleAllRows}
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((row) => (
                    <tr key={row.id} className={`hover:${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{row.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{row.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-vibees-accent hover:text-vibees-accent/80 mr-3">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredData.length}</span> of{' '}
                    <span className="font-medium">{filteredData.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-vibees-accent text-sm font-medium text-white"
                    >
                      1
                    </button>
                    <button
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      2
                    </button>
                    <button
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      3
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'forms' && (
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} p-6`}>
          <h2 className="text-xl font-semibold mb-6">User Form</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="organizer">Organizer</option>
                <option value="speaker">Speaker</option>
                <option value="exhibitor">Exhibitor</option>
                <option value="attendee">Attendee</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                rows={4}
                placeholder="Enter user bio"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                placeholder="Confirm password"
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Profile Image</h3>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Allowed formats: JPG, PNG. Max size: 2MB
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Permissions</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perm_users"
                  className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                />
                <label htmlFor="perm_users" className="ml-2 block text-sm">
                  Manage Users
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perm_events"
                  className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                />
                <label htmlFor="perm_events" className="ml-2 block text-sm">
                  Manage Events
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perm_content"
                  className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                />
                <label htmlFor="perm_content" className="ml-2 block text-sm">
                  Moderate Content
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perm_settings"
                  className="h-4 w-4 text-vibees-accent border-gray-300 rounded focus:ring-vibees-accent"
                />
                <label htmlFor="perm_settings" className="ml-2 block text-sm">
                  Manage Settings
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
              Cancel
            </button>
            <button className={`px-4 py-2 ${baseClasses.accent} rounded-lg`}>
              Save User
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsAndTables;