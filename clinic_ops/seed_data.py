# =============================================================================
# CLINIC APPOINTMENT OPS MANAGER - SEED / DEMO DATA SCRIPT
# =============================================================================
# HOW TO RUN:
#   python manage.py shell --command="exec(open('seed_data.py', encoding='utf-8').read())"
# =============================================================================

from datetime import date, time, timedelta
from users.models import User, Doctor, Patient
from appointments.models import Appointment

print("Starting seed data generation...")

# -- CLEANUP -------------------------------------------------------------------
demo_usernames = [
    'admin_user', 'dr_sharma', 'dr_khan',
    'patient_rahul', 'patient_priya', 'receptionist_riya'
]
User.objects.filter(username__in=demo_usernames).delete()
print("Cleared old demo users (if any).")


# =============================================================================
# STEP 1: CREATE USERS
# =============================================================================

# Admin
admin = User.objects.create(
    username='admin_user',
    email='admin@clinic.com',
    first_name='Super',
    last_name='Admin',
    role='ADMIN',
)
admin.set_password('Admin@1234')
admin.save()
print(f"Created ADMIN: {admin.username}")

# Doctors
doc1_user = User.objects.create(
    username='dr_sharma',
    email='sharma@clinic.com',
    first_name='Rajesh',
    last_name='Sharma',
    role='DOCTOR',
)
doc1_user.set_password('Doctor@1234')
doc1_user.save()

doc2_user = User.objects.create(
    username='dr_khan',
    email='khan@clinic.com',
    first_name='Aisha',
    last_name='Khan',
    role='DOCTOR',
)
doc2_user.set_password('Doctor@1234')
doc2_user.save()
print("Created 2 DOCTORs: dr_sharma, dr_khan")

# Patients
pat1_user = User.objects.create(
    username='patient_rahul',
    email='rahul@gmail.com',
    first_name='Rahul',
    last_name='Verma',
    role='PATIENT',
)
pat1_user.set_password('Patient@1234')
pat1_user.save()

pat2_user = User.objects.create(
    username='patient_priya',
    email='priya@gmail.com',
    first_name='Priya',
    last_name='Mehta',
    role='PATIENT',
)
pat2_user.set_password('Patient@1234')
pat2_user.save()
print("Created 2 PATIENTs: patient_rahul, patient_priya")

# Receptionist
rec_user = User.objects.create(
    username='receptionist_riya',
    email='riya@clinic.com',
    first_name='Riya',
    last_name='Patel',
    role='RECEPTIONIST',
)
rec_user.set_password('Recept@1234')
rec_user.save()
print(f"Created RECEPTIONIST: {rec_user.username}")


# =============================================================================
# STEP 2: CREATE DOCTOR PROFILES
# =============================================================================

doctor1 = Doctor.objects.create(
    user=doc1_user,
    specialization='Cardiologist',
    consultation_fee=800.00,
    avg_consultation_time=20,
)

doctor2 = Doctor.objects.create(
    user=doc2_user,
    specialization='Dentist',
    consultation_fee=500.00,
    avg_consultation_time=15,
)
print("Created Doctor profiles (Cardiologist, Dentist)")


# =============================================================================
# STEP 3: CREATE PATIENT PROFILES
# =============================================================================

patient1 = Patient.objects.create(
    user=pat1_user,
    age=32,
    contact='9876543210',
    gender='MALE',
    medical_history='Hypertension, diagnosed 2021',
    allergies='Penicillin',
    current_medication='Amlodipine 5mg daily',
    profile_completed=True,
)

patient2 = Patient.objects.create(
    user=pat2_user,
    age=27,
    contact='9123456789',
    gender='FEMALE',
    medical_history='No significant history',
    allergies='None',
    current_medication='None',
    profile_completed=True,
)
print("Created Patient profiles (Rahul, Priya)")


# =============================================================================
# STEP 4: CREATE APPOINTMENTS
# =============================================================================

today      = date.today()
yesterday  = today - timedelta(days=1)
tomorrow   = today + timedelta(days=1)

appointments_data = [
    # Today's appointments
    {
        'doctor': doctor1, 'patient': patient1,
        'date': today, 'time': time(9, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'BOOKED',
        'reason': 'Chest pain and shortness of breath',
        'appointment_type': 'NORMAL',
        'fee': 800.00,
    },
    {
        'doctor': doctor1, 'patient': patient2,
        'date': today, 'time': time(9, 20),
        'token_number': 2, 'estimated_wait_time': 20,
        'status': 'ARRIVED',
        'reason': 'Follow-up for hypertension medication',
        'appointment_type': 'FOLLOWUP',
        'fee': 800.00,
    },
    {
        'doctor': doctor2, 'patient': patient1,
        'date': today, 'time': time(10, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'BOOKED',
        'reason': 'Routine dental checkup',
        'appointment_type': 'NORMAL',
        'fee': 500.00,
    },
    {
        'doctor': doctor2, 'patient': patient2,
        'date': today, 'time': time(10, 15),
        'token_number': 2, 'estimated_wait_time': 15,
        'status': 'BOOKED',
        'reason': 'Tooth sensitivity and pain',
        'appointment_type': 'NORMAL',
        'fee': 500.00,
    },

    # Yesterday's appointments
    {
        'doctor': doctor1, 'patient': patient2,
        'date': yesterday, 'time': time(11, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'COMPLETED',
        'reason': 'Routine heart checkup',
        'appointment_type': 'NORMAL',
        'fee': 800.00,
        'prescription': 'Aspirin 75mg - 1 tab daily\nAtorvastatin 10mg - 1 tab at night',
        'doctor_remark': 'Patient BP slightly elevated. Monitor weekly.',
        'advice': 'Low salt diet. Avoid smoking. Morning walks.',
    },
    {
        'doctor': doctor2, 'patient': patient1,
        'date': yesterday, 'time': time(14, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'CANCELLED',
        'reason': 'Dental cleaning',
        'appointment_type': 'NORMAL',
        'fee': 500.00,
    },

    # Tomorrow's appointments
    {
        'doctor': doctor1, 'patient': patient1,
        'date': tomorrow, 'time': time(9, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'BOOKED',
        'reason': 'Post-medication review',
        'appointment_type': 'FOLLOWUP',
        'fee': 800.00,
    },
    {
        'doctor': doctor2, 'patient': patient2,
        'date': tomorrow, 'time': time(11, 0),
        'token_number': 1, 'estimated_wait_time': 0,
        'status': 'BOOKED',
        'reason': 'Tooth extraction follow-up',
        'appointment_type': 'FOLLOWUP',
        'fee': 500.00,
    },
]

for appt_data in appointments_data:
    Appointment.objects.create(**appt_data)

print(f"Created {len(appointments_data)} Appointments")


# =============================================================================
# SUMMARY
# =============================================================================

print()
print("=" * 55)
print("  SEED DATA COMPLETE!")
print("=" * 55)
print()
print("  LOGIN CREDENTIALS")
print("-" * 55)
print("  ADMIN        | admin_user         | Admin@1234")
print("  DOCTOR       | dr_sharma          | Doctor@1234")
print("  DOCTOR       | dr_khan            | Doctor@1234")
print("  PATIENT      | patient_rahul      | Patient@1234")
print("  PATIENT      | patient_priya      | Patient@1234")
print("  RECEPTIONIST | receptionist_riya  | Recept@1234")
print("-" * 55)
print()
print("  APPOINTMENTS")
print("  Today     : 4  (BOOKED, ARRIVED)")
print("  Yesterday : 2  (COMPLETED, CANCELLED)")
print("  Tomorrow  : 2  (BOOKED)")
print()
