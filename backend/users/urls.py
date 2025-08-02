from django.urls import path
from .views import (
    ClinicaListCreateAPIView, 
    UsuarioCreateAPIView,
    UsuarioDetailAPIView
)

urlpatterns = [
    path('register/', UsuarioCreateAPIView.as_view(), name='user-register'),
    path('me/', UsuarioDetailAPIView.as_view(), name='user-detail'),
    path('clinicas/', ClinicaListCreateAPIView.as_view(), name='clinica-list-create'),
]