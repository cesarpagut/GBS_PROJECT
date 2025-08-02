from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from django.db.models import Q
from .models import EquipoBiomedico, DocumentoAdjunto, HistorialCambios # Importamos los nuevos modelos
from .serializers import EquipoBiomedicoSerializer, DocumentoAdjuntoSerializer # Importamos el nuevo serializer
from users.models import Clinica
import json
import pandas as pd
import io

class EquipoBiomedicoViewSet(viewsets.ModelViewSet):
    serializer_class = EquipoBiomedicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Prefetch related objects to optimize database queries
        user = self.request.user
        queryset = EquipoBiomedico.objects.all()
        if not user.is_superuser:
            queryset = queryset.filter(clinica=user.clinica)
        return queryset.prefetch_related('parametros', 'documentos', 'historial__usuario')

    # <<<--- INICIO DE LA MODIFICACIÓN: REGISTRO DE CAMBIOS ---
    def update(self, request, *args, **kwargs):
        motivo_cambio = request.data.get('motivo_cambio')
        if not motivo_cambio:
            raise ValidationError({'motivo_cambio': 'Este campo es requerido para realizar una modificación.'})

        # Llamamos al método de actualización original
        response = super().update(request, *args, **kwargs)

        # Si la actualización fue exitosa, creamos el registro en el historial
        if response.status_code == 200:
            equipo = self.get_object()
            HistorialCambios.objects.create(
                equipo=equipo,
                usuario=request.user,
                motivo_cambio=motivo_cambio
            )
        
        return response
    # <<<--- FIN DE LA MODIFICACIÓN ---

    # --- NUEVOS ENDPOINTS PARA GESTIONAR DOCUMENTOS ---
    @action(detail=True, methods=['post'], serializer_class=DocumentoAdjuntoSerializer)
    def upload_documento(self, request, pk=None):
        equipo = self.get_object()
        file = request.FILES.get('archivo')
        nombre = request.data.get('nombre')

        if not file or not nombre:
            return Response({'error': 'Se requiere un nombre y un archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        documento = DocumentoAdjunto.objects.create(
            equipo=equipo,
            nombre=nombre,
            archivo=file
        )
        serializer = self.get_serializer(documento)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='delete_documento/(?P<documento_id>[^/.]+)')
    def delete_documento(self, request, pk=None, documento_id=None):
        equipo = self.get_object()
        try:
            documento = DocumentoAdjunto.objects.get(id=documento_id, equipo=equipo)
            documento.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DocumentoAdjunto.DoesNotExist:
            return Response({'error': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    # --- MÉTODOS EXISTENTES (SIN CAMBIOS) ---
    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superuser:
            if not user.clinica:
                raise ValidationError("Tu usuario no está asociado a ninguna clínica.")
            serializer.save(clinica=user.clinica)
        else:
            first_clinic = Clinica.objects.first()
            if not first_clinic:
                raise ValidationError("No hay clínicas creadas en el sistema.")
            serializer.save(clinica=first_clinic)
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'parametros' in data and isinstance(data['parametros'], str):
            data['parametros'] = json.loads(data['parametros'])
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def check_duplicate(self, request):
        nombre = request.query_params.get('nombre_equipo')
        marca = request.query_params.get('marca')
        modelo = request.query_params.get('modelo')
        
        if not all([nombre, marca, modelo]):
            return Response({'error': 'Nombre, marca y modelo son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        clinica = user.clinica if not user.is_superuser else Clinica.objects.first()
        
        duplicates = EquipoBiomedico.objects.filter(
            clinica=clinica,
            nombre_equipo__iexact=nombre,
            marca__iexact=marca,
            modelo__iexact=modelo
        )
        
        if duplicates.exists():
            first_duplicate = duplicates.first()
            serializer = self.get_serializer(first_duplicate)
            return Response({'is_duplicate': True, 'equipo': serializer.data})
        
        return Response({'is_duplicate': False})

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No se ha subido ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file)
            required_columns = ['nombre_equipo', 'marca', 'modelo', 'serie', 'codigo_interno', 'ubicacion', 'area_servicio', 'registro_sanitario']
            if not all(col in df.columns for col in required_columns):
                return Response({'error': f"El archivo Excel debe contener las columnas: {', '.join(required_columns)}"}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            clinica = user.clinica if not user.is_superuser else Clinica.objects.first()
            if not clinica:
                 return Response({'error': 'No hay clínicas en el sistema.'}, status=status.HTTP_400_BAD_REQUEST)

            equipos_creados = 0
            for index, row in df.iterrows():
                if not EquipoBiomedico.objects.filter(serie=row['serie']).exists():
                    EquipoBiomedico.objects.create(
                        clinica=clinica,
                        nombre_equipo=row['nombre_equipo'],
                        marca=row['marca'],
                        modelo=row['modelo'],
                        serie=row['serie'],
                        codigo_interno=row.get('codigo_interno', ''),
                        ubicacion=row.get('ubicacion', 'No especificada'),
                        area_servicio=row.get('area_servicio', 'General'),
                        registro_sanitario=row.get('registro_sanitario', ''),
                        fecha_adquisicion='2024-01-01' 
                    )
                    equipos_creados += 1
            
            return Response({'message': f'Carga masiva completada. Se crearon {equipos_creados} nuevos equipos.'})

        except Exception as e:
            return Response({'error': f'Ocurrió un error al procesar el archivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def export_to_excel(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        df = pd.DataFrame(serializer.data)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Inventario')
        
        output.seek(0)

        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="inventario_equipos.xlsx"'
        return response