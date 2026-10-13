from django.urls import path
from .api_endpoints import click, order


app_name = "payment"

urlpatterns = [
    # tour order create
    path("OrderCreate/", order.OrderCreateAPIView.as_view(), name="order-create"),
    # get last transaction status
    path(
        "GetLastTransactionStatus/<int:order_id>",
        order.GetLastTransactionStatusAPIView.as_view(),
        name="get-last-transaction-status",
    ),
    # click
    path("ClickPrepare/", click.ClickPrepareAPIView.as_view(), name="click-prepare"),
    path("ClickComplete/", click.ClickCompleteAPIView.as_view(), name="click-complete"),
    path("OrderList/", order.OrderListAPIView.as_view(), name="order-list"),
]
