import React, { useState, useEffect, useRef} from "react";
import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Search,
  UserPlus,
  X,
  Eye,
  Grid3x3,
  List,
  Calendar,
  MapPin,
  Truck
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import type { Database } from "../../types/supabase";

type User = Database["public"]["Tables"]["users"]["Row"];
type Orders = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"]& {
    location: Database["public"]["Tables"]["location"]["Row"];
  };
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

interface PackageFormData {
  deliveryFee: number;
  deliverer: string;
  status: string;
  locationId?: string;
}

export const PackagesManagement: React.FC<PackagesManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const [orders, setOrders] = useState<Orders[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Orders | null>(null);
  const [deliverers, setDeliverers] = useState<User[]>([]);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const salesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [packageFormData, setPackageFormData] = useState<PackageFormData>({
    deliveryFee: 0,
    deliverer: "",
    status: "pending",
    locationId: "",
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
        .select(`
          *,
          client(*, location(*))
        `)
        .order("created_at", { ascending: true });

      if (orderError) throw orderError;

      const { data: delivererData, error: delivererError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "deliver");

      if (delivererError) throw delivererError;

      setOrders(orderData || []);
      setDeliverers(delivererData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackage = async () => {
    try {
      const { error: locationError } = await supabase
        .from("location")
        .update({
          deliver: packageFormData.deliverer,
          delivery_fee: packageFormData.deliveryFee,
        })
        .eq("id", selectedOrder?.client.location.id);

      if (locationError) throw locationError;

      const { error: packageError } = await supabase
        .from("orders")
        .update({
          status: packageFormData.status,
          net_payement: selectedOrder?.total + packageFormData.deliveryFee,
        })
        .eq("uid", selectedOrder?.uid);

      if (packageError) throw packageError;

      toast.success("Colis enregistre avec succes");
      setSelectedOrder(null);
      setEditingPackage(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error(
        `Erreur d'enregistrement du colis: ${
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

  function formatNumber(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      pending: { label: "En attente", class: "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400" },
      delivered: { label: "Livré", class: "border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
      returned: { label: "Retourné", class: "border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const formatPhoneNumber = (input?: string): string => {
    const digits = (input || "").replace(/\D/g, "");
    if (!digits) return "";
    const pattern = [3, 2, 3, 2];
    const parts: string[] = [];
    let i = 0;
    for (const len of pattern) {
      if (i >= digits.length) break;
      parts.push(digits.slice(i, i + len));
      i += len;
    }
    if (i < digits.length) parts.push(digits.slice(i));
    return parts.join(" ");
  };

    const resetForm = () => {
    setPackageFormData({
      deliveryFee: 0,
      deliverer: "",
      status: "pending",
      locationId: "",
    });
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
              className={`p-2 rounded ${
                viewMode === "table" ? "bg-white dark:bg-gray-700 shadow" : ""
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow" : ""
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content - Table or Grid View */}
      {viewMode === "table" ? (
        <div
          className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? "bg-gray-950" : "bg-gray-50"}>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Id
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Lieu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Articles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Livreur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
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
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucun colis trouvé
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={`order-${order.uid}`}
                      className={`hover:${
                        isDark ? "bg-gray-800" : "bg-gray-50"
                      } cursor-pointer`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        #{order.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {order.client?.full_name || "Inconnu"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                        {order.client.location.city === "Antananarivo"
                          ? order.client.location.place
                          : order.client?.coop}
                      </td>
                      <td className="px-4 py-4 text-sm hidden lg:table-cell">
                        {Array.isArray(order.article)
                          ? (order.article as any[])
                              .filter(
                                (a): a is { price: number; quantity: number } =>
                                  a &&
                                  typeof a === "object" &&
                                  "price" in a &&
                                  "quantity" in a
                              )
                              .map(
                                (
                                  a: { price: number; quantity: number },
                                  idx: number,
                                  arr: any[]
                                ) => (
                                  <span key={idx}>
                                    {a.price} × {a.quantity}
                                    {idx < arr.length - 1 && " | "}
                                  </span>
                                )
                              )
                          : null}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatNumber(
                          String(
                            order.net_payement
                              ? order.net_payement
                              : order.total
                          )
                        )}{" "}
                        Ar
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                        {deliverers.find(
                          (d) => d.id === order?.client.location.deliver
                        )?.username
                          ? deliverers.find(
                              (d) => d.id === order?.client.location.deliver
                            )?.username
                          : "Non assigné"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`text-xs py-1 px-2 border-2 rounded-lg ${
                            getStatusBadge(order.status).class
                          }`}
                        >
                          {getStatusBadge(order.status).label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setEditingPackage(order.uid);
                              setPackageFormData({
                                deliveryFee: order.client.location.delivery_fee,
                                deliverer: order.client.location.deliver || "",
                                status: order.status,
                                locationId: order.client.location.id,
                              });
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
                    <p className="text-sm text-gray-500">
                      {order.client?.full_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs py-1 px-2 border-2 rounded-lg ${
                      getStatusBadge(order.status).class
                    }`}
                  >
                    {getStatusBadge(order.status).label}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="text-lg text-grey-800">
                    {Array.isArray(order.article)
                      ? (order.article as any[])
                          .filter(
                            (a): a is { price: number; quantity: number } =>
                              a &&
                              typeof a === "object" &&
                              "price" in a &&
                              "quantity" in a
                          )
                          .map(
                            (
                              a: { price: number; quantity: number },
                              idx: number,
                              arr: any[]
                            ) => (
                              <span key={idx}>
                                {a.price} × {a.quantity}
                                {idx < arr.length - 1 && " | "}
                              </span>
                            )
                          )
                      : null}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{order.client.location.place}</span>
                    {order.client.location.city !== "Antananarivo" && (
                      <>
                        <Truck className="ml-24 w-4 h-4 text-gray-400" />
                        <span>{order.client?.coop}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Livreur :</span>
                    <span>
                      {deliverers.find(
                        (d) => d.id === order?.client.location.deliver
                      )?.username
                        ? deliverers.find(
                            (d) => d.id === order?.client.location.deliver
                          )?.username
                        : "Non assigné"}
                    </span>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatNumber(
                      String(
                        order.net_payement ? order.net_payement : order.total
                      )
                    )}{" "}
                    Ar
                  </div>
                  <div className="text-lg h-12 overflow-y-auto">
                    <p className="text-sm text-gray-800">{order.comment}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setEditingPackage(order.uid);
                      setPackageFormData({
                        deliveryFee: order.client.location.delivery_fee,
                        deliverer: order.client.location.deliver || "",
                        status: order.status,
                        locationId: order.client.location.id,
                      });
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
            <h3 className="text-xl font-semibold mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action
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
                onClick={() => handleDeleteOrder(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PackagesManagement;
