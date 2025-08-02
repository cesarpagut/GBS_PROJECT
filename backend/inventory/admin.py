from django.contrib import admin
from .models import EquipoBiomedico, ParametroEntregado, DocumentoAdjunto, HistorialCambios

admin.site.register(EquipoBiomedico)
admin.site.register(ParametroEntregado)
admin.site.register(DocumentoAdjunto)
admin.site.register(HistorialCambios)