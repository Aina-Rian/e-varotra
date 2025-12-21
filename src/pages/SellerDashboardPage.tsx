import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Settings,
  UserCircle,
  LogOut,
  Building2,
  ImageIcon,
  FileText,
  Package,
  MessageSquare,
  PieChart,
  Users,
  Home,
  History,
  Tag,
  Receipt
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { Notifications } from "../components/Notications";
import { Database } from "../types/supabase";

// Import the separated components
import Dashboard from "../components/Dashboard";
import ClientsManagement from "../components/ClientsManagement";
import SalesManagement from "../components/SellerDashboard/SalesManagement";
import PackagesManagement from "../components/SellerDashboard/PackagesManagement";

type User = Database["public"]["Tables"]["users"]["Row"];

export const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const baseClasses = {
    background: isDark ? "bg-black" : "bg-gray-50",
    sidebar: isDark ? "bg-gray-950" : "bg-white",
    card: isDark ? "bg-gray-900" : "bg-white",
    border: isDark ? "border-gray-800" : "border-gray-200",
    text: isDark ? "text-gray-100" : "text-gray-900",
    input: isDark ? "bg-gray-800 text-gray-100" : "bg-gray-50 text-gray-900",
    accent: "bg-blue-600 text-white hover:bg-blue-700",
    yellow: "bg-yellow-400 text-black",
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", id: "dashboard" },
    { icon: Users, label: "Clients", id: "clients" },
    { icon: Receipt, label: "Ventes", id: "sales" },
    { icon: Package, label: "Colis", id: "packages" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Please Sign In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be signed in to access the messaging system.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Chargement</h2>
          <p className="text-gray-600 mt-2">Attendez s'il vous plait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${baseClasses.background}`}>
      {/* Top Navigation */}
      <div
        className={`${
          isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"
        } border-b sticky top-0 z-50`}
      >
        <div className="max-w-[1920px] mx-7 px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <motion.div
                className="flex items-center space-x-2 cursor-pointer left-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
              >
                <img
                  src={isDark ? `/LLogo_dark.png` : `/LLogo_light.png`}
                  alt="Vibee's logo"
                  className={`w-auto h-10 rounded-lg`}
                />
                <h1 className="text-2xl font-bold text-vibees-yellow">
                  E-Varotra
                </h1>
              </motion.div>
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  isDark
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                Acces Vendeur
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <Notifications />

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <div
                  className={`flex items-center space-x-2 p-2 rounded-full transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <UserCircle className="w-6 h-6" />
                  <span className="text-sm font-medium truncate">
                  {userData?.username}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed left-0 z-50 group flex flex-col h-screen w-16 hover:w-52
              bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300
              overflow-hidden`}
        >
          <div className="flex-1 space-y-1 p-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors w-full
          ${
            activeSection === item.id
              ? isDark
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-900"
              : isDark
              ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              : "text-gray-700 hover:bg-gray-100"
          }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {React.createElement(item.icon, {
                  className: "w-5 h-5 flex-shrink-0",
                })}
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
          <div className="fixed bottom-3 left-0 w-52 px-2">
            <motion.button
              onClick={handleSignOut}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-white`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: menuItems.length * 0.05 }}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Se déconnecter
              </span>
            </motion.button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 ml-16 pl-6 pr-6">
          {/* Page Content */}
          <div className="top-0 flex-1 p-6">
            {activeSection === "dashboard" && (
              <Dashboard isDark={isDark} baseClasses={baseClasses} />
            )}
            {activeSection === "clients" && (
              <ClientsManagement isDark={isDark} baseClasses={baseClasses} />
            )}
            {activeSection === "sales" && (
              <SalesManagement isDark={isDark} baseClasses={baseClasses} />
            )}
            {activeSection === "packages" && (
              <PackagesManagement isDark={isDark} baseClasses={baseClasses} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
