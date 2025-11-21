#!/usr/bin/env python
"""
Script to create a superuser for the Django app.
Run this locally or on the server to create an admin account.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create superuser
username = 'aashutosh'
password = 'aashuttosh123'
email = 'admin@example.com'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"✅ Superuser '{username}' created successfully!")
else:
    print(f"⚠️  User '{username}' already exists.")
