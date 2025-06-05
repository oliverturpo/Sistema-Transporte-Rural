from django.db import models
from vehiculos.models import Vehiculo
from django.conf import settings

class Ruta(models.Model):
    nombre = models.CharField(max_length=100)
    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    distancia_km = models.DecimalField(max_digits=6, decimal_places=2)
    tiempo_estimado = models.DurationField()
    precio_pasaje = models.DecimalField(max_digits=8, decimal_places=2)
    precio_encomienda_kg = models.DecimalField(max_digits=8, decimal_places=2)
    activa = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'rutas'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.origen} → {self.destino}"

class Salida(models.Model):
    ESTADOS = [
        ('programada', 'Programada'),
        ('en_curso', 'En Curso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]
    
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE)
    conductor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 limit_choices_to={'tipo': 'conductor'})
    fecha_hora = models.DateTimeField()
    estado = models.CharField(max_length=15, choices=ESTADOS, default='programada')
    
    class Meta:
        db_table = 'salidas'
        ordering = ['-fecha_hora']
        unique_together = ['vehiculo', 'fecha_hora']
    
    @property
    def capacidad_disponible(self):
        return self.vehiculo.capacidad - self.pasajes.count()
    
    def __str__(self):
        return f"{self.ruta} - {self.fecha_hora.strftime('%d/%m %H:%M')}"