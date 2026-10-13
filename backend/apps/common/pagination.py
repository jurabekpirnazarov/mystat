import math
from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination
from rest_framework.response import Response


class CustomLimitOffsetPagination(LimitOffsetPagination):
    """
    Custom LimitOffsetPagination that includes page_count in the response.
    """

    default_limit = 10
    limit_query_param = "limit"
    offset_query_param = "offset"
    max_limit = 100

    def get_paginated_response(self, data):
        page_count = math.ceil(self.count / self.limit) if self.count > 0 else 0

        return Response(
            OrderedDict(
                [
                    ("count", self.count),
                    ("page_count", page_count),
                    ("next", self.get_next_link()),
                    ("previous", self.get_previous_link()),
                    ("results", data),
                ]
            )
        )


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom PageNumberPagination that includes page_count and current_page in the response.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data):
        page_count = self.page.paginator.num_pages
        current_page = self.page.number

        return Response(
            OrderedDict(
                [
                    ("count", self.page.paginator.count),
                    ("page_count", page_count),
                    ("current_page", current_page),
                    ("next", self.get_next_link()),
                    ("previous", self.get_previous_link()),
                    ("results", data),
                ]
            )
        )
