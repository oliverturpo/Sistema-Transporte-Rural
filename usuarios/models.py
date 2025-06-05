from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    TIPOS = [
        ('admin', 'Administrador'),
        ('conductor', 'Conductor'),
    ]
    
    tipo = models.CharField(max_length=10, choices=TIPOS, default='conductor')
    telefono = models.CharField(max_length=15, blank=True)
    
    class Meta:
        db_table = 'usuarios'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_tipo_display()})"
    