from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Vehiculo
from usuarios.models import Usuario

@api_view(['GET'])
def get_vehiculos(request):
    """Obtener todos los vehículos"""
    vehiculos = Vehiculo.objects.all().order_by('placa')
    data = []
    for vehiculo in vehiculos:
        data.append({
            'id': vehiculo.id,
            'placa': vehiculo.placa,
            'marca': vehiculo.marca,
            'modelo': vehiculo.modelo,
            'año': vehiculo.año,
            'capacidad': vehiculo.capacidad,
            'conductor': vehiculo.conductor.get_full_name() if vehiculo.conductor else 'Sin asignar',
            'conductor_id': vehiculo.conductor.id if vehiculo.conductor else None,
            'estado': vehiculo.estado
        })
    return Response(data)

@api_view(['POST'])
def crear_vehiculo(request):
    """Crear nuevo vehículo"""
    data = request.data
    
    try:
        vehiculo = Vehiculo.objects.create(
            placa=data.get('placa').upper(),
            marca=data.get('marca'),
            modelo=data.get('modelo'),
            año=int(data.get('año')),
            capacidad=int(data.get('capacidad')),
            conductor_id=data.get('conductor_id') if data.get('conductor_id') else None,
            estado=data.get('estado', 'activo')
        )
        
        return Response({
            'success': True,
            'message': f'Vehículo {vehiculo.placa} creado correctamente',
            'vehiculo_id': vehiculo.id
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)