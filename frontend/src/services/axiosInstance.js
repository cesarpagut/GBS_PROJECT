import axios from 'axios';

const baseURL = 'http://127.0.0.1:8000/api/';

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    // No establecemos Content-Type aquí para que axios lo maneje automáticamente,
    // lo cual es especialmente importante para subir archivos ('multipart/form-data').
  },
});

// Interceptor de Petición: Se ejecuta ANTES de cada petición.
// Su trabajo es añadir el token de acceso a la cabecera de autorización.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta: Se ejecuta DESPUÉS de recibir una respuesta.
// Su trabajo es detectar si la petición falló por un token expirado (error 401).
axiosInstance.interceptors.response.use(
  (response) => {
    return response; // Si la respuesta es exitosa (ej: 200 OK), no hacemos nada.
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos reintentado ya esta petición.
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos la petición para no reintentarla infinitamente.
      
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Intentamos obtener un nuevo token de acceso usando el refreshToken.
          const response = await axios.post(baseURL + 'token/refresh/', {
            refresh: refreshToken,
          });

          // Si tenemos éxito, guardamos el nuevo token de acceso.
          localStorage.setItem('accessToken', response.data.access);
          
          // Actualizamos la cabecera de la instancia de axios para futuras peticiones.
          axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
          
          // Actualizamos la cabecera de la petición original que falló.
          originalRequest.headers['Authorization'] = 'Bearer ' + response.data.access;
          
          // Reintentamos la petición original con el nuevo token.
          return axiosInstance(originalRequest);

        } catch (refreshError) {
          console.log("El token de refresco es inválido o ha expirado", refreshError);
          // Si el refresco falla, significa que la sesión ha terminado.
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/'; // Redirigimos al usuario a la página de login.
          return Promise.reject(refreshError);
        }
      } else {
        console.log("No hay token de refresco disponible.");
        window.location.href = '/';
      }
    }

    // Para cualquier otro error (ej: 404, 500), simplemente lo devolvemos.
    return Promise.reject(error);
  }
);

export default axiosInstance;
