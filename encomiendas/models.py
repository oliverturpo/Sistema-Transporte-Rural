from django.db import models
from rutas.models import Salida

class Encomienda(models.Model):
    ESTADOS = [
        ('enviada', 'Enviada'),
        ('en_transito', 'En Tránsito'),
        ('entregada', 'Entregada'),
    ]
    
    salida = models.ForeignKey(Salida, on_delete=models.CASCADE, related_name='encomiendas')
    remitente_nombre = models.CharField(max_length=100)
    remitente_telefono = models.CharField(max_length=15)
    destinatario_nombre = models.CharField(max_length=100)
    destinatario_telefono = models.CharField(max_length=15)
    descripcion = models.CharField(max_length=200)
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2)
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    estado = models.CharField(max_length=15, choices=ESTADOS, default='enviada')
    created_at = models.DateTimeField(auto_now_add=True)
    entregada_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'encomiendas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.descripcion} - {self.destinatario_nombre}"