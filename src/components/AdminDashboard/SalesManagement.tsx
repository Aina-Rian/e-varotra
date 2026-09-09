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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import type { Database } from "../../types/supabase";
import { set } from "date-fns";
import { JSX } from "react/jsx-runtime";
import { User } from "@supabase/supabase-js";
import { Form } from "react-router-dom";

type Sales = Database["public"]["Tables"]["sales"]["Row"] & {
  creator: Database["public"]["Tables"]["users"]["Row"];
};
type Clients = Database["public"]["Tables"]["clients"]["Row"];
type Products = Database["public"]["Tables"]["products"]["Row"];
type Orders = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"];
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

interface saleForm {
  title: string;
  type: string;
  product: string;
  description: string;
  quantity: number;
  prices: number[];
  creator: string;
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

export const SalesManagement: React.FC<SalesManagementProps> = ({
  isDark,
  baseClasses,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Orders[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [sales, setSales] = useState<Sales[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [editingSale, setEditingSale] = useState<string | null>(null);
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
  const [orderModal, setOrderModal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newQty, setNewQty] = useState<number | "">("");
  const [saleData, setSaleData] = useState<saleForm>({
    title: "",
    type: "",
    product: "",
    description: "",
    quantity: 0,
    prices: [],
    creator: "",
  });
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
        .order("created_at", { ascending: false });

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

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          *,
          creator:users(*)
        `
        )
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      setOrders(orderData || []);
      setProducts(productData || []);
      setClients(clientData || []);
      setSales(salesData || []);
      // console.log(orderData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSale = async () => {
    try {
      if (editingSale) {
        // Update existing sale
        console.log("Updating sale with ID:", editingSale);
        const { error } = await supabase
          .from("sales")
          .update({
            title: saleData.title,
            type: saleData.type,
            product_id: saleData.product,
            description: saleData.description,
            quantity: saleData.quantity,
            prices: saleData.prices,
          })
          .eq("id", editingSale);

        if (error) {
          toast.error(`Update error: ${error.message}`);
          throw error;
        }
      } else {
        // Create new sale
        const { error } = await supabase.from("sales").insert({
          title: saleData.title,
          type: saleData.type,
          product_id: saleData.product,
          description: saleData.description,
          quantity: saleData.quantity,
          prices: saleData.prices,
          creator: user?.id,
        });

        if (error) {
          toast.error(`Insert error: ${error.message}`);
          throw error;
        }
      }
      toast.success("Sale saved successfully");
      setShowModal(false);
      setEditingSale(null);
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

  const handleSaveOrder = async () => {
    try {
      let clientId: string;
      let nbr_article = orderForm.article.reduce((acc, item) => acc + item.quantity, 0);

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
        const { error } = await supabase.from("orders")
          .insert({
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
          const productId = orderForm.article[0].product_id || orderForm.article[0].id;
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
              toast.error(`Error updating product quantity: ${productError.message}`);
              throw productError;
            }
          }
        }
      }

      toast.success("Sale saved successfully");
      setShowModal(false);
      setEditingSale(null);
      setOrderModal(false);
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
    setSaleData({
      title: "",
      type: "",
      product: "",
      description: "",
      quantity: 0,
      prices: [],
      creator: "",
    });

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
  }, [sales, filteredOrders]);

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
            onClick={() => setShowModal(true)}
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
                      <span className="ml-2">Chargement des ventes...</span>
                    </div>
                  </td>
                </tr>
              ) : (() => {
                // Séparer les ventes en cours et terminées
                const currentSales = sales
                  .filter((sale) => !sale.end_time)
                  .map((sale) => ({
                    type: "current_sale" as const,
                    created_at: sale.created_at,
                    data: sale,
                  }));

                const endedSales = sales
                  .filter((sale) => sale.end_time)
                  .map((sale) => ({
                    type: "ended_sale" as const,
                    created_at: sale.created_at,
                    data: sale,
                  }));

                const combined = [
                  ...currentSales,
                  ...endedSales,
                  ...filteredOrders.map((order) => ({
                    type: "order" as const,
                    created_at: order.created_at,
                    data: order,
                  })),
                ].sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );

                if (combined.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Aucun vente ou commande trouvée
                      </td>
                    </tr>
                  );
                }

                return combined.map((item) => {
                  if (item.type === "current_sale") {
                    const sale = item.data as Sales;
                    return (
                      <tr key={`sale-${sale.id}`}>
                        <td
                          colSpan={6}
                          className="px-6 py-2 text-center bg-gray-100 text-gray-500 border-l border-red"
                        >
                          <span className="font-semibold">Vente</span> #
                          {sale.title} du{" "}
                          {(() => {
                            const date = new Date(sale.created_at);
                            const day = String(date.getDate()).padStart(
                              2,
                              "0"
                            );
                            const month = String(
                              date.getMonth() + 1
                            ).padStart(2, "0");
                            const year = String(date.getFullYear()).slice(-2);
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(
                              date.getMinutes()
                            ).padStart(2, "0");
                            return `${day}/${month}/${year} ${hours}:${minutes}`;
                          })()}
                          {` crée par ${
                            (sale.creator &&
                              (sale.creator as any).username) ||
                            "Inconnu"
                          }`}
                          .
                        </td>
                      </tr>
                    );
                  }
                  if (item.type === "ended_sale") {
                    const sale = item.data as Sales;
                    return (
                      <tr key={`sale-${sale.id}`}>
                        <td
                          colSpan={6}
                          className="px-6 py-2 text-sm text-center bg-gray-100 text-gray-500 border-l border-red"
                        >
                          <span className="font-semibold">Fin du Vente</span> #
                          {sale.title} du{" "}
                          {(() => {
                            const date = new Date(sale.end_time ?? "");
                            const day = String(date.getDate()).padStart(
                              2,
                              "0"
                            );
                            const month = String(
                              date.getMonth() + 1
                            ).padStart(2, "0");
                            const year = String(date.getFullYear()).slice(-2);
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(
                              date.getMinutes()
                            ).padStart(2, "0");
                            return `${day}/${month}/${year} ${hours}:${minutes}`;
                          })()}
                          {` crée par ${
                            (sale.creator &&
                              (sale.creator as any).username) ||
                            "Inconnu"
                          }`}
                          .
                        </td>
                      </tr>
                    );
                  } else {
                    const order = item.data as Orders;
                    return (
                      <tr
                        key={`order-${order.uid}`}
                        className={`hover:${isDark ? "bg-[#142845]" : "bg-gray-50"} cursor-pointer`}
                        onClick={() => {
                          setOrderForm({
                            client: order.client,
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
                          <span className="font-semibold">{order.id}</span>
                        </td>
                        <td className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}>
                          <span className="text-sm font-medium">
                            {order.client?.full_name || "Inconnu"}
                          </span>
                        </td>
                        <td className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}>
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
                                  .map(
                                    (
                                      a: { price: number; quantity: number },
                                      idx: number,
                                      arr: {
                                        price: number;
                                        quantity: number;
                                      }[]
                                    ) => (
                                      <span key={idx}>
                                        {a.price} × {a.quantity}
                                        {idx < arr.length - 1 && " | "}
                                      </span>
                                    )
                                  )
                              : null}
                          </span>
                        </td>
                        <td className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}>
                          <span className="text-sm">
                            {formatNumber(String(order.total ?? ""))} Ar
                          </span>
                        </td>
                        <td className={`text-left px-6 py-4 whitespace-nowrap text-sm ${baseClasses.text}`}>
                          <span className="text-sm">
                            {order.status}
                          </span>
                        </td>
                        <td className={`text-left px-6 py-4 whitespace-nowrap truncate text-sm ${baseClasses.text}`}>
                          <span className="text-sm">
                            {order.comment}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                });
              })()}
            </tbody>
          </table>

          <div
            className="py-2 text-center sticky bottom-0 bg-white border-t border-gray-200 z-20"
            ref={salesEndRef}
          >
            <button
              type="button"
              onClick={() => {
                setOrderModal(true);
                setEditingOrder(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-vibees-accent text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Ajouter une commande
            </button>
          </div>
        </div>
      </div>

      {/* Add sale modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Creer une vente</h3>
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
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du vente
                </label>
                <input
                  type="text"
                  value={saleData.title}
                  onChange={(e) =>
                    setSaleData({ ...saleData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saleData.description}
                  onChange={(e) =>
                    setSaleData({ ...saleData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              {/*Produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit
                </label>
                <select
                  value={saleData.product}
                  onChange={(e) => {
                    setSaleData({ ...saleData, product: e.target.value });
                    setSelectedProduct(
                      products.find((p) => p.id === e.target.value) || null
                    );
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Choisir un produit --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Type */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de vente
                  </label>
                  <select
                    value={saleData.type}
                    onChange={(e) =>
                      setSaleData({ ...saleData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Choisir un type --</option>
                    <option value="Live">Live</option>
                    <option value="Photo">Photo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={saleData.quantity || ""}
                    onChange={(e) =>
                      setSaleData({
                        ...saleData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={
                      selectedProduct
                        ? `Quantite du produit : ${selectedProduct.quantity}`
                        : "Quantity"
                    }
                    required
                  />
                </div>
              </div>

              {/* Prices */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix
                </label>
                {/* Champs de prix dynamiques */}
                {saleData.prices.map((price, idx) => (
                  <div
                    className="flex gap-2 items-center mb-2 relative"
                    key={idx}
                  >
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      Ar
                    </span>
                    <input
                      type="number"
                      value={price === 0 ? "" : price}
                      min={0}
                      onChange={(e) => {
                        const newPrices = [...saleData.prices];
                        newPrices[idx] =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        setSaleData({ ...saleData, prices: newPrices });
                      }}
                      className="flex-1 w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Prix #${idx + 1}`}
                    />
                    {saleData.prices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPrices = [...saleData.prices];
                          newPrices.splice(idx, 1);
                          setSaleData({ ...saleData, prices: newPrices });
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        title="Supprimer ce prix"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {/* Bouton pour ajouter un champ prix supplémentaire */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSaleData({
                        ...saleData,
                        prices: [...saleData.prices, 0],
                      });
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mt-1"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Ajouter un prix
                  </button>
                </div>
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
                  onClick={handleSaveSale}
                  disabled={!saleData.title || !saleData.description}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <span>Enregister</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              ville
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

                          {orderForm.client.city &&
                            orderForm.client.city !== "Antananarivo" && (
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
                <div className="flex justify-between items-center mb-3">
                  <h6 className="text-sm font-medium">Articles</h6>
                </div>

                {/* Liste des articles */}
                <div className="mt-4 space-y-2">
                  {orderForm.article.map((art, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900"
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
    </div>
  );
};

export default SalesManagement;
