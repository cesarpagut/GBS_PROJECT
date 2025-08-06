const getMediaUrl = (relativePath) => {
  if (!relativePath) return '';

  // Intenta usar la URL base desde el .env o usa localhost por defecto
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  // Asegura que no haya doble barra "//"
  return `${baseUrl.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
};

export default getMediaUrl;
