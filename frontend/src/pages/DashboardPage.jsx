import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para la navegación
import AuthContext from '../context/AuthContext';

function DashboardPage() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>GBS Dashboard</h1>
        <button onClick={logout} className="logout-button">Cerrar Sesión</button>
      </nav>
      <main className="dashboard-content">
        <h2>¡Bienvenido!</h2>
        <p>Has iniciado sesión correctamente en el Software de Gestión Biomédica.</p>
        <div className="dashboard-modules">
          <Link to="/inventory" className="module-card">
            <h3>Gestión de Inventario</h3>
            <p>Ver, añadir y editar equipos biomédicos.</p>
          </Link>
          {/* Aquí añadiremos más tarjetas para otros módulos en el futuro */}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
