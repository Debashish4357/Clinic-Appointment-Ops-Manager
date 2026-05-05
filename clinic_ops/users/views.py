from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User, Doctor, Patient


# ── JWT Login ──────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds role + user_id to the JWT response payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        print(f"[LOGIN] Attempt for username: {attrs.get('username')}")
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['user_id'] = self.user.id
        print(f"[LOGIN] Success — user_id={self.user.id}, role={self.user.role}")
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(APIView):
    """GET /api/profile/ — returns the role and basic info of the logged-in user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'role': request.user.role,
        }, status=status.HTTP_200_OK)


# ── Patient Signup (public — PATIENT role only) ────────────────────────────────

class RegisterView(APIView):
    """POST /api/register/ — open to the public; always creates a PATIENT."""
    permission_classes = []

    def post(self, request):
        username = request.data.get('username', '').strip()
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        print(f"[REGISTER] Request — username={username}, email={email}")

        if not username or not password:
            print("[REGISTER] Failed — missing username or password")
            return Response({'detail': 'username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            print(f"[REGISTER] Failed — username '{username}' already taken")
            return Response({'detail': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Email uniqueness check ──────────────────────────────────────────
        if email and User.objects.filter(email__iexact=email).exists():
            print(f"[REGISTER] Failed — email '{email}' already exists")
            return Response({'detail': 'User already exists with this email.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                role='PATIENT',
                password=password,
            )
            Patient.objects.create(user=user)
            print(f"[REGISTER] Success — created patient user_id={user.id}")
            return Response({'message': 'Patient account created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"[REGISTER] Exception — {e}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── Reset Password (no email service — direct update) ─────────────────────────

class ResetPasswordView(APIView):
    """POST /api/reset-password/ — update password by email (no email service)."""
    permission_classes = []

    def post(self, request):
        email       = request.data.get('email', '').strip()
        new_password = request.data.get('newPassword', '').strip()

        print(f"[RESET-PASSWORD] Request — email={email}")

        # ── Input validation ────────────────────────────────────────────────
        if not email or not new_password:
            print("[RESET-PASSWORD] Failed — missing email or newPassword")
            return Response(
                {'detail': 'email and newPassword are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            print("[RESET-PASSWORD] Failed — password too short")
            return Response(
                {'detail': 'Password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Find user ──────────────────────────────────────────────────────
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            print(f"[RESET-PASSWORD] Failed — no user found for email={email}")
            return Response(
                {'detail': 'User not found with this email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Hash & save new password ───────────────────────────────────────
        user.set_password(new_password)   # uses Django's PBKDF2 / bcrypt hasher
        user.save()
        print(f"[RESET-PASSWORD] Success — password updated for user_id={user.id}")

        return Response(
            {'message': 'Password updated successfully.'},
            status=status.HTTP_200_OK
        )


# ── Create Receptionist (ADMIN only) ──────────────────────────────────────────

class CreateReceptionistView(APIView):
    """POST /api/create-receptionist/ — ADMIN creates a receptionist account."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Only admins can create receptionist accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'message': 'username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(password) < 6:
            return Response(
                {'message': 'Password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {'message': 'Username is already taken.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            User.objects.create_user(
                username=username,
                role='RECEPTIONIST',
                password=password,
            )
            return Response(
                {'message': f'Receptionist "{username}" created successfully.'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'message': f'Error creating receptionist: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ── Create Doctor (ADMIN or RECEPTIONIST only) ────────────────────────────────

class CreateDoctorView(APIView):
    """POST /api/create-doctor/ — RECEPTIONIST or ADMIN creates a doctor account."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['RECEPTIONIST', 'ADMIN']:
            return Response(
                {'message': 'Only receptionists or admins can create doctor accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )

        username             = request.data.get('username', '').strip()
        password             = request.data.get('password', '')
        specialization       = request.data.get('specialization', '').strip()
        consultation_fee     = request.data.get('consultation_fee', 0)
        avg_consultation_time= request.data.get('avg_consultation_time', 15)

        if not username or not password:
            return Response(
                {'message': 'username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(password) < 6:
            return Response(
                {'message': 'Password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {'message': 'Username is already taken.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            role='DOCTOR',
            password=password,
        )

        Doctor.objects.create(
            user=user,
            specialization=specialization,
            consultation_fee=consultation_fee,
            avg_consultation_time=avg_consultation_time,
        )

        return Response(
            {'message': f'Doctor "{username}" created successfully.'},
            status=status.HTTP_201_CREATED
        )


# ── Patient Details (Quick View for DOCTOR / RECEPTIONIST) ───────────────────

class PatientDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role not in ['DOCTOR', 'RECEPTIONIST', 'ADMIN']:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get top 3 recent appointments
        from appointments.models import Appointment, LabReport
        from appointments.serializers import LabReportSerializer
        recent_appts = Appointment.objects.filter(patient=patient).order_by('-date', '-time')[:3]
        recent_list = []
        for appt in recent_appts:
            # Build a short prescription summary string
            presc_summary = ''
            if appt.prescription and isinstance(appt.prescription, list):
                names = [m.get('medicine', '') for m in appt.prescription if m.get('medicine')]
                presc_summary = ', '.join(names[:2])
                if len(names) > 2:
                    presc_summary += f' +{len(names) - 2} more'
            recent_list.append({
                'date': appt.date,
                'status': appt.status,
                'prescription_summary': presc_summary,
                'doctor_notes': appt.doctor_notes or '',
            })
            
        reports = LabReport.objects.filter(patient=patient)
        reports_data = LabReportSerializer(reports, many=True, context={'request': request}).data

        data = {
            'name': patient.user.get_full_name() or patient.user.username,
            'age': patient.age,
            'contact': patient.contact,
            'gender': patient.gender,
            'blood_group': patient.blood_group,
            'medical_history': patient.medical_history,
            'allergies': patient.allergies,
            'current_medication': patient.current_medication,
            'insurance_info': patient.insurance_info,
            'address': patient.address,
            'lab_reports': reports_data,
            'recent_appointments': recent_list,
        }
        return Response(data, status=status.HTTP_200_OK)


# ── Patient Profile ───────────────────────────────────────────────────────────


def _build_profile_image_url(request, patient):
    """Return an absolute URL for the patient's profile image, or None."""
    if patient.profile_image:
        return request.build_absolute_uri(patient.profile_image.url)
    return None


class PatientProfileView(APIView):
    """GET / POST / PATCH  /api/patient/profile/"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_patient(self, request):
        if request.user.role != 'PATIENT':
            return None, Response({'message': 'Not a patient.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            return Patient.objects.get(user=request.user), None
        except Patient.DoesNotExist:
            return None, Response({'message': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    def _serialize(self, request, patient):
        return {
            'id': patient.id,
            'username': request.user.username,
            'age': patient.age,
            'contact': patient.contact,
            'gender': patient.gender,
            'emergency_contact': patient.emergency_contact,
            'blood_group': patient.blood_group,
            'medical_history': patient.medical_history,
            'allergies': patient.allergies,
            'current_medication': patient.current_medication,
            'insurance_info': patient.insurance_info,
            'address': patient.address,
            'profile_image': _build_profile_image_url(request, patient),
            'profile_completed': patient.profile_completed,
        }

    def get(self, request):
        patient, err = self._get_patient(request)
        if err:
            return err
        return Response({'message': 'Success', 'data': self._serialize(request, patient)})

    def _save(self, request, patient):
        """Shared save logic for POST and PATCH."""
        data = request.data

        # Helper to clean strings and handle empty/null
        def get_clean(key):
            val = data.get(key)
            if val is None: return None
            return str(val).strip()

        # ── Age (Integer) ───────────────────────────────────────────────────
        age_val = get_clean('age')
        if age_val is not None:
            if age_val == "":
                patient.age = None
            else:
                try:
                    patient.age = int(age_val)
                except ValueError:
                    return Response({'message': 'Age must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Contact numbers (Clean and validate) ──────────────────────────
        def clean_phone(key, label):
            val = get_clean(key)
            if val is None: return None
            # Remove all non-digits (like +, spaces, dashes)
            digits = "".join(filter(str.isdigit, val))
            # If it's 12 digits and starts with 91, take last 10
            if len(digits) == 12 and digits.startswith('91'):
                digits = digits[2:]
            
            if digits and len(digits) != 10:
                return f"{label} must be exactly 10 digits."
            return digits

        contact = clean_phone('contact', 'Contact number')
        if isinstance(contact, str) and "must be" in contact:
            return Response({'message': contact}, status=status.HTTP_400_BAD_REQUEST)
        if contact is not None:
            patient.contact = contact

        emergency = clean_phone('emergency_contact', 'Emergency contact')
        if isinstance(emergency, str) and "must be" in emergency:
            return Response({'message': emergency}, status=status.HTTP_400_BAD_REQUEST)
        if emergency is not None:
            patient.emergency_contact = emergency

        # ── Other fields ────────────────────────────────────────────────────
        for field in ['gender', 'blood_group', 'medical_history', 'allergies', 
                      'current_medication', 'insurance_info', 'address']:
            val = get_clean(field)
            if val is not None:
                setattr(patient, field, val)

        # ── Profile image ────────────────────────────────────────────────────
        if 'profile_image' in request.FILES:
            patient.profile_image = request.FILES['profile_image']

        # Mark profile completed if core fields are present
        # Core fields: Age, Contact, Gender
        if patient.age and patient.contact and patient.gender:
            patient.profile_completed = True
        else:
            patient.profile_completed = False

        patient.save()
        return Response({
            'message': 'Profile updated successfully.',
            'data': self._serialize(request, patient),
        }, status=status.HTTP_200_OK)

    def post(self, request):
        patient, err = self._get_patient(request)
        if err:
            return err
        return self._save(request, patient)

    def patch(self, request):
        patient, err = self._get_patient(request)
        if err:
            return err
        return self._save(request, patient)

# ── List Views (for Dropdowns) ────────────────────────────────────────────────

class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        doctors = Doctor.objects.select_related('user').all()
        data = [{
            'id': d.id,
            'name': f"Dr. {d.user.get_full_name() or d.user.username}",
            'specialization': d.specialization,
            'consultation_fee': str(d.consultation_fee),
            'avg_consultation_time': d.avg_consultation_time,
            'is_available': d.is_available,
            'doctor_code': d.doctor_code,
        } for d in doctors]
        return Response(data, status=status.HTTP_200_OK)

class DoctorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            doctor = Doctor.objects.select_related('user').get(pk=pk)
        except Doctor.DoesNotExist:
            return Response({'message': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_available' in request.data:
            doctor.is_available = bool(request.data['is_available'])
        
        doctor.save()
        return Response({
            'message': 'Doctor availability updated successfully.',
            'data': {
                'id': doctor.id,
                'name': f"Dr. {doctor.user.get_full_name() or doctor.user.username}",
                'is_available': doctor.is_available,
                'doctor_code': doctor.doctor_code,
            }
        }, status=status.HTTP_200_OK)

class PatientListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        patients = Patient.objects.select_related('user').all()
        data = [{
            'id': p.id,
            'name': p.user.get_full_name() or p.user.username,
            'contact': p.contact
        } for p in patients]
        return Response(data, status=status.HTTP_200_OK)


# ── Staff List (ADMIN only) ──────────────────────────────────────────────────────

class StaffListView(APIView):
    """GET /api/staff/ — list all ADMIN + RECEPTIONIST users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        staff = User.objects.filter(role__in=['ADMIN', 'RECEPTIONIST']).order_by('-date_joined')
        data = [{
            'id': u.id,
            'username': u.username,
            'email': u.email or '—',
            'role': u.role,
            'is_active': u.is_active,
            'date_joined': u.date_joined.strftime('%Y-%m-%d'),
        } for u in staff]
        return Response({'message': 'Success', 'data': data}, status=status.HTTP_200_OK)
