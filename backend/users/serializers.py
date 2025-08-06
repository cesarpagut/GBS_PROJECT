from rest_framework import serializers
from .models import Usuario, Clinica
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

class ClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinica
        fields = ['id', 'nombre', 'logo', 'fecha_creacion']

class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para MOSTRAR la información de los usuarios.
    Es de solo lectura para la mayoría de los campos.
    """
    clinica = ClinicaSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre_completo', 'rol', 'clinica', 'is_superuser']


class UserCreateSerializer(BaseUserCreateSerializer):
    """
    Serializer para CREAR nuevos usuarios.
    Hereda de Djoser para integrarse con el sistema de registro.
    """
    # Hacemos que la clínica sea un campo de solo escritura que espera un ID.
    clinica = serializers.PrimaryKeyRelatedField(
        queryset=Clinica.objects.all(), 
        required=False,  # No es requerido para superusuarios
        allow_null=True
    )

    class Meta(BaseUserCreateSerializer.Meta):
        model = Usuario
        fields = ('id', 'email', 'nombre_completo', 'password', 'rol', 'clinica')

    def validate(self, attrs):
        # Un usuario normal (no superusuario) DEBE tener una clínica.
        is_superuser = self.context['request'].user.is_superuser
        if not is_superuser and not attrs.get('clinica'):
            raise serializers.ValidationError({"clinica": "Un usuario no administrador debe estar asociado a una clínica."})
        return super().validate(attrs)

    def create(self, validated_data):
        """
        Sobrescribimos el método 'create' para usar nuestro gestor de usuarios personalizado.
        Esto asegura que la contraseña se guarde hasheada correctamente.
        """
        user = Usuario.objects.create_user(**validated_data)
        return user
