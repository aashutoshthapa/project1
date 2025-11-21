from django.db import models
from django.utils import timezone



class Book(models.Model):
    book_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    genre = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=0)

    def __str__(self):
        return self.name
    

class Customer(models.Model):
    customer_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=200)
    phone = models.CharField(max_length=100, blank=True, unique=True)
    email = models.EmailField(default="")

    def __str__(self):
        return self.name
    
class Transaction(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    issue_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    returned = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.customer.name} - {self.book.name}"
    
    @property
    def due_status(self):
        """
        Calculates how many days late a book is.
        Returns a formatted string like "5 days late" or an empty string if not late.
        """
        today = timezone.now().date()

       
        if self.returned is False and self.return_date and self.return_date < today:
            
            
            dl  = today - self.return_date
            days_late = dl.days
            
           
            return f"{days_late} days late"
        
        return ""