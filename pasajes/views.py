from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Pasaje
from rutas.models import Salida



from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
from usuarios.models import Usuario

from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import datetime

# AGREGAR estas funciones al final de pasajes/views.py

@require_http_methods(["GET"])
def get_pasajes_salida(request, salida_id):
    """
    Obtiene todos los pasajes de una salida - CON SEGURIDAD PARA CONDUCTORES
    """
    try:
        salida = Salida.objects.get(id=salida_id)
        
        # Verificar permisos si es conductor
        conductor_id = request.GET.get('conductor_id')
        if conductor_id and int(conductor_id) != salida.conductor.id:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para ver esta salida'
            })
        
        pasajes = Pasaje.objects.filter(salida=salida).order_by('asiento')
        
        pasajes_data = []
        total_ingresos = 0
        
        for pasaje in pasajes:
            pasaje_info = {
                'id': pasaje.id,
                'nombre': pasaje.nombre,
                'dni': pasaje.dni,
                'telefono': pasaje.telefono,
                'asiento': pasaje.asiento,
                'precio': float(pasaje.precio),
                'estado': pasaje.estado,
                'fecha_venta': pasaje.created_at.strftime('%Y-%m-%d %H:%M'),
                'tipo_pasaje': pasaje.tipo_pasaje,
                'es_reserva_conductor': pasaje.es_reserva_conductor,
                'genera_ingresos': pasaje.genera_ingresos
            }
            
            if pasaje.es_reserva_conductor and pasaje.reservado_por:
                pasaje_info['reservado_por'] = {
                    'id': pasaje.reservado_por.id,
                    'nombre': pasaje.reservado_por.get_full_name() or pasaje.reservado_por.username
                }
            
            pasajes_data.append(pasaje_info)
            
            if pasaje.genera_ingresos:
                total_ingresos += pasaje.precio
        
        total_pasajes = len(pasajes_data)
        pasajes_vendidos = len([p for p in pasajes_data if not p['es_reserva_conductor']])
        reservas_conductor = len([p for p in pasajes_data if p['es_reserva_conductor']])
        asientos_disponibles = salida.vehiculo.capacidad - total_pasajes
        
        return JsonResponse({
            'success': True,
            'salida': {
                'id': salida.id,
                'ruta': salida.ruta.nombre,
                'fecha_hora': salida.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                'vehiculo': salida.vehiculo.placa,
                'capacidad': salida.vehiculo.capacidad,
                'conductor': salida.conductor.get_full_name() or salida.conductor.username
            },
            'pasajes': pasajes_data,
            'estadisticas': {
                'total_pasajes': total_pasajes,
                'pasajes_vendidos': pasajes_vendidos,
                'reservas_conductor': reservas_conductor,
                'asientos_disponibles': asientos_disponibles,
                'total_ingresos': float(total_ingresos),
                'porcentaje_ocupacion': round((total_pasajes / salida.vehiculo.capacidad) * 100, 1) if salida.vehiculo.capacidad > 0 else 0
            }
        })
        
    except Salida.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Salida no encontrada'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error: {str(e)}'
        })




@require_http_methods(["GET"])
def get_manifiesto_conductor(request, salida_id):
    """
    Manifiesto exclusivo para el conductor de la salida
    """
    try:
        salida = Salida.objects.get(id=salida_id)
        
        # VALIDAR QUE SEA EL CONDUCTOR DE LA SALIDA
        conductor_id = request.GET.get('conductor_id')
        if not conductor_id or int(conductor_id) != salida.conductor.id:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para descargar este manifiesto'
            })
        
        # Obtener pasajeros de la salida
        pasajes = Pasaje.objects.filter(salida=salida).order_by('asiento')
        
        pasajeros_data = []
        for pasaje in pasajes:
            pasajeros_data.append({
                'asiento': pasaje.asiento,
                'nombre': pasaje.nombre,
                'dni': pasaje.dni,
                'telefono': pasaje.telefono or 'N/A',
                'estado': pasaje.estado,
                'tipo': 'Reserva del Conductor' if pasaje.es_reserva_conductor else 'Pasaje Vendido',
                'precio': float(pasaje.precio)
            })
        
        # Estadísticas
        total_pasajeros = len(pasajeros_data)
        ingresos_generados = sum(p['precio'] for p in pasajeros_data if p['tipo'] == 'Pasaje Vendido')
        
        return JsonResponse({
            'success': True,
            'manifiesto': {
                'salida': {
                    'id': salida.id,
                    'fecha_hora': salida.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                    'ruta': {
                        'nombre': salida.ruta.nombre,
                        'origen': salida.ruta.origen,
                        'destino': salida.ruta.destino
                    },
                    'vehiculo': {
                        'placa': salida.vehiculo.placa,
                        'capacidad': salida.vehiculo.capacidad
                    },
                    'conductor': {
                        'nombre': salida.conductor.get_full_name() or salida.conductor.username
                    }
                },
                'pasajeros': pasajeros_data,
                'estadisticas': {
                    'total_pasajeros': total_pasajeros,
                    'capacidad_vehiculo': salida.vehiculo.capacidad,
                    'asientos_disponibles': salida.vehiculo.capacidad - total_pasajeros,
                    'ingresos_generados': float(ingresos_generados),
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            }
        })
        
    except Salida.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Salida no encontrada'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error: {str(e)}'
        })






@csrf_exempt
@require_http_methods(["PUT"])
def check_in_pasajero(request, pasaje_id):
    """
    Check-in de pasajero con validación de conductor
    """
    try:
        data = json.loads(request.body) if request.body else {}
        pasaje = Pasaje.objects.get(id=pasaje_id)
        
        # Verificar permisos si es conductor
        conductor_id = data.get('conductor_id')
        if conductor_id and int(conductor_id) != pasaje.salida.conductor.id:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para hacer check-in en esta salida'
            })
        
        pasaje.estado = 'abordado'
        pasaje.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Check-in realizado para {pasaje.nombre}'
        })
        
    except Pasaje.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Pasaje no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error: {str(e)}'
        })









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
    



@csrf_exempt
@require_http_methods(["POST"])
def reservar_asiento_conductor(request, salida_id):
    """
    Permite al conductor reservar un asiento sin generar venta
    """
    try:
        data = json.loads(request.body)
        
        # Validar que la salida existe
        salida = Salida.objects.get(id=salida_id)
        
        # Validar campos requeridos
        required_fields = ['nombre', 'dni', 'asiento', 'conductor_id']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'El campo {field} es requerido'
                })
        
        nombre = data['nombre'].strip()
        dni = data['dni'].strip()
        asiento = int(data['asiento'])
        conductor_id = data['conductor_id']
        telefono = data.get('telefono', '').strip()
        
        # Validaciones
        if len(dni) != 8 or not dni.isdigit():
            return JsonResponse({
                'success': False,
                'error': 'El DNI debe tener exactamente 8 dígitos'
            })
        
        if asiento < 1 or asiento > salida.vehiculo.capacidad:
            return JsonResponse({
                'success': False,
                'error': f'Asiento inválido. Capacidad: {salida.vehiculo.capacidad}'
            })
        
        # Verificar que el asiento esté disponible
        if Pasaje.objects.filter(salida=salida, asiento=asiento).exists():
            return JsonResponse({
                'success': False,
                'error': 'El asiento ya está ocupado'
            })
        
        # Verificar que el conductor puede reservar en esta salida
        if salida.conductor.id != conductor_id:
            return JsonResponse({
                'success': False,
                'error': 'Solo puedes reservar asientos en tus propias salidas'
            })
        
        # Obtener el usuario conductor
        conductor = Usuario.objects.get(id=conductor_id)
        
        # Crear la reserva del conductor
        pasaje = Pasaje.objects.create(
            salida=salida,
            nombre=nombre,
            dni=dni,
            telefono=telefono,
            asiento=asiento,
            tipo_pasaje='reserva_conductor',
            precio=0.00,  # Las reservas de conductor no tienen precio
            reservado_por=conductor,
            estado='pagado'  # Las reservas van directo a 'pagado'
        )
        
        return JsonResponse({
            'success': True,
            'message': f'✅ Asiento {asiento} reservado para {nombre}',
            'pasaje': {
                'id': pasaje.id,
                'nombre': pasaje.nombre,
                'dni': pasaje.dni,
                'asiento': pasaje.asiento,
                'tipo': 'Reserva del Conductor',
                'precio': 0.00,
                'estado': pasaje.estado
            }
        })
        
    except Salida.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Salida no encontrada'
        })
    except Usuario.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Conductor no encontrado'
        })
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': 'Datos inválidos'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error interno: {str(e)}'
        })







@require_http_methods(["GET"])
def get_asientos_disponibles_conductor(request, salida_id):
    """
    Obtiene asientos disponibles para reserva del conductor
    """
    try:
        salida = Salida.objects.get(id=salida_id)
        
        # Obtener todos los asientos ocupados
        asientos_ocupados = Pasaje.objects.filter(salida=salida).values_list('asiento', flat=True)
        
        # Generar lista de asientos disponibles
        asientos_disponibles = []
        for i in range(1, salida.vehiculo.capacidad + 1):
            if i not in asientos_ocupados:
                asientos_disponibles.append(i)
        
        # Obtener asientos ocupados con detalles
        asientos_ocupados_detalle = []
        pasajes = Pasaje.objects.filter(salida=salida).order_by('asiento')
        
        for pasaje in pasajes:
            asientos_ocupados_detalle.append({
                'asiento': pasaje.asiento,
                'nombre': pasaje.nombre,
                'tipo': 'Reserva del Conductor' if pasaje.es_reserva_conductor else 'Vendido',
                'precio': float(pasaje.precio),
                'es_reserva': pasaje.es_reserva_conductor,
                'estado': pasaje.estado
            })
        
        return JsonResponse({
            'success': True,
            'salida': {
                'id': salida.id,
                'ruta': salida.ruta.nombre,
                'fecha_hora': salida.fecha_hora.strftime('%Y-%m-%d %H:%M'),
                'vehiculo': salida.vehiculo.placa,
                'capacidad': salida.vehiculo.capacidad,
                # CORREGIDO: Usar get_full_name() o username
                'conductor': salida.conductor.get_full_name() or salida.conductor.username
            },
            'asientos_disponibles': asientos_disponibles,
            'asientos_ocupados': asientos_ocupados_detalle,
            'total_disponibles': len(asientos_disponibles),
            'total_ocupados': len(asientos_ocupados_detalle)
        })
        
    except Salida.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Salida no encontrada'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error: {str(e)}'
        })



@require_http_methods(["GET"])
def descargar_manifiesto_pdf(request, salida_id):
    """
    Generar y descargar manifiesto en formato PDF
    """
    try:
        salida = Salida.objects.get(id=salida_id)
        
        # VALIDAR QUE SEA EL CONDUCTOR DE LA SALIDA
        conductor_id = request.GET.get('conductor_id')
        if not conductor_id or int(conductor_id) != salida.conductor.id:
            return JsonResponse({
                'success': False,
                'error': 'No tienes permisos para descargar este manifiesto'
            })
        
        # Crear el PDF en memoria
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
        
        # Obtener estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Centrado
        )
        
        # Lista para elementos del PDF
        elements = []
        
        # TÍTULO
        elements.append(Paragraph("MANIFIESTO DE VIAJE", title_style))
        elements.append(Spacer(1, 20))
        
        # INFORMACIÓN DEL VIAJE
        info_data = [
            ['INFORMACIÓN DEL VIAJE', ''],
            ['Ruta:', salida.ruta.nombre],
            ['Origen:', salida.ruta.origen],
            ['Destino:', salida.ruta.destino],
            ['Fecha y Hora:', salida.fecha_hora.strftime('%d/%m/%Y %H:%M')],
            ['Vehículo:', salida.vehiculo.placa],
            ['Conductor:', salida.conductor.get_full_name() or salida.conductor.username],
            ['Capacidad:', f"{salida.vehiculo.capacidad} asientos"],
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 30))
        
        # OBTENER PASAJEROS
        pasajes = Pasaje.objects.filter(salida=salida).order_by('asiento')
        
        # ESTADÍSTICAS
        total_pasajeros = pasajes.count()
        pasajes_vendidos = pasajes.filter(tipo_pasaje='vendido').count()
        reservas_conductor = pasajes.filter(tipo_pasaje='reserva_conductor').count()
        ingresos_generados = sum(float(p.precio) for p in pasajes if p.tipo_pasaje == 'vendido')
        
        stats_data = [
            ['ESTADÍSTICAS DEL VIAJE', ''],
            ['Total Pasajeros:', str(total_pasajeros)],
            ['Pasajes Vendidos:', str(pasajes_vendidos)],
            ['Reservas del Conductor:', str(reservas_conductor)],
            ['Asientos Disponibles:', str(salida.vehiculo.capacidad - total_pasajeros)],
            ['Ingresos Generados:', f"S/ {ingresos_generados:.2f}"],
        ]
        
        stats_table = Table(stats_data, colWidths=[2*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(stats_table)
        elements.append(Spacer(1, 30))
        
        # LISTA DE PASAJEROS
        if pasajes.exists():
            pasajeros_data = [['ASIENTO', 'NOMBRE', 'DNI', 'TELÉFONO', 'TIPO', 'ESTADO']]
            
            for pasaje in pasajes:
                tipo = '🚛 Reserva Conductor' if pasaje.tipo_pasaje == 'reserva_conductor' else '🎫 Vendido'
                estado = '✅ Abordado' if pasaje.estado == 'abordado' else '⏳ Pendiente'
                
                pasajeros_data.append([
                    str(pasaje.asiento),
                    pasaje.nombre,
                    pasaje.dni,
                    pasaje.telefono or 'N/A',
                    tipo,
                    estado
                ])
            
            pasajeros_table = Table(pasajeros_data, colWidths=[0.8*inch, 2*inch, 1*inch, 1.2*inch, 1.5*inch, 1*inch])
            pasajeros_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.green),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            elements.append(pasajeros_table)
        else:
            elements.append(Paragraph("No hay pasajeros registrados para este viaje.", styles['Normal']))
        
        # FOOTER
        elements.append(Spacer(1, 30))
        footer_data = [
            ['Fecha de Generación:', datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')],
            ['Sistema:', 'Transporte Rural - Manifiesto Digital'],
        ]
        
        footer_table = Table(footer_data, colWidths=[2*inch, 4*inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
        ]))
        
        elements.append(footer_table)
        
        # Construir el PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Crear respuesta HTTP con el PDF
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f'manifiesto_salida_{salida_id}_{datetime.datetime.now().strftime("%Y%m%d_%H%M")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Salida.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Salida no encontrada'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al generar PDF: {str(e)}'
        })