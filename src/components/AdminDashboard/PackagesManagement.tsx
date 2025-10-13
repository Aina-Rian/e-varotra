import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Search,
  UserPlus,
  X,
  Plus,
  Minus,
  Trash,
  Eye,
  Grid3x3,
  List,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import type { Database } from "../../types/supabase";

type Sales = Database["public"]["Tables"]["sales"]["Row"] & {
  creator: Database["public"]["Tables"]["users"]["Row"];
};
type Clients = Database["public"]["Tables"]["clients"]["Row"];
type Products = Database["public"]["Tables"]["products"]["Row"];
type Orders = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"];
  sale: Database["public"]["Tables"]["sales"]["Row"];
};

interface PackagesManagementProps {
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

interface OrdersForm {
  client: {
    full_name: string;
    city: string;
    address: string;
    coop: string;
    contacts: string;
    payment: string;
    fb_link: string;
  };
  client_id: string;
  article: { price: number; quantity: number }[];
  total: number;
  status: string;
  comment: string;
}

export const PackagesManagement: React.FC<PackagesManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Orders[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const salesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [orderModal, setOrderModal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newQty, setNewQty] = useState<number | "">("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [orderForm, setOrderForm] = useState<OrdersForm>({
    client: {
      full_name: "",
      city: "",
      address: "",
      contacts: "",
      coop: "",
      payment: "",
      fb_link: "",
    },
    client_id: "",
    article: [] as { price: number; quantity: number }[],
    total: 0,
    status: "En attente",
    comment: "",
  });

  useEffect(() => {
    fetchData();
    salesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          client(*)
        `
        )
        .order("created_at", { ascending: true });

      if (orderError) throw orderError;

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true);

      if (productError) throw productError;

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*");

      if (clientError) throw clientError;

      setOrders(orderData || []);
      setProducts(productData || []);
      setClients(clientData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    try {
      let clientId: string;
      let nbr_article = orderForm.article.reduce((acc, item) => acc + item.quantity, 0);

      orderForm.total = orderForm.article.reduce((acc, item) => {
        const price = item.price * item.quantity;
        return acc + price;
      }, 0);

      if (orderForm.client_id) {
        clientId = orderForm.client_id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            full_name: orderForm.client.full_name,
            city: orderForm.client.city,
            address: orderForm.client.address,
            contacts: orderForm.client.contacts,
            coop: orderForm.client.coop,
            payment: orderForm.client.payment,
            fb_link: orderForm.client.fb_link,
          })
          .select();

        if (clientError) {
          toast.error(`Error creating client: ${clientError.message}`);
          throw clientError;
        }

        clientId = newClient?.[0]?.uid;
      }

      if (editingOrder) {
        if (editingClient) {
          const { error } = await supabase
            .from("clients")
            .update({
              full_name: orderForm.client.full_name,
              city: orderForm.client.city,
              address: orderForm.client.address,
              contacts: orderForm.client.contacts,
              coop: orderForm.client.coop,
              payment: orderForm.client.payment,
              fb_link: orderForm.client.fb_link,
            })
            .eq("uid", editingClient);

          if (error) {
            toast.error(`Error updating client: ${error.message}`);
            throw error;
          }
        }
        const { error } = await supabase
          .from("orders")
          .update({
            client: clientId,
            article: orderForm.article,
            total: orderForm.total,
            payment: orderForm.client.payment,
            status: orderForm.status,
            comment: orderForm.comment,
          })
          .eq("uid", editingOrder);

        if (error) {
          toast.error(`Client not found: ${error.message}`);
          throw error;
        }
      } else {
        const { error } = await supabase.from("orders").insert({
          creator: user?.id,
          client: clientId,
          article: orderForm.article,
          total: orderForm.total,
          payment: orderForm.client.payment,
          status: orderForm.status,
          comment: orderForm.comment,
        });

        if (error) {
          toast.error(`Client not found: ${error.message}`);
          throw error;
        }
      }

      toast.success("Commande enregistrée avec succès");
      setOrderModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(
        `Error saving order: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("uid", orderId);

      if (error) throw error;

      setOrders(orders.filter((order) => order.uid !== orderId));
      toast.success("Commande supprimée avec succès");
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      order.id?.toString().toLowerCase().includes(searchLower) ||
      order.client?.full_name?.toLowerCase().includes(searchLower) ||
      order.comment?.toLowerCase().includes(searchLower);

    const matchesFilter = filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setOrderForm({
      client: {
        full_name: "",
        city: "",
        address: "",
        contacts: "",
        coop: "",
        payment: "",
        fb_link: "",
      },
      client_id: "",
      article: [],
      total: 0,
      status: "En attente",
      comment: "",
    });
  };

  function formatNumber(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const addArticle = () => {
    if (newPrice === "" || newQty === "") return;
    setOrderForm((prev) => ({
      ...prev,
      article: [
        ...prev.article,
        { price: Number(newPrice), quantity: Number(newQty) },
      ],
    }));

    setNewPrice("");
    setNewQty("");
  };

  const removeArticle = (idx: number) => {
    setOrderForm((prev) => ({
      ...prev,
      article: prev.article.filter((_, i) => i !== idx),
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", class: "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" },
      delivered: { label: "Livré", class: "border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
      returned: { label: "Retourné", class: "border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des colis</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérer les colis, assigner des livraisons et suivre les statuts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="delivered">Livré</option>
            <option value="returned">Retourné</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow" : ""}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow" : ""}`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setOrderModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Nouvelle commande</span>
          </button>
        </div>
      </div>

      {/* Content - Table or Grid View */}
      {viewMode === "table" ? (
        <div className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? "bg-gray-950" : "bg-gray-50"}>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Id</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Lieu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Articles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Livreur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2">Chargement des colis...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucun colis trouvé
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={`order-${order.uid}`} className={`hover:${isDark ? "bg-gray-800" : "bg-gray-50"} cursor-pointer`}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        #{order.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {order.client?.full_name || "Inconnu"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                        {order.client?.city === "Antananarivo" ? order.client?.address : order.client?.coop}
                      </td>
                      <td className="px-4 py-4 text-sm hidden lg:table-cell">
                        {Array.isArray(order.article)
                          ? (order.article as any[])
                              .filter((a): a is { price: number; quantity: number } =>
                                a && typeof a === "object" && "price" in a && "quantity" in a
                              )
                              .map((a: { price: number; quantity: number }, idx: number, arr: any[]) => (
                                <span key={idx}>
                                  {a.price} × {a.quantity}
                                  {idx < arr.length - 1 && " | "}
                                </span>
                              ))
                          : null}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatNumber(String(order.total ?? ""))} Ar
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                        Rivo
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`text-xs py-1 px-2 border-2 rounded-lg ${getStatusBadge(order.status).class}`}>
                          {getStatusBadge(order.status).label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setOrderForm({
                                client: {
                                  full_name: order.client?.full_name || "",
                                  city: order.client?.city || "",
                                  address: order.client?.address || "",
                                  contacts: order.client?.contacts || "",
                                  coop: order.client?.coop || "",
                                  payment: order.client?.payment || "",
                                  fb_link: order.client?.fb_link || "",
                                },
                                client_id: order.client?.uid || "",
                                article: order.article as any,
                                total: order.total || 0,
                                status: order.status || "En attente",
                                comment: order.comment || "",
                              });
                              setEditingOrder(order.uid);
                              setShowAddClient(true);
                              setOrderModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(order.uid)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">Chargement des colis...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Aucun colis trouvé
            </div>
          ) : (
            filteredOrders.map((order) => (
              <motion.div
                key={`order-grid-${order.uid}`}
                whileHover={{ y: -5 }}
                className={`${baseClasses.card} rounded-xl shadow-sm p-4 border ${baseClasses.border}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">#{order.id}</h3>
                    <p className="text-sm text-gray-500">{order.client?.full_name}</p>
                  </div>
                  <span className={`text-xs py-1 px-2 border-2 rounded-lg ${getStatusBadge(order.status).class}`}>
                    {getStatusBadge(order.status).label}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{order.client?.city === "Antananarivo" ? order.client?.address : order.client?.coop}</span>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatNumber(String(order.total ?? ""))} Ar
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setOrderForm({
                        client: {
                          full_name: order.client?.full_name || "",
                          city: order.client?.city || "",
                          address: order.client?.address || "",
                          contacts: order.client?.contacts || "",
                          coop: order.client?.coop || "",
                          payment: order.client?.payment || "",
                          fb_link: order.client?.fb_link || "",
                        },
                        client_id: order.client?.uid || "",
                        article: order.article as any,
                        total: order.total || 0,
                        status: order.status || "En attente",
                        comment: order.comment || "",
                      });
                      setEditingOrder(order.uid);
                      setShowAddClient(true);
                      setOrderModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(order.uid)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${baseClasses.card} rounded-xl shadow-xl w-full max-w-md p-6`}
          >
            <h3 className="text-xl font-semibold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteOrder(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${baseClasses.card} rounded-xl shadow-xl w-full max-w-2xl my-8`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {editingOrder ? `Modifier une commande` : `Créer une commande`}
                </h3>
                <button
                  onClick={() => {
                    setOrderModal(false);
                    setShowAddClient(false);
                    setEditingOrder(null);
                    setEditingClient(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {!editingOrder && (
                <div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={searchClient}
                        onChange={(e) => setSearchClient(e.target.value)}
                        className={`w-full px-4 py-2 border ${baseClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${baseClasses.input}`}
                      />
                      {searchClient && (
                        <div className={`absolute z-10 ${baseClasses.card} border ${baseClasses.border} rounded shadow mt-1 w-full max-h-40 overflow-y-auto`}>
                          {clients
                            .filter((client) =>
                              client.full_name?.toLowerCase().includes(searchClient.toLowerCase())
                            )
                            .map((client) => (
                              <div
                                key={client.uid}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => {
                                  setOrderForm({
                                    client: {
                                      full_name: client.full_name || "",
                                      city: client.city || "",
                                      address: client.address || "",
                                      contacts: client.contacts || "",
                                      coop: client.coop || "",
                                      payment: client.payment || "",
                                      fb_link: client.fb_link || "",
                                    },
                                    client_id: client.uid,
                                    article: [],
                                    total: 0,
                                    status: "En attente",
                                    comment: "",
                                  });
                                  setSearchClient("");
                                  setShowAddClient(true);
                                }}
                              >
                                {client.full_name}
                              </div>
                            ))}
                          {clients.filter((client) =>
                            client.full_name?.toLowerCase().includes(searchClient.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              Aucun client trouvé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => setShowAddClient(true)}
                    >
                      <UserPlus className="w-5 h-5 mr-1" />
                      <span className="hidden sm:inline">Nouveau client</span>
                    </button>
                  </div>
                </div>
              )}

              {showAddClient && (
                <div className={`${!editingOrder ? "mt-6" : ""}`}>
                  <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"} border ${baseClasses.border}`}>
                      <div className="flex justify-between items-start mb-3">
                        {editingOrder ? (
                          <>
                            <h6 className="text-sm font-medium">
                              Client: {orderForm.client.full_name}
                            </h6>
                            <button
                              type="button"
                              onClick={() => setEditingClient(orderForm.client_id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <h6 className="text-sm font-medium">Client</h6>
                            <button
                              type="button"
                              onClick={() => {
                                resetForm();
                                setShowAddClient(false);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {(!editingOrder || editingClient) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Nom complet
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.full_name}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    full_name: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Contacts
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.contacts}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    contacts: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Ville
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.city}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    city: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Adresse ou repère
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.address}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    address: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                            />
                          </div>

                          {orderForm.client.city && orderForm.client.city !== "Antananarivo" && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium mb-1">
                                Coop
                              </label>
                              <input
                                type="text"
                                value={orderForm.client.coop}
                                onChange={(e) =>
                                  setOrderForm({
                                    ...orderForm,
                                    client: {
                                      ...orderForm.client,
                                      coop: e.target.value,
                                    },
                                  })
                                }
                                className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                              />
                            </div>
                          )}

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium mb-1">
                              Paiement
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.payment}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    payment: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium mb-1">
                              Facebook
                            </label>
                            <input
                              type="url"
                              value={orderForm.client.fb_link}
                              onChange={(e) =>
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    fb_link: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                              placeholder="https://facebook.com/username"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"} border ${baseClasses.border}`}>
                <div className="flex justify-between items-center mb-3">
                  <h6 className="text-sm font-medium">Articles</h6>
                </div>

                <div className="mt-4 space-y-2">
                  {orderForm.article.map((art, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${baseClasses.border} ${isDark ? "bg-gray-900" : "bg-white"}`}
                    >
                      <span>
                        {art.price} Ar × {art.quantity}
                      </span>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderForm((prev) => {
                              const updated = [...prev.article];
                              if (updated[idx].quantity <= 1) {
                                removeArticle(idx);
                                return prev;
                              }
                              updated[idx] = {
                                ...updated[idx],
                                quantity: updated[idx].quantity - 1,
                              };
                              return { ...prev, article: updated };
                            });
                          }}
                          className="text-red-500 hover:text-red-700 mr-2"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderForm((prev) => {
                              const updated = [...prev.article];
                              updated[idx] = {
                                ...updated[idx],
                                quantity: updated[idx].quantity + 1,
                              };
                              return { ...prev, article: updated };
                            });
                          }}
                          className="text-green-500 hover:text-green-700 mr-2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArticle(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Prix
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) =>
                        setNewPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${baseClasses.border} ${baseClasses.input}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      value={newQty}
                      onChange={(e) =>
                        setNewQty(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      disabled={!newPrice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addArticle();
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${baseClasses.border} ${baseClasses.input}`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addArticle}
                  className="flex items-center text-green-500 hover:text-green-700"
                >
                  <Plus className="w-5 h-5 mr-1" /> Ajouter
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Commentaire
                </label>
                <textarea
                  value={orderForm.comment}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, comment: e.target.value })
                  }
                  className={`w-full px-4 py-2 border ${baseClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${baseClasses.input}`}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setOrderModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PackagesManagement;
