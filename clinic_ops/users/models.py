from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        DOCTOR = 'DOCTOR', 'Doctor'
        RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'
        PATIENT = 'PATIENT', 'Patient'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100, blank=True)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    avg_consultation_time = models.PositiveIntegerField(default=15, help_text='Average consultation time in minutes')

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    age = models.PositiveIntegerField(null=True, blank=True)
    contact = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    medical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    current_medication = models.TextField(blank=True)
    profile_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.user.get_full_name() or self.user.username
