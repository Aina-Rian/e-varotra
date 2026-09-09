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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type Clients = Database['public']['Tables']['clients']['Row'];

interface ClientsManagementProps {
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

interface Client {
  full_name: string;
  city: string;
  address: string;
  coop: string;
  contacts: string;
  payment: string;
  fb_link: string;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Client>({
    full_name: "",
    city: "",
    address: "",
    contacts: "",
    coop: "",
    payment: "",
    fb_link: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async () => {
    try {
      if (editingClient) {
        // Update existing product
        console.log("Updating client with ID:", user?.id);
        const { error } = await supabase
          .from("clients")
          .update({
            full_name: formData.full_name,
            contacts: formData.contacts,
            address: formData.address,
            city: formData.city,
            coop: formData.coop,
            fb_link: formData.fb_link,
            payment: formData.payment,
          })
          .eq("id", editingClient);

        if (error) {
          toast.error(`Update error: ${error.message}`);
          throw error;
        }
      } else {
        // Create new product
        const { error } = await supabase.from("clients")
          .insert({
            full_name: formData.full_name,
            contacts: formData.contacts,
            address: formData.address,
            city: formData.city,
            coop: formData.coop || "N/A",
            fb_link: formData.fb_link,
            payment: formData.payment,
        });

        if (error) {
          toast.error(`Insert error: ${error.message}`);
          throw error;
        }
      }
      toast.success("Product saved successfully");
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(
        `Error saving client: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      setClients(clients.filter((client) => client.uid !== clientId));
      toast.success("Client deleted successfully");
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  // Filtrer et trier les clients par ordre alphabétique du nom
  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(searchLower) ||
      client.city?.toLowerCase().includes(searchLower) ||
      client.address?.toLowerCase().includes(searchLower)
    );
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      city: "",
      address: "",
      contacts: "",
      coop: "",
      payment: "",
      fb_link: "",
    });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des cliens</h1>
          <p className="text-gray-500">Gerer tout les clients enregistre</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
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
            Ajouter un client
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
                <th className="px-6 py-3 w-16 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Id
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Nom Complet
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Telephone
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Location
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Coop
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Payement
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Achats
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Chargement des clients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.uid}
                    className={`hover:${
                      isDark ? "bg-[#142845]" : "bg-gray-50"
                    } cursor-pointer`}
                    onClick={() => {
                      setShowModal(true);
                      setEditingClient(client.uid);
                      setFormData({
                        full_name: client.full_name || "",
                        city: client.city || "",
                        address: client.address || "",
                        contacts: client.contacts || "",
                        coop: client.coop || "",
                        payment: client.payment || "",
                        fb_link: client.fb_link || "",
                      });
                    }}
                  >
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold">{client.id}</span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.full_name}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.contacts.split(";")[0].trim()}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap truncate">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.address}, {client.city}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.coop}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.payment}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {client.purchases}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      N/A
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  {editingClient ? `Modifier un client` : `Ajouter un client`}
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
                  Nom complet du client
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
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
                  value={formData.contacts}
                  onChange={(e) =>
                    setFormData({ ...formData, contacts: e.target.value })
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
                    Adresse ou reprere du client
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="L'adresse ou le reprere du client"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <datalist id="city">
                    {Array.from(
                      new Set(filteredClients.map((client) => client.city))
                    )
                      .filter((city) => city) // remove empty cities
                      .map((city) => (
                        <option key={city} value={city} />
                      ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    list="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Choisir ou taper un type"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <datalist id="city">
                    {Array.from(
                      new Set(filteredClients.map((client) => client.city))
                    )
                      .filter((city) => city) // remove empty cities
                      .map((city) => (
                        <option key={city} value={city} />
                      ))}
                  </datalist>
                </div>
              </div>

              {/* Payement && coop */}
              {formData.city && formData.city !== "Antananarivo" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cooperative d&apos;envoie
                  </label>
                  <input
                    list="coop"
                    value={formData.coop}
                    onChange={(e) =>
                      setFormData({ ...formData, coop: e.target.value })
                    }
                    placeholder="Choisir ou taper un type"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <datalist id="coop">
                    {Array.from(
                      new Set(filteredClients.map((client) => client.coop))
                    )
                      .filter((coop) => coop)
                      .map((coop) => (
                        <option key={coop} value={coop} />
                      ))}
                  </datalist>
                </div>
              )}

              {/* Payement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payement
                </label>
                <select
                  value={formData.payment}
                  onChange={(e) =>
                    setFormData({ ...formData, payment: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="MVOLA">MVOLA</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Airtel Money">Airtel Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.fb_link}
                  onChange={(e) =>
                    setFormData({ ...formData, fb_link: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://facebook.com/username"
                  required
                />
              </div>

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
                  onClick={handleSaveClient}
                  disabled={
                    !formData.full_name ||
                    !formData.city ||
                    !formData.address ||
                    !formData.contacts
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

export default ClientsManagement;