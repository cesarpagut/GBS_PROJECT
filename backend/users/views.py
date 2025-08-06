from rest_framework import viewsets, permissions
from .models import Clinica
from .serializers import ClinicaSerializer

class ClinicaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Un ViewSet de solo lectura para ver las clínicas.
    """
    queryset = Clinica.objects.all()
    serializer_class = ClinicaSerializer
    # Solo los administradores (superusuarios) pueden ver la lista de clínicas.
    permission_classes = [permissions.IsAdminUser]
