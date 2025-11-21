from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
# Import Transaction model from your management app to show history
from management.models import Transaction

def customer_signup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Basic Validation
        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return redirect('customer_signup')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, "This email is already registered.")
            return redirect('customer_signup')

        # Create the User
        try:
            # We ONLY create a Django User here. We don't touch the management.Customer table.
            user = User.objects.create_user(username=username, email=email, password=password)
            
            # Log them in immediately
            login(request, user)
            messages.success(request, "Account created! Welcome.")
            return redirect('customer_dashboard')
        except Exception as e:
            messages.error(request, f"Error creating account: {e}")
            return redirect('customer_signup')

    return render(request, 'customers/signup.html')

def customer_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {username}!")
            return redirect('customer_dashboard')
        else:
            messages.error(request, "Invalid username or password.")
            return redirect('customer_login')

    return render(request, 'customers/login.html')

def customer_logout(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('customer_login')

@login_required(login_url='customer_login')
def customer_dashboard(request):
    # 1. Get the logged-in user's email
    user_email = request.user.email

    # 2. SEARCH Logic: Find transactions where the Library Customer's email matches this User's email
    my_transactions = Transaction.objects.filter(
        customer__email=user_email
    ).select_related('book').order_by('-issue_date')

    return render(request, 'customers/dashboard.html', {
        'transactions': my_transactions
    })