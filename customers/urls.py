from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.customer_signup, name='customer_signup'),
    path('login/', views.customer_login, name='customer_login'),
    path('logout/', views.customer_logout, name='customer_logout'),
    path('', views.customer_dashboard, name='customer_dashboard'),
]