import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  Shield, 
  Search,
  UserPlus,
  X,
  Check,
  DollarSign,
  Tag,
  Plus,
  Star,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type Users = Database['public']['Tables']['users']['Row'];

type Clients = Database['public']['Tables']['clients']['Row'] & {
  location : Database['public']['Tables']['location']['Row']; 
};

interface EmployeesManagementProps {
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

interface UserFormData {
  username: string;
  address: string;
  contact: string;
  password: string;
  role: string;
  email: string;
  status: string;
}

export const EmployeesManagement: React.FC<EmployeesManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    address: "",
    contact: "",
    password: "",
    role: "",
    email: "",
    status: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select('*')
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUSer = async () => {
    try {
      if (editingUser) {
        // Update existing client
        const { error } = await supabase
          .from("users")
          .update({
            username: formData.username,
            contact: formData.contact,
            address: formData.address,
            role: formData.role,
            status: formData.status,
            email: formData.email,
          })
          .eq("id", editingUser);

        if (error) {
          toast.error(`Update error: ${error.message}`);
          throw error;
        }
      } else {
        // Insert new user
        // create auth user (signup) and prepare fields for the DB insert
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) {
          toast.error(`Signup error: ${authError.message}`);
          throw authError;
        }

        // attach any missing fields expected by the following insert
        const authUserId = authData?.user?.id ?? null;
        if (!authUserId) {
          toast.error("Failed to retrieve authenticated user ID");
          throw new Error("Failed to retrieve authenticated user ID");
        }

        // location placeholder (no location field in the form currently)

        const { error } = await supabase.from("users")
          .insert({
            id: authUserId,
            username: formData.username,
            contact: formData.contact,
            address: formData.address,
            role: formData.role,
            status: formData.status,
            email: formData.email,
          });

        if (error) {
          toast.error(`Insert error: ${error.message}`);
          throw error;
        }
      }

      toast.success("Employé enregistré avec succès");
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(
        `Error saving employee: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.filter((user) => user.id !== userId));
      toast.success("User deleted successfully");
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  // Filtrer et trier les clients par ordre alphabétique du nom
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower)
      // user.location.city?.toLowerCase().includes(searchLower) ||
      // user.location.place?.toLowerCase().includes(searchLower)
    );
  });

  const resetForm = () => {
    setFormData({
      username: "",
      address: "",
      contact: "",
      password: "",
      role: "visitor",
      email: "",
      status: "",
    });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des employés</h1>
          <p className="text-gray-500">Gerer tout les employés actifs</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un employé ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-vibees-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Creer un employé
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div
        className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border} flex flex-col`}
        style={{ height: "calc(100vh - 200px)" }}
      >
        {/* Table Header - Fixed */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full table-fixed">
            <thead>
              <tr className={isDark ? "bg-[#142845]" : "bg-gray-50"}>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Nom Complet
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Adresse
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Telephone
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Poste
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Chargement des clients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:${
                      isDark ? "bg-[#142845]" : "bg-gray-50"
                    } cursor-pointer`}
                  >
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {user.username}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${baseClasses.text}`}>
                        {user.address}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${baseClasses.text}`}>
                        {user.contact}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${baseClasses.text}`}>
                        {user.role
                          ? user.role === "liver"
                            ? "Vendeur"
                            : user.role === "deliver"
                            ? "Livreur"
                            : user.role === "admin"
                            ? "Administrateur"
                            : "Visiteur"
                          : ""}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`text-sm ${baseClasses.text}`}>
                        {user.status ? user.status === "salaried" ? "Salarie" : "Presataire" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowModal(true);
                            setEditingUser(user.id);
                            setFormData({
                              username: user.username,
                              address: user.address,
                              contact: user.contact,
                              password: "",
                              role: user.role,
                              email: user.email,
                              status: user.status,
                            });
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${baseClasses.card} rounded-xl shadow-xl w-full max-w-md p-6`}
          >
            <h3 className="text-xl font-semibold mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cet employé ? Cette action
              est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {editingUser ? `Modifier un employe` : `Ajouter un employe`}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  email
                </label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  contacts (separer par un point-virgule si plusieurs)
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  placeholder="03X XX XXX XX; 03X XX XXX XX"
                />
              </div>

              {/* city and province */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selectionner le poste</option>
                    <option value="admin">Administrateur</option>
                    <option value="liver">Vendeur</option>
                    <option value="deliver">Livreur</option>
                    <option value="visitor">Visiteur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Selectionner le status --</option>
                    <option value="salaried">salarie</option>
                    <option value="presta">Presataire</option>
                  </select>
                </div>
              </div>

              {/* Payement */}
              {!editingUser && (
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  />
              </div>
                )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveUSer}
                  disabled={
                    !formData.username ||
                    !formData.address ||
                    !formData.contact ||
                    !formData.role ||
                    !formData.email
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <span>Enregister</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;