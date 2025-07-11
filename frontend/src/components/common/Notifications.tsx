import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Notification,
  useDeleteNotification,
  useMarkAsRead,
  useNotificationBell,
  useNotifications,
} from "../../hooks/useNotifications";

/**
 * Composant pour afficher les notifications en temps réel.
 * Gère l'ouverture et la fermeture du menu déroulant des notifications.
 */
function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Détecter si on est dans l'espace admin
  const isAdminSpace = location.pathname.startsWith('/admin');

  // Hooks pour les notifications
  const { unreadCount, hasUnread, markAllRead, isMarkingAllRead } = useNotificationBell();
  const { data: notificationsData, isLoading } = useNotifications(1, 10, false);
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const notifications = notificationsData?.notifications || [];

  /**
   * Hook pour fermer le menu déroulant si l'utilisateur clique en dehors.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Gère le clic sur une notification
   */
  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue si pas encore lue
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
      }
    }

    // Naviguer vers l'action URL si définie
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  /**
   * Supprime une notification
   */
  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast.success("Notification supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  /**
   * Marque toutes les notifications comme lues
   */
  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage");
    }
  };

  /**
   * Retourne l'icône et la couleur selon le type de notification
   */
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MESSAGE':
        return { icon: 'fas fa-comment', color: 'bg-blue-100 text-blue-600' };
      case 'PAYMENT':
        return { icon: 'fas fa-credit-card', color: 'bg-green-100 text-green-600' };
      case 'ORDER':
        return { icon: 'fas fa-shopping-cart', color: 'bg-purple-100 text-purple-600' };
      case 'SUCCESS':
        return { icon: 'fas fa-check', color: 'bg-green-100 text-green-600' };
      case 'WARNING':
        return { icon: 'fas fa-exclamation-triangle', color: 'bg-yellow-100 text-yellow-600' };
      case 'ERROR':
        return { icon: 'fas fa-times-circle', color: 'bg-red-100 text-red-600' };
      case 'SYSTEM':
        return { icon: 'fas fa-cog', color: 'bg-gray-100 text-gray-600' };
      default:
        return { icon: 'fas fa-info-circle', color: 'bg-blue-100 text-blue-600' };
    }
  };

  /**
   * Formate la date de création
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "À l'instant" : `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton pour ouvrir/fermer les notifications */}
      <motion.button
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fas fa-bell text-lg"></i>
        
        {/* Badge de compteur avec animation */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
              style={{ fontSize: '10px' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Menu déroulant des notifications */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
          >
            {/* En-tête du menu */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {hasUnread && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isMarkingAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {isMarkingAllRead ? "..." : "Tout marquer lu"}
                  </button>
                )}
              </div>
              {hasUnread && (
                <p className="text-xs text-gray-500 mt-1">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <i className="fas fa-spinner fa-spin mb-2"></i>
                  <p className="text-sm">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <i className="fas fa-bell-slash text-2xl mb-2 text-gray-300"></i>
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const { icon, color } = getNotificationIcon(notification.type);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0 ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <i className={`${icon} text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-medium text-gray-900 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Supprimer"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatDate(notification.createdAt)}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pied du menu */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-100 text-center">
                <button 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onClick={() => {
                    const notificationsUrl = isAdminSpace ? '/admin/notifications' : '/app/notifications';
                    navigate(notificationsUrl);
                    setIsOpen(false);
                  }}
                >
                  Voir toutes les notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Notifications;