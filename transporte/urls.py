from django.contrib import admin
from django.urls import path
from rutas.views import (salidas_hoy, get_rutas, crear_ruta, actualizar_ruta, 
                        toggle_estado_ruta, eliminar_ruta, crear_salida, 
                        get_salidas, cancelar_salida, marcar_salida, marcar_llegada)
from usuarios.views import login_usuario, usuarios_conductores, registrar_conductor, get_conductores, actualizar_conductor, toggle_estado_conductor
from vehiculos.views import get_vehiculos, crear_vehiculo, actualizar_vehiculo, eliminar_vehiculo
from pasajes.views import (get_pasajes_salida, vender_pasaje, 
                          get_manifiesto_salida, check_in_pasajero)
from encomiendas.views import (get_encomiendas_salida, crear_encomienda, 
                              entregar_encomienda)

# FALTA IMPORTAR - Agregando importación que faltaba
from rutas.views import salidas_disponibles_venta

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # APIs de autenticación
    path('api/login/', login_usuario, name='login'),
    path('api/conductores/', usuarios_conductores, name='conductores'),
    
    # APIs de gestión de conductores
    path('api/conductores/registrar/', registrar_conductor, name='registrar_conductor'),
    path('api/conductores/lista/', get_conductores, name='get_conductores'),
    path('api/conductores/<int:conductor_id>/actualizar/', actualizar_conductor, name='actualizar_conductor'),
    path('api/conductores/<int:conductor_id>/toggle-estado/', toggle_estado_conductor, name='toggle_estado_conductor'),
    
    # APIs de operación
    path('api/salidas-hoy/', salidas_hoy, name='salidas_hoy'),
    
    # APIs de rutas y salidas
    path('api/rutas/', get_rutas, name='get_rutas'),
    path('api/rutas/crear/', crear_ruta, name='crear_ruta'),
    path('api/rutas/<int:ruta_id>/actualizar/', actualizar_ruta, name='actualizar_ruta'),
    path('api/rutas/<int:ruta_id>/toggle-estado/', toggle_estado_ruta, name='toggle_estado_ruta'),
    path('api/rutas/<int:ruta_id>/eliminar/', eliminar_ruta, name='eliminar_ruta'),
    
    path('api/salidas/', get_salidas, name='get_salidas'),
    path('api/salidas/crear/', crear_salida, name='crear_salida'),
    path('api/salidas/<int:salida_id>/cancelar/', cancelar_salida, name='cancelar_salida'),
    path('api/salidas-disponibles/', salidas_disponibles_venta, name='salidas_disponibles_venta'),
    path('api/salida/<int:salida_id>/manifiesto/', get_manifiesto_salida, name='manifiesto_salida'),
    
    # APIs para conductores - NUEVAS URLs AGREGADAS
    path('api/salidas/<int:salida_id>/marcar-salida/', marcar_salida, name='marcar_salida'),
    path('api/salidas/<int:salida_id>/marcar-llegada/', marcar_llegada, name='marcar_llegada'),
    path('api/pasaje/<int:pasaje_id>/check-in/', check_in_pasajero, name='check_in_pasajero'),
    path('api/encomienda/<int:encomienda_id>/entregar/', entregar_encomienda, name='entregar_encomienda'),
    
    # APIs de vehículos
    path('api/vehiculos/', get_vehiculos, name='vehiculos'),
    path('api/vehiculos/crear/', crear_vehiculo, name='crear_vehiculo'),
    path('api/vehiculos/<int:vehiculo_id>/actualizar/', actualizar_vehiculo, name='actualizar_vehiculo'),
    path('api/vehiculos/<int:vehiculo_id>/eliminar/', eliminar_vehiculo, name='eliminar_vehiculo'),
    
    # APIs de pasajes y encomiendas
    path('api/salida/<int:salida_id>/pasajes/', get_pasajes_salida, name='pasajes_salida'),
    path('api/salida/<int:salida_id>/vender/', vender_pasaje, name='vender_pasaje'),
    path('api/salida/<int:salida_id>/encomiendas/', get_encomiendas_salida, name='encomiendas_salida'),
    path('api/salida/<int:salida_id>/encomienda/', crear_encomienda, name='crear_encomienda'),
]