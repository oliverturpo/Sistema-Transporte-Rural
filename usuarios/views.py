from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import login
from .models import Usuario
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError



@api_view(['POST'])
def login_usuario(request):
    """Login para admin y conductores"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username y password requeridos'}, status=400)
    
    user = authenticate(username=username, password=password)
    
    if user and user.is_active:
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'nombre': user.get_full_name() or user.username,
                'tipo': user.tipo,
                'email': user.email
            }
        })
    
    return Response({'error': 'Credenciales inválidas'}, status=401)

@api_view(['GET'])
def usuarios_conductores(request):
    """Obtener lista de conductores"""
    conductores = Usuario.objects.filter(tipo='conductor', is_active=True)
    data = []
    for conductor in conductores:
        data.append({
            'id': conductor.id,
            'username': conductor.username,
            'nombre_completo': conductor.get_full_name() or conductor.username,
            'telefono': conductor.telefono or 'Sin teléfono'
        })
    return Response(data)



@api_view(['POST'])
def registrar_conductor(request):
    """Registrar nuevo conductor"""
    try:
        data = request.data
        
        # Validaciones básicas
        required_fields = ['username', 'password', 'first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Validar que el username no exista
        if Usuario.objects.filter(username=data['username']).exists():
            return Response({
                'error': 'El nombre de usuario ya existe'
            }, status=400)
        
        # Validar que el email no exista
        if Usuario.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'El email ya está registrado'
            }, status=400)
        
        # Crear el conductor
        conductor = Usuario.objects.create(
            username=data['username'],
            password=make_password(data['password']),
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            telefono=data.get('telefono', ''),
            tipo='conductor',
            is_active=True
        )
        
        return Response({
            'success': True,
            'message': f'Conductor {conductor.get_full_name()} registrado correctamente',
            'conductor': {
                'id': conductor.id,
                'username': conductor.username,
                'nombre_completo': conductor.get_full_name(),
                'email': conductor.email,
                'telefono': conductor.telefono
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
def get_conductores(request):
    """Obtener lista completa de conductores"""
    from vehiculos.models import Vehiculo  # Agregar este import
    
    conductores = Usuario.objects.filter(tipo='conductor').order_by('first_name', 'last_name')
    data = []
    
    for conductor in conductores:
        # Contar vehículos asignados CORRECTAMENTE
        vehiculos_asignados = Vehiculo.objects.filter(conductor=conductor).count()
        
        data.append({
            'id': conductor.id,
            'username': conductor.username,
            'nombre_completo': conductor.get_full_name(),
            'email': conductor.email,
            'telefono': conductor.telefono or 'No registrado',
            'fecha_registro': conductor.date_joined.strftime('%d/%m/%Y'),
            'vehiculos_asignados': vehiculos_asignados,  # ← ESTO ES LO IMPORTANTE
            'is_active': conductor.is_active
        })
    
    return Response(data)
    """Obtener lista completa de conductores"""
    conductores = Usuario.objects.filter(tipo='conductor').order_by('first_name', 'last_name')
    data = []
    
    for conductor in conductores:
        # Contar vehículos asignados
        vehiculos_asignados = conductor.vehiculo_set.count()
        
        data.append({
            'id': conductor.id,
            'username': conductor.username,
            'nombre_completo': conductor.get_full_name(),
            'email': conductor.email,
            'telefono': conductor.telefono or 'No registrado',
            'fecha_registro': conductor.date_joined.strftime('%d/%m/%Y'),
            'vehiculos_asignados': vehiculos_asignados,
            'is_active': conductor.is_active
        })
    
    return Response(data)

@api_view(['PUT'])
def actualizar_conductor(request, conductor_id):
    """Actualizar datos del conductor"""
    try:
        conductor = Usuario.objects.get(id=conductor_id, tipo='conductor')
        
        # Actualizar campos
        conductor.first_name = request.data.get('first_name', conductor.first_name)
        conductor.last_name = request.data.get('last_name', conductor.last_name)
        conductor.email = request.data.get('email', conductor.email)
        conductor.telefono = request.data.get('telefono', conductor.telefono)
        
        # Si se proporciona nueva contraseña
        new_password = request.data.get('password')
        if new_password:
            conductor.password = make_password(new_password)
        
        conductor.save()
        
        return Response({'success': True, 'message': 'Conductor actualizado correctamente'})
        
    except Usuario.DoesNotExist:
        return Response({'error': 'Conductor no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
def toggle_estado_conductor(request, conductor_id):
    """Activar/desactivar conductor"""
    try:
        conductor = Usuario.objects.get(id=conductor_id, tipo='conductor')
        conductor.is_active = not conductor.is_active
        conductor.save()
        
        estado = 'activado' if conductor.is_active else 'desactivado'
        return Response({
            'success': True,
            'message': f'Conductor {estado} correctamente',
            'is_active': conductor.is_active
        })
        
    except Usuario.DoesNotExist:
        return Response({'error': 'Conductor no encontrado'}, status=404)