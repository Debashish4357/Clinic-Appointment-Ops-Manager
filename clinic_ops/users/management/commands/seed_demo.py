import os
from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Doctor, Patient
from appointments.models import Appointment

class Command(BaseCommand):
    help = 'Seed the database with demo data for doctors, patients, and appointments'

    def handle(self, *args, **options):
        User = get_user_model()
        self.stdout.write("Starting demo data generation...")

        # -- CLEANUP -------------------------------------------------------------------
        demo_usernames = [
            'admin_user', 'dr_sharma', 'dr_khan',
            'patient_rahul', 'patient_priya', 'receptionist_riya'
        ]
        User.objects.filter(username__in=demo_usernames).delete()
        self.stdout.write(self.style.WARNING("Cleared old demo users (if any)."))

        # 1. CREATE USERS
        admin = User.objects.create(username='admin_user', email='admin@clinic.com', role='ADMIN')
        admin.set_password('Admin@1234')
        admin.save()

        doc1_user = User.objects.create(username='dr_sharma', email='sharma@clinic.com', first_name='Rajesh', last_name='Sharma', role='DOCTOR')
        doc1_user.set_password('Doctor@1234')
        doc1_user.save()

        doc2_user = User.objects.create(username='dr_khan', email='khan@clinic.com', first_name='Aisha', last_name='Khan', role='DOCTOR')
        doc2_user.set_password('Doctor@1234')
        doc2_user.save()

        pat1_user = User.objects.create(username='patient_rahul', email='rahul@gmail.com', first_name='Rahul', last_name='Verma', role='PATIENT')
        pat1_user.set_password('Patient@1234')
        pat1_user.save()

        pat2_user = User.objects.create(username='patient_priya', email='priya@gmail.com', first_name='Priya', last_name='Mehta', role='PATIENT')
        pat2_user.set_password('Patient@1234')
        pat2_user.save()

        rec_user = User.objects.create(username='receptionist_riya', email='riya@clinic.com', first_name='Riya', last_name='Patel', role='RECEPTIONIST')
        rec_user.set_password('Recept@1234')
        rec_user.save()

        # 2. CREATE PROFILES
        doctor1 = Doctor.objects.create(user=doc1_user, specialization='Cardiologist', consultation_fee=800.00, avg_consultation_time=20)
        doctor2 = Doctor.objects.create(user=doc2_user, specialization='Dentist', consultation_fee=500.00, avg_consultation_time=15)
        
        patient1 = Patient.objects.create(user=pat1_user, age=32, contact='9876543210', gender='MALE', medical_history='Hypertension', profile_completed=True)
        patient2 = Patient.objects.create(user=pat2_user, age=27, contact='9123456789', gender='FEMALE', medical_history='None', profile_completed=True)

        # 3. CREATE APPOINTMENTS
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        appointments_data = [
            {'doctor': doctor1, 'patient': patient1, 'date': today, 'time': time(9, 0), 'token_number': 1, 'estimated_wait_time': 0, 'status': 'BOOKED', 'reason': 'Chest pain', 'fee': 800.00},
            {'doctor': doctor1, 'patient': patient2, 'date': today, 'time': time(9, 20), 'token_number': 2, 'estimated_wait_time': 20, 'status': 'ARRIVED', 'reason': 'Follow-up', 'fee': 800.00},
            {'doctor': doctor2, 'patient': patient1, 'date': today, 'time': time(10, 0), 'token_number': 1, 'estimated_wait_time': 0, 'status': 'BOOKED', 'reason': 'Dental checkup', 'fee': 500.00},
            {'doctor': doctor1, 'patient': patient2, 'date': yesterday, 'time': time(11, 0), 'token_number': 1, 'estimated_wait_time': 0, 'status': 'COMPLETED', 'reason': 'Routine heart checkup', 'fee': 800.00, 'advice': 'Low salt diet.'},
            {'doctor': doctor1, 'patient': patient1, 'date': tomorrow, 'time': time(9, 0), 'token_number': 1, 'estimated_wait_time': 0, 'status': 'BOOKED', 'reason': 'Post-medication review', 'fee': 800.00},
        ]

        for appt_data in appointments_data:
            Appointment.objects.create(**appt_data)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded demo data with {len(appointments_data)} appointments!"))
