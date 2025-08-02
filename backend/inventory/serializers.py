from rest_framework import serializers
from .models import EquipoBiomedico, ParametroEntregado, DocumentoAdjunto, HistorialCambios
from users.serializers import UsuarioSerializer # Para mostrar info del usuario en el historial
import json

class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoAdjunto
        fields = ['id', 'nombre', 'archivo', 'fecha_carga']

class HistorialCambiosSerializer(serializers.ModelSerializer):
    # Usamos un serializer anidado para mostrar el email del usuario, no solo su ID.
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = HistorialCambios
        fields = ['id', 'usuario', 'fecha_modificacion', 'motivo_cambio']

class ParametroEntregadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametroEntregado
        fields = ['id', 'parametro', 'rango_min', 'rango_max']

class EquipoBiomedicoSerializer(serializers.ModelSerializer):
    clinica_nombre = serializers.CharField(source='clinica.nombre', read_only=True)
    
    # Hacemos que los datos anidados sean de solo lectura en la vista de lista/detalle.
    # La creación y eliminación se manejarán en endpoints separados.
    parametros = ParametroEntregadoSerializer(many=True, read_only=True)
    documentos = DocumentoAdjuntoSerializer(many=True, read_only=True)
    historial = HistorialCambiosSerializer(many=True, read_only=True)

    class Meta:
        model = EquipoBiomedico
        # Incluimos todos los campos del modelo original.
        fields = '__all__'
        read_only_fields = ('clinica',)
