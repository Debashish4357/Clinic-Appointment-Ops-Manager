from datetime import date, datetime
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

    # ── GET /api/appointments/ ─────────────────────────────────────────────────
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
                return Response({'message': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        elif role == 'PATIENT':
            try:
                patient = Patient.objects.get(user=user)
                appointments = Appointment.objects.filter(patient=patient)
            except Patient.DoesNotExist:
                return Response({'message': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'message': 'Unauthorized role.'}, status=status.HTTP_403_FORBIDDEN)

        # Optional filters: ?date=YYYY-MM-DD  &  ?doctor=<id>
        filter_date = request.query_params.get('date')
        filter_doctor = request.query_params.get('doctor')
        if filter_date:
            appointments = appointments.filter(date=filter_date)
        if filter_doctor:
            appointments = appointments.filter(doctor__id=filter_doctor)

        serializer = AppointmentSerializer(appointments, many=True)
        return Response({'message': 'Success', 'data': serializer.data}, status=status.HTTP_200_OK)

    # ── POST /api/appointments/ ────────────────────────────────────────────────
    def post(self, request):
        doctor_id = request.data.get('doctor')
        patient_id = request.data.get('patient')
        appt_date = request.data.get('date')
        appt_time = request.data.get('time')

        # Validate required fields
        if not all([doctor_id, patient_id, appt_date, appt_time]):
            return Response(
                {'message': 'doctor, patient, date, and time are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch doctor and patient
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'message': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Conflict detection — same doctor, date, and time
        if Appointment.objects.filter(doctor=doctor, date=appt_date, time=appt_time).exists():
            return Response(
                {'message': 'Doctor is already booked for this date and time.'},
                status=status.HTTP_409_CONFLICT
            )

        # Auto-generate token and wait time
        appointments_today = Appointment.objects.filter(doctor=doctor, date=appt_date).count()
        token_number = appointments_today + 1
        estimated_wait_time = token_number * doctor.avg_consultation_time

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date=appt_date,
            time=appt_time,
            token_number=token_number,
            estimated_wait_time=estimated_wait_time,
            fee=request.data.get('fee', doctor.consultation_fee),
        )

        return Response({
            'message': 'Appointment booked successfully.',
            'data': {
                'id': appointment.id,
                'token_number': token_number,
                'estimated_wait_time': estimated_wait_time,
                'date': appt_date,
                'time': appt_time,
            }
        }, status=status.HTTP_201_CREATED)


class AppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_appointment(self, pk):
        try:
            return Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return None

    # ── PATCH /api/appointments/<id>/ ─────────────────────────────────────────
    def patch(self, request, pk):
        role = request.user.role
        appointment = self.get_appointment(pk)

        if not appointment:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # ── Guard: Terminal states cannot be changed ───────────────────────────
        if appointment.status in ['COMPLETED', 'CANCELLED']:
            return Response(
                {'message': f'Cannot update an appointment that is already {appointment.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = request.data.get('status')

        # ── DOCTOR: BOOKED → COMPLETED + optional medical fields ──────────────
        if role == 'DOCTOR':
            if new_status and new_status != 'COMPLETED':
                return Response(
                    {'message': 'Doctor can only change status to COMPLETED.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if new_status == 'COMPLETED':
                appointment.status = 'COMPLETED'
            # Update medical fields if provided
            if 'doctor_remark' in request.data:
                appointment.doctor_remark = request.data['doctor_remark']
            if 'prescription' in request.data:
                appointment.prescription = request.data['prescription']
            if 'advice' in request.data:
                appointment.advice = request.data['advice']

        # ── RECEPTIONIST: BOOKED → CANCELLED ──────────────────────────────────
        elif role == 'RECEPTIONIST':
            if not new_status or new_status != 'CANCELLED':
                return Response(
                    {'message': 'Receptionist can only change status to CANCELLED.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            appointment.status = 'CANCELLED'

        # ── ADMIN: Any valid transition ────────────────────────────────────────
        elif role == 'ADMIN':
            valid_statuses = ['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
            if new_status:
                if new_status not in valid_statuses:
                    return Response(
                        {'message': f'Invalid status. Choose from: {valid_statuses}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = new_status
            # Admin can also update medical fields
            for field in ['doctor_remark', 'prescription', 'advice']:
                if field in request.data:
                    setattr(appointment, field, request.data[field])

        else:
            return Response(
                {'message': 'Unauthorized action.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── NO_SHOW: Auto-validate appointment time has passed ─────────────────
        if new_status == 'NO_SHOW':
            appt_datetime = datetime.combine(appointment.date, appointment.time)
            if datetime.now() <= appt_datetime:
                return Response(
                    {'message': 'Cannot mark as NO_SHOW before the scheduled appointment time.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        appointment.save()
        serializer = AppointmentSerializer(appointment)
        return Response(
            {'message': 'Appointment updated successfully.', 'data': serializer.data},
            status=status.HTTP_200_OK
        )

    # ── DELETE /api/appointments/<id>/ ────────────────────────────────────────
    def delete(self, request, pk):
        role = request.user.role

        if role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'message': 'Only Admin or Receptionist can delete appointments.'}, status=status.HTTP_403_FORBIDDEN)

        appointment = self.get_appointment(pk)
        if not appointment:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        appointment.delete()
        return Response({'message': 'Appointment deleted successfully.'}, status=status.HTTP_200_OK)


# ── ANALYTICS ──────────────────────────────────────────────────────────────────

class DailyPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        count = Appointment.objects.filter(date=today).aggregate(total=Count('id'))
        return Response({'message': 'Success', 'data': {'date': today, 'total_appointments': count['total']}})


class RevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total_revenue=Sum('fee'))
        return Response({'message': 'Success', 'data': {'total_revenue': result['total_revenue'] or 0}})


# ── DASHBOARDS ─────────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        total_revenue = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        data = {
            'total_users': User.objects.count(),
            'total_doctors': Doctor.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'total_revenue': total_revenue,
        }
        return Response({'message': 'Success', 'data': data})


class DoctorDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'DOCTOR':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({'message': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        today_appointments = Appointment.objects.filter(doctor=doctor, date=today)
        total_earnings = today_appointments.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        data = {
            'todays_appointments': AppointmentSerializer(today_appointments, many=True).data,
            'total_patients_today': today_appointments.count(),
            'total_earnings': total_earnings,
        }
        return Response({'message': 'Success', 'data': data})


class ReceptionistDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'RECEPTIONIST':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        today = date.today()
        today_appointments = Appointment.objects.filter(date=today)

        data = {
            'todays_appointments': AppointmentSerializer(today_appointments, many=True).data,
            'total_bookings_today': today_appointments.count(),
        }
        return Response({'message': 'Success', 'data': data})


class PatientDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)

        appointments = Appointment.objects.filter(patient=patient).order_by('date', 'time')
        upcoming = appointments.filter(date__gte=date.today(), status=Appointment.Status.BOOKED).first()

        data = {
            'patients_appointments': AppointmentSerializer(appointments, many=True).data,
            'upcoming_appointment': AppointmentSerializer(upcoming).data if upcoming else None,
            'token_number': upcoming.token_number if upcoming else None,
            'estimated_wait_time': upcoming.estimated_wait_time if upcoming else None,
        }
        return Response({'message': 'Success', 'data': data})
