from django.db import models
from django.conf import settings

class Vehiculo(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('mantenimiento', 'Mantenimiento'),
        ('inactivo', 'Inactivo'),
    ]
    
    placa = models.CharField(max_length=10, unique=True)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    año = models.PositiveIntegerField()
    capacidad = models.PositiveIntegerField()
    conductor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                 null=True, blank=True, limit_choices_to={'tipo': 'conductor'})
    estado = models.CharField(max_length=15, choices=ESTADOS, default='activo')
    
    class Meta:
        db_table = 'vehiculos'
        ordering = ['placa']
    
    def __str__(self):
        return f"{self.placa} - {self.marca} {self.modelo}"