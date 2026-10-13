from rest_framework import serializers
from apps.book_market.models import Book, BookOption


class BookOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookOption
        fields = ['id', 'book_type', 'price', ]


class BookListSerializer(serializers.ModelSerializer):
    options = BookOptionSerializer(many=True, read_only=True)
    class Meta:
        model = Book
        fields = ['id', 'name_uz', 'name_ru', 'name_cry', 'year', 'base_file', 'image_url', 'options']



class BookDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'name_uz', 'name_ru', 'name_cry', 'image_url', 'base_file', 'description', 'created_at', 'updated_at']



class ElectronBookListSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'name_uz', 'name_ru', 'name_cry', 'image_url']


    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image_url and request:
            return request.build_absolute_uri(obj.image_url.url)
        return None