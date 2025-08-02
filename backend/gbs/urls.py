from django.contrib import admin
from django.urls import path, include
# --- INICIO DE LA SECCIÓN A VERIFICAR ---
from django.conf import settings
from django.conf.urls.static import static
# --- FIN DE LA SECCIÓN A VERIFICAR ---

from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView,)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('users.urls')),
    path('api/inventory/', include('inventory.urls')),
]

# --- INICIO DE LA SECCIÓN A VERIFICAR ---
# Esta línea es crucial. SOLO funciona cuando DEBUG = True en settings.py.
# Le dice a Django: "Cuando estés en modo de desarrollo, si alguien pide una URL
# que empieza con /media/, busca el archivo correspondiente en la carpeta MEDIA_ROOT".
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# --- FIN DE LA SECCIÓN A VERIFICAR ---