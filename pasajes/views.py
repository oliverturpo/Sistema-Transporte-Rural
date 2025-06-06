from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Pasaje
from rutas.models import Salida

@api_view(['GET'])
def get_pasajes_salida(request, salida_id):
    """Obtener pasajes de una salida específica"""
    try:
        salida = Salida.objects.get(id=salida_id)
        pasajes = salida.pasajes.all().order_by('asiento')
        
        data = {
            'salida': {
                'id': salida.id,
                'ruta': f"{salida.ruta.origen} → {salida.ruta.destino}",
                'fecha_hora': salida.fecha_hora.strftime('%d/%m/%Y %H:%M'),
                'vehiculo': salida.vehiculo.placa,
                'conductor': salida.conductor.get_full_name(),
                'capacidad': salida.vehiculo.capacidad
            },
            'pasajes': [
                {
                    'id': p.id,
                    'nombre': p.nombre,
                    'dni': p.dni,
                    'telefono': p.telefono,
                    'asiento': p.asiento,
                    'precio': float(p.precio),
                    'estado': p.estado
                } for p in pasajes
            ],
            'asientos_ocupados': [p.asiento for p in pasajes]
        }
        
        return Response(data)
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)

@api_view(['POST'])
def vender_pasaje(request, salida_id):
    """Vender un pasaje"""
    try:
        salida = Salida.objects.get(id=salida_id)
        
        # Validar asiento libre
        asiento = int(request.data.get('asiento'))
        if Pasaje.objects.filter(salida=salida, asiento=asiento).exists():
            return Response({'error': 'Asiento ocupado'}, status=400)
        
        # Crear pasaje
        pasaje = Pasaje.objects.create(
            salida=salida,
            nombre=request.data.get('nombre'),
            dni=request.data.get('dni'),
            telefono=request.data.get('telefono', ''),
            asiento=asiento,
            precio=salida.ruta.precio_pasaje,
            estado='pagado'
        )
        
        return Response({
            'success': True,
            'message': f'Pasaje vendido a {pasaje.nombre}',
            'pasaje_id': pasaje.id
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)