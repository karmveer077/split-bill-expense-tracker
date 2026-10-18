import apiClient from './apiClient';

export const getGroupActivity = async (groupId) => {
    return await apiClient(`/groups/${groupId}/activity`, {
        method: 'GET'
    });
};
