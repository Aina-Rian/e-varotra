import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Navigation,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Orders = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"];
};

export const DeliveryPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Orders[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          client(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("uid", orderId);

      if (error) throw error;

      toast.success("Statut mis à jour avec succès");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "all") return true;
    return order.status === selectedStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "returned":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", class: "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" },
      delivered: { label: "Livré", class: "border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
      returned: { label: "Retourné", class: "border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const formatNumber = (value: string | number): string => {
    const cleaned = String(value).replace(/\D/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espace Livreur</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos livraisons du jour</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>Rivo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total à livrer</p>
                <h3 className="text-2xl font-bold mt-1">{orders.filter(o => o.status === 'pending').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Livré</p>
                <h3 className="text-2xl font-bold mt-1">{orders.filter(o => o.status === 'delivered').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Retourné</p>
                <h3 className="text-2xl font-bold mt-1">{orders.filter(o => o.status === 'returned').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { value: "all", label: "Tous" },
            { value: "pending", label: "En attente" },
            { value: "delivered", label: "Livré" },
            { value: "returned", label: "Retourné" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedStatus === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3">Chargement...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-800">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <motion.div
                key={order.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Commande #{order.id}
                          </h3>
                          <span className={`text-xs py-1 px-2 border-2 rounded-lg ${getStatusBadge(order.status).class}`}>
                            {getStatusBadge(order.status).label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(order.total || 0)} Ar
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Client</p>
                          <p className="text-sm text-gray-900 dark:text-white">{order.client?.full_name || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact</p>
                          <p className="text-sm text-gray-900 dark:text-white">{order.client?.contacts || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {order.client?.city === "Antananarivo"
                              ? order.client?.address
                              : `${order.client?.city} - ${order.client?.coop}`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Paiement</p>
                          <p className="text-sm text-gray-900 dark:text-white">{order.payment || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.comment && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaire</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.comment}</p>
                    </div>
                  )}

                  {/* Articles */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Articles</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(order.article) &&
                        (order.article as any[])
                          .filter((a): a is { price: number; quantity: number } =>
                            a && typeof a === "object" && "price" in a && "quantity" in a
                          )
                          .map((a, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            >
                              {a.price} Ar × {a.quantity}
                            </span>
                          ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.uid, "delivered")}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Marquer comme livré
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.uid, "returned")}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Marquer comme retourné
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          order.client?.city === "Antananarivo"
                            ? order.client?.address || ""
                            : `${order.client?.city} ${order.client?.coop}` || ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="w-5 h-5 mr-2" />
                        Itinéraire
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
