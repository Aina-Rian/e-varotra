import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  Shield, 
  Search,
  UserPlus,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface SalesManagementProps {
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

export const SalesManagement: React.FC<SalesManagementProps> = ({ isDark, baseClasses }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<User['role']>('attendee');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Filtrer et trier les utilisateurs par ordre alphabétique du nom complet
  const filteredUsers = users
    .filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
      );
    });

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'organizer':
        return isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800';
      case 'speaker':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'exhibitor':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des ventes</h1>
          <p className="text-gray-500">Gérer les ventes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une vente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            />
          </div>
          <button
            onClick={() => {/* TODO: Implement user creation */}}
            className="flex items-center px-4 py-2 bg-vibees-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Ajouter une vente
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-[#142845]' : 'bg-gray-50'}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telephone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livraison</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Chargement des ventes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune vente trouvée
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}
                    onClick={() => {
                      setEditingUser(user.id);
                      setSelectedRole(user.role);
                    }}>
                    <td className="px-4 py-4">
                      <span className={`px-1 py-1 inline-flex text-xs leading-5 font-semibold`}>
                       1000
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">             
                        <div className={`font-medium ${baseClasses.text}`}>{user.full_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-1 py-1 inline-flex font-medium ${baseClasses.text}`}>
                       034 64 342 94 <br/> asdfads 
                      </span>

                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-1 py-1 inline-flex font-medium ${baseClasses.text}`}>
                       Antananarivo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as User['role'])}
                          className={`${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                        >
                          <option value="attendee">Attendee</option>
                          <option value="exhibitor">Exhibitor</option>
                          <option value="speaker">Speaker</option>
                          <option value="moderator">Moderator</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'admin' ? 'KOFMAD' : 'COUTTISSE'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                        {user.role === 'admin' ? 'Mobile Money' : 'Livraison'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold`}>
                        3 000 Ar
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            className="text-green-600 hover:text-green-900"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : showDeleteConfirm === user.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setSelectedRole(user.role);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement permissions management */}}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesManagement;