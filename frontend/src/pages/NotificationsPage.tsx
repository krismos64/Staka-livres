import { motion } from "framer-motion";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Notification,
  useDeleteNotification,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotifications,
} from "../hooks/useNotifications";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: notificationsData, isLoading, error } = useNotifications(
    currentPage,
    20,
    selectedFilter === "unread"
  );
  
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const notifications = notificationsData?.notifications || [];
  const pagination = notificationsData?.pagination;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
      }
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast.success("Notification supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage");
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
          <p className="text-red-600">Erreur lors du chargement des notifications</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <i className="fas fa-bell mr-3 text-blue-500"></i>
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos notifications et restez informé des événements importants
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour
          </button>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Toutes ({pagination?.total || 0})
            </button>
            <button
              onClick={() => setSelectedFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "unread"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors text-sm font-medium"
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Marquage...
                </>
              ) : (
                <>
                  <i className="fas fa-check-double mr-2"></i>
                  Tout marquer lu
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-500">
              {selectedFilter === "unread"
                ? "Vous n'avez aucune notification non lue"
                : "Vous n'avez aucune notification pour le moment"}
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const { icon, color } = getNotificationIcon(notification.type);
            const isUnread = !notification.isRead;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  isUnread ? 'ring-2 ring-blue-100' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${icon} text-lg`}></i>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium text-gray-900 ${
                          isUnread ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                          {isUnread && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            Voir
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
              const isCurrentPage = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    isCurrentPage
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;