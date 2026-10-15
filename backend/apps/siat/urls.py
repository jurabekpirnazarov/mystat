from django.urls import path

from . import views

app_name = "siat"

urlpatterns = [
    path("indicators/", views.IndicatorsView.as_view(), name="indicators"),
    path("values/", views.ValuesView.as_view(), name="values"),
    path("territory/<str:soato>/", views.TerritoryView.as_view(), name="territory"),
    path("territories/", views.TerritoriesView.as_view(), name="territories"),
]
