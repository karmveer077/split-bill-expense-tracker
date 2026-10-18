import request from './apiClient';

export const getSettlementHistory = async (groupId) => {
    return await request(`/groups/${groupId}/settlements`);
};

export const createSettlement = async (groupId, settlementData) => {
    return await request(`/groups/${groupId}/settlements`, {
        method: 'POST',
        body: JSON.stringify(settlementData)
    });
};
