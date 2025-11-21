from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Book, Customer, Transaction
from datetime import date
from django.db.models import Q
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse 



# One-time setup to create admin user
def setup_admin(request):
    username = 'aashutosh'
    password = 'aashuttosh123'
    email = 'admin@example.com'
    
    if User.objects.filter(username=username).exists():
        return HttpResponse("✅ Admin user already exists! You can now login.")
    
    User.objects.create_superuser(username=username, email=email, password=password)
    return HttpResponse("✅ Admin user created successfully! Username: aashutosh, Password: aashuttosh123")


def admin_login(request):

    if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
        return redirect('dashboard')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:

            if user.is_staff or user.is_superuser:
                login(request, user)
                
                return redirect('dashboard')
            else:
                messages.error(request, "Access Denied: Students must use the Student Portal.")
                return redirect('admin_login')

        else:
            messages.error(request, "Invalid username or password.")
            return redirect('admin_login')

    return render(request, 'management/admin_login.html')

def admin_logout(request):
    logout(request)
    messages.info(request, "Admin logged out successfully.")
    return redirect('admin_login')



@login_required(login_url='admin_login')
def dashboard(request):
    books = Book.objects.all()
    customers = Customer.objects.all()
    transactions = Transaction.objects.all()

    total_books = 0
    for book in books:
        total_books = total_books + book.quantity

    total_customer = 0
    for customer in customers:
        total_customer = total_customer + 1

    total_transaction = 0
    for transaction in transactions:
        total_transaction = total_transaction + 1

    return render(request, "management/dashboard.html",{
        "book_count": total_books,
        "customer_count": total_customer,
        "transaction_count": total_transaction
    })



@login_required(login_url='admin_login')
def book(request):
    books_list = Book.objects.all()
    
    query = request.GET.get('q')
    
    if query:
        books_list = books_list.filter(
            Q(name__icontains=query) | 
            Q(author__icontains=query) |
            Q(genre__icontains=query)
        )

    return render(request, "management/booklist.html", {"books": books_list})

@login_required(login_url='admin_login')
def addbook(request):
    if request.method == "POST":
        name = request.POST.get("name")
        author = request.POST.get("author")
        genre = request.POST.get("genre")
        quantity = request.POST.get("quantity")

        book = Book(name=name, author=author, genre=genre, quantity=quantity)
        book.save()

        messages.success(request, "Book added successfully!")
        return redirect("addbook")
    
    return render(request, "management/addbook.html")

@login_required(login_url='admin_login')
def editbook(request, book_id):
    book = get_object_or_404(Book, book_id=book_id)
    if request.method == "POST":
        book.name = request.POST.get("name")
        book.author = request.POST.get("author")
        book.genre = request.POST.get("genre")
        book.quantity = request.POST.get("quantity")

        book.save()
        messages.success(request, "Book updated successfully!")
        return redirect("book")
    
    return render(request, 'management/editbook.html', {'book': book})

@login_required(login_url='admin_login')
def deletebook(request, book_id):
    book = get_object_or_404(Book, book_id=book_id)
    book.delete()
    messages.success(request, "Book deleted successfully!")
    return redirect("book")



@login_required(login_url='admin_login')
def customer(request):
    customers_list = Customer.objects.all()
    query = request.GET.get('q')
    
    if query:
        customers_list = customers_list.filter(
            Q(name__icontains=query) | 
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        )
    
    return render(request, "management/customerlist.html", {"customers": customers_list})

@login_required(login_url='admin_login')
def addcustomer(request):
    if request.method == 'POST':
        name = request.POST.get("name")
        address = request.POST.get("address")
        phone = request.POST.get("phone")
        email = request.POST.get("email")

        customer = Customer(name=name, address=address, phone=phone, email=email)
        customer.save()

        messages.success(request, "Customer added successfully!")
        return redirect("addcustomer")
    
    return render(request, "management/addcustomer.html")

@login_required(login_url='admin_login')
def editcustomer(request, customer_id):
    customer = get_object_or_404(Customer, customer_id=customer_id)
    if request.method == "POST":
        customer.name = request.POST.get("name")
        customer.address = request.POST.get("address")
        customer.phone = request.POST.get("phone")
        customer.email = request.POST.get("email")
        customer.save()
        messages.success(request, "Customer updated successfully!")
        return redirect("customer")
    return render(request, 'management/editcustomer.html', {'customer': customer})

@login_required(login_url='admin_login')
def deletecustomer(request, customer_id):
    customer = get_object_or_404(Customer, customer_id=customer_id)
    customer.delete()
    messages.success(request, "Customer deleted successfully!")
    return redirect("customer")



@login_required(login_url='admin_login')
def transaction(request):
    transactions_list = Transaction.objects.select_related('book', 'customer').all().order_by('-issue_date')

    query = request.GET.get('q')
    if query:
        transactions_list = transactions_list.filter(
            Q(customer__name__icontains=query) | 
            Q(book__name__icontains=query)
        )

    return render(request, "management/transaction.html", {
        "transactions": transactions_list,
    })

@login_required(login_url='admin_login')
def addtransaction(request):
    if request.method == "POST":
        book_id_val = request.POST.get("book")
        customer_id_val = request.POST.get("customer")
        issue_date = request.POST.get("issue_date")
        return_date = request.POST.get("return_date") or None

        book = get_object_or_404(Book, book_id=book_id_val)
        customer = get_object_or_404(Customer, customer_id=customer_id_val)

        if book.quantity <= 0:
            messages.error(request, f"'{book.name}' is out of stock!")
        else:
            Transaction.objects.create(
                book=book, 
                customer=customer, 
                issue_date=issue_date, 
                return_date=return_date
            )
            book.quantity -= 1
            book.save()
            messages.success(request, "Transaction added successfully!")
        
        return redirect("addtransaction")

    books = Book.objects.all()
    customers = Customer.objects.all()
    
    return render(request, "management/addtransaction.html", {
        "books": books,
        "customers": customers,
        "today": date.today()
    })

@login_required(login_url='admin_login')
def return_transaction(request, transaction_id):
    t = get_object_or_404(Transaction, id=transaction_id)
    
    if not t.returned:
        t.returned = True
        t.return_date = date.today()
        t.save()


        t.book.quantity += 1
        t.book.save()
        messages.success(request, f"Book '{t.book.name}' returned!")
    else:
        messages.warning(request, "This book was already returned.")

    return redirect("transaction")

@login_required(login_url='admin_login')
def delete_transaction(request, transaction_id):
    t = get_object_or_404(Transaction, id=transaction_id)
    
    if not t.returned:
        t.book.quantity += 1
        t.book.save()
        messages.warning(request, "Active transaction deleted. Stock restored.")
    
    t.delete()
    messages.success(request, "Transaction deleted!")
    
    return redirect("transaction")