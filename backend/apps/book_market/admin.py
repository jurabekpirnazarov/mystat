from django.contrib import admin
from .models import Book, OrderBook, OrderItem, PostalLocation, BookOption

# Register your models here.


class BookOptionInline(admin.TabularInline):
    model = BookOption
    extra = 1
    fields = ('book_type', 'price')
    show_change_link = True

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('name_uz', 'year')
    list_filter = ('year',)
    inlines = [BookOptionInline]


@admin.register(BookOption)
class BookOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'book', 'book_type', 'price')

@admin.register(PostalLocation)
class PostalLocationAdmin(admin.ModelAdmin):
    list_display = ('index', 'name', 'lat', 'lng')
    search_fields = ('name', 'index')



class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(OrderBook)
class OrderBookAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline]
    list_display = ('id', 'user', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')

