import requests
import json
import os
from .register import register_social_user


class Google:
    def __init__(self) -> None:
        self.user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        self.access_token_url = "https://oauth2.googleapis.com/token"
        self.google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        self.google_client_secret = os.environ.get("GOOGLE_SECRET_KEY")
        # self.redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
        self.redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")

    def get_access_token(self, code):
        url = self.access_token_url

        data = {
            "code": code,
            "client_id": self.google_client_id,
            "client_secret": self.google_client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        response = requests.post(url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data
        raise Exception("Could not get token, maybe code is wrong or expired ")

    def get_user_info(self, access_token):
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(self.user_info_url, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            return user_data
        raise Exception("Could not fetch user data")

    def validate(self, code):
        access_token = self.get_access_token(code)
        user_data = self.get_user_info(access_token["access_token"])
        return user_data


class Facebook:
    def __init__(self) -> None:
        self.user_info_url = "https://graph.facebook.com/me"
        self.access_token_url = "https://graph.facebook.com/v11.0/oauth/access_token"
        self.facebook_client_id = os.environ.get("FACEBOOK_CLIENT_ID")
        self.facebook_client_secret = os.environ.get("FACEBOOK_SECRET_KEY")
        self.redirect_uri = os.environ.get("FACEBOOK_REDIRECT_URI")

    def get_access_token(self, code):
        url = self.access_token_url

        data = {
            "code": code,
            "client_id": self.facebook_client_id,
            "client_secret": self.facebook_client_secret,
            "redirect_uri": self.redirect_uri,
        }

        response = requests.get(url, params=data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data
        raise Exception("Could not get token, maybe code is wrong or expired ")

    def get_user_info(self, access_token):
        url = self.user_info_url
        params = {
            "access_token": access_token,
            "fields": "id,name,email,first_name,last_name",
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            user_data = response.json()
            return user_data
        raise Exception("Could not fetch user data")

    def validate(self, code):
        access_token = self.get_access_token(code)
        user_data = self.get_user_info(access_token["access_token"])
        return user_data

class Apple:
    def __init__(self) -> None:
        self.user_info_url = "https://appleid.apple.com/auth/token"
        self.apple_client_id = os.environ.get("APPLE_CLIENT_ID")
        self.apple_client_secret = os.environ.get("APPLE_SECRET_KEY")
        self.redirect_uri = os.environ.get("APPLE_REDIRECT_URI")

    def get_access_token(self, code):
        url = self.user_info_url

        data = {
            "code": code,
            "client_id": self.apple_client_id,
            "client_secret": self.apple_client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        response = requests.post(url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data
        raise Exception("Could not get token, maybe code is wrong or expired ")

    def get_user_info(self, access_token):
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(self.user_info_url, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            return user_data
        raise Exception("Could not fetch user data")

    def validate(self, code):
        access_token = self.get_access_token(code)
        user_data = self.get_user_info(access_token["access_token"])
        return user_data