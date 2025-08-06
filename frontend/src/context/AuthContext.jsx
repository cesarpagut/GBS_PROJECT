import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const loginUser = async (email, password) => {
        const response = await apiClient.post('/auth/jwt/create/', { email, password });
        
        if (response.status === 200) {
            const data = response.data;
            setAuthTokens(data);
            localStorage.setItem('authTokens', JSON.stringify(data));
            
            const userDetailsResponse = await apiClient.get('/auth/users/me/');

            if (userDetailsResponse.status === 200) {
                setUser(userDetailsResponse.data);
            } else {
                setUser(jwtDecode(data.access));
            }

            navigate('/inventory');
        } else {
            throw new Error('Credenciales incorrectas');
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/');
    };

    useEffect(() => {
        const fetchUser = async () => {
            const storedTokens = localStorage.getItem('authTokens');
            if (storedTokens) {
                try {
                    setAuthTokens(JSON.parse(storedTokens));
                    const userDetailsResponse = await apiClient.get('/auth/users/me/');
                    setUser(userDetailsResponse.data);
                } catch (e) {
                    console.error("No se pudieron obtener los detalles del usuario.", e);
                    // No cerrar sesión aquí, el interceptor lo manejará si es necesario
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};
