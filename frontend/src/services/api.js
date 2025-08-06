import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// --- FIX DEFINITIVO: Interceptor para manejar la expiración de tokens ---
apiClient.interceptors.request.use(config => {
    const authTokens = localStorage.getItem('authTokens') 
        ? JSON.parse(localStorage.getItem('authTokens')) 
        : null;

    if (authTokens) {
        config.headers.Authorization = `JWT ${authTokens.access}`;
    }
    return config;
});

// --- Interceptor de respuesta para renovar el token ---
apiClient.interceptors.response.use(
    response => response, // Si la respuesta es exitosa, no hacer nada
    async error => {
        const originalRequest = error.config;
        
        // Si el error es 401 y no es un reintento
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Marcar como reintento
            
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const refreshToken = authTokens?.refresh;

            if (refreshToken) {
                try {
                    // Pedir un nuevo token de acceso
                    const response = await axios.post('http://127.0.0.1:8000/api/auth/jwt/refresh/', {
                        refresh: refreshToken
                    });

                    const newAuthTokens = {
                        ...authTokens,
                        access: response.data.access,
                    };

                    // Guardar los nuevos tokens
                    localStorage.setItem('authTokens', JSON.stringify(newAuthTokens));
                    
                    // Actualizar el encabezado de la petición original y reintentarla
                    apiClient.defaults.headers.common['Authorization'] = `JWT ${response.data.access}`;
                    originalRequest.headers['Authorization'] = `JWT ${response.data.access}`;
                    
                    return apiClient(originalRequest);

                } catch (refreshError) {
                    console.error("No se pudo renovar el token, cerrando sesión.", refreshError);
                    // Si la renovación falla, limpiar todo y redirigir al login
                    localStorage.removeItem('authTokens');
                    window.location.href = '/'; 
                    return Promise.reject(refreshError);
                }
            }
        }
        
        return Promise.reject(error);
    }
);


export default apiClient;