from django.urls import path
from apps.contracts.api.ContractView.views import ContractList
from apps.contracts.api.ContractExtra.views import ContractPreviewView, ContractTimelineView
from apps.contracts.api.ContractCreate.views import (
    ContractCreateView 
)


app_name = 'contracts'

urlpatterns = [
    path('', ContractList.as_view(), name='contracts-list'),
    
    path('create/', ContractCreateView.as_view(), name='contract-create'),
    path('preview/', ContractPreviewView.as_view(), name='contract-preview'),
    path('<int:pk>/timeline/', ContractTimelineView.as_view(), name='contract-timeline'),
    

]