import React, { useState, useEffect } from 'react';

function SessionTimeoutModal({ isOpen, onContinue, onLogout }) {
  const [countdown, setCountdown] = useState(60); // 60 segundos de cuenta atrás

  useEffect(() => {
    if (isOpen) {
      setCountdown(60); // Reiniciamos la cuenta atrás cada vez que se abre
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onLogout(); // Si llega a cero, cerramos la sesión.
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content session-modal">
        <div className="modal-header">
          <h2>Su sesión está a punto de expirar</h2>
        </div>
        <div className="modal-body">
          <p>Por inactividad, su sesión se cerrará automáticamente en</p>
          <p className="countdown">{countdown} segundos</p>
          <p>¿Desea continuar en la sesión?</p>
        </div>
        <div className="modal-footer">
          <button onClick={onLogout} className="button-secondary">Cerrar Sesión</button>
          <button onClick={onContinue} className="button-primary">Permanecer Conectado</button>
        </div>
      </div>
    </div>
  );
}

export default SessionTimeoutModal;