from django.urls import path

from .api import views

app_name = "chat-api"

urlpatterns = [
    path("chats/list/", views.ChatListView.as_view(), name="chat-list"),
    path("chats/<int:pk>/messages/", views.MessageListView.as_view(), name="message-list"),
]
