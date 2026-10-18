import request from './apiClient';

export const getGroups = () => {
    return request('/groups', { method: 'GET' });
};

export const createGroup = (name, description = '') => {
    return request('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, description })
    });
};

export const getGroupById = (groupId) => {
    return request(`/groups/${groupId}`, { method: 'GET' });
};

export const updateGroup = (groupId, name, description) => {
    return request(`/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description })
    });
};

export const joinGroup = (inviteCode) => {
    return request('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode })
    });
};
