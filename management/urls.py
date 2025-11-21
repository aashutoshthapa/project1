from django.urls import path
from management import views

urlpatterns = [

    path('', views.admin_login, name='admin_login'),
    path('logout/', views.admin_logout, name='admin_logout'),

    path('dashboard/', views.dashboard, name='dashboard'),
    path('books/', views.book, name='book'),
    path('customers/', views.customer, name='customer'),
    path('transaction/', views.transaction, name='transaction'),
    path('addtransaction/', views.addtransaction, name='addtransaction'),

    # Add book and customers
    path('addbook/', views.addbook, name='addbook'),
    path('addcustomer/', views.addcustomer, name='addcustomer'),
    
    # Edit/Delte book and customers
    path('editbook/<int:book_id>/', views.editbook, name='editbook'),
    path('editcustomer/<int:customer_id>/', views.editcustomer, name='editcustomer'),

   
    path('deletebook/<int:book_id>/', views.deletebook, name='deletebook'), 
    path('deletecustomer/<int:customer_id>/', views.deletecustomer, name='deletecustomer'),

    # transaction return and delete
    path('return_transaction/<int:transaction_id>/', views.return_transaction, name='return_transaction'),
    path('delete_transaction/<int:transaction_id>/', views.delete_transaction, name='delete_transaction'),
]