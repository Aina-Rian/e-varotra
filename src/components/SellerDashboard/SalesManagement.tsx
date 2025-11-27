import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
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
  PlusCircle,
  Minus,
  MinusCircle,
  XCircle,
  Trash,
  Lock,
  Unlock,
  Play,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import type { Database } from "../../types/supabase";
import { verifyAdminPassword } from "../../lib/admin";
import { set } from "date-fns";
import { JSX } from "react/jsx-runtime";
import { User } from "@supabase/supabase-js";
import { Form } from "react-router-dom";

type Clients = Database["public"]["Tables"]["clients"]["Row"] & {
  location: Database["public"]["Tables"]["location"]["Row"];
};
type Products = Database["public"]["Tables"]["products"]["Row"];
type Orders = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"] & {
    location: Database["public"]["Tables"]["location"]["Row"];
  };
  sale: Database["public"]["Tables"]["sales"]["Row"];
};

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

interface OrdersForm {
  client: {
    full_name: string;
    location: {
      city: string;
      place: string;
    };
    locationId: string;
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

export const SalesManagement: React.FC<SalesManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Orders[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const salesEndRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showSaleLock, setShowSaleLock] = useState(false);
  const [saleLock, setSaleLock] = useState(true);
  const [sale, setSale] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newQty, setNewQty] = useState<number | "">("");
  const [orderForm, setOrderForm] = useState<OrdersForm>({
    client: {
      full_name: "",
      location: {
        city: "",
        place: "",
      },
      locationId: "",
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
          client(*, location(*))
        `
        )
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true);

      if (productError) throw productError;

      const { data: clientData, error: clientError } = await supabase.from(
        "clients"
      ).select(`
          *,
          location(*)
        `);

      if (clientError) throw clientError;

      setOrders(orderData || []);
      setProducts(productData || []);
      setClients(clientData || []);
      // console.log(orderData);
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
      let nbr_article = orderForm.article.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      orderForm.total = orderForm.article.reduce((acc, item) => {
        const price = item.price * item.quantity;
        return acc + price;
      }, 0);

      console.log(orderForm.total);

      if (orderForm.client_id) {
        // Client is selected
        clientId = orderForm.client_id;
      } else {
        // Create new client
        let locationId: string;
        // if (selectedLocation) {
        //   locationId = selectedLocation;
        // } else {
        const { data: locationData, error: locationError } = await supabase
          .from("location")
          .insert({
            city: orderForm.client.location.city,
            place: orderForm.client.location.place,
          })
          .select()
          .single();

        if (locationError) {
          toast.error(`Error creating location: ${locationError.message}`);
          throw locationError;
        }
        locationId = locationData.id;
        // }

        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            full_name: orderForm.client.full_name,
            location: locationId,
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
          const { error: clientError } = await supabase
            .from("clients")
            .update({
              full_name: orderForm.client.full_name,
              contacts: orderForm.client.contacts,
              coop: orderForm.client.coop,
              payment: orderForm.client.payment,
              fb_link: orderForm.client.fb_link,
            })
            .eq("uid", editingClient);

          if (clientError) {
            toast.error(`Error updating client: ${clientError.message}`);
            throw clientError;
          }
          if (editingLocation) {
            toast.success(editingLocation);
            const { error: locationError } = await supabase
              .from("location")
              .update({
                city: orderForm.client.location.city,
                place: orderForm.client.location.place,
              })
              .eq("id", editingLocation);

            if (locationError) {
              toast.error(`Error updating location: ${locationError.message}`);
              throw locationError;
            }
          }
        }

        const { error } = await supabase
          .from("orders")
          .update({
            client: clientId,
            article: orderForm.article,
            total: orderForm.total * 1000,
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
          total: orderForm.total * 1000,
          payment: orderForm.client.payment,
          status: orderForm.status,
          comment: orderForm.comment,
        });

        if (error) {
          toast.error(`Client not found: ${error.message}`);
          throw error;
        }

        // Update product quantity after order creation
        if (orderForm.article.length > 0 && orderForm.article[0]) {
          // Assuming you want to update the quantity of the first product in the order
          const productId =
            orderForm.article[0].product_id || orderForm.article[0].id;
          if (productId) {
            // Fetch current quantity
            const { data: productData, error: fetchError } = await supabase
              .from("products")
              .select("quantity")
              .eq("id", productId)
              .single();

            if (fetchError) {
              toast.error(`Error fetching product: ${fetchError.message}`);
              throw fetchError;
            }

            const currentQty = productData?.quantity ?? 0;
            const updatedQty = currentQty - nbr_article;

            const { error: productError } = await supabase
              .from("products")
              .update({ quantity: updatedQty })
              .eq("id", productId);

            if (productError) {
              toast.error(
                `Error updating product quantity: ${productError.message}`
              );
              throw productError;
            }
          }
        }
      }

      toast.success("Sale saved successfully");
      setShowModal(false);
      setEditingSale(null);
      setOrderModal(false);
      setShowAddClient(false);
      setEditingOrder(null);
      setEditingClient(null);
      setEditingLocation(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error(
        `Error saving sale: ${
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
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.filter((order) => order.uid !== orderId));
      toast.success("Order deleted successfully");
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  // Filtrer et trier les commandes par ordre alphabétique du nom complet
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id?.toString().toLowerCase().includes(searchLower) ||
      order.client?.full_name?.toLowerCase().includes(searchLower) ||
      order.comment?.toLowerCase().includes(searchLower)
    );
  });

  const resetForm = () => {
    setOrderForm({
      client: {
        full_name: "",
        location: {
          city: "",
          place: "",
        },
        locationId: "",
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
    // Supprimer tous les caractères non numériques
    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) return "";

    // Formater avec séparateurs de milliers (.)
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  useLayoutEffect(() => {
    const el = salesEndRef.current;
    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [filteredOrders]);

  // Ajouter un article
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

  // Supprimer un article
  const removeArticle = (idx: number) => {
    setOrderForm((prev) => ({
      ...prev,
      article: prev.article.filter((_, i) => i !== idx),
    }));
  };

  const handleUnlock = async () => {
    const input = document.getElementById(
      "admin-password"
    ) as HTMLInputElement | null;
    const password = input?.value ?? "";

    if (!password) {
      toast.error("Veuillez saisir le mot de passe administrateur");
      return;
    }

    try {
      const { success, data } = await verifyAdminPassword(password);

      if (success && data.is_valid) {
        toast.success("✅ Déverrouillé !");
        setShowSaleLock(false);
        setSaleLock(false);
      } else {
        toast.error(data.message || "Mot de passe incorrect");
      }
    } catch (err) {
      toast.error(
        (err as Error).message ||
          "Erreur lors de la vérification du mot de passe"
      );
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
              autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            />
          </div>
            <button
              onClick={() => setSale(true)}
              className="flex items-center px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Play className="w-5 h-5" />
            </button>
          {saleLock ? (
            <button
              onClick={() => setShowSaleLock(true)}
              className="flex items-center px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Lock className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setSaleLock(true)}
              className="flex items-center px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Unlock className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setOrderModal(true)}
            className="flex items-center px-4 py-2 bg-vibees-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Ajouter une vente
          </button>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </div>

      {/* Sales Table */}
      <div
        className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border} flex flex-col`}
        style={{ height: "calc(100vh - 200px)" }}
      >
        <div className="overflow-x-auto flex-1" ref={salesEndRef}>
          <table className="w-full table-fixed">
            <thead>
              <tr className={isDark ? "bg-[#142845]" : "bg-gray-50"}>
                <th className="px-6 py-3 w-16 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-inherit">
                  Commentaire
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Chargement des commandes...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  // Ne garder que les orders et les séparer par jour
                  if (filteredOrders.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          Aucune commande trouvée
                        </td>
                      </tr>
                    );
                  }

                  const groupedByDay = filteredOrders.reduce<
                    Record<string, Orders[]>
                  >((acc, order) => {
                    const date = new Date(order.created_at || "");
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = String(date.getFullYear());
                    const dayKey = `${day}/${month}/${year}`;
                    if (!acc[dayKey]) acc[dayKey] = [];
                    acc[dayKey].push(order);
                    return acc;
                  }, {});

                  // Trier les jours du plus récent au plus ancien
                  const dayKeys = Object.keys(groupedByDay).sort((a, b) => {
                    const [da, ma, ya] = a.split("/").map(Number);
                    const [db, mb, yb] = b.split("/").map(Number);
                    return (
                      new Date(yb, mb - 1, db).getTime() -
                      new Date(ya, ma - 1, da).getTime()
                    );
                  });

                  const frenchDays = [
                    "dimanche",
                    "lundi",
                    "mardi",
                    "mercredi",
                    "jeudi",
                    "vendredi",
                    "samedi",
                  ];
                  const frenchMonths = [
                    "janvier",
                    "février",
                    "mars",
                    "avril",
                    "mai",
                    "juin",
                    "juillet",
                    "août",
                    "septembre",
                    "octobre",
                    "novembre",
                    "décembre",
                  ];

                  // Trier les jours du plus ancien au plus récent (ordre croissant)
                  return dayKeys
                    .sort((a, b) => {
                      const [da, ma, ya] = a.split("/").map(Number);
                      const [db, mb, yb] = b.split("/").map(Number);
                      return (
                        new Date(ya, ma - 1, da).getTime() -
                        new Date(yb, mb - 1, db).getTime()
                      );
                    })
                    .map((day) => {
                      const ordersForDay = (groupedByDay[day] || []).sort(
                        (o1, o2) =>
                          new Date(o1.created_at || "").getTime() -
                          new Date(o2.created_at || "").getTime()
                      );

                      // day is "dd/mm/yyyy" — reconstruire une Date pour formater
                      const [dd, mm, yyyy] = day.split("/").map(Number);
                      const dateObj = new Date(yyyy, mm - 1, dd);
                      const dayName = frenchDays[dateObj.getDay()] || "";
                      const monthName = frenchMonths[dateObj.getMonth()] || "";
                      const yy = String(dateObj.getFullYear()).slice(-2);
                      const formattedDay = `${dayName} ${String(dd).padStart(
                        2,
                        "0"
                      )} ${monthName} 20${yy}`;

                      return (
                        <React.Fragment key={`day-${day}`}>
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-2 text-center bg-gray-100 text-gray-500 border-l"
                            >
                              <span className="font-semibold">Ventes du</span>{" "}
                              {formattedDay}
                            </td>
                          </tr>

                          {ordersForDay.map((order) => (
                            <tr
                              key={`order-${order.uid ?? order.id}`}
                              className={`hover:${
                                isDark ? "bg-[#142845]" : "bg-gray-50"
                              } cursor-pointer`}
                              onClick={() => {
                                setOrderForm({
                                  client: {
                                    full_name: order.client.full_name || "",
                                    location: {
                                      city: order.client.location.city || "",
                                      place: order.client.location.place || "",
                                    },
                                    locationId: order.client.location.id || "",
                                    coop: order.client.coop || "",
                                    contacts: order.client.contacts || "",
                                    payment: order.client.payment || "",
                                    fb_link: order.client.fb_link || "",
                                  },
                                  article: (order.article || []) as {
                                    price: number;
                                    quantity: number;
                                  }[],
                                  client_id: order.client?.uid || "",
                                  total: order.total || 0,
                                  status: order.status || "",
                                  comment: order.comment || "",
                                });
                                setEditingOrder(order.uid);
                                setShowAddClient(true);
                                setOrderModal(true);
                              }}
                            >
                              <td className="text-left px-6 py-4 whitespace-nowrap bg-gray-50 border-r border-red text-sm">
                                <span className="font-semibold">
                                  {order.id ?? order.uid}
                                </span>
                              </td>
                              <td
                                className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}
                              >
                                <span className="text-sm font-medium">
                                  {order.client?.full_name || "Inconnu"}
                                </span>
                              </td>
                              <td
                                className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}
                              >
                                <span className="text-sm">
                                  {Array.isArray(order.article)
                                    ? (order.article as any[])
                                        .filter(
                                          (
                                            a
                                          ): a is {
                                            price: number;
                                            quantity: number;
                                          } =>
                                            a &&
                                            typeof a === "object" &&
                                            "price" in a &&
                                            "quantity" in a
                                        )
                                        .map((a, idx, arr) => (
                                          <span key={idx}>
                                            {a.price} × {a.quantity}
                                            {idx < arr.length - 1 && " | "}
                                          </span>
                                        ))
                                    : null}
                                </span>
                              </td>
                              <td
                                className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}
                              >
                                <span className="text-sm">
                                  {formatNumber(String(order.total ?? ""))} Ar
                                </span>
                              </td>
                              <td
                                className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}
                              >
                                <span className="text-sm">{order.status}</span>
                              </td>
                              <td
                                className={`text-left px-6 py-4 whitespace-nowrap truncate text-sm ${baseClasses.text}`}
                              >
                                <span className="text-sm">{order.comment}</span>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    });
                })()
              )}
            </tbody>
          </table>

          <div
            className="py-2 text-center sticky bottom-0 bg-white border-t border-gray-200 z-20"
            ref={salesEndRef}
          />
        </div>
      </div>

      {orderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {editingOrder
                    ? `Modifier une commande`
                    : `Créer une commande`}
                </h3>
                <button
                  onClick={() => {
                    setOrderModal(false);
                    setShowAddClient(false);
                    setEditingOrder(null);
                    setEditingClient(null);
                    setEditingLocation(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* client */}
              {!editingOrder && (
                <div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={searchClient}
                        onChange={(e) => {
                          setSearchClient(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      {searchClient && (
                        <div className="absolute z-10 bg-white border border-gray-200 rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                          {clients
                            .filter((client) =>
                              client.full_name
                                ?.toLowerCase()
                                .includes(searchClient.toLowerCase())
                            )
                            .map((client) => (
                              <div
                                key={client.uid}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setOrderForm({
                                    ...orderForm,
                                    client_id: client.uid,
                                  });
                                  setSearchClient("");
                                  setOrderForm({
                                    client: {
                                      full_name: client.full_name || "",
                                      location: {
                                        city: client.location.city || "",
                                        place: client.location.place || "",
                                      },
                                      locationId: client.location || "",
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
                                  console.log("log", client.location);
                                  setShowAddClient(true);
                                }}
                              >
                                {client.full_name}
                              </div>
                            ))}
                          {clients.filter((client) =>
                            client.full_name
                              ?.toLowerCase()
                              .includes(searchClient.toLowerCase())
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
                      className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      onClick={() => setShowAddClient(true)}
                    >
                      <UserPlus className="w-5 h-5 mr-1" />
                      Nouveau client
                    </button>
                  </div>
                </div>
              )}

              {/* Modal pour ajouter un nouveau client */}
              {showAddClient && (
                <div className={`${!editingOrder ? "mt-6" : ""}`}>
                  <div className="space-y-4">
                    <div
                      className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border ${baseClasses.border}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        {editingOrder ? (
                          <>
                            <h6 className="text-sm font-medium">
                              Client: {orderForm.client.full_name}
                            </h6>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClient(orderForm.client_id);
                              }}
                              className="text-blue-500 hover:text-red-700"
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
                              Adresse ou repere
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.location.place}
                              onChange={(e) => {
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    location: {
                                      ...orderForm.client.location,
                                      place: e.target.value,
                                    },
                                  },
                                });
                                setEditingLocation(orderForm.client.locationId);
                              }}
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              ville
                            </label>
                            <input
                              type="text"
                              value={orderForm.client.location.city}
                              onChange={(e) => {
                                setEditingLocation(orderForm.client.locationId);
                                setOrderForm({
                                  ...orderForm,
                                  client: {
                                    ...orderForm.client,
                                    location: {
                                      ...orderForm.client.location,
                                      city: e.target.value,
                                    },
                                  },
                                });
                              }}
                              className={`w-full px-3 py-1.5 text-sm rounded-lg ${baseClasses.input} border ${baseClasses.border}`}
                            />
                          </div>

                          {orderForm.client.location.city &&
                            orderForm.client.location.city !==
                              "Antananarivo" && (
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
                              payement
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

              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border">
                <div className="flex justify-between items-center mb-2">
                  <h6 className="text-sm font-medium">Produit</h6>
                </div>
                <select
                  value={""}
                  onChange={(e) => {
                    // setSaleData({ ...saleData, product: e.target.value });
                    setSelectedProduct(
                      products.find((p) => p.id === e.target.value) || null
                    );
                  }}
                  className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Choisir un produit --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-between items-center mb-3">
                  <h6 className="text-sm font-medium">Articles</h6>
                </div>

                {/* Liste des articles */}
                <div className="mt-4 space-y-2">
                  {orderForm.article.map((art, idx) => (
                    <div
                      key={idx}
                      className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900"
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
                          title="Supprimer l'article"
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
                          title="Incrémenter la quantité"
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

                {/* Inputs d'ajout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Prix
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) =>
                        setNewPrice(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-1.5 text-sm rounded-lg border"
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
                        setNewQty(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      disabled={!newPrice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addArticle();
                        }
                      }}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border"
                    />
                  </div>
                </div>

                {/* Bouton ajouter */}
                <button
                  type="button"
                  onClick={addArticle}
                  className="flex items-center text-green-500 hover:text-green-700"
                >
                  <Plus className="w-5 h-5 mr-1" /> Ajouter
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire
                </label>
                <textarea
                  value={orderForm.comment}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, comment: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  // disabled={!saleData.title || !saleData.description}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <span>Enregister</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showSaleLock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Déverrouiller avec le mot de passe administrateur
              </h3>
              <button
                onClick={() => setShowSaleLock(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Saisissez le mot de passe administrateur pour déverrouiller cette
              action.
            </p>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Mot de passe administrateur
              </label>
              <input
                id="admin-password"
                name="admin-password"
                type="password"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") await handleUnlock();
                }}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaleLock(false)}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleUnlock}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Déverrouiller
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
