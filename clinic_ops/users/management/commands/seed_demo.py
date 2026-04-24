import os
import random
from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Doctor, Patient
from appointments.models import Appointment

class Command(BaseCommand):
    help = 'Seed the database with a massive 7-day demo dataset for a realistic clinic simulation'

    def handle(self, *args, **options):
        User = get_user_model()
        self.stdout.write("Starting massive 7-day demo data generation...")

        # -- CLEANUP -------------------------------------------------------------------
        Appointment.objects.all().delete()
        Doctor.objects.all().delete()
        Patient.objects.all().delete()
        User.objects.exclude(is_superuser=True).exclude(role='ADMIN').delete()
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

        # 3. CREATE DOCTORS (20 Doctors)
        doc_specialties = [
            'Cardiology', 'Dentistry', 'Dermatology', 'Neurology', 'Pediatrics',
            'Orthopedics', 'General Medicine', 'ENT', 'Gynecology', 'Ophthalmology',
            'Psychiatry', 'Oncology', 'Urology', 'Radiology', 'Pathology'
        ]
        doc_names = [
            ('Rajesh', 'Sharma'), ('Aisha', 'Khan'), ('Suresh', 'Iyer'), ('Priya', 'Mehta'),
            ('Amit', 'Verma'), ('Sneha', 'Reddy'), ('Vikram', 'Singh'), ('Anjali', 'Gupta'),
            ('Manoj', 'Joshi'), ('Kavita', 'Nair'), ('Rohan', 'Das'), ('Meera', 'Kapoor'),
            ('Sanjay', 'Malhotra'), ('Neha', 'Bose'), ('Arjun', 'Patel'), ('Deepa', 'Rao'),
            ('Vijay', 'Kumar'), ('Shanti', 'Puri'), ('Kiran', 'Desai'), ('Lata', 'Mangesh')
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
                consultation_fee=random.choice([300, 500, 800, 1000, 1500]),
                avg_consultation_time=random.choice([15, 20, 30]),
                is_available=True
            )
            doctors.append(doctor)
        self.stdout.write(f"Created 20 Doctors. Password: Doctor@1234")

        # 4. CREATE PATIENTS (100 Patients)
        patient_first_names = ['Rahul', 'Pooja', 'Deepak', 'Sonia', 'Alok', 'Ritu', 'Karan', 'Simran', 'Abhishek', 'Tanvi', 'Vikas', 'Nisha', 'Sunil', 'Preeti']
        patient_last_names = ['Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Chawla', 'Bansal', 'Pandey', 'Mishra', 'Yadav', 'Joshi', 'Patel']
        
        patients = []
        for i in range(100):
            fn = random.choice(patient_first_names)
            ln = random.choice(patient_last_names)
            uname = f"patient_{i+1}"
            user = User.objects.create(username=uname, first_name=fn, last_name=ln, role='PATIENT')
            user.set_password('Patient@1234')
            user.save()
            
            patient = Patient.objects.create(
                user=user,
                age=random.randint(5, 80),
                contact=f"9{random.randint(100000000, 999999999)}",
                gender=random.choice(['MALE', 'FEMALE', 'OTHER']),
                blood_group=random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-']),
                profile_completed=True
            )
            patients.append(patient)
        self.stdout.write(f"Created 100 Patients. Password: Patient@1234")

        # 5. CREATE APPOINTMENTS (Filling slots for 7 Days)
        # From Yesterday to 5 Days from now
        today = date.today()
        appt_count = 0
        
        for day_offset in range(-1, 6):
            target_date = today + timedelta(days=day_offset)
            
            for doc in doctors:
                # Randomize number of appointments per doctor per day
                if day_offset < 0: # Past
                    num_appts = random.randint(10, 15)
                    status_options = ['COMPLETED']
                elif day_offset == 0: # Today
                    num_appts = random.randint(8, 12)
                    status_options = ['ARRIVED', 'BOOKED', 'IN_PROGRESS', 'COMPLETED']
                else: # Future
                    num_appts = random.randint(5, 10)
                    status_options = ['BOOKED']
                
                random_patients = random.sample(patients, min(num_appts, len(patients)))
                
                for idx, pat in enumerate(random_patients):
                    hour = 9 + (idx // 2)
                    minute = 0 if idx % 2 == 0 else 30
                    
                    if hour >= 18: continue # Clinic closes at 6 PM
                    
                    Appointment.objects.create(
                        doctor=doc,
                        patient=pat,
                        date=target_date,
                        time=time(hour, minute),
                        token_number=idx + 1,
                        estimated_wait_time=idx * doc.avg_consultation_time,
                        status=random.choice(status_options),
                        reason=random.choice(['Routine Checkup', 'Fever', 'Consultation', 'Follow-up', 'Pain Management']),
                        fee=doc.consultation_fee
                    )
                    appt_count += 1
        
        self.stdout.write(self.style.SUCCESS(f"Massive seeding complete! Created {appt_count} appointments across 7 days."))
        self.stdout.write("\nDEMO ACCESS:")
        self.stdout.write(f"  ADMIN:  admin_user / Admin@1234")
        self.stdout.write(f"  RECEPTIONIST: receptionist_riya / Recept@1234")
        self.stdout.write(f"  DOCTOR: {doctors[0].user.username} / Doctor@1234")
        self.stdout.write(f"  PATIENT: {patients[0].user.username} / Patient@1234")
