from django.urls import path

from .views import (
    DemographicsSchemaView,
    DemographicsDataView,
    DemographicsOptionsView,
    DemographicsExportView,
)

app_name = "demographics"

urlpatterns = [
    path("schema/", DemographicsSchemaView.as_view(), name="schema"),
    path("<slug:slug>/data/", DemographicsDataView.as_view(), name="data"),
    path("<slug:slug>/options/", DemographicsOptionsView.as_view(), name="options"),
    path("<slug:slug>/export/", DemographicsExportView.as_view(), name="export"),
]
