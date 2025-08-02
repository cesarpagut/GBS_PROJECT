from django.contrib import admin
from .models import Usuario, Clinica

# Registramos los modelos para que aparezcan en el panel de admin.
admin.site.register(Usuario)
admin.site.register(Clinica)
