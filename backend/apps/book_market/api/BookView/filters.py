import django_filters
from apps.book_market.models import Book


class BookFilter(django_filters.FilterSet):
    year = django_filters.NumberFilter(field_name="year", label="Year")

    class Meta:
        model = Book
        fields = ["year"]