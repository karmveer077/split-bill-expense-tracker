import request from './apiClient';

export const getExpenses = () => {
    return request('/expenses', { method: 'GET' });
};

export const createExpense = (groupId, payload) => {
    return request(`/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const updateExpense = (expenseId, payload) => {
    return request(`/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

export const deleteExpense = (expenseId) => {
    return request(`/expenses/${expenseId}`, { method: 'DELETE' });
};
