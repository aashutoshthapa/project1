from django.contrib import admin
from django.urls import path, include
from management.views import home


urlpatterns = [
    path('', home, name='home'),  # Landing page
    path('admin/', admin.site.urls),
    path('management/', include("management.urls")),
    path('customer/', include("customers.urls")),
]
