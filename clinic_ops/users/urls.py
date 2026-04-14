from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, PatientProfileView,
    CreateReceptionistView, CreateDoctorView, CreateAdminView,
)

urlpatterns = [
    path('token/',              CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/',      TokenRefreshView.as_view(),          name='token_refresh'),
    path('register/',           RegisterView.as_view(),              name='register'),
    path('patient/profile/',    PatientProfileView.as_view(),        name='patient_profile'),
    path('create-receptionist/',CreateReceptionistView.as_view(),    name='create_receptionist'),
    path('create-doctor/',      CreateDoctorView.as_view(),          name='create_doctor'),
    path('create-admin/',       CreateAdminView.as_view(),           name='create_admin'),
]
