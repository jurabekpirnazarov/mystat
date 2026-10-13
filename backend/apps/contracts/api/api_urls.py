from django.urls import path
from apps.contracts.api.ContractView.views import ContractList
from apps.contracts.api.ContractCreate.views import (
    ContractCreateView 
)


app_name = 'contracts'

urlpatterns = [
    path('', ContractList.as_view(), name='contracts-list'),
    
    path('create/', ContractCreateView.as_view(), name='contract-create'),
    

]