from django.urls import path

from . import views

app_name = "consultations"

urlpatterns = [
    path("", views.ConsultantListView.as_view(), name="consultants"),
    path("<int:pk>/slots/", views.SlotListView.as_view(), name="slots"),
    path("book/", views.BookView.as_view(), name="book"),
    path("my/", views.MyBookingsView.as_view(), name="my"),
    path("my/<int:pk>/", views.BookingDetailView.as_view(), name="my-detail"),
    path("schedule/", views.ScheduleView.as_view(), name="schedule"),
    path("schedule/bookings/<int:pk>/", views.ScheduleBookingView.as_view(), name="schedule-booking"),
]
