from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, ResetPasswordView,
    PatientProfileView, CreateReceptionistView, CreateDoctorView,
    PatientDetailView, DoctorListView, DoctorDetailView,
    PatientListView, UserProfileView, StaffListView
)

urlpatterns = [
    path('token/',              CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/',      TokenRefreshView.as_view(),          name='token_refresh'),
    path('register/',           RegisterView.as_view(),              name='register'),
    path('reset-password/',     ResetPasswordView.as_view(),         name='reset_password'),
    path('profile/',            UserProfileView.as_view(),           name='user_profile'),
    path('patient/profile/',    PatientProfileView.as_view(),        name='patient_profile'),
    path('patient/<int:pk>/details/', PatientDetailView.as_view(),   name='patient_details'),
    path('create-receptionist/',CreateReceptionistView.as_view(),    name='create_receptionist'),
    path('create-doctor/',      CreateDoctorView.as_view(),          name='create_doctor'),
    path('doctors/',            DoctorListView.as_view(),            name='doctor_list'),
    path('doctors/<int:pk>/',   DoctorDetailView.as_view(),          name='doctor_detail'),
    path('patients/',           PatientListView.as_view(),           name='patient_list'),
    path('staff/',              StaffListView.as_view(),             name='staff_list'),
]

