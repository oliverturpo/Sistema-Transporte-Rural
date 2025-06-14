# Generated by Django 5.2.2 on 2025-06-05 16:40

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Encomienda',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('remitente_nombre', models.CharField(max_length=100)),
                ('remitente_telefono', models.CharField(max_length=15)),
                ('destinatario_nombre', models.CharField(max_length=100)),
                ('destinatario_telefono', models.CharField(max_length=15)),
                ('descripcion', models.CharField(max_length=200)),
                ('peso_kg', models.DecimalField(decimal_places=2, max_digits=5)),
                ('precio', models.DecimalField(decimal_places=2, max_digits=8)),
                ('estado', models.CharField(choices=[('enviada', 'Enviada'), ('en_transito', 'En Tránsito'), ('entregada', 'Entregada')], default='enviada', max_length=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('entregada_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'encomiendas',
                'ordering': ['-created_at'],
            },
        ),
    ]
