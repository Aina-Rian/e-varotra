import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Filter,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Trash2
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'event' | 'networking' | 'stand' | 'system';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const Notifications: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
	const { user } = useAuth();



	const { notifications, markAllAsRead, deleteNotifications } = useNotifications(user?.id || '');

	// console.log(notifications);
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'networking': return <Users className="w-4 h-4" />;
      case 'stand': return <Building2 className="w-4 h-4" />;
      case 'system': return <Info className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesPriority && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleViewAllClick = () => {
    setShowAllNotifications(!showAllNotifications);
    if (!showAllNotifications) {
      setSelectionMode(false);
      setSelectedNotifications([]);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleSelectionMode = async () => {
    if (selectionMode) {
      // Si déjà en mode sélection, effacer les éléments sélectionnés
      if (selectedNotifications.length > 0) {
				await deleteNotifications(selectedNotifications);
        // Ici vous pouvez implémenter la logique pour supprimer les notifications
        console.log('Suppression des notifications:', selectedNotifications);
        setSelectedNotifications([]);
      }
      setSelectionMode(false);
    } else {
      // Activer le mode sélection
      setSelectionMode(true);
    }
  };

  const handleNotificationSelect = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
      >
        <Bell className={`h-5 w-5 text-gray-700 hover:text-indigo-600`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 transform translate-x-1/2 -translate-y-1/2"></span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-1 z-50"
            style={{ 
              width: showAllNotifications ? '500px' : '320px',
              maxHeight: showAllNotifications ? '600px' : '400px'
            }}
          >
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium">Notifications récentes</h3>
            </div>

            {/* Filters - Only show when expanded */}
            {showAllNotifications && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-3 border-b border-gray-200 bg-gray-50"
              >
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filtres:</span>
                  </div>
                  
                  {/* Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tous les types</option>
                    <option value="message">Messages</option>
                    <option value="event">Événements</option>
                    <option value="networking">Networking</option>
                    <option value="stand">Stands</option>
                    <option value="system">Système</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Notifications List */}
            <div className={`overflow-y-auto ${showAllNotifications ? 'max-h-96' : 'max-h-none'}`}>
              {filteredNotifications.length > 0 ? (
                (showAllNotifications ? filteredNotifications : filteredNotifications.slice(0, 3)).map((notification) => (
                  <div key={notification.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for selection mode */}
                      {showAllNotifications && selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleNotificationSelect(notification.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      
                      <div className="mt-1">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                          {getPriorityIcon(notification.priority)}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(() => {
                              const created = new Date(notification.created_at);
                              const now = new Date();
                              const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
                              
                              if (diffInSeconds < 60) {
                                return `${diffInSeconds} secondes`;
                              } else if (diffInSeconds < 3600) {
                                const minutes = Math.floor(diffInSeconds / 60);
                                return `${minutes} minute${minutes > 1 ? 's' : ''}`;
                              } else if (diffInSeconds < 86400) {
                                const hours = Math.floor(diffInSeconds / 3600);
                                return `${hours} heure${hours > 1 ? 's' : ''}`;
                              } else {
                                const days = Math.floor(diffInSeconds / 86400);
                                return `${days} jour${days > 1 ? 's' : ''}`;
                              }
                            })()}
                          </div>
                          {showAllNotifications && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.type === 'message' ? 'bg-blue-100 text-blue-800' :
                              notification.type === 'event' ? 'bg-green-100 text-green-800' :
                              notification.type === 'networking' ? 'bg-purple-100 text-purple-800' :
                              notification.type === 'stand' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune notification trouvée</p>
                </div>
              )}
            </div>

            {/* Action Buttons - Above footer */}
            {showAllNotifications && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectionMode && (
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {selectedNotifications.length === filteredNotifications.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Marquer tout comme lu
                    </button>
                    <button
                      onClick={handleSelectionMode}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        selectionMode 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {selectionMode ? (
                        <>
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Effacer ({selectedNotifications.length})
                        </>
                      ) : (
                        'Effacer la sélection'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200">
              <button 
                onClick={handleViewAllClick}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showAllNotifications ? 'Réduire' : `Voir toutes les notifications (${notifications.length})`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
