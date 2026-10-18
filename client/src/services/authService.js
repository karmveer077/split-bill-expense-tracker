import request from './apiClient';

export const register = async (name, email, password) => {
    const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const login = async (email, password) => {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const getCurrentUser = async () => {
    return await request('/auth/me', { method: 'GET' });
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getLocalUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch(e) {
        return null;
    }
};
