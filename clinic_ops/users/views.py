from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
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

        user = User.objects.create(
            username=data.get('username'),
            email=data.get('email', ''),
            role='PATIENT',
            password=make_password(data.get('password'))
        )

        Patient.objects.create(user=user)

        return Response({'message': 'Patient registered successfully'}, status=status.HTTP_201_CREATED)


# ── Patient Profile ───────────────────────────────────────────────────────────

class PatientProfileView(APIView):
    """GET + POST /api/patient/profile/ — view and update patient profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Not a patient.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = {
            'id': patient.id,
            'username': request.user.username,
            'age': patient.age,
            'contact': patient.contact,
            'gender': patient.gender,
            'medical_history': patient.medical_history,
            'allergies': patient.allergies,
            'current_medication': patient.current_medication,
            'profile_completed': patient.profile_completed,
        }
        return Response({'message': 'Success', 'data': data})

    def post(self, request):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Not a patient.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Required fields for profile completion
        age = data.get('age')
        contact = data.get('contact')
        gender = data.get('gender')

        if not all([age, contact, gender]):
            return Response(
                {'message': 'age, contact, and gender are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        patient.age = age
        patient.contact = contact
        patient.gender = gender
        patient.medical_history = data.get('medical_history', '')
        patient.allergies = data.get('allergies', '')
        patient.current_medication = data.get('current_medication', '')
        patient.profile_completed = True
        patient.save()

        return Response({'message': 'Profile updated successfully.'}, status=status.HTTP_200_OK)
