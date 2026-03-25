from django.urls import path
from .views import (
    AppointmentView, UpdateAppointmentStatusView, DailyPatientsView, RevenueView,
    AdminDashboardView, DoctorDashboardView, ReceptionistDashboardView, PatientDashboardView
)

urlpatterns = [
    path('appointments/', AppointmentView.as_view(), name='appointments'),
    path('appointments/<int:pk>/', UpdateAppointmentStatusView.as_view(), name='appointment_update_status'),
    path('analytics/daily-patients/', DailyPatientsView.as_view(), name='analytics_daily_patients'),
    path('analytics/revenue/', RevenueView.as_view(), name='analytics_revenue'),
    
    # Dashboards
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    path('dashboard/doctor/', DoctorDashboardView.as_view(), name='dashboard_doctor'),
    path('dashboard/receptionist/', ReceptionistDashboardView.as_view(), name='dashboard_receptionist'),
    path('dashboard/patient/', PatientDashboardView.as_view(), name='dashboard_patient'),
]
