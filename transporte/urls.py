from django.contrib import admin
from django.urls import path
from rutas.views import salidas_hoy
from usuarios.views import login_usuario, usuarios_conductores
from vehiculos.views import get_vehiculos, crear_vehiculo
from pasajes.views import get_pasajes_salida, vender_pasaje
from encomiendas.views import get_encomiendas_salida, crear_encomienda

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # APIs de autenticación
    path('api/login/', login_usuario, name='login'),
    path('api/conductores/', usuarios_conductores, name='conductores'),
    
    # APIs de operación
    path('api/salidas-hoy/', salidas_hoy, name='salidas_hoy'),
    path('api/vehiculos/', get_vehiculos, name='vehiculos'),
    path('api/vehiculos/crear/', crear_vehiculo, name='crear_vehiculo'),
    
    # APIs de pasajes y encomiendas
    path('api/salida/<int:salida_id>/pasajes/', get_pasajes_salida, name='pasajes_salida'),
    path('api/salida/<int:salida_id>/vender/', vender_pasaje, name='vender_pasaje'),
    path('api/salida/<int:salida_id>/encomiendas/', get_encomiendas_salida, name='encomiendas_salida'),
    path('api/salida/<int:salida_id>/encomienda/', crear_encomienda, name='crear_encomienda'),
]