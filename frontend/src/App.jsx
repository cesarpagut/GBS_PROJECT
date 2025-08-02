import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import SessionTimeoutModal from './components/SessionTimeoutModal'; // Importamos el modal

// Creamos un componente interno para poder acceder al contexto
const AppContent = () => {
  const { isTimeoutModalOpen, stayActive, logout } = useContext(AuthContext);
  return (
    <>
      <div className="App">
        <main>
          <Outlet />
        </main>
      </div>
      <SessionTimeoutModal
        isOpen={isTimeoutModalOpen}
        onContinue={stayActive}
        onLogout={logout}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
