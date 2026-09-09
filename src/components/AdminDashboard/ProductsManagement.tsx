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
import { set } from 'date-fns';

type Products = Database['public']['Tables']['products']['Row'];

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
}

export const ProductsManagement: React.FC<ProductsManagementProps> = ({ isDark, baseClasses }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Product>({
    name: '',
    type: '',
    quantity: '',
    price: '',
    in_stock: true,
    date: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
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
        const { error } = await supabase
          .from('products')
          .insert({
            'name': formData.name,
            'type': formData.type,
            'quantity': Number(formData.quantity),
            'purchase_price': Number(formData.price.replace(/\./g, '')),
            'in_stock': formData.in_stock,
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

  // const getRoleBadgeColor = (role: User['role']) => {
  //   switch (role) {
  //     case 'admin':
  //       return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
  //     case 'organizer':
  //       return isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800';
  //     case 'speaker':
  //       return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
  //     case 'exhibitor':
  //       return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
  //     default:
  //       return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
  //   }
  // };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      quantity: '',
      price: '',
      in_stock: true,
      date: ''
    });
  };

  function formatNumber(value: string): string {
    // Supprimer tous les caractères non numériques
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) return '';

    // Formater avec séparateurs de milliers (.)
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }



  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des produits</h1>
          <p className="text-gray-500">Gérer les produits</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
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
            Ajouter un produit
          </button>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </div>

      {/* Products Table */}
      <div
        className={`${baseClasses.card} rounded-xl shadow-sm overflow-hidden border ${baseClasses.border} flex flex-col`}
        style={{ height: 'calc(100vh - 200px)' }}
      >
        {/* Table Header - Fixed */}
        <div className="overflow-x-auto flex-shrink-0">
          <table className="w-full">
            <thead>
              <tr className={isDark ? "bg-[#142845]" : "bg-gray-50"}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix d'achat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'ajout
                </th>
              </tr>
            </thead>
          </table>
        </div>
        
        {/* Table Body - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-vibees-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Chargement des produits...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
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
                    onClick={() => {
                      setEditingProduct(product.id);
                      setFormData({
                        name: product.name,
                        type: product.type,
                        quantity: String(product.quantity),
                        price: String(product.purchase_price),
                        in_stock: product.in_stock,
                        date: ''
                      });
                      setShowModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold">
                        {products.findIndex(p => p.id === product.id) + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-medium ${baseClasses.text}`}>
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {product.quantity} Pcs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${baseClasses.text}`}>
                        {formatNumber(String(product.purchase_price))} Ar
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.in_stock 
                          ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                          : (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                      }`}>
                        {product.in_stock ? "En stock" : "Rupture"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString()}
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
                  {editingProduct ? `Modifier une produit` : `Ajouter un produit`}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <datalist id="products">
                    {Array.from(new Set(filteredProducts.map((product) => product.type)))
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Quantité"
                    required
                  />
                </div>
              </div>

              {/*Produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                 <select
                    value={formData.in_stock ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, in_stock: e.target.value === "true" })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="true">En stock</option>
                    <option value="false">En rupture</option>
                  </select>
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
                    className="flex-1 w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="10.000"
                  />
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