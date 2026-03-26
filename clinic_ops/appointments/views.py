from datetime import date
from django.db.models import Count, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Appointment
from .serializers import AppointmentSerializer
from users.models import User, Doctor, Patient


class AppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role in ['ADMIN', 'RECEPTIONIST']:
            appointments = Appointment.objects.all()
        elif role == 'DOCTOR':
            try:
                doctor = Doctor.objects.get(user=user)
                appointments = Appointment.objects.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return Response({'error': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        elif role == 'PATIENT':
            try:
                patient = Patient.objects.get(user=user)
                appointments = Appointment.objects.filter(patient=patient)
            except Patient.DoesNotExist:
                return Response({'error': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Unauthorized role.'}, status=status.HTTP_403_FORBIDDEN)

        # Structure response to return exactly the required fields
        data = [
            {
                "doctor": appt.doctor.id,
                "patient": appt.patient.id,
                "date": appt.date,
                "time": appt.time,
                "token_number": appt.token_number,
                "estimated_wait_time": appt.estimated_wait_time,
                "status": appt.status
            }
            for appt in appointments
        ]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        doctor_id = request.data.get('doctor')
        patient_id = request.data.get('patient')
        date = request.data.get('date')
        time = request.data.get('time')

        # Validate required fields
        if not all([doctor_id, patient_id, date, time]):
            return Response(
                {'error': 'doctor, patient, date, and time are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch doctor and patient
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Step 1: Conflict detection — same doctor, date, and time
        already_booked = Appointment.objects.filter(
            doctor=doctor, date=date, time=time
        ).exists()

        if already_booked:
            return Response(
                {'error': 'Doctor is already booked for this date and time.'},
                status=status.HTTP_409_CONFLICT
            )

        # Step 2: Generate token_number
        appointments_today = Appointment.objects.filter(
            doctor=doctor, date=date
        ).count()
        token_number = appointments_today + 1

        # Step 3: Calculate estimated_wait_time
        estimated_wait_time = token_number * doctor.avg_consultation_time

        # Step 4: Save appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date=date,
            time=time,
            token_number=token_number,
            estimated_wait_time=estimated_wait_time,
            fee=request.data.get('fee', doctor.consultation_fee),
        )

        return Response({
            "message": "Appointment booked",
            "token": token_number,
            "wait_time": estimated_wait_time
        }, status=status.HTTP_201_CREATED)


class UpdateAppointmentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    # Roles and the statuses they are allowed to set
    ROLE_ALLOWED_STATUSES = {
        'DOCTOR': ['COMPLETED'],
        'RECEPTIONIST': ['CANCELLED', 'BOOKED'],  # BOOKED = reschedule/re-activate
    }

    def patch(self, request, pk):
        user = request.user
        role = user.role

        # Check role is authorized to update status at all
        if role not in self.ROLE_ALLOWED_STATUSES:
            return Response(
                {'error': 'You do not have permission to update appointment status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the appointment
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the status value is allowed for this role
        allowed = self.ROLE_ALLOWED_STATUSES[role]
        if new_status not in allowed:
            return Response(
                {'error': f'{role} can only set status to: {allowed}'},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment.status = new_status
        appointment.save()

        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        count = Appointment.objects.filter(date=today).aggregate(total=Count('id'))
        return Response({'date': today, 'total_appointments': count['total']}, status=status.HTTP_200_OK)


class RevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total_revenue=Sum('fee'))
        return Response(
            {'total_revenue': result['total_revenue'] or 0},
            status=status.HTTP_200_OK
        )


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        total_revenue = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        data = {
            'total_users': User.objects.count(),
            'total_doctors': Doctor.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'total_revenue': total_revenue
        }
        return Response(data, status=status.HTTP_200_OK)


class DoctorDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'DOCTOR':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        today_appointments = Appointment.objects.filter(doctor=doctor, date=today)
        
        total_handled = today_appointments.filter(status__in=[Appointment.Status.COMPLETED, Appointment.Status.BOOKED]).count()
        total_earnings = today_appointments.filter(status=Appointment.Status.COMPLETED).aggregate(total=Sum('fee'))['total'] or 0.00

        data = {
            'todays_appointments': AppointmentSerializer(today_appointments, many=True).data,
            'total_patients_today': total_handled,
            'total_earnings': total_earnings
        }
        return Response(data, status=status.HTTP_200_OK)


class ReceptionistDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'RECEPTIONIST':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        today = date.today()
        today_appointments = Appointment.objects.filter(date=today)
        
        total_bookings_today = today_appointments.count()
        data = {
            'todays_appointments': AppointmentSerializer(today_appointments, many=True).data,
            'total_bookings_today': total_bookings_today
        }
        return Response(data, status=status.HTTP_200_OK)


class PatientDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PATIENT':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)

        appointments = Appointment.objects.filter(patient=patient).order_by('date', 'time')
        upcoming = appointments.filter(date__gte=date.today(), status=Appointment.Status.BOOKED).first()

        data = {
            'patients_appointments': AppointmentSerializer(appointments, many=True).data,
            'upcoming_appointment': AppointmentSerializer(upcoming).data if upcoming else None,
            'token_number': upcoming.token_number if upcoming else None,
            'estimated_wait_time': upcoming.estimated_wait_time if upcoming else None
        }
        return Response(data, status=status.HTTP_200_OK)










