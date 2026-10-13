from typing import Optional
import requests
from requests.adapters import HTTPAdapter, Retry
from django.conf import settings

BASE_URL = settings.REGISTER_BASE_URL
X_DEVICE_ID = settings.X_DEVICE_ID

class ServiceError(Exception):
    """General service error."""
    pass

class ServiceNotFound(ServiceError):
    """STIR topilmadi (404 yoki qidiruv natija yo'q)."""
    pass


class RegisterService:
    def __init__(self, timeout: int = 10):
        self.base_url = BASE_URL
        self.x_device_id = X_DEVICE_ID
        self.timeout = timeout

        if not self.base_url:
            raise ValueError("Register API topilmadi")

        self.session = requests.Session()

        retries = Retry(total=2, backoff_factor=0.3, status_forcelist=(500,502,503,504))

        self.session.mount("https://", HTTPAdapter(max_retries=retries))
        self.session.mount("http://", HTTPAdapter(max_retries=retries))

    def _build_headers(self) -> dict:
        headers = {"Accept": "application/json"}
        device_id = self.x_device_id

        if device_id:
            headers["x-device-id"] = device_id
        return headers

    def get_organization_detail(self, stir_number: int) -> dict:
        url = f"{self.base_url}/detail/{stir_number}"

        try:
            resp = self.session.get(url, headers=self._build_headers(), timeout=self.timeout)

        except requests.RequestException as e:
            raise ServiceError(f"Network error: {e}") from e

        if resp.status_code == 200:
            try:
                return resp.json()
            except ValueError as e:
                raise ServiceError("Invalid JSON response from STIR provider") from e

        if resp.status_code == 404:
            raise ServiceNotFound(f"Ushbu STIR bo'yicha tashkilot topilmadi")
        raise ServiceError(f"STIR API error: status={resp.status_code}, body={resp.text}")

    def get_classify_item_list(self, stat_classifier__type: str, code: int):
        url = f"{self.base_url}/ClassifyItemList/"
        params = {
            "stat_classifier__type": stat_classifier__type,
            "code": code
        }
        try:
            resp = self.session.get(url, headers=self._build_headers(), params=params, timeout=self.timeout)

        except requests.RequestException as e:
            raise ServiceError(f"Network error: {e}") from e

        if resp.status_code == 200:
            try:
                return resp.json()
            except ValueError as e:
                raise ServiceError("Invalid JSON response from Server") from e

        if resp.status_code == 404:
            raise ServiceNotFound(f"List item not found (404)")
        raise ServiceError(f"STIR API error: status={resp.status_code}, body={resp.text}")

