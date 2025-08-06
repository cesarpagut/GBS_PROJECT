from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from django.db import transaction
from django.db.models import Q
from .models import EquipoBiomedico, DocumentoAdjunto, HistorialCambios, ParametroEntregado
from .serializers import EquipoBiomedicoSerializer
from users.models import Clinica
import json
import pandas as pd
import io

class EquipoBiomedicoViewSet(viewsets.ModelViewSet):
    serializer_class = EquipoBiomedicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = EquipoBiomedico.objects.all()

        if not user.is_superuser:
            queryset = queryset.filter(clinica=user.clinica)
        else:
            clinica_id = self.request.query_params.get('clinica_id', None)
            if clinica_id:
                queryset = queryset.filter(clinica_id=clinica_id)
        
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(nombre_equipo__icontains=search_term) | Q(marca__icontains=search_term) |
                Q(modelo__icontains=search_term) | Q(serie__icontains=search_term) |
                Q(codigo_interno__icontains=search_term) | Q(area_servicio__icontains=search_term)
            )

        multi_filters = ['nombre_equipo', 'modelo', 'marca', 'area_servicio', 'clasificacion_uso', 'clasificacion_riesgo', 'ubicacion']
        for filter_field in multi_filters:
            values = self.request.query_params.getlist(filter_field)
            if values:
                queryset = queryset.filter(**{f'{filter_field}__in': values})

        calibracion_filter = self.request.query_params.get('requiere_calibracion', None)
        if calibracion_filter:
            calibracion_bool = calibracion_filter.lower() == 'true'
            queryset = queryset.filter(requiere_calibracion=calibracion_bool)

        return queryset.prefetch_related('parametros', 'documentos', 'historial__usuario', 'clinica').order_by('-fecha_modificacion')

    def _procesar_y_guardar_relacionados(self, request, equipo):
        parametros_data_str = request.data.get('parametros', '[]')
        parametros_data = json.loads(parametros_data_str)
        
        equipo.parametros.all().delete()
        for param_data in parametros_data:
            if param_data.get('parametro'):
                ParametroEntregado.objects.create(equipo=equipo, **param_data)

        for key, file in request.FILES.items():
            if key.startswith('documentos['):
                nombre_documento = key.replace('documentos[', '').replace(']', '')
                DocumentoAdjunto.objects.create(equipo=equipo, nombre=nombre_documento, archivo=file)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.request.user
        
        clinica = user.clinica if not user.is_superuser else Clinica.objects.first()
        if not clinica:
            raise ValidationError("No hay clínica asociada o creada para asignar el equipo.")
            
        equipo = serializer.save(clinica=clinica)
        self._procesar_y_guardar_relacionados(request, equipo)
        final_serializer = self.get_serializer(equipo)
        headers = self.get_success_headers(final_serializer.data)
        return Response(final_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        motivo_cambio = request.data.get('motivo_cambio')
        if not motivo_cambio:
            raise ValidationError({'motivo_cambio': 'Este campo es requerido.'})
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        equipo = serializer.save()
        self._procesar_y_guardar_relacionados(request, equipo)
        HistorialCambios.objects.create(equipo=equipo, usuario=request.user, motivo_cambio=motivo_cambio)
        final_serializer = self.get_serializer(equipo)
        return Response(final_serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No se ha subido ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(file).fillna('')
            required_columns = ['nombre_equipo', 'marca', 'modelo', 'serie', 'codigo_interno', 'ubicacion', 'area_servicio', 'registro_sanitario']
            if not all(col in df.columns for col in required_columns):
                return Response({'error': f"El archivo Excel debe contener las columnas: {', '.join(required_columns)}"}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            
            clinica_id = request.POST.get('clinica_id')
            clinica = None
            if clinica_id:
                try:
                    clinica = Clinica.objects.get(pk=clinica_id)
                except Clinica.DoesNotExist:
                    return Response({'error': 'La clínica especificada no existe.'}, status=status.HTTP_400_BAD_REQUEST)
            elif not user.is_superuser:
                clinica = user.clinica
            else:
                clinica = Clinica.objects.first()

            if not clinica:
                return Response({'error': 'No se pudo determinar la clínica para la carga masiva.'}, status=status.HTTP_400_BAD_REQUEST)

            equipos_creados = 0
            errores = []
            for index, row in df.iterrows():
                if not EquipoBiomedico.objects.filter(serie=row['serie']).exists():
                    try:
                        EquipoBiomedico.objects.create(
                            clinica=clinica, 
                            nombre_equipo=row['nombre_equipo'], 
                            marca=row['marca'], 
                            modelo=row['modelo'], 
                            serie=row['serie'], 
                            codigo_interno=row.get('codigo_interno', ''), 
                            ubicacion=row.get('ubicacion', 'No especificada'), 
                            area_servicio=row.get('area_servicio', 'General'), 
                            registro_sanitario=row.get('registro_sanitario', '')
                        )
                        equipos_creados += 1
                    except Exception as e:
                        errores.append(f"Fila {index + 2}: {row['serie']} - {str(e)}")
            
            if errores:
                return Response({'message': f'Carga completada con errores. Equipos creados: {equipos_creados}.', 'errors': errores}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': f'Carga masiva completada. Se crearon {equipos_creados} nuevos equipos para la clínica {clinica.nombre}.'})

        except Exception as e:
            return Response({'error': f'Ocurrió un error al procesar el archivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def export_to_excel(self, request):
        queryset = self.get_queryset()
        
        data_to_export = []
        for equipo in queryset:
            data_to_export.append({
                'Id clinica': equipo.clinica.id if equipo.clinica else '',
                'hoja_vida_id': equipo.hoja_vida_id,
                'nombre_equipo': equipo.nombre_equipo,
                'marca': equipo.marca,
                'modelo': equipo.modelo,
                'serie': equipo.serie,
                'codigo_interno': equipo.codigo_interno,
                'area_servicio': equipo.area_servicio,
                'ubicacion': equipo.ubicacion,
                'registro_sanitario': equipo.registro_sanitario,
                'clasificacion_riesgo': equipo.clasificacion_riesgo,
                'clasificacion_uso': equipo.get_clasificacion_uso_display(),
                'fecha_adquisicion': equipo.fecha_adquisicion,
                'forma_adquisicion': equipo.get_forma_adquisicion_display(),
                'fabricante': equipo.fabricante,
                'proveedor': equipo.proveedor,
                'precio': equipo.precio,
                'garantia_anios': equipo.garantia_anios,
                'vida_util_anios': equipo.vida_util_anios,
                'voltaje_vdc': equipo.voltaje_vdc,
                'voltaje_vac': equipo.voltaje_vac,
                'corriente': equipo.corriente,
                'potencia': equipo.potencia,
                'frecuencia': equipo.frecuencia,
                'temperatura': equipo.temperatura,
                'peso': equipo.peso,
                'frecuencia_mantenimiento_meses': equipo.frecuencia_mantenimiento_meses,
                'requiere_calibracion': 'Sí' if equipo.requiere_calibracion else 'No',
                'frecuencia_calibracion_meses': equipo.frecuencia_calibracion_meses,
            })

        df = pd.DataFrame(data_to_export)
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

    @action(detail=True, methods=['delete'], url_path='delete_documento/(?P<documento_id>[^/.]+)')
    def delete_documento(self, request, pk=None, documento_id=None):
        equipo = self.get_object()
        try:
            documento = DocumentoAdjunto.objects.get(id=documento_id, equipo=equipo)
            documento.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DocumentoAdjunto.DoesNotExist:
            return Response({'error': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)