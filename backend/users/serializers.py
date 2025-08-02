from rest_framework import serializers
from .models import Usuario, Clinica

class ClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinica
        fields = ['id', 'nombre', 'fecha_creacion']

class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y mostrar usuarios.
    La contraseña es de solo escritura y el campo 'clinica' muestra el nombre, no solo el ID.
    """
    clinica = ClinicaSerializer(read_only=True)
    clinica_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre_completo', 'rol', 'clinica', 'clinica_id', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}}
        }

    def create(self, validated_data):
        """
        Sobrescribimos el método 'create' para usar nuestro gestor de usuarios.
        Esto asegura que la contraseña se guarde hasheada correctamente.
        """
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance