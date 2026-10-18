const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        if (response.status === 204) return null;
        
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.message || 'Something went wrong');
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            const networkError = new Error('Unable to connect to the server. Please try again.');
            networkError.status = 0;
            throw networkError;
        }
        throw error;
    }
};

export default request;
