from django.urls import path

from . import agent_api, api

app_name = "credits"

urlpatterns = [
    path("me/", api.CreditsMeView.as_view(), name="me"),
    path("unlock/", api.UnlockView.as_view(), name="unlock"),
    path("activation/", api.ActivationView.as_view(), name="activation"),
    path("agent/quote/", agent_api.AgentQuoteView.as_view(), name="agent-quote"),
    path("agent/accept/", agent_api.AgentAcceptView.as_view(), name="agent-accept"),
    path("agent/decline/", agent_api.AgentDeclineView.as_view(), name="agent-decline"),
    path("agent/history/", agent_api.AgentHistoryView.as_view(), name="agent-history"),
    path("agent/purchases/<int:pk>/preview/", agent_api.AgentPreviewView.as_view(), name="agent-preview"),
    path("agent/purchases/<int:pk>/download/", agent_api.AgentDownloadView.as_view(), name="agent-download"),
]
