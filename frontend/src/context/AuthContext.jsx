import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer'; // Importamos nuestro hook

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false); // Estado para el modal
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setIsTimeoutModalOpen(false); // Nos aseguramos de cerrar el modal
    navigate('/');
  };
  
  // Función que se llamará cuando el temporizador de inactividad se cumpla.
  const handleIdle = () => {
    if (isAuthenticated) {
      setIsTimeoutModalOpen(true);
    }
  };

  const { resetTimer } = useIdleTimer({ onIdle: handleIdle, idleTime: 900 });

  const login = (access, refresh) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    setIsAuthenticated(true);
    resetTimer(); // Reiniciamos el temporizador al iniciar sesión
    navigate('/dashboard');
  };

  const stayActive = () => {
    setIsTimeoutModalOpen(false);
    resetTimer(); // El usuario quiere seguir, reiniciamos el temporizador.
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      resetTimer();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isTimeoutModalOpen, stayActive }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;