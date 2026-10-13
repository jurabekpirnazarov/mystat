# Create your views here.
from rest_framework.views import APIView


class PaymentView(APIView):
    TYPE: str = ""
    PROVIDER: str = ""

    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        return response
