import apiClient from './apiClient';

export const getGroupMessages = async (groupId) => {
    return await apiClient(`/groups/${groupId}/messages`, {
        method: 'GET'
    });
};

export const sendGroupMessage = async (groupId, content) => {
    return await apiClient(`/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
};
