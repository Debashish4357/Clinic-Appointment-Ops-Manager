from django.urls import path
from .views import (
    AppointmentView, AppointmentDetailView, AppointmentMoveView,
    DailyPatientsView, RevenueView,
    AdminDashboardView, DoctorDashboardView,
    ReceptionistDashboardView, PatientDashboardView,
    DoctorListView,
)

urlpatterns = [
    # Doctors list (for booking dropdown)
    path('doctors/', DoctorListView.as_view(), name='doctors_list'),

    # Appointments CRUD
    path('appointments/', AppointmentView.as_view(), name='appointments'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment_detail'),
    path('appointments/<int:pk>/move/', AppointmentMoveView.as_view(), name='appointment_move'),

    # Analytics
    path('analytics/daily-patients/', DailyPatientsView.as_view(), name='analytics_daily_patients'),
    path('analytics/revenue/', RevenueView.as_view(), name='analytics_revenue'),

    # Dashboards
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    path('dashboard/doctor/', DoctorDashboardView.as_view(), name='dashboard_doctor'),
    path('dashboard/receptionist/', ReceptionistDashboardView.as_view(), name='dashboard_receptionist'),
    path('dashboard/patient/', PatientDashboardView.as_view(), name='dashboard_patient'),
]
