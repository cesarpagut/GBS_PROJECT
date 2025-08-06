from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Importamos las vistas directamente para construir las rutas aquí
from users.views import ClinicaViewSet
from inventory.views import EquipoBiomedicoViewSet

# --- FIX DEFINITIVO: Se crea un único router principal ---
# Esto elimina la necesidad de archivos urls.py en cada app y previene la recursión.
router = DefaultRouter()
router.register(r'clinicas', ClinicaViewSet, basename='clinica')
router.register(r'equipos', EquipoBiomedicoViewSet, basename='equipo')


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- Rutas de la API ---
    # Se incluyen las rutas generadas por el router bajo el prefijo /api/
    # Esto nos dará: /api/clinicas/ y /api/equipos/
    path('api/', include(router.urls)),
    
    # --- Rutas de Autenticación ---
    # Se agrupan todas las rutas de Djoser bajo /api/auth/
    # Esto nos dará: /api/auth/users/, /api/auth/users/me/, /api/auth/jwt/create/ etc.
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
]

# Servir archivos multimedia en modo de desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
