from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import IntegrityError
from .models import User, Doctor, Patient


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token payload
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Also include role and user_id in the JSON response body
        data['role'] = self.user.role
        data['user_id'] = self.user.id
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from users.models import User, Patient, Doctor

class RegisterView(APIView):
    permission_classes = [] # Allow unauthenticated

    def post(self, request):
        data = request.data
        if User.objects.filter(username=data.get('username')).exists():
            return Response({'detail': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create(
            username=data.get('username'),
            email=data.get('email', ''),
            role=data.get('role', 'PATIENT'),
            password=make_password(data.get('password'))
        )

        # Map correct role profiles
        if user.role == 'PATIENT':
            Patient.objects.create(user=user)
        elif user.role == 'DOCTOR':
            Doctor.objects.create(user=user)

        return Response({'detail': 'User registered successfully'}, status=status.HTTP_201_CREATED)
