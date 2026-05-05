# =============================================================================
# CLINIC APPOINTMENT OPS MANAGER - MASSIVE SEED DATA SCRIPT (50+ Appts)
# =============================================================================
# HOW TO RUN:
#   python manage.py shell --command="exec(open('seed_data.py', encoding='utf-8').read())"
# =============================================================================

import random
from datetime import date, time, timedelta
from users.models import User, Doctor, Patient
from appointments.models import Appointment

print("Starting massive seed data generation...")

# -- 1. CLEANUP ALL EXISTING USERS EXCEPT SUPERUSER ----------------------------
# To ensure a clean slate and avoid unique constraint errors, we delete non-superusers.
User.objects.filter(is_superuser=False).delete()
print("Cleared old demo users.")

# =============================================================================
# 2. CREATE USERS & PROFILES
# =============================================================================
def create_user(username, email, first, last, role, password):
    user = User.objects.create(username=username, email=email, first_name=first, last_name=last, role=role)
    user.set_password(password)
    user.save()
    return user

# -- RECEPTIONISTS --
rec1 = create_user('receptionist_riya', 'riya@clinic.com', 'Riya', 'Patel', 'RECEPTIONIST', 'Recept@1234')
rec2 = create_user('receptionist_vikas', 'vikas@clinic.com', 'Vikas', 'Singh', 'RECEPTIONIST', 'Recept@1234')

# -- DOCTORS --
doctors_info = [
    ('dr_sharma', 'Rajesh', 'Sharma', 'Cardiologist', 800.00, 20),
    ('dr_khan', 'Aisha', 'Khan', 'Dentist', 500.00, 15),
    ('dr_gupta', 'Sanjay', 'Gupta', 'Orthopedic', 1000.00, 30),
    ('dr_iyer', 'Meera', 'Iyer', 'Dermatologist', 700.00, 15), # Will leave this one mostly empty
    ('dr_reddy', 'Vikram', 'Reddy', 'Pediatrician', 600.00, 20),
]

doctor_objects = {}
for u, f, l, spec, fee, t in doctors_info:
    user = create_user(u, f"{u}@clinic.com", f, l, 'DOCTOR', 'Doctor@1234')
    doc = Doctor.objects.create(user=user, specialization=spec, consultation_fee=fee, avg_consultation_time=t, is_available=True)
    doctor_objects[u] = doc

# -- PATIENTS --
# 5 Main named patients for easy login
patients_info = [
    ('patient_rahul', 'Rahul', 'Verma', 'MALE'),
    ('patient_priya', 'Priya', 'Mehta', 'FEMALE'),
    ('patient_amit', 'Amit', 'Singh', 'MALE'),
    ('patient_neha', 'Neha', 'Gupta', 'FEMALE'),
    ('patient_rohan', 'Rohan', 'Das', 'MALE'),
]
# Add 15 extra dummy patients
first_names = ["Karan", "Pooja", "Vikram", "Sneha", "Arjun", "Anjali", "Ravi", "Kavita", "Suresh", "Divya", "Manoj", "Geeta", "Tariq", "Fatima", "Deepak"]
last_names = ["Kumar", "Sharma", "Verma", "Reddy", "Patil", "Deshmukh", "Chopra", "Joshi", "Yadav", "Nair", "Iyer", "Das", "Ali", "Bano", "Mishra"]

for i in range(15):
    patients_info.append((f'patient_demo{i+1}', first_names[i], last_names[i], 'MALE' if i%2==0 else 'FEMALE'))

patient_objects = []
for u, f, l, gender in patients_info:
    user = create_user(u, f"{u}@gmail.com", f, l, 'PATIENT', 'Patient@1234')
    age = random.randint(18, 65)
    contact = f"98765{random.randint(10000,99999)}"
    pat = Patient.objects.create(user=user, age=age, contact=contact, gender=gender, profile_completed=True)
    patient_objects.append(pat)

print(f"Created 2 Receptionists, {len(doctor_objects)} Doctors, and {len(patient_objects)} Patients.")

# =============================================================================
# 3. CREATE APPOINTMENTS (Target ~50 total)
# =============================================================================
today = date.today()
yesterday = today - timedelta(days=1)
tomorrow = today + timedelta(days=1)

def time_add(t, mins):
    dt = timedelta(hours=t.hour, minutes=t.minute) + timedelta(minutes=mins)
    hours, remainder = divmod(dt.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return time(hours, minutes)

appointments_created = 0

# A helper to create a block of appointments for a doctor on a specific date
def create_block(doctor_key, target_date, start_time_hr, num_appts, statuses, is_past=False):
    global appointments_created
    doc = doctor_objects[doctor_key]
    current_time = time(start_time_hr, 0)
    
    for i in range(num_appts):
        pat = random.choice(patient_objects)
        status = statuses[i % len(statuses)]
        if is_past:
            status = random.choice(['COMPLETED', 'CANCELLED'])
            
        fee = doc.consultation_fee
        
        appt = Appointment.objects.create(
            doctor=doc,
            patient=pat,
            date=target_date,
            time=current_time,
            token_number=i+1,
            estimated_wait_time=0 if status in ['COMPLETED','CANCELLED','IN_PROGRESS'] else (i * doc.avg_consultation_time),
            status=status,
            reason=f"Demo reason {appointments_created}",
            appointment_type=random.choice(['NORMAL', 'FOLLOWUP']),
            fee=fee,
        )
        
        # Add vitals/prescriptions for completed or in-progress
        if status in ['COMPLETED', 'IN_PROGRESS']:
            appt.bp = f"{random.randint(110,140)}/{random.randint(70,90)}"
            appt.heart_rate = random.randint(65, 95)
            appt.save()
            
        if status == 'COMPLETED':
            appt.prescription = "Paracetamol 500mg - 1 tab SOS"
            appt.doctor_remark = "Patient recovering well."
            appt.save()
            
        current_time = time_add(current_time, doc.avg_consultation_time)
        appointments_created += 1


# --- TODAY'S APPOINTMENTS (Heavy load to show active queue) ---
# Dr Sharma: 15 appts (Heavy queue)
create_block('dr_sharma', today, 9, 15, ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'ARRIVED', 'ARRIVED', 'ARRIVED'] + ['BOOKED']*9)

# Dr Khan: 12 appts
create_block('dr_khan', today, 10, 12, ['COMPLETED', 'IN_PROGRESS', 'ARRIVED', 'ARRIVED'] + ['BOOKED']*8)

# Dr Gupta: 8 appts
create_block('dr_gupta', today, 11, 8, ['ARRIVED', 'BOOKED', 'BOOKED', 'BOOKED', 'BOOKED', 'BOOKED', 'BOOKED', 'BOOKED'])

# Dr Reddy: 5 appts
create_block('dr_reddy', today, 14, 5, ['BOOKED', 'BOOKED', 'BOOKED', 'BOOKED', 'BOOKED'])

# Dr Iyer (Dermatologist): 0 appts! Leaves empty slots for demo purposes.
# (Intentionally skipping dr_iyer for today)

# --- YESTERDAY'S APPOINTMENTS (History) ---
create_block('dr_sharma', yesterday, 9, 5, ['COMPLETED'], is_past=True)
create_block('dr_iyer', yesterday, 10, 3, ['COMPLETED'], is_past=True) # Has some past history

# --- TOMORROW'S APPOINTMENTS (Upcoming) ---
create_block('dr_khan', tomorrow, 10, 4, ['BOOKED'])
create_block('dr_gupta', tomorrow, 9, 3, ['BOOKED'])

print(f"Created {appointments_created} total appointments.")

# =============================================================================
# SUMMARY
# =============================================================================
print()
print("=" * 60)
print("  MASSIVE SEED DATA COMPLETE! (50+ Appts)")
print("=" * 60)
print()
print("  LOGIN CREDENTIALS (Password is 'Role@1234' for all)")
print("-" * 60)
print("  ADMIN        | admin_user          | Admin@1234")
print("  RECEPTIONIST | receptionist_riya   | Recept@1234")
print("  RECEPTIONIST | receptionist_vikas  | Recept@1234")
print("-" * 60)
print("  DOCTOR (Cardio)  | dr_sharma       | Doctor@1234  (15 appts today)")
print("  DOCTOR (Dentist) | dr_khan         | Doctor@1234  (12 appts today)")
print("  DOCTOR (Ortho)   | dr_gupta        | Doctor@1234  (8 appts today)")
print("  DOCTOR (Pedia)   | dr_reddy        | Doctor@1234  (5 appts today)")
print("  DOCTOR (Derma)   | dr_iyer         | Doctor@1234  (0 appts today - SHOW EMPTY SLOTS)")
print("-" * 60)
print("  PATIENT      | patient_rahul       | Patient@1234")
print("  PATIENT      | patient_priya       | Patient@1234")
print("  ...plus 18 other patients (patient_amit, patient_demo1...)")
print("-" * 60)
print()
print("  APPOINTMENTS CREATED")
print(f"  Total     : {appointments_created}")
print(f"  Today     : 40 (Heavy load for live demo)")
print(f"  Yesterday : 8  (History & Cancelled)")
print(f"  Tomorrow  : 7  (Upcoming)")
print("=" * 60)
