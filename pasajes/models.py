from django.db import models
from rutas.models import Salida

class Pasaje(models.Model):
    ESTADOS = [
        ('reservado', 'Reservado'),
        ('pagado', 'Pagado'),
        ('abordado', 'Abordado'),
        ('no_show', 'No Show'),
    ]
    
    salida = models.ForeignKey(Salida, on_delete=models.CASCADE, related_name='pasajes')
    nombre = models.CharField(max_length=100)
    dni = models.CharField(max_length=15)
    telefono = models.CharField(max_length=15, blank=True)
    asiento = models.PositiveIntegerField()
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='reservado')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pasajes'
        unique_together = ['salida', 'asiento']
        ordering = ['asiento']
    
    def __str__(self):
        return f"{self.nombre} - Asiento {self.asiento}"