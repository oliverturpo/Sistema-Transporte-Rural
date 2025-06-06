from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import login
from .models import Usuario

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
            'nombre': conductor.get_full_name() or conductor.username,
            'telefono': conductor.telefono
        })
    return Response(data)