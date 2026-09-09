import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UsersRound, 
  Calendar, 
  Layout, 
  MessageSquare, 
  CheckCircle, 
  ArrowUpRight, 
  Plus, 
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

interface DashboardProps {
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

export const Dashboard: React.FC<DashboardProps> = ({ isDark, baseClasses }) => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProducts: 0,
    totalSales: 0,
    newClients: 0,
    totalPackages: 0,
    daySales: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [contentItems, setContentItems] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
    fetchRecentEvents();
    fetchContentModeration();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch total client
      const { count: clientCount, error: userError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      // Fetch total available products
      const { count: ProductCount, error: eventError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', true);
      
      // Fetch new clients
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newClientsCount, error: newClientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      
      // Fetch total sessions
      // const { count: sessionCount, error: sessionError } = await supabase
      //   .from('sessions')
      //   .select('*', { count: 'exact', head: true });
      
      // // Fetch pending questions
      // const { count: questionCount, error: questionError } = await supabase
      //   .from('session_questions')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('status', 'pending');
      
      // // Fetch total registrations
      // const { count: registrationCount, error: registrationError } = await supabase
      //   .from('event_registrations')
      //   .select('*', { count: 'exact', head: true });
      
      setStats({
        totalClients: clientCount || 0,
        totalProducts: ProductCount || 0,
        totalSales: 0, 
        newClients: newClientsCount || 0,
        totalPackages: 0,
        daySales: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentUsers(data || []);
    } catch (error) {
      console.error('Error fetching recent users:', error);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error fetching recent events:', error);
    }
  };

  const fetchContentModeration = async () => {
    try {
      // Fetch recent messages that might need moderation
      const { data: messages, error: messagesError } = await supabase
        .from('session_messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          session_id,
          sessions:session_id(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (messagesError) throw messagesError;
      
      // Fetch recent questions that might need moderation
      const { data: questions, error: questionsError } = await supabase
        .from('session_questions')
        .select(`
          id,
          question,
          status,
          created_at,
          user_id,
          session_id,
          sessions:session_id(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (questionsError) throw questionsError;
      
      // Combine and format the data
      const formattedMessages = (messages || []).map(msg => ({
        id: msg.id,
        type: 'message',
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        session_id: msg.session_id,
        session_title: msg.sessions?.title || 'Unknown Session',
        flagged: Math.random() < 0.2 // Simulate some messages being flagged
      }));
      
      const formattedQuestions = (questions || []).map(q => ({
        id: q.id,
        type: 'question',
        content: q.question,
        created_at: q.created_at,
        user_id: q.user_id,
        session_id: q.session_id,
        session_title: q.sessions?.title || 'Unknown Session',
        status: q.status,
        flagged: Math.random() < 0.2 // Simulate some questions being flagged
      }));
      
      // Combine and sort by creation date
      const combined = [...formattedMessages, ...formattedQuestions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setContentItems(combined);
    } catch (error) {
      console.error('Error fetching content for moderation:', error);
    }
  };

  const handleApproveContent = async (id: string, type: string) => {
    try {
      if (type === 'question') {
        const { error } = await supabase
          .from('session_questions')
          .update({ status: 'answered' })
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Question approved');
      } else {
        // For messages, we could mark them as reviewed in a real implementation
        toast.success('Message approved');
      }
      
      // Refresh the content list
      fetchContentModeration();
    } catch (error) {
      console.error('Error approving content:', error);
      toast.error('Failed to approve content');
    }
  };

  const handleDeleteContent = async (id: string, type: string) => {
    try {
      if (type === 'question') {
        const { error } = await supabase
          .from('session_questions')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('session_messages')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      toast.success('Content deleted successfully');
      fetchContentModeration();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handleReportContent = async (id: string, type: string) => {
    try {
      // In a real implementation, you would have a reports table
      // For now, we'll just show a success message
      toast.success('Content reported for review');
      
      // Simulate marking the content as flagged
      setContentItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, flagged: true } : item
        )
      );
    } catch (error) {
      console.error('Error reporting content:', error);
      toast.error('Failed to report content');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'organizer':
        return isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800';
      case 'speaker':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'exhibitor':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'moderator':
        return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'draft':
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
      case 'live':
        return isDark ? 'bg-vibees-yellow text-vibees-navy' : 'bg-vibees-yellow text-vibees-navy';
      case 'ended':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord de Gestion</h1>
          <p className="text-gray-500 dark:text-gray-400">Bienvenue dans le tableau de bord</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              fetchStats();
              fetchRecentUsers();
              fetchRecentEvents();
              fetchContentModeration();
              toast.success('Dashboard refreshed');
            }}
            className="flex items-center px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button className={`flex items-center px-4 py-2 rounded-lg ${baseClasses.accent}`}>
            <Plus className="w-4 h-4 mr-2" />
            Creer un Rapport
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clients Total</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalClients}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Produits Disponible</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalProducts}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                8% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Package className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ventes Total</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalSales}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                15% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Calendar className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nouveau Clients</p>
              <h3 className="text-2xl font-bold mt-1">{stats.newClients}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                15% increase
              </p>
              {/* <p className="text-xs text-yellow-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Needs attention
              </p> */}
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
              <UsersRound className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Colis Total</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalPackages}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                5% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
              <Calendar className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ventes effectue aujourd'hui</p>
              <h3 className="text-2xl font-bold mt-1">{stats.daySales}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                18% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-pink-900/30' : 'bg-pink-100'}`}>
              <CheckCircle className={`w-6 h-6 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Clients Aujourd'hui</h3>
              <button className="text-sm text-vibees-accent hover:underline">
                Tout voir
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-[#142845]' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telephone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Achats</th>
                </tr>
              </thead>
              {/* <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsers.map((user) => (
                  <tr key={user.id} className={`hover:${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="h-10 w-10 rounded-full" />
                          ) : (
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                              {user.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-vibees-accent hover:text-vibees-accent/80 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody> */}
            </table>
          </div>
        </div>

        {/* Recent Events */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ventes Aujourd'hui</h3>
              <button className="text-sm text-vibees-accent hover:underline">
                Tout Voir
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-[#142845]' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendus</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              {/* <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentEvents.map((event) => (
                  <tr key={event.id} className={`hover:${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {event.banner_url ? (
                            <img src={event.banner_url} alt={event.title} className="h-10 w-10 object-cover" />
                          ) : (
                            <Calendar className="h-6 w-6 m-2 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                        <span>{event.current_attendees}/{event.max_attendees}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-vibees-accent hover:text-vibees-accent/80 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody> */}
            </table>
          </div>
        </div>
      </div>

      {/* Content Moderation */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tâches à faire</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  activeTab === 'all' 
                    ? 'bg-vibees-accent text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Tout
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  activeTab === 'pending' 
                    ? 'bg-vibees-yellow text-vibees-navy' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                En Attente
              </button>
              <button 
                onClick={() => setActiveTab('flagged')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  activeTab === 'flagged' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {contentItems.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pas de tâches disponibles</p>
              </div>
            ) : (
              contentItems
                .filter(item => {
                  if (activeTab === 'all') return true;
                  if (activeTab === 'pending' && item.type === 'question') return item.status === 'pending';
                  if (activeTab === 'flagged') return item.flagged;
                  return true;
                })
                .map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'} border ${
                      item.flagged ? 'border-red-500' : baseClasses.border
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                            {item.user_id ? item.user_id.substring(0, 1).toUpperCase() : 'A'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">
                              {item.user_id ? `User ${item.user_id.substring(0, 8)}` : 'Anonymous User'}
                            </p>
                            {item.flagged && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                                Flagged
                              </span>
                            )}
                            {item.type === 'question' && item.status === 'pending' && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            In {item.session_title}
                          </p>
                          <p className="mt-1">{item.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleApproveContent(item.id, item.type)}
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleReportContent(item.id, item.type)}
                          className="p-1 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-full transition-colors"
                          title="Report"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteContent(item.id, item.type)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Rapport du jour</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2 border-b">
                <h2 className="font-semibold">Clients</h2>
              </div>
               <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pas de remarques</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2 border-b">
                <h2 className="font-semibold">Ventes</h2>
              </div>
               <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pas de remarques</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#142845]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2 border-b">
                <h4 className="font-medium">Livraison</h4>
              </div>
               <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pas de remarques</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;