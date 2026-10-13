from django.urls import path
from apps.book_market.api.BookView.views import (
        BookListAPIView, BookDetailAPIView, BookYearsAPIView, ElectronBookAPIView, BookDownloadAPIView, MyDownloadedBooks
    )
from apps.book_market.api.OrderView.views import (
    OrderDetailView, OrderListView
)
from apps.book_market.api.OrderCreateView.views import (
    OrderCreateAPIView, OrderPaymentLinkAPIView
)
from .Location.views import (
    AttachPostalToOrder,
    PostalLocationAPIView
)

app_name = "book_market"


urlpatterns = [
    path('books-list/', BookListAPIView.as_view(), name='books'),
    path('book/<int:id>/', BookDetailAPIView.as_view(), name='book-detail'),
    path('order/<int:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('order/create/', OrderCreateAPIView.as_view(), name='order-create'),
    path('years/', BookYearsAPIView.as_view(), name='book-years'),
    path("orders/payment-link/", OrderPaymentLinkAPIView.as_view(), name="order-payment-link"),
    path('postal-location/', PostalLocationAPIView.as_view(), name='location-list'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('attach-postal/', AttachPostalToOrder.as_view(), name='attach-postal'),
    path('e-books/', ElectronBookAPIView.as_view(), name='e-books'),
    # path("orders/<int:pk>/", OrderItemUpdateAPIView.as_view(), name="order-update"),
    path('e-book/download/<int:book_id>', BookDownloadAPIView.as_view(), name='e-book-download'),
    path('my-downloaded-books/', MyDownloadedBooks.as_view(), name='my-download'),

]