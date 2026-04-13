from datetime import date, datetime, time
from django.utils.dateparse import parse_date, parse_time
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

        # Optional filters: ?date=YYYY-MM-DD  &  ?doctor_id=<id>
        filter_date = request.query_params.get('date')
        filter_doctor = request.query_params.get('doctor_id')
        if filter_date:
            appointments = appointments.filter(date=filter_date)
        if filter_doctor:
            appointments = appointments.filter(doctor_id=filter_doctor)

        serializer = AppointmentSerializer(appointments, many=True)
        return Response({'message': 'Success', 'data': serializer.data}, status=status.HTTP_200_OK)

    # ── POST /api/appointments/ ────────────────────────────────────────────────
    def post(self, request):
        # Only PATIENT role can book appointments
        if request.user.role != 'PATIENT':
            return Response(
                {'message': 'Only patients can book appointments.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Resolve patient from the logged-in user
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response(
                {'message': 'Patient profile not found for this user.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if patient profile is completed
        if not patient.profile_completed:
            return Response(
                {'message': 'Please complete your profile before booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor_id        = request.data.get('doctor')
        appt_date        = request.data.get('date')
        appt_time        = request.data.get('time')
        reason           = request.data.get('reason', '')
        appointment_type = request.data.get('appointment_type', 'NORMAL')

        # Validate required fields
        if not all([doctor_id, appt_date, appt_time]):
            return Response(
                {'message': 'doctor, date, and time are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse date and time
        appt_date_obj = parse_date(appt_date)
        appt_time_obj = parse_time(appt_time)

        if not appt_date_obj or not appt_time_obj:
            return Response(
                {'message': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent booking in past date/time
        if datetime.combine(appt_date_obj, appt_time_obj) < datetime.now():
            return Response(
                {'message': 'Cannot book an appointment in the past.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure appointment is within doctor available time (Assume 09:00 - 17:00)
        if not (time(9, 0) <= appt_time_obj <= time(17, 0)):
            return Response(
                {'message': 'Doctor is only available between 09:00 and 17:00.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch doctor
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'message': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent double booking (same doctor, date, and time)
        if Appointment.objects.filter(doctor=doctor, date=appt_date, time=appt_time).exclude(status='CANCELLED').exists():
            return Response(
                {'message': 'Doctor is already booked for this date and time.'},
                status=status.HTTP_409_CONFLICT
            )

        # Auto-generate token and wait time
        appointments_today = Appointment.objects.filter(
            doctor=doctor, date=appt_date
        ).exclude(status='CANCELLED').count()
        token_number       = appointments_today + 1
        estimated_wait_time = token_number * doctor.avg_consultation_time

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date=appt_date,
            time=appt_time,
            token_number=token_number,
            estimated_wait_time=estimated_wait_time,
            fee=doctor.consultation_fee,
            reason=reason,
            appointment_type=appointment_type,
        )

        return Response({
            'message': 'Appointment booked successfully.',
            'data': {
                'id': appointment.id,
                'token_number': token_number,
                'estimated_wait_time': estimated_wait_time,
                'date': appt_date,
                'time': appt_time,
                'doctor_name': str(doctor),
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
        if appointment.status in ['COMPLETED', 'CANCELLED', 'NO_SHOW']:
            return Response(
                {'message': f'Cannot update an appointment that is already {appointment.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = request.data.get('status')

        # ── DOCTOR: BOOKED/ARRIVED → COMPLETED + optional medical fields ───────
        if role == 'DOCTOR':
            if new_status and new_status != 'COMPLETED':
                return Response(
                    {'message': 'Doctor can only change status to COMPLETED.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if new_status == 'COMPLETED':
                if appointment.status not in ['BOOKED', 'ARRIVED']:
                    return Response(
                        {'message': f'Cannot complete an appointment with status {appointment.status}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'COMPLETED'
            # Update medical fields if provided
            if 'doctor_remark' in request.data:
                appointment.doctor_remark = request.data['doctor_remark']
            if 'prescription' in request.data:
                appointment.prescription = request.data['prescription']
            if 'advice' in request.data:
                appointment.advice = request.data['advice']

        # ── RECEPTIONIST: Check-In / Check-Out / Cancel ─────────────────────────
        elif role == 'RECEPTIONIST':
            if not new_status:
                return Response(
                    {'message': 'Status field is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # BOOKED → ARRIVED (Check-In)
            if new_status == 'ARRIVED':
                if appointment.status != 'BOOKED':
                    return Response(
                        {'message': 'Can only check-in a BOOKED appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'ARRIVED'

            # ARRIVED → COMPLETED (Check-Out)
            elif new_status == 'COMPLETED':
                if appointment.status != 'ARRIVED':
                    return Response(
                        {'message': 'Can only check-out an ARRIVED appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'COMPLETED'

            # BOOKED → CANCELLED
            elif new_status == 'CANCELLED':
                if appointment.status != 'BOOKED':
                    return Response(
                        {'message': 'Can only cancel a BOOKED appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'CANCELLED'

            else:
                return Response(
                    {'message': 'Receptionist can set status to ARRIVED, COMPLETED, or CANCELLED.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # ── ADMIN: Any valid transition ────────────────────────────────────────
        elif role == 'ADMIN':
            valid_statuses = ['BOOKED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
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


class AppointmentMoveView(APIView):
    """PATCH /api/appointments/<id>/move/ — swap token_number up or down."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['RECEPTIONIST', 'ADMIN']:
            return Response({'message': 'Only Receptionist or Admin can reorder the queue.'},
                            status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', '').upper()
        if action not in ['UP', 'DOWN']:
            return Response({'message': 'action must be UP or DOWN.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            current = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only reorder same doctor + same date queue
        siblings = Appointment.objects.filter(
            doctor=current.doctor, date=current.date
        ).order_by('token_number')

        if action == 'UP':
            # Find the appointment right before this one
            prev = siblings.filter(token_number__lt=current.token_number).order_by('-token_number').first()
            if not prev:
                return Response({'message': 'Already at the top of the queue.'},
                                status=status.HTTP_400_BAD_REQUEST)
            swap_target = prev
        else:
            # Find the appointment right after this one
            nxt = siblings.filter(token_number__gt=current.token_number).order_by('token_number').first()
            if not nxt:
                return Response({'message': 'Already at the bottom of the queue.'},
                                status=status.HTTP_400_BAD_REQUEST)
            swap_target = nxt

        # Swap token numbers
        current.token_number, swap_target.token_number = swap_target.token_number, current.token_number
        current.save(update_fields=['token_number'])
        swap_target.save(update_fields=['token_number'])

        return Response({
            'message': f'Appointment moved {action.lower()} successfully.',
        }, status=status.HTTP_200_OK)

# ── DOCTORS LIST ───────────────────────────────────────────────────────────────

class DoctorListView(APIView):
    """GET /api/doctors/ — returns all doctors for the booking dropdown."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctors = Doctor.objects.select_related('user').all()
        data = [
            {
                'id': doc.id,
                'name': doc.user.get_full_name() or doc.user.username,
                'specialization': doc.specialization or 'General',
                'consultation_fee': str(doc.consultation_fee),
                'avg_consultation_time': doc.avg_consultation_time,
            }
            for doc in doctors
        ]
        return Response({'message': 'Success', 'data': data}, status=status.HTTP_200_OK)


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
        today_appointments = Appointment.objects.filter(
            doctor=doctor, date=today
        ).select_related('patient', 'patient__user').order_by('token_number')

        # Build appointment list with patient names
        appointments_list = []
        for appt in today_appointments:
            patient_user = appt.patient.user
            appointments_list.append({
                'id': appt.id,
                'token_number': appt.token_number,
                'time': str(appt.time),
                'patient_name': patient_user.get_full_name() or patient_user.username,
                'patient_age': appt.patient.age,
                'patient_gender': appt.patient.gender,
                'status': appt.status,
                'reason': appt.reason,
                'appointment_type': appt.appointment_type,
                'prescription': appt.prescription or '',
                'doctor_remark': appt.doctor_remark or '',
                'advice': appt.advice or '',
                'fee': str(appt.fee),
            })

        # Stats
        total = today_appointments.count()
        completed = today_appointments.filter(status='COMPLETED').count()
        pending = today_appointments.filter(status='BOOKED').count()
        cancelled = today_appointments.filter(status='CANCELLED').count()
        earnings = today_appointments.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        data = {
            'appointments': appointments_list,
            'stats': {
                'total_patients': total,
                'completed': completed,
                'pending': pending,
                'cancelled': cancelled,
                'earnings': float(earnings),
            }
        }
        return Response({'message': 'Success', 'data': data})


class ReceptionistDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'RECEPTIONIST':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        today = date.today()
        today_appointments = Appointment.objects.filter(
            date=today
        ).select_related(
            'patient', 'patient__user', 'doctor', 'doctor__user'
        ).order_by('token_number')

        # Build appointment list with names
        appointments_list = []
        for appt in today_appointments:
            patient_user = appt.patient.user
            doctor_user = appt.doctor.user
            appointments_list.append({
                'id': appt.id,
                'token_number': appt.token_number,
                'time': str(appt.time),
                'patient_name': patient_user.get_full_name() or patient_user.username,
                'doctor_name': f'Dr. {doctor_user.get_full_name() or doctor_user.username}',
                'status': appt.status,
                'reason': appt.reason,
                'appointment_type': appt.appointment_type,
            })

        # Stats
        total = today_appointments.count()
        arrived = today_appointments.filter(status='ARRIVED').count()
        pending = today_appointments.filter(status='BOOKED').count()
        completed = today_appointments.filter(status='COMPLETED').count()
        cancelled = today_appointments.filter(status='CANCELLED').count()

        data = {
            'appointments': appointments_list,
            'stats': {
                'total_patients': total,
                'arrived': arrived,
                'pending': pending,
                'completed': completed,
                'cancelled': cancelled,
            }
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
            'profile': {
                'username': request.user.username,
                'age': patient.age,
                'contact': patient.contact,
                'medical_history': patient.medical_history,
            },
            'patients_appointments': AppointmentSerializer(appointments, many=True).data,
            'upcoming_appointment': AppointmentSerializer(upcoming).data if upcoming else None,
            'token_number': upcoming.token_number if upcoming else None,
            'estimated_wait_time': upcoming.estimated_wait_time if upcoming else None,
        }
        return Response({'message': 'Success', 'data': data})
