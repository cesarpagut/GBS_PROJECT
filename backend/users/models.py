from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from django.utils import timezone

# --- Modelo para las Clínicas ---
# Esta es la tabla que almacenará la información de cada institución.
class Clinica(models.Model):
    nombre = models.CharField(max_length=255, unique=True, help_text="Nombre de la clínica u hospital")
    logo = models.ImageField(upload_to='logos_clinicas/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.nombre

# --- Gestor para nuestro modelo de Usuario Personalizado ---
# Django necesita un "Manager" para saber cómo crear usuarios y superusuarios.
class UsuarioManager(BaseUserManager):

    # Método para crear un usuario estándar.
    def create_user(self, email, nombre_completo, password=None, **extra_fields):
        """
        Crea y guarda un Usuario con el email, nombre y contraseña dados.
        """
        if not email:
            raise ValueError('El campo Email es obligatorio')

        # Normalizamos el email (lo pone en minúsculas) para consistencia.
        email = self.normalize_email(email)
        
        user = self.model(
            email=email,
            nombre_completo=nombre_completo,
            **extra_fields
        )
        
        # El método set_password se encarga de "hashear" la contraseña por seguridad.
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Método para crear un superusuario (administrador total del sistema).
    def create_superuser(self, email, nombre_completo, password, **extra_fields):
        """
        Crea y guarda un superusuario.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        
        # Para el superusuario, la clínica no es obligatoria.
        return self.create_user(email, nombre_completo, password, **extra_fields)

# --- Modelo de Usuario Personalizado ---
# Heredamos de las clases de Django para tener todo el sistema de autenticación,
# pero con los campos que nosotros necesitamos.
class Usuario(AbstractBaseUser, PermissionsMixin):
    
    # Definimos los roles que puede tener un usuario dentro del sistema.
    class Rol(models.TextChoices):
        MASTER = 'MASTER', 'Master'
        ADMIN_BIOMEDICO = 'ADMIN_BIOMEDICO', 'Admin Biomédico'
        BASICO = 'BASICO', 'Básico'

    email = models.EmailField(max_length=255, unique=True, help_text="Email del usuario, se usará para el login")
    nombre_completo = models.CharField(max_length=255)
    
    clinica = models.ForeignKey(Clinica, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    
    rol = models.CharField(max_length=50, choices=Rol.choices, default=Rol.BASICO)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # ==========================================================================
    # <<<--- INICIO DE LA CORRECCIÓN DE CONFLICTOS --->>>
    # Añadimos estos campos para resolver el choque con el modelo de Usuario por defecto.
    # Les damos un 'related_name' único para que Django no se confunda.
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="usuario_set",
        related_query_name="usuario",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="usuario_set",
        related_query_name="usuario",
    )
    # <<<--- FIN DE LA CORRECCIÓN --->>>

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']

    def __str__(self):
        return self.email