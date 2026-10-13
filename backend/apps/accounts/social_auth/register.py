from django.contrib.auth import authenticate
from ..models import User
import os
import random
from rest_framework.exceptions import AuthenticationFailed


def register_social_user(provider, first_name, email, last_name):
    filtered_user_by_email = User.objects.filter(email=email)
    if filtered_user_by_email.exists():
        return {
                "email": filtered_user_by_email[0].email,
                "tokens": filtered_user_by_email[0].tokens,
                "first_name": first_name,
                "last_name": last_name,
        }

    else:
        user = {"email": email, "first_name": first_name, "last_name": last_name}
        user = User.objects.create_user(**user)
        user.is_active = True
        user.auth_provider = provider
        user.save()
        return {
            "email": user.email,
            "tokens": user.tokens,
            "first_name": first_name,
            "last_name": last_name,
        }

