from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.hashers import make_password
from django.conf import settings
from .models import User, Doctor, Patient


# ── JWT Login ──────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['user_id'] = self.user.id
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ── Registration ───────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        data = request.data
        if User.objects.filter(username=data.get('username')).exists():
            return Response({'detail': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            
        role = data.get('role', 'PATIENT').upper()
        if role not in dict(User.Role.choices):
            role = 'PATIENT'

        user = User.objects.create_user(
            username=data.get('username'),
            email=data.get('email', ''),
            role=role,
            password=data.get('password')
        )

        if role == 'PATIENT':
            Patient.objects.create(user=user)
        elif role == 'DOCTOR':
            Doctor.objects.create(user=user)

        return Response({'message': f'{role.capitalize()} registered successfully'}, status=status.HTTP_201_CREATED)


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
        password = request.data.get('password', '').strip()

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

        User.objects.create_user(
            username=username,
            role='RECEPTIONIST',
            password=password,
        )

        return Response(
            {'message': f'Receptionist "{username}" created successfully.'},
            status=status.HTTP_201_CREATED
        )


# ── Create Doctor (RECEPTIONIST only) ────────────────────────────────────────

class CreateDoctorView(APIView):
    """POST /api/create-doctor/ — RECEPTIONIST creates a doctor account."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'RECEPTIONIST':
            return Response(
                {'message': 'Only receptionists can create doctor accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )

        username             = request.data.get('username', '').strip()
        password             = request.data.get('password', '').strip()
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

        # ── Contact validation ───────────────────────────────────────────────
        contact = data.get('contact', None)
        if contact is not None:
            contact_digits = str(contact).strip()
            if contact_digits and (not contact_digits.isdigit() or len(contact_digits) != 10):
                return Response(
                    {'message': 'Contact number must be exactly 10 digits.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            patient.contact = contact_digits

        # ── Scalar fields (only update if present in request) ────────────────
        if data.get('age') is not None:
            patient.age = data['age']
        if data.get('gender') is not None:
            patient.gender = data['gender']
        if data.get('emergency_contact') is not None:
            ec = str(data['emergency_contact']).strip()
            if ec and (not ec.isdigit() or len(ec) != 10):
                return Response(
                    {'message': 'Emergency contact must be exactly 10 digits.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            patient.emergency_contact = ec
        if data.get('blood_group') is not None:
            patient.blood_group = data['blood_group']
        if data.get('medical_history') is not None:
            patient.medical_history = data['medical_history']
        if data.get('allergies') is not None:
            patient.allergies = data['allergies']
        if data.get('current_medication') is not None:
            patient.current_medication = data['current_medication']
        if data.get('address') is not None:
            patient.address = data['address']

        # ── Profile image ────────────────────────────────────────────────────
        if 'profile_image' in request.FILES:
            patient.profile_image = request.FILES['profile_image']

        # Mark profile completed if core fields are present
        if patient.age and patient.contact and patient.gender:
            patient.profile_completed = True

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
