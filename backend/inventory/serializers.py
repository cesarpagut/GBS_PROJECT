from rest_framework import serializers
from .models import EquipoBiomedico, ParametroEntregado, DocumentoAdjunto, HistorialCambios
from users.serializers import UsuarioSerializer, ClinicaSerializer

class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoAdjunto
        fields = ['id', 'nombre', 'archivo', 'fecha_carga']

class HistorialCambiosSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    class Meta:
        model = HistorialCambios
        fields = ['id', 'usuario', 'fecha_modificacion', 'motivo_cambio']

class ParametroEntregadoSerializer(serializers.ModelSerializer):
    parametro_display = serializers.CharField(source='get_parametro_display', read_only=True)
    class Meta:
        model = ParametroEntregado
        fields = ['id', 'parametro', 'rango_min', 'rango_max', 'parametro_display']

class EquipoBiomedicoSerializer(serializers.ModelSerializer):
    # --- FIX: Asegurar que los detalles de la clínica se serialicen correctamente ---
    clinica = ClinicaSerializer(read_only=True)
    
    parametros = ParametroEntregadoSerializer(many=True, read_only=True)
    documentos = DocumentoAdjuntoSerializer(many=True, read_only=True)
    historial = HistorialCambiosSerializer(many=True, read_only=True)

    clasificacion_uso_display = serializers.CharField(source='get_clasificacion_uso_display', read_only=True)
    forma_adquisicion_display = serializers.CharField(source='get_forma_adquisicion_display', read_only=True)
    tecnologia_predominante_display = serializers.CharField(source='get_tecnologia_predominante_display', read_only=True)


    class Meta:
        model = EquipoBiomedico
        fields = '__all__'
        extra_fields = [
            'clasificacion_uso_display', 
            'forma_adquisicion_display', 
            'tecnologia_predominante_display'
        ]
