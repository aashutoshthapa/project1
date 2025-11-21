from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('management/', include("management.urls")),
    path('customer/', include("customers.urls")),
]
