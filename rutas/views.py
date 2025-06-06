from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Salida

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