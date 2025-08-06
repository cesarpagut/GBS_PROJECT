import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Si el usuario no está autenticado, lo redirigimos a la página de inicio de sesión.
    return <Navigate to="/" />;
  }

  return children; // Si está autenticado, mostramos el componente hijo (la página protegida).
};

export default ProtectedRoute;