import request from './apiClient';

export const getGroupBalances = async (groupId) => {
    return await request(`/groups/${groupId}/balances`);
};

export const getSettlementSuggestions = async (groupId) => {
    return await request(`/groups/${groupId}/settlements/suggestions`);
};
