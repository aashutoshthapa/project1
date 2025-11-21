from django.contrib import admin
from .models import Book, Customer, Transaction
# Register your models here.
admin.site.register(Book)
admin.site.register(Customer)
admin.site.register(Transaction)