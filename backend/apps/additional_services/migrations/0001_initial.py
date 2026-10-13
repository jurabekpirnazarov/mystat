import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CountryGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('name_uz_lat', models.CharField(max_length=100)),
                ('name_ru', models.CharField(max_length=100)),
                ('name_en', models.CharField(max_length=100)),
                ('name_uz_cyr', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=10, unique=True)),
            ],
            options={
                'verbose_name': 'Country Group',
                'verbose_name_plural': 'Country Groups',
            },
        ),
        migrations.CreateModel(
            name='Country',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('ctrana', models.CharField(max_length=10, unique=True)),
                ('zar1', models.IntegerField()),
                ('zar', models.IntegerField()),
                ('name_uz_lat', models.CharField(max_length=100)),
                ('name_ru', models.CharField(max_length=100)),
                ('name_en', models.CharField(max_length=100)),
                ('name_uz_cyr', models.CharField(max_length=100)),
                ('kod_kont', models.IntegerField()),
                ('country_group', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='countries', to='additional_services.countrygroup')),
            ],
            options={
                'verbose_name': 'Country',
                'verbose_name_plural': 'Countries',
            },
        ),
    ]
