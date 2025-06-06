from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Encomienda
from rutas.models import Salida

@api_view(['GET'])
def get_encomiendas_salida(request, salida_id):
    """Obtener encomiendas de una salida"""
    try:
        salida = Salida.objects.get(id=salida_id)
        encomiendas = salida.encomiendas.all().order_by('-created_at')
        
        data = [
            {
                'id': e.id,
                'remitente_nombre': e.remitente_nombre,
                'remitente_telefono': e.remitente_telefono,
                'destinatario_nombre': e.destinatario_nombre,
                'destinatario_telefono': e.destinatario_telefono,
                'descripcion': e.descripcion,
                'peso_kg': float(e.peso_kg),
                'precio': float(e.precio),
                'estado': e.estado,
                'fecha_envio': e.created_at.strftime('%d/%m/%Y %H:%M')
            } for e in encomiendas
        ]
        
        return Response(data)
    except Salida.DoesNotExist:
        return Response({'error': 'Salida no encontrada'}, status=404)

@api_view(['POST'])
def crear_encomienda(request, salida_id):
    """Crear nueva encomienda"""
    try:
        salida = Salida.objects.get(id=salida_id)
        
        peso = float(request.data.get('peso_kg'))
        precio = peso * salida.ruta.precio_encomienda_kg
        
        encomienda = Encomienda.objects.create(
            salida=salida,
            remitente_nombre=request.data.get('remitente_nombre'),
            remitente_telefono=request.data.get('remitente_telefono'),
            destinatario_nombre=request.data.get('destinatario_nombre'),
            destinatario_telefono=request.data.get('destinatario_telefono'),
            descripcion=request.data.get('descripcion'),
            peso_kg=peso,
            precio=precio,
            estado='enviada'
        )
        
        return Response({
            'success': True,
            'message': f'Encomienda creada para {encomienda.destinatario_nombre}',
            'encomienda_id': encomienda.id,
            'precio_total': float(precio)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)