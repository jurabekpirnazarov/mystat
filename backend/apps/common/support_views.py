"""Global qidiruv (U-10), "Stat AI" yordamchi (U-11), operator chat (U-12)."""
import secrets

from django.shortcuts import get_object_or_404
from django.utils.crypto import constant_time_compare
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact, ContactReply
from .search import MIN_QUERY, assistant_answer, global_search


class GlobalSearchAPIView(APIView):
    """GET /api/common/search/?q=... — guruhlangan natijalar (har guruhdan 5 tadan)."""
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "")
        if len(q.strip()) < MIN_QUERY:
            return Response({"query": q, "groups": []})
        return Response({"query": q, "groups": global_search(q, request.user)})


class AssistantAPIView(APIView):
    """POST /api/common/assistant/ {"message": "..."} — FAQ asosidagi javob (tashqi LLM yo'q)."""
    permission_classes = [AllowAny]

    def post(self, request):
        message = str(request.data.get("message", ""))[:500]
        if not message.strip():
            return Response({"detail": "message bo'sh"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(assistant_answer(message))


class SupportStartSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=13, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, data):
        user = self.context["request"].user
        if not user.is_authenticated and not (data.get("name") and data.get("phone_number")):
            raise serializers.ValidationError("Mehmon uchun ism va telefon raqami majburiy.")
        return data


def _thread(contact):
    return {
        "id": contact.id,
        "created_at": contact.created_at,
        "messages": [{"text": contact.text, "from_operator": False, "created_at": contact.created_at}] + [
            {"text": r.text, "from_operator": r.from_operator, "created_at": r.created_at}
            for r in contact.replies.all()
        ],
    }


class SupportStartAPIView(APIView):
    """POST /api/common/support/ — yangi murojaat (chat). Javob: {id, token, ...thread}.
    Token mehmonga keyingi javoblarni o'qish uchun beriladi (brauzerda saqlanadi)."""
    permission_classes = [AllowAny]

    def post(self, request):
        ser = SupportStartSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        data, user = ser.validated_data, request.user
        authed = user.is_authenticated
        contact = Contact.objects.create(
            name=data.get("name") or (user.first_name or user.username if authed else ""),
            surname=(user.last_name or "") if authed else "",
            phone_number=data.get("phone_number") or (getattr(user, "phone_number", "") if authed else ""),
            email=data.get("email") or (user.email or "" if authed else ""),
            text=data["text"],
            user=user if authed else None,
            access_token=secrets.token_urlsafe(24),
            is_chat=True,
        )
        return Response({**_thread(contact), "token": contact.access_token}, status=status.HTTP_201_CREATED)


class SupportThreadAPIView(APIView):
    """GET  /api/common/support/<id>/?token=... — xabarlar (operator javoblari bilan)
    POST /api/common/support/<id>/?token=... {"text"} — murojaatchining qo'shimcha xabari"""
    permission_classes = [AllowAny]

    def _get(self, request, pk):
        contact = get_object_or_404(Contact, pk=pk, is_chat=True)
        token = request.query_params.get("token") or request.data.get("token") or ""
        own = request.user.is_authenticated and contact.user_id == request.user.id
        if not own and not (contact.access_token and constant_time_compare(token, contact.access_token)):
            return None
        return contact

    def get(self, request, pk):
        contact = self._get(request, pk)
        if contact is None:
            return Response({"detail": "Topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_thread(contact))

    def post(self, request, pk):
        contact = self._get(request, pk)
        if contact is None:
            return Response({"detail": "Topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        text = str(request.data.get("text", "")).strip()[:2000]
        if not text:
            return Response({"detail": "text bo'sh"}, status=status.HTTP_400_BAD_REQUEST)
        ContactReply.objects.create(contact=contact, text=text, from_operator=False,
                                    author=request.user if request.user.is_authenticated else None)
        return Response(_thread(contact), status=status.HTTP_201_CREATED)
