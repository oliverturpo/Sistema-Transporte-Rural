from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Pasaje
from rutas.models import Salida



# AGREGAR estas funciones al final de pasajes/views.py

@api_view(['GET'])
def get_pasajes_salida(request, salida_id):
    """Obtener pasajes de una salida específica"""
    try:
        from rutas.models import Salida
        salida = Salida.objects.get(id=salida_id)
        pasajes = salida.pasajes.all().order_by('asiento')
        
        asientos_ocupados = [pasaje.asiento for pasaje in pasajes]
        
        data = {
            'salida_id': salida.id,
            'capacidad': salida.vehiculo.capacidad,
            'asientos_ocupados': asientos_ocupados,
            'pasajes': []
        }
        
        for pasaje in pasajes:
            data['pasajes'].append({
                'id': pasaje.id,
                'nombre': pasaje.nombre,
                'dni': pasaje.dni,
                'asiento': pasaje.asiento,
                'estado': pasaje.estado,
                'precio': float(pasaje.precio)
            })
        
        return Response(data)
        
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)

@api_view(['POST'])
def vender_pasaje(request, salida_id):
    """Vender un pasaje para una salida"""
    try:
        from rutas.models import Salida
        from .models import Pasaje
        
        salida = Salida.objects.get(id=salida_id)
        data = request.data
        
        # Validaciones
        required_fields = ['nombre', 'dni', 'asiento']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Validar que el asiento no esté ocupado
        asiento = int(data['asiento'])
        if Pasaje.objects.filter(salida=salida, asiento=asiento).exists():
            return Response({
                'error': f'El asiento {asiento} ya está ocupado'
            }, status=400)
        
        # Validar que el asiento sea válido
        if asiento < 1 or asiento > salida.vehiculo.capacidad:
            return Response({
                'error': f'Asiento inválido. Debe ser entre 1 y {salida.vehiculo.capacidad}'
            }, status=400)
        
        # Validar que haya cupo disponible
        if salida.capacidad_disponible <= 0:
            return Response({
                'error': 'No hay cupos disponibles en esta salida'
            }, status=400)
        
        # Crear el pasaje
        pasaje = Pasaje.objects.create(
            salida=salida,
            nombre=data['nombre'].strip().title(),
            dni=data['dni'].strip(),
            telefono=data.get('telefono', '').strip(),
            asiento=asiento,
            precio=salida.ruta.precio_pasaje,
            estado='pagado'
        )
        
        return Response({
            'success': True,
            'message': f'Pasaje vendido correctamente para {pasaje.nombre}',
            'pasaje_id': pasaje.id,
            'asiento': pasaje.asiento,
            'precio': float(pasaje.precio),
            'capacidad_disponible': salida.capacidad_disponible
        })
        
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)
    except ValueError:
        return Response({'error': 'Número de asiento inválido'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    



# AGREGAR esta función en pasajes/views.py

@api_view(['GET'])
def get_manifiesto_salida(request, salida_id):
    """Obtener manifiesto de pasajeros para una salida"""
    try:
        from rutas.models import Salida
        salida = Salida.objects.get(id=salida_id)
        pasajes = salida.pasajes.filter(estado__in=['pagado', 'abordado']).order_by('asiento')
        
        pasajeros = []
        saldo_total = 0
        
        for pasaje in pasajes:
            pasajeros.append({
                'nombre': pasaje.nombre,
                'dni': pasaje.dni,
                'asiento': pasaje.asiento,
                'telefono': pasaje.telefono,
                'precio': float(pasaje.precio),
                'estado': pasaje.estado
            })
            saldo_total += float(pasaje.precio)
        
        data = {
            'salida': {
                'id': salida.id,
                'ruta': f"{salida.ruta.origen} → {salida.ruta.destino}",
                'ruta_nombre': salida.ruta.nombre,
                'fecha_completa': salida.fecha_hora.strftime('%d/%m/%Y %H:%M'),
                'vehiculo': f"{salida.vehiculo.placa} - {salida.vehiculo.marca} {salida.vehiculo.modelo}",
                'conductor': salida.conductor.get_full_name() or salida.conductor.username,
                'capacidad': salida.vehiculo.capacidad
            },
            'pasajeros': pasajeros,
            'total_pasajeros': len(pasajeros),
            'saldo_total': saldo_total,
            'capacidad_disponible': salida.capacidad_disponible
        }
        
        return Response(data)
        
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)
    

@api_view(['PUT'])
def check_in_pasajero(request, pasaje_id):
    """Marcar check-in de pasajero"""
    try:
        from .models import Pasaje
        pasaje = Pasaje.objects.get(id=pasaje_id)
        pasaje.estado = 'abordado'
        pasaje.save()
        
        return Response({
            'success': True,
            'message': f'Check-in realizado para {pasaje.nombre}'
        })
    except Pasaje.DoesNotExist:
        return Response({'error': 'Pasaje no encontrado'}, status=404)