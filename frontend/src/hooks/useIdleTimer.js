import { useState, useEffect, useRef } from 'react';

export const useIdleTimer = ({ onIdle, idleTime = 900 }) => { // idleTime en segundos (900s = 15 minutos)
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef();

  const resetTimer = () => {
    clearTimeout(timeoutId.current);
    setIsIdle(false);
    timeoutId.current = setTimeout(() => {
      setIsIdle(true);
      onIdle(); // Llama a la función que se le pasa cuando el tiempo se cumple.
    }, idleTime * 1000);
  };

  const handleEvent = () => {
    resetTimer();
  };

  useEffect(() => {
    // Escuchamos los eventos de actividad del usuario.
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleEvent));

    resetTimer(); // Iniciamos el temporizador la primera vez.

    // Limpiamos los listeners cuando el componente se desmonta.
    return () => {
      clearTimeout(timeoutId.current);
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, []);

  return { isIdle, resetTimer };
};
