import apiClient from './apiClient';

export const getNotifications = async () => {
    return await apiClient('/notifications', {
        method: 'GET'
    });
};

export const markNotificationRead = async (notificationId) => {
    return await apiClient(`/notifications/${notificationId}/read`, {
        method: 'PUT'
    });
};

export const markAllNotificationsRead = async () => {
    return await apiClient('/notifications/read-all', {
        method: 'PUT'
    });
};
