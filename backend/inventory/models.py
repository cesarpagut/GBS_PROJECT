from django.db import models
from django.conf import settings
from users.models import Clinica

class EquipoBiomedico(models.Model):
    # --- Clasificaciones y Estados ---
    class ClasificacionRiesgo(models.TextChoices):
        CLASE_I = 'I', 'Clase I'
        CLASE_IIA = 'IIA', 'Clase IIa'
        CLASE_IIB = 'IIB', 'Clase IIb'
        CLASE_III = 'III', 'Clase III'
        NA = 'N/A', 'N/A'
    class ClasificacionUso(models.TextChoices):
        DIAGNOSTICO = 'DIAGNOSTICO', 'Diagnóstico'
        SOPORTE_VITAL = 'SOPORTE_VITAL', 'Soporte Vital'
        LABORATORIO = 'LABORATORIO', 'Laboratorio Clínico'
        TRATAMIENTO = 'TRATAMIENTO', 'Tratamiento/Quirúrgico'
        TERAPEUTICO = 'TERAPEUTICO', 'Terapéutico/Rehabilitación'
        ESTERILIZACION = 'ESTERILIZACION', 'Esterilización/Desinfección'
        OTRO = 'OTRO', 'Otro'
    class FormaAdquisicion(models.TextChoices):
        COMPRA_NUEVO = 'COMPRA_NUEVO', 'Compra (Nuevo)'
        COMPRA_SEGUNDA = 'COMPRA_SEGUNDA', 'Compra (Segunda)'
        DONACION = 'DONACION', 'Donación'
        COMODATO = 'COMODATO', 'Comodato'
        OTRO = 'OTRO', 'Otro'
    class EstadoActual(models.TextChoices):
        FUNCIONAL = 'FUNCIONAL', 'En Funcionamiento'
        FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO', 'Fuera de Servicio'
        EN_REPARACION = 'EN_REPARACION', 'En Reparación (A la espera de repuesto)'
        DADO_DE_BAJA = 'DADO_DE_BAJA', 'Dado de Baja'
    class TecnologiaPredominante(models.TextChoices):
        MECANICO = 'MECANICO', 'Mecánico'
        ELECTRICO = 'ELECTRICO', 'Eléctrico'
        ELECTRONICO = 'ELECTRONICO', 'Electrónico'
        HIDRAULICO = 'HIDRAULICO', 'Hidráulico'
        NEUMATICO = 'NEUMATICO', 'Neumático'
        INFORMATICO = 'INFORMATICO', 'Informático'

    # --- Relación Principal ---
    clinica = models.ForeignKey(Clinica, on_delete=models.CASCADE, related_name='equipos')

    # --- Campos de Gestión ---
    hoja_vida_id = models.CharField(max_length=100, unique=True, blank=True)
    is_complete = models.BooleanField(default=False)

    # --- IDENTIFICACIÓN DEL EQUIPO ---
    nombre_equipo = models.CharField(max_length=255)
    marca = models.CharField(max_length=255)
    modelo = models.CharField(max_length=255)
    serie = models.CharField(max_length=255, unique=True)
    codigo_interno = models.CharField(max_length=100, blank=True, default='')
    area_servicio = models.CharField(max_length=255, default='General')
    ubicacion = models.CharField(max_length=255, default='No especificada')
    foto_equipo = models.ImageField(upload_to='fotos_equipos/', blank=True, null=True)
    registro_sanitario_aplica = models.BooleanField(default=True)
    registro_sanitario = models.CharField(max_length=255, blank=True, default='')
    clasificacion_riesgo = models.CharField(max_length=10, choices=ClasificacionRiesgo.choices, blank=True, default='')
    clasificacion_uso = models.CharField(max_length=50, choices=ClasificacionUso.choices, default=ClasificacionUso.DIAGNOSTICO)
    
    # --- INFORMACIÓN DE ADQUISICIÓN Y PROPIEDAD ---
    fecha_adquisicion = models.DateField(null=True, blank=True)
    forma_adquisicion = models.CharField(max_length=50, choices=FormaAdquisicion.choices, default=FormaAdquisicion.COMPRA_NUEVO)
    proveedor = models.CharField(max_length=255, blank=True, default='')
    factura = models.FileField(upload_to='facturas/', blank=True, null=True)
    precio_no_registra = models.BooleanField(default=False)
    precio = models.CharField(max_length=50, blank=True, null=True)
    garantia_anios = models.PositiveIntegerField(default=0)
    vida_util_anios = models.PositiveIntegerField(default=10)

    # --- CARACTERÍSTICAS TÉCNICAS (DE FUNCIONAMIENTO) ---
    voltaje_vdc = models.CharField(max_length=50, blank=True, null=True)
    voltaje_vdc_na = models.BooleanField(default=False)
    voltaje_vac = models.CharField(max_length=50, blank=True, null=True)
    voltaje_vac_na = models.BooleanField(default=False)
    corriente = models.CharField(max_length=50, blank=True, null=True)
    corriente_na = models.BooleanField(default=False)
    potencia = models.CharField(max_length=50, blank=True, null=True)
    potencia_na = models.BooleanField(default=False)
    frecuencia = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_na = models.BooleanField(default=False)
    temperatura = models.CharField(max_length=50, blank=True, null=True)
    temperatura_na = models.BooleanField(default=False)
    peso = models.CharField(max_length=50, blank=True, null=True)
    peso_na = models.BooleanField(default=False)
    tecnologia_predominante = models.CharField(max_length=50, choices=TecnologiaPredominante.choices, default=TecnologiaPredominante.ELECTRONICO)
    
    # OTRAS FUENTES DE ALIMENTACIÓN
    fuente_neumatica = models.BooleanField(default=False)
    fuente_hidraulica = models.BooleanField(default=False)
    fuente_combustion = models.BooleanField(default=False)

    # --- MANTENIMIENTO Y CALIBRACIÓN ---
    frecuencia_mantenimiento_meses = models.PositiveIntegerField(default=6)
    requiere_calibracion = models.BooleanField(default=False)
    frecuencia_calibracion_meses = models.CharField(max_length=50, blank=True, null=True)
    estado_actual = models.CharField(max_length=50, choices=EstadoActual.choices, default=EstadoActual.FUNCIONAL)
    
    def _is_field_complete(self, field_name):
        value = getattr(self, field_name)
        if isinstance(value, models.fields.files.FieldFile):
             return bool(value)
        return value is not None and str(value).strip() != '' and value != 'N/A' and value != 'no requiere'

    def check_completeness(self):
        critical_fields = [
            'nombre_equipo', 'marca', 'modelo', 'serie', 'area_servicio', 'ubicacion',
            'clasificacion_uso', 'fecha_adquisicion', 'forma_adquisicion',
            'vida_util_anios', 'tecnologia_predominante', 'registro_sanitario',
            'clasificacion_riesgo', 'precio', 'frecuencia_calibracion_meses'
        ]
        
        for field in critical_fields:
            if not self._is_field_complete(field):
                return False
        return True

    def save(self, *args, **kwargs):
        if not self.pk and not self.hoja_vida_id:
            last_equipo = EquipoBiomedico.objects.filter(clinica=self.clinica).order_by('id').last()
            next_id = (int(last_equipo.hoja_vida_id.split('-')[-1]) + 1) if last_equipo and '-' in last_equipo.hoja_vida_id else 1
            self.hoja_vida_id = f"HV-{self.clinica.id}-{next_id:04d}"
        
        self.is_complete = self.check_completeness()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre_equipo} - {self.marca} ({self.serie})"

class ParametroEntregado(models.Model):
    class TipoParametro(models.TextChoices):
        RPM = 'RPM', 'RPM'
        TEMPERATURA = 'TEMPERATURA', 'Temperatura (°C)'
        PRESION = 'PRESION', 'Presión (PSI)'
        FLUJO = 'FLUJO', 'Flujo (lpm)'
        PESO = 'PESO', 'Peso (kg)'
        SPO2 = 'SPO2', 'Saturación de Oxígeno (SpO2)'
        FC = 'FC', 'Frecuencia Cardíaca (LPM)'
        ENERGIA = 'ENERGIA', 'Energía (J)'
    equipo = models.ForeignKey(EquipoBiomedico, on_delete=models.CASCADE, related_name='parametros')
    parametro = models.CharField(max_length=50, choices=TipoParametro.choices)
    rango_min = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    rango_max = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    def __str__(self):
        return f"{self.parametro} para {self.equipo.nombre_equipo}"

# --- NUEVO MODELO PARA DOCUMENTOS ADJUNTOS ---
class DocumentoAdjunto(models.Model):
    equipo = models.ForeignKey(EquipoBiomedico, on_delete=models.CASCADE, related_name='documentos')
    nombre = models.CharField(max_length=255, help_text="Ej: Manual de Usuario, Factura, Otro")
    archivo = models.FileField(upload_to='documentos_equipos/')
    fecha_carga = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} para {self.equipo.nombre_equipo}"

# --- NUEVO MODELO PARA HISTORIAL DE CAMBIOS ---
class HistorialCambios(models.Model):
    equipo = models.ForeignKey(EquipoBiomedico, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    fecha_modificacion = models.DateTimeField(auto_now_add=True)
    motivo_cambio = models.TextField()
    # En el futuro, aquí se podría guardar un JSON con los campos que cambiaron.

    def __str__(self):
        return f"Modificación en {self.equipo.nombre_equipo} por {self.usuario.email} el {self.fecha_modificacion}"
