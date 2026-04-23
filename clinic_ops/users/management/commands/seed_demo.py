import os
import random
from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Doctor, Patient
from appointments.models import Appointment

class Command(BaseCommand):
    help = 'Seed the database with a large demo dataset for a realistic clinic simulation'

    def handle(self, *args, **options):
        User = get_user_model()
        self.stdout.write("Starting large-scale demo data generation...")

        # -- CLEANUP -------------------------------------------------------------------
        Appointment.objects.all().delete()
        Doctor.objects.all().delete()
        Patient.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        self.stdout.write(self.style.WARNING("Cleared existing non-admin data."))

        # 1. CREATE ROLES & MAIN ADMIN
        admin_pass = 'Admin@1234'
        if not User.objects.filter(username='admin_user').exists():
            admin = User.objects.create(username='admin_user', email='admin@clinic.com', role='ADMIN')
            admin.set_password(admin_pass)
            admin.save()
            self.stdout.write(f"Admin created: admin_user / {admin_pass}")

        # 2. CREATE RECEPTIONIST
        rec_user = User.objects.create(username='receptionist_riya', first_name='Riya', last_name='Patel', role='RECEPTIONIST')
        rec_user.set_password('Recept@1234')
        rec_user.save()
        self.stdout.write(f"Receptionist created: receptionist_riya / Recept@1234")

        # 3. CREATE DOCTORS (15 Doctors)
        doc_specialties = ['Cardiology', 'Dentistry', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'ENT', 'Gynecology', 'Ophthalmology']
        doc_names = [
            ('Rajesh', 'Sharma'), ('Aisha', 'Khan'), ('Suresh', 'Iyer'), ('Priya', 'Mehta'),
            ('Amit', 'Verma'), ('Sneha', 'Reddy'), ('Vikram', 'Singh'), ('Anjali', 'Gupta'),
            ('Manoj', 'Joshi'), ('Kavita', 'Nair'), ('Rohan', 'Das'), ('Meera', 'Kapoor'),
            ('Sanjay', 'Malhotra'), ('Neha', 'Bose'), ('Arjun', 'Patel')
        ]
        
        doctors = []
        for i, (fn, ln) in enumerate(doc_names):
            uname = f"dr_{ln.lower()}_{i+1}"
            user = User.objects.create(username=uname, first_name=fn, last_name=ln, role='DOCTOR')
            user.set_password('Doctor@1234')
            user.save()
            
            doctor = Doctor.objects.create(
                user=user,
                specialization=random.choice(doc_specialties),
                consultation_fee=random.choice([300, 500, 800, 1200]),
                avg_consultation_time=random.choice([15, 20, 30]),
                is_available=True
            )
            doctors.append(doctor)
        self.stdout.write(f"Created 15 Doctors. Password: Doctor@1234")

        # 4. CREATE PATIENTS (60 Patients)
        patient_names = ['Rahul', 'Pooja', 'Deepak', 'Sonia', 'Alok', 'Ritu', 'Karan', 'Simran', 'Abhishek', 'Tanvi']
        patients = []
        for i in range(60):
            fn = random.choice(patient_names)
            uname = f"patient_{i+1}"
            user = User.objects.create(username=uname, first_name=fn, role='PATIENT')
            user.set_password('Patient@1234')
            user.save()
            
            patient = Patient.objects.create(
                user=user, age=random.randint(5, 75),
                contact=f"9{random.randint(100000000, 999999999)}",
                gender=random.choice(['MALE', 'FEMALE']),
                profile_completed=True
            )
            patients.append(patient)
        self.stdout.write(f"Created 60 Patients. Password: Patient@1234")

        # 5. CREATE APPOINTMENTS
        today = date.today()
        tomorrow = today + timedelta(days=1)
        appt_count = 0
        for d in [today, tomorrow]:
            for doc in doctors:
                num_appts = random.randint(4, 8)
                random_patients = random.sample(patients, num_appts)
                for idx, pat in enumerate(random_patients):
                    Appointment.objects.create(
                        doctor=doc, patient=pat, date=d,
                        time=time(9 + (idx // 2), 0 if idx % 2 == 0 else 30),
                        token_number=idx + 1,
                        estimated_wait_time=idx * doc.avg_consultation_time,
                        status='BOOKED', reason='Routine Checkup',
                        fee=doc.consultation_fee
                    )
                    appt_count += 1
        
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {appt_count} appointments!"))
