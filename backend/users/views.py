from rest_framework import generics, permissions
from .models import Usuario, Clinica
from .serializers import UsuarioSerializer, ClinicaSerializer

# --- Vistas para Clínicas ---
class ClinicaListCreateAPIView(generics.ListCreateAPIView):
    queryset = Clinica.objects.all()
    serializer_class = ClinicaSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Vistas para Usuarios ---
class UsuarioCreateAPIView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.AllowAny]

class UsuarioDetailAPIView(generics.RetrieveUpdateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
