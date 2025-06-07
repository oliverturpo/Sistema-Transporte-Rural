from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Ruta, Salida
from vehiculos.models import Vehiculo
from usuarios.models import Usuario


@api_view(['GET'])
def salidas_hoy(request):
    """API: Obtener salidas del día de hoy"""
    hoy = timezone.now().date()
    salidas = Salida.objects.filter(fecha_hora__date=hoy).order_by('fecha_hora')
    
    data = []
    for salida in salidas:
        data.append({
            'id': salida.id,
            'hora': salida.fecha_hora.strftime('%H:%M'),
            'ruta': f"{salida.ruta.origen} → {salida.ruta.destino}",
            'vehiculo': salida.vehiculo.placa,
            'conductor': salida.conductor.get_full_name() or salida.conductor.username,
            'capacidad': salida.vehiculo.capacidad,
            'ocupados': salida.pasajes.count(),
            'disponibles': salida.capacidad_disponible
        })
    
    return Response(data)



@api_view(['GET'])
def get_rutas(request):
    """Obtener todas las rutas"""
    rutas = Ruta.objects.filter(activa=True).order_by('nombre')
    data = []
    for ruta in rutas:
        # Contar salidas programadas para esta ruta
        salidas_programadas = ruta.salida_set.filter(
            fecha_hora__gte=timezone.now(),
            estado='programada'
        ).count()
        
        data.append({
            'id': ruta.id,
            'nombre': ruta.nombre,
            'origen': ruta.origen,
            'destino': ruta.destino,
            'distancia_km': float(ruta.distancia_km),
            'tiempo_estimado': str(ruta.tiempo_estimado),
            'precio_pasaje': float(ruta.precio_pasaje),
            'precio_encomienda_kg': float(ruta.precio_encomienda_kg),
            'salidas_programadas': salidas_programadas,
            'activa': ruta.activa
        })
    return Response(data)

@api_view(['POST'])
def crear_ruta(request):
    """Crear nueva ruta"""
    try:
        data = request.data
        
        # Validaciones básicas
        required_fields = ['nombre', 'origen', 'destino', 'distancia_km', 
                          'tiempo_estimado', 'precio_pasaje', 'precio_encomienda_kg']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Validar que no exista una ruta con el mismo nombre
        if Ruta.objects.filter(nombre=data['nombre']).exists():
            return Response({
                'error': 'Ya existe una ruta con ese nombre'
            }, status=400)
        
        # Parsear tiempo estimado (formato: "HH:MM" o minutos)
        tiempo_str = data['tiempo_estimado']
        if ':' in tiempo_str:
            # Formato HH:MM
            horas, minutos = tiempo_str.split(':')
            tiempo_estimado = timedelta(hours=int(horas), minutes=int(minutos))
        else:
            # Asumir que son minutos
            tiempo_estimado = timedelta(minutes=int(tiempo_str))
        
        # Crear la ruta
        ruta = Ruta.objects.create(
            nombre=data['nombre'],
            origen=data['origen'],
            destino=data['destino'],
            distancia_km=float(data['distancia_km']),
            tiempo_estimado=tiempo_estimado,
            precio_pasaje=float(data['precio_pasaje']),
            precio_encomienda_kg=float(data['precio_encomienda_kg']),
            activa=data.get('activa', True)
        )
        
        return Response({
            'success': True,
            'message': f'Ruta {ruta.nombre} creada correctamente',
            'ruta_id': ruta.id
        })
        
    except ValueError as e:
        return Response({
            'error': f'Error en formato de datos: {str(e)}'
        }, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
def actualizar_ruta(request, ruta_id):
    """Actualizar ruta existente"""
    try:
        ruta = Ruta.objects.get(id=ruta_id)
        
        # Actualizar campos básicos
        if 'nombre' in request.data:
            # Verificar que el nuevo nombre no exista
            if request.data['nombre'] != ruta.nombre:
                if Ruta.objects.filter(nombre=request.data['nombre']).exists():
                    return Response({
                        'error': 'Ya existe una ruta con ese nombre'
                    }, status=400)
            ruta.nombre = request.data['nombre']
        
        if 'origen' in request.data:
            ruta.origen = request.data['origen']
        if 'destino' in request.data:
            ruta.destino = request.data['destino']
        if 'distancia_km' in request.data:
            ruta.distancia_km = float(request.data['distancia_km'])
        if 'precio_pasaje' in request.data:
            ruta.precio_pasaje = float(request.data['precio_pasaje'])
        if 'precio_encomienda_kg' in request.data:
            ruta.precio_encomienda_kg = float(request.data['precio_encomienda_kg'])
        
        # Tiempo estimado
        if 'tiempo_estimado' in request.data:
            tiempo_str = request.data['tiempo_estimado']
            if ':' in tiempo_str:
                horas, minutos = tiempo_str.split(':')
                ruta.tiempo_estimado = timedelta(hours=int(horas), minutes=int(minutos))
            else:
                ruta.tiempo_estimado = timedelta(minutes=int(tiempo_str))
        
        ruta.save()
        
        return Response({
            'success': True,
            'message': 'Ruta actualizada correctamente'
        })
        
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no encontrada'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
def toggle_estado_ruta(request, ruta_id):
    """Activar/desactivar ruta"""
    try:
        ruta = Ruta.objects.get(id=ruta_id)
        
        # Verificar si tiene salidas programadas antes de desactivar
        if ruta.activa:
            salidas_futuras = ruta.salida_set.filter(
                fecha_hora__gte=timezone.now(),
                estado__in=['programada', 'en_curso']
            ).count()
            
            if salidas_futuras > 0:
                return Response({
                    'error': f'No se puede desactivar la ruta. Tiene {salidas_futuras} salidas programadas'
                }, status=400)
        
        ruta.activa = not ruta.activa
        ruta.save()
        
        estado = 'activada' if ruta.activa else 'desactivada'
        return Response({
            'success': True,
            'message': f'Ruta {estado} correctamente',
            'activa': ruta.activa
        })
        
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no encontrada'}, status=404)

@api_view(['DELETE'])
def eliminar_ruta(request, ruta_id):
    """Eliminar ruta (solo si no tiene salidas)"""
    try:
        ruta = Ruta.objects.get(id=ruta_id)
        
        # Verificar que no tenga salidas asociadas
        if ruta.salida_set.exists():
            return Response({
                'error': 'No se puede eliminar la ruta. Tiene salidas asociadas'
            }, status=400)
        
        nombre = ruta.nombre
        ruta.delete()
        
        return Response({
            'success': True,
            'message': f'Ruta {nombre} eliminada correctamente'
        })
        
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no encontrada'}, status=404)

@api_view(['POST'])
def crear_salida(request):
    """Crear nueva salida"""
    try:
        data = request.data
        
        # Validaciones
        required_fields = ['ruta_id', 'vehiculo_id', 'conductor_id', 'fecha_hora']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Verificar que existan los objetos
        try:
            ruta = Ruta.objects.get(id=data['ruta_id'], activa=True)
            vehiculo = Vehiculo.objects.get(id=data['vehiculo_id'], estado='activo')
            conductor = Usuario.objects.get(id=data['conductor_id'], tipo='conductor', is_active=True)
        except (Ruta.DoesNotExist, Vehiculo.DoesNotExist, Usuario.DoesNotExist):
            return Response({'error': 'Ruta, vehículo o conductor no válido'}, status=400)
        
        # Parsear fecha y hora
        fecha_hora = datetime.strptime(data['fecha_hora'], '%Y-%m-%dT%H:%M')
        
        # Verificar que no haya conflictos de vehículo
        conflictos = Salida.objects.filter(
            vehiculo=vehiculo,
            fecha_hora__date=fecha_hora.date(),
            estado__in=['programada', 'en_curso']
        ).exists()
        
        if conflictos:
            return Response({
                'error': f'El vehículo {vehiculo.placa} ya tiene una salida programada para esa fecha'
            }, status=400)
        
        # Crear la salida
        salida = Salida.objects.create(
            ruta=ruta,
            vehiculo=vehiculo,
            conductor=conductor,
            fecha_hora=fecha_hora,
            estado='programada'
        )
        
        return Response({
            'success': True,
            'message': f'Salida programada correctamente para {salida.fecha_hora.strftime("%d/%m %H:%M")}',
            'salida_id': salida.id
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    




@api_view(['GET'])
def get_salidas(request):
    salidas = Salida.objects.all().order_by('-fecha_hora')
    data = []
    for salida in salidas:
        data.append({
            'id': salida.id,
            'fecha_hora': salida.fecha_hora.strftime('%d/%m/%Y %H:%M'),
            'ruta': {
                'id': salida.ruta.id,
                'nombre': salida.ruta.nombre,
                'origen': salida.ruta.origen,
                'destino': salida.ruta.destino
            },
            'vehiculo': {
                'id': salida.vehiculo.id,
                'placa': salida.vehiculo.placa,
                'capacidad': salida.vehiculo.capacidad
            },
            'conductor': {
                'id': salida.conductor.id,
                'nombre': salida.conductor.get_full_name()
            },
            'estado': salida.estado,
            'pasajeros_count': salida.pasajes.count(),
            'encomiendas_count': salida.encomiendas.count()
        })
    return Response(data)

@api_view(['PUT'])
def cancelar_salida(request, salida_id):
    try:
        salida = Salida.objects.get(id=salida_id)
        salida.estado = 'cancelada'
        salida.save()
        return Response({
            'success': True,
            'message': 'Salida cancelada correctamente'
        })
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)
    

# AGREGAR esta función en rutas/views.py

@api_view(['GET'])
def salidas_disponibles_venta(request):
    """API: Obtener salidas disponibles para venta (hoy y próximos días)"""
    from datetime import datetime, timedelta
    
    # Obtener salidas desde hoy hasta los próximos 7 días
    hoy = timezone.now().date()
    limite = hoy + timedelta(days=7)
    
    salidas = Salida.objects.filter(
        fecha_hora__date__gte=hoy,
        fecha_hora__date__lte=limite,
        estado__in=['programada', 'en_curso']
    ).order_by('fecha_hora')
    
    data = []
    for salida in salidas:
        # Solo mostrar salidas que tienen cupo disponible
        if salida.capacidad_disponible > 0:
            data.append({
                'id': salida.id,
                'hora': salida.fecha_hora.strftime('%H:%M'),
                'fecha': salida.fecha_hora.strftime('%d/%m/%Y'),
                'fecha_completa': salida.fecha_hora.strftime('%d/%m/%Y %H:%M'),
                'ruta': f"{salida.ruta.origen} → {salida.ruta.destino}",
                'ruta_nombre': salida.ruta.nombre,
                'vehiculo': salida.vehiculo.placa,
                'conductor': salida.conductor.get_full_name() or salida.conductor.username,
                'capacidad': salida.vehiculo.capacidad,
                'ocupados': salida.pasajes.count(),
                'disponibles': salida.capacidad_disponible,
                'precio': float(salida.ruta.precio_pasaje),
                'estado': salida.estado
            })
    
    return Response(data)



@api_view(['PUT'])
def marcar_salida(request, salida_id):
    """Marcar que el vehículo ha salido"""
    try:
        salida = Salida.objects.get(id=salida_id)
        salida.estado = 'en_curso'
        salida.save()
        
        return Response({
            'success': True,
            'message': 'Salida marcada correctamente'
        })
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)

@api_view(['PUT'])
def marcar_llegada(request, salida_id):
    """Marcar que el viaje ha terminado"""
    try:
        salida = Salida.objects.get(id=salida_id)
        salida.estado = 'completada'
        salida.save()
        
        return Response({
            'success': True,
            'message': 'Viaje completado correctamente'
        })
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)
    

    