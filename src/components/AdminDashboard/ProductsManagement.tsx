import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  Trash,
  Eye,
  Calendar as CalendarIcon,
  List,
  Grid3x3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import type { Database } from '../../types/supabase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, set } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';


const messages = {
  allDay: "Jour entier",
  previous: "<",
  next: ">",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Événement",
  noEventsInRange: "Aucun événement dans cette plage",
  showMoreLink: "Voir plus",
};

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});


type Products = Database['public']['Tables']['products']['Row'] & {
  supplier ?: Database['public']['Tables']['supplier']['Row'];
};

interface ProductsManagementProps {
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

interface Product {
  name: string;
  type: string;
  quantity: string;
  price: string;
  in_stock: boolean;
  date: string;
  supplier_id: string;
  articles: { name:string; price: number; quantity: number }[];
  supplier: {
    name: string;
    contact: string;
    address: string;
    email: string;
  }
}

export const ProductsManagement: React.FC<ProductsManagementProps> = ({ isDark, baseClasses }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Products[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newArticlePrice, setNewArticlePrice] = useState<number | "">("");
  const [newArticleQty, setNewArticleQty] = useState<number | "">("");
  const [newArticleName, setNewArticleName] = useState<string | "">("");
  const [formData, setFormData] = useState<Product>({
    name: '',
    type: '',
    quantity: '',
    price: '',
    in_stock: true,
    date: '',
    articles: [] as { name:string; price: number; quantity: number }[],
    supplier_id: '',
    supplier: {
      name: '',
      contact: '',
      address: '',
      email: '',
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            supplier(*)
          `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {

      if (editingProduct) {
        if (editingSupplier) {
          // Update existing supplier
          console.log('Updating supplier with ID:', user?.id);
          const { error: supplierError } = await supabase
            .from('supplier')
            .update({
              'name': formData.supplier?.name ?? '',
              'email': formData.supplier?.email ?? '',
              'contact': formData.supplier?.contact ?? '',
              'address': formData.supplier?.address ?? '',
            })
            .eq('id', editingSupplier);

            if (supplierError) {
              toast.error(`Update error: ${supplierError.message}`);
              throw supplierError;
            }
        }

        // Update existing product
        console.log('Updating product with ID:', user?.id);
        const { error } = await supabase
          .from('products')
          .update({
            'name': formData.name,
            'type': formData.type,
            'quantity': Number(formData.quantity),
            'purchase_price': Number(formData.price.replace(/\./g, '')),
            'in_stock': formData.in_stock,
          })
          .eq('id', editingProduct);

        if (error) {
          toast.error(`Update error: ${error.message}`);
          throw error;
        }
      } else {
        // Create new product
        const { data: supplier, error: supplierError} = await supabase
          .from('supplier')
          .insert({
            'name': formData.supplier?.name ?? '',
            'email': formData.supplier?.email ?? '',
            'contact': formData.supplier?.contact ?? '',
            'address': formData.supplier?.address ?? '',
          })
          .select()
          .single();

        if (supplierError) {
          toast.error(`Insert error: ${supplierError.message}`);
          throw supplierError;
        }

        const { error } = await supabase
          .from('products')
          .insert({
            'name': formData.name,
            'type': formData.type,
            'quantity': Number(formData.quantity),
            'purchase_price': Number(formData.price.replace(/\./g, '')),
            'in_stock': formData.in_stock,
            supplier: supplier ? supplier.id : null,
            'creator_id': user?.id
          });

        if (error) {
          toast.error(`Insert error: ${error.message}`);
          throw error;
        }

      }
      toast.success('Product saved successfully');
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Filtrer et trier les produits par ordre alphabétique du nom
  const filteredProducts = products
    .filter(product => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.type?.toLowerCase().includes(searchLower)
      );
    });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      quantity: "",
      price: "",
      in_stock: true,
      date: "",
      supplier_id: "",
      articles: [],
      supplier: {
        name: "",
        contact: "",
        address: "",
        email: "",
      },
    });
    setEditingProduct(null);
  };

  function formatNumber(value: string): string {
    // Supprimer tous les caractères non numériques
    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) return "";

    // Formater avec séparateurs de milliers (.)
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      pending: {
        label: "En attente",
        class:
          "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
      },
      in_stock: {
        label: "Livré",
        class:
          "border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
      },
      returned: {
        label: "Retourné",
        class:
          "border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
      },
    };
    return statusConfig[status] || statusConfig.pending;
  };

   const events = [
    {
      title: "Rendez-vous important",
      start: new Date(2025, 11, 12, 10),
      end: new Date(2025, 11, 12, 11)
    }
  ];

  const addArticle = () => {
    if (newArticleName === "" || newArticlePrice === "" || newArticleQty === "") return;
    setFormData((prev) => ({
      ...prev,
      article: [
        ...prev.articles,
        { name: newArticleName, price: Number(newArticlePrice), quantity: Number(newArticleQty) },
      ],
    }));

    setNewArticleName("");
    setNewArticlePrice("");
    setNewArticleQty("");
  };

  const removeArticle = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Produits</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérer les produits, ajouter et suivre les statuts.
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
            <option value="in_stock">En stock</option>
            <option value="rupture">Rupture</option>
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
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-vibees-accent text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-5 h-5 mr-2" /> Ajouter
            </button>
        </div>
      </div>

      {/* Products Table */}
        {/* Table Header - Fixed */}
        {!isCalendarOpen ? (
          <div
            className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border} flex flex-col`}
            style={{ height: "calc(100vh - 200px)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? "bg-[#142845]" : "bg-gray-50"}>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Id
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantite
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Prix d'achat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Bénéfice est.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bénéfice réel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Date d'ajout
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2">Chargement des produits...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-2 text-center text-gray-500"
                      >
                        Aucun produit trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:${
                          isDark ? "bg-[#142845]" : "bg-gray-50"
                        } cursor-pointer`}
                      >
                        <td className="text-sm px-4 py-2 whitespace-nowrap font-semibold">
                          #{products.findIndex((p) => p.id === product.id) + 1}
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap font-medium">
                          {product.name}
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap">
                          {product.type}
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap">
                          {product.quantity} Pcs
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap hidden md:table-cell">
                          {formatNumber(String(product.purchase_price))} Ar
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap hidden md:table-cell">
                          {" "}
                          {/* Bénéfice estime */}
                          {formatNumber(String(product.purchase_price))} Ar
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap">
                          {" "}
                          {/*// ! Bénéfice reel */}
                          {formatNumber(String(product.purchase_price))} Ar
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap font-medium">
                          <span
                            className={`text-xs py-1 px-2 border-2 rounded-lg ${
                              product.in_stock
                                ? "border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                                : "border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {product.in_stock ? "En stock" : "Rupture"}
                          </span>
                        </td>
                        <td className="text-sm px-4 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(product.id);
                                setFormData({
                                  name: product.name,
                                  type: product.type,
                                  quantity: String(product.quantity),
                                  price: String(product.purchase_price),
                                  in_stock: product.in_stock,
                                  articles: (formData.articles || []) as {
                                    name:string;
                                    price: number;
                                    quantity: number;
                                  }[],
                                  date: "",
                                  supplier_id: product.supplier?.id || '',
                                  supplier: {
                                    name: product.supplier?.name || '',
                                    contact: product.supplier?.contact || '',
                                    address: product.supplier?.address || '',
                                    email: product.supplier?.email || '',
                                  },
                                });
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(product.id)}
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
          <div className={`p-4 ${baseClasses.card} ${baseClasses.border} rounded-xl shadow-sm`}>
            <Calendar
              messages={messages}
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              culture = 'fr'
              style={{ height: "calc(100vh - 200px)" }}
            />
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
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
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
                  {editingProduct
                    ? `Modifier une produit`
                    : `Ajouter un produit`}
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
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Quantity and Type */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de produit
                  </label>
                  <input
                    list="products"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder="Choisir ou taper un type"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <datalist id="products">
                    {Array.from(
                      new Set(filteredProducts.map((product) => product.type))
                    )
                      .filter((type) => type) // remove empty types
                      .map((type) => (
                        <option key={type} value={type} />
                      ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Quantité"
                    required
                  />
                </div>
              </div>

              {/* Prices */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat
                </label>
                {/* Champ principal prix */}
                <div className="flex gap-2 items-center mb-2 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    Ar
                  </span>
                  <input
                    type="text"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value.replace(/\s/g, ""),
                      })
                    }
                    onBlur={(e) => {
                      if (e.target.value) {
                        e.target.value = formatNumber(e.target.value);
                      }
                    }}
                    className="flex-1 w-full pl-10 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="10.000"
                  />
                </div>
              </div>

              {/* // ! fournisseur */}

              <div className={`""}`}>
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded-lg border ${baseClasses.border}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h6 className="text-sm font-medium">Fournisseur</h6>
                    </div>
                    <div className="md:col-span-2 mb-3">
                      <label className="block text-xs font-medium mb-1">
                        Nom du fournisseur
                      </label>
                      <input
                        type="text"
                        value={formData.supplier?.name}
                        onChange={(e) => {
                          if (editingProduct) setEditingSupplier(formData.supplier_id);
                          setFormData({
                            ...formData,
                            supplier: {
                              ...formData.supplier,
                              name: e.target.value,
                            },
                          });
                        }}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${baseClasses.border}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Contacts
                        </label>
                        <input
                          type="text"
                          value={formData.supplier?.contact}
                          onChange={(e) => {
                            if (editingProduct) setEditingSupplier(formData.supplier_id);
                            setFormData({
                              ...formData,
                              supplier: {
                                ...formData.supplier,
                                contact: e.target.value,
                              },
                            })
                          }}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg border ${baseClasses.border}`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={formData.supplier?.address}
                          onChange={(e) => {
                            if (editingProduct) setEditingSupplier(formData.supplier_id);
                            setFormData({
                              ...formData,
                              supplier: {
                                ...formData.supplier,
                                address: e.target.value,
                              },
                            })
                            }}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg border ${baseClasses.border}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/*Produit */}
              {editingProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.in_stock ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        in_stock: e.target.value === "true",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="true">En stock</option>
                    <option value="false">En rupture</option>
                  </select>
                </div>
              )}

              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border">
                <div className="flex justify-between items-center mb-2">
                  <h6 className="text-sm font-medium">Articles</h6>
                </div>

                {/* Liste des articles */}
                <div className="mt-4 space-y-2">
                  {formData.articles.map((art, idx) => (
                    <div
                      key={idx}
                      className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900"
                    >
                      <span>
                        {art.name} -
                        {art.price} Ar | {art.quantity} pcs
                      </span>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => {
                              const updated = [...prev.articles];
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
                          {/* <Minus className="w-4 h-4" /> */}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => {
                              const updated = [...prev.articles];
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
                <div>
                  <label className="block text-xs font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newArticleName}
                    onChange={(e) =>
                      setNewArticleName(
                        e.target.value === "" ? "" : e.target.value
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-lg border"
                  />
                </div>
                {/* Inputs d'ajout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Prix
                    </label>
                    <input
                      type="number"
                      value={newArticlePrice}
                      onChange={(e) =>
                        setNewArticlePrice(
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
                      value={newArticleQty}
                      onChange={(e) =>
                        setNewArticleQty(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      disabled={!newArticlePrice}
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
                  onClick={handleSaveProduct}
                  disabled={!formData.name}
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

export default ProductsManagement;