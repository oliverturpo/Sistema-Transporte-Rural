from django.db import models
from rutas.models import Salida

class Pasaje(models.Model):
    # ESTADOS = Flujo del pasaje (reservado → pagado → abordado)
    ESTADOS = [
        ('reservado', 'Reservado'),  # ⏳ Creado, esperando confirmación
        ('pagado', 'Pagado'),        # ✅ Confirmado y pagado
        ('abordado', 'Abordado'),    # 🚌 Ya subió al vehículo
        ('no_show', 'No Show'),      # ❌ No apareció
    ]
    
    # TIPO_PASAJE = Quién lo creó y si genera ingresos
    TIPO_PASAJE_CHOICES = [
        ('vendido', 'Vendido'),              # 🎫 Vendido por administrador
        ('reserva_conductor', 'Reserva del Conductor'), # 🚛 Reservado por conductor
    ]
    
    salida = models.ForeignKey(Salida, on_delete=models.CASCADE, related_name='pasajes')
    nombre = models.CharField(max_length=100)
    dni = models.CharField(max_length=15)
    telefono = models.CharField(max_length=15, blank=True)
    asiento = models.PositiveIntegerField()
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    
    # ESTADO = ¿En qué fase está el pasaje?
    estado = models.CharField(max_length=10, choices=ESTADOS, default='reservado')
    
    # TIPO = ¿Quién lo creó y genera ingresos?
    tipo_pasaje = models.CharField(
        max_length=20, 
        choices=TIPO_PASAJE_CHOICES, 
        default='vendido'
    )
    
    reservado_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pasajes'
        unique_together = ['salida', 'asiento']
        ordering = ['asiento']
    
    def __str__(self):
        tipo_emoji = "🚛" if self.tipo_pasaje == 'reserva_conductor' else "🎫"
        estado_emoji = {
            'reservado': '⏳',
            'pagado': '✅', 
            'abordado': '🚌',
            'no_show': '❌'
        }.get(self.estado, '❓')
        
        return f"{tipo_emoji}{estado_emoji} {self.nombre} - Asiento {self.asiento}"
    
    @property
    def es_reserva_conductor(self):
        return self.tipo_pasaje == 'reserva_conductor'
    
    @property
    def genera_ingresos(self):
        return self.tipo_pasaje == 'vendido'