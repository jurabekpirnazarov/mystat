from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.additional_services.services.trade_data_services import process_file
from apps.additional_services.serializers.trade_data_serializer import ExcelUploadSerializer
import os
from django.conf import settings


class TradeDataAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ExcelUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data['file']
        save_dir = os.path.join(settings.BASE_DIR, "datas")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, file_obj.name)

        with open(save_path, "wb") as f:
            for chunk in file_obj.chunks() if hasattr(file_obj, "chunks") else [file_obj.read()]:
                f.write(chunk)

        if not os.path.exists(save_path):
            return Response({"error": f"Saved file not found: {save_path}"}, status=status.HTTP_400_BAD_REQUEST)

        year = serializer.validated_data['year']
        format = serializer.validated_data['format']


        result = process_file(file_path=save_path,year=year, format=format)
        return Response({"status": "ok", "result": result})
