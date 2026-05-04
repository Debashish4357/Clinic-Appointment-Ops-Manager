from datetime import date, datetime, time
from django.utils.dateparse import parse_date, parse_time
from django.db.models import Count, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Appointment, LabReport
from .serializers import AppointmentSerializer, LabReportSerializer
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
        print("=== BACKEND REQUEST BODY ===")
        print(request.data)
        
        role = request.user.role

        # Fix 1: PATIENT books for themselves; RECEPTIONIST/ADMIN can book for any patient
        if role == 'PATIENT':
            try:
                patient = Patient.objects.get(user=request.user)
            except Patient.DoesNotExist:
                print("Error: Patient profile not found.")
                return Response(
                    {'message': 'Patient profile not found for this user.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            # Check if patient profile is completed
            if not patient.profile_completed:
                print("Error: Patient profile incomplete.")
                return Response(
                    {'message': 'Please complete your profile before booking.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif role in ['RECEPTIONIST', 'ADMIN']:
            if request.data.get('is_walk_in'):
                import uuid
                walk_in_name = request.data.get('walk_in_name', 'Walk-in Patient')
                walk_in_contact = request.data.get('contact', '')
                walk_in_age = request.data.get('age', None)
                walk_in_gender = request.data.get('gender', 'OTHER')
                walk_in_address = request.data.get('address', '')
                walk_in_medical_history = request.data.get('medical_history', '')
                walk_in_allergies = request.data.get('allergies', '')
                walk_in_current_medication = request.data.get('current_medication', '')
                walk_in_insurance_info = request.data.get('insurance_info', '')

                dummy_username = f"walkin_{uuid.uuid4().hex[:8]}"
                # Use create_user to ensure any default password/hashing is handled correctly
                user = User.objects.create_user(username=dummy_username, first_name=walk_in_name, role='PATIENT')
                patient = Patient.objects.create(
                    user=user, 
                    profile_completed=True,
                    contact=walk_in_contact,
                    age=walk_in_age,
                    gender=walk_in_gender,
                    address=walk_in_address,
                    medical_history=walk_in_medical_history,
                    allergies=walk_in_allergies,
                    current_medication=walk_in_current_medication,
                    insurance_info=walk_in_insurance_info
                )
            else:
                patient_id = request.data.get('patient_id') or request.data.get('patient')
                if not patient_id:
                    return Response(
                        {'message': 'patient_id or patient is required for receptionist/admin booking.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                try:
                    patient = Patient.objects.get(id=patient_id)
                except Patient.DoesNotExist:
                    return Response({'message': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'message': 'Unauthorized role.'}, status=status.HTTP_403_FORBIDDEN)

        doctor_id        = request.data.get('doctor')
        appt_date        = request.data.get('date')
        appt_time        = request.data.get('time')
        reason           = request.data.get('reason', '')
        appointment_type = request.data.get('appointment_type', 'NORMAL')

        # Validate required fields
        if not all([doctor_id, appt_date, appt_time]):
            print("Error: Missing required fields.")
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

        is_walk_in = request.data.get('is_walk_in', False)

        # Prevent booking in past date/time (skip strict check for walk-ins)
        if not is_walk_in and datetime.combine(appt_date_obj, appt_time_obj) < datetime.now():
            return Response(
                {'message': 'Cannot book an appointment in the past.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure appointment is within doctor available time (Assume 09:00 - 17:00)
        if not is_walk_in and not (time(9, 0) <= appt_time_obj <= time(17, 0)):
            return Response(
                {'message': 'Doctor is only available between 09:00 and 17:00.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch doctor
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'message': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        if Appointment.objects.filter(doctor=doctor, date=appt_date, time=appt_time).exclude(status='CANCELLED').exists():
            return Response(
                {'message': 'Time slot already booked'},
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
        print("=== DB SAVE RESULT ===")
        print(f"Appointment created: ID={appointment.id}, Status={appointment.status}, Token={token_number}")

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
                if appointment.status not in ['BOOKED', 'ARRIVED', 'IN_PROGRESS']:
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

        # ── RECEPTIONIST: Full lifecycle transitions ────────────────────────────
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

            # Fix 2: ARRIVED → IN_PROGRESS (Start Consultation)
            elif new_status == 'IN_PROGRESS':
                if appointment.status != 'ARRIVED':
                    return Response(
                        {'message': 'Can only start consultation for an ARRIVED appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'IN_PROGRESS'

            # IN_PROGRESS → COMPLETED
            elif new_status == 'COMPLETED':
                if appointment.status not in ['ARRIVED', 'IN_PROGRESS']:
                    return Response(
                        {'message': 'Can only complete an ARRIVED or IN_PROGRESS appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'COMPLETED'

            # BOOKED / ARRIVED → CANCELLED
            elif new_status == 'CANCELLED':
                if appointment.status not in ['BOOKED', 'ARRIVED']:
                    return Response(
                        {'message': 'Can only cancel a BOOKED or ARRIVED appointment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                appointment.status = 'CANCELLED'

            else:
                return Response(
                    {'message': 'Invalid status transition.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ── ADMIN: Any valid transition ────────────────────────────────────────
        elif role == 'ADMIN':
            valid_statuses = ['BOOKED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
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

        # ── PATIENT: Cancel own BOOKED appointment ───────────────────────────
        elif role == 'PATIENT':
            # Verify ownership
            try:
                patient = request.user.patient_profile
            except Exception:
                return Response({'message': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

            if appointment.patient != patient:
                return Response(
                    {'message': 'You can only cancel your own appointments.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if new_status != 'CANCELLED':
                return Response(
                    {'message': 'Patients can only cancel appointments.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if appointment.status != 'BOOKED':
                return Response(
                    {'message': f'Cannot cancel an appointment with status {appointment.status}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = 'CANCELLED'

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

        # Swap token numbers safely to avoid unique constraint violation
        temp_token = 999999
        current_token = current.token_number
        target_token = swap_target.token_number

        current.token_number = temp_token
        current.save(update_fields=['token_number'])

        swap_target.token_number = current_token
        swap_target.save(update_fields=['token_number'])

        current.token_number = target_token
        current.save(update_fields=['token_number'])

        return Response({
            'message': f'Appointment moved {action.lower()} successfully.',
        }, status=status.HTTP_200_OK)


class AppointmentWaitTimeView(APIView):
    """PATCH /api/appointments/<id>/wait-time/ — adjust wait time by specific value."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['DOCTOR', 'RECEPTIONIST', 'ADMIN']:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        change = request.data.get('change', 0)
        try:
            change = int(change)
        except ValueError:
            return Response({'message': 'Change must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_val = appt.estimated_wait_time + change
        appt.estimated_wait_time = max(0, new_val)
        appt.save(update_fields=['estimated_wait_time'])

        return Response({'message': 'Wait time updated.', 'wait_time': appt.estimated_wait_time}, status=status.HTTP_200_OK)


class AppointmentRescheduleView(APIView):
    """PATCH /api/appointments/<id>/reschedule/ — change date/time."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['RECEPTIONIST', 'ADMIN']:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        new_date = request.data.get('date')
        new_time = request.data.get('time')

        if not new_date or not new_time:
            return Response({'message': 'Date and time are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if appt.status in ['COMPLETED', 'CANCELLED', 'NO_SHOW']:
            return Response({'message': f'Cannot reschedule a {appt.status} appointment.'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic parsing check
        from django.utils.dateparse import parse_date, parse_time
        d_obj = parse_date(new_date)
        t_obj = parse_time(new_time)

        if not d_obj or not t_obj:
            return Response({'message': 'Invalid date/time format.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for conflict
        if Appointment.objects.filter(doctor=appt.doctor, date=new_date, time=new_time).exclude(id=appt.id).exclude(status='CANCELLED').exists():
            return Response({'message': 'Doctor is already booked for this time.'}, status=status.HTTP_409_CONFLICT)

        appt.date = new_date
        appt.time = new_time
        # Reset to booked if it was arrived
        if appt.status == 'ARRIVED':
            appt.status = 'BOOKED'
        appt.save()

        return Response({'message': 'Appointment rescheduled successfully.'}, status=status.HTTP_200_OK)

class AppointmentCompleteView(APIView):
    """PATCH /api/appointments/<id>/complete/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'DOCTOR':
            return Response({'message': 'Only Doctors can complete appointments.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appt.status not in ['BOOKED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED']:
            return Response({'message': f'Cannot complete an appointment with status {appt.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        appt.status = 'COMPLETED'
        if 'prescription' in request.data:
            appt.prescription = request.data['prescription']
        if 'notes' in request.data:
            appt.doctor_notes = request.data['notes']
            
        appt.save(update_fields=['status', 'prescription', 'doctor_notes'])
        return Response({'message': 'Appointment completed successfully.'}, status=status.HTTP_200_OK)


class AppointmentVitalsView(APIView):
    """PATCH /api/appointments/<id>/vitals/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'RECEPTIONIST':
            return Response({'message': 'Only Receptionists can add vitals.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'message': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appt.status in ['COMPLETED', 'CANCELLED', 'NO_SHOW']:
            return Response({'message': 'Cannot add vitals to closed appointments.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'bp' in request.data:
            appt.bp = request.data['bp']
        if 'heart_rate' in request.data:
            appt.heart_rate = request.data['heart_rate']
        if 'weight' in request.data:
            appt.weight = request.data['weight']
        if 'temperature' in request.data:
            appt.temperature = request.data['temperature']

        appt.save(update_fields=['bp', 'heart_rate', 'weight', 'temperature'])
        return Response({'message': 'Vitals saved successfully.'}, status=status.HTTP_200_OK)

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

        today = date.today()

        total_revenue = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        # Fix 4: Add today's breakdown
        today_qs = Appointment.objects.filter(date=today)

        data = {
            'total_users': User.objects.count(),
            'total_doctors': Doctor.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'total_revenue': total_revenue,
            'today': {
                'total':     today_qs.count(),
                'completed': today_qs.filter(status='COMPLETED').count(),
                'pending':   today_qs.filter(status='BOOKED').count(),
                'arrived':   today_qs.filter(status='ARRIVED').count(),
                'cancelled': today_qs.filter(status='CANCELLED').count(),
            },
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
                'patient_id': appt.patient.id,
                'patient_name': patient_user.get_full_name() or patient_user.username,
                'patient_age': appt.patient.age,
                'patient_gender': appt.patient.gender,
                'status': appt.status,
                'reason': appt.reason,
                'appointment_type': appt.appointment_type,
                'prescription': appt.prescription or [],
                'doctor_remark': appt.doctor_remark or '',
                'advice': appt.advice or '',
                'fee': str(appt.fee),
                'estimated_wait_time': appt.estimated_wait_time,
                'bp': appt.bp or '',
                'heart_rate': appt.heart_rate or '',
                'weight': appt.weight or '',
                'temperature': appt.temperature or '',
                'doctor_notes': appt.doctor_notes or '',
            })

        # Stats
        total = today_appointments.count()
        completed = today_appointments.filter(status='COMPLETED').count()
        pending = today_appointments.filter(status='BOOKED').count()
        cancelled = today_appointments.filter(status='CANCELLED').count()
        earnings = today_appointments.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('fee'))['total'] or 0.00

        # ── Smart Queue ────────────────────────────────────────────────────────
        # Active queue: BOOKED or ARRIVED, ordered by token_number
        active_queue = [a for a in appointments_list if a['status'] in ['BOOKED', 'ARRIVED']]
        now_serving = active_queue[0] if active_queue else None
        next_patient = active_queue[1] if len(active_queue) > 1 else None
        waiting_count = len(active_queue)

        data = {
            'appointments': appointments_list,
            'stats': {
                'total_patients': total,
                'completed': completed,
                'pending': pending,
                'cancelled': cancelled,
                'earnings': float(earnings),
            },
            'queue': {
                'now_serving': now_serving,
                'next_patient': next_patient,
                'waiting_count': waiting_count,
            },
        }
        return Response({'message': 'Success', 'data': data})


class ReceptionistDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fix 3: Allow both RECEPTIONIST and ADMIN to view this dashboard
        if request.user.role not in ['RECEPTIONIST', 'ADMIN']:
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        date_param = request.query_params.get('date')
        if date_param:
            try:
                target_date = parse_date(date_param)
            except Exception:
                target_date = date.today()
        else:
            target_date = date.today()

        today_appointments = Appointment.objects.filter(
            date=target_date
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
                'patient_id': appt.patient.id,
                'patient_name': patient_user.get_full_name() or patient_user.username,
                'patient_phone': appt.patient.contact or '',
                'doctor_name': f'Dr. {doctor_user.get_full_name() or doctor_user.username}',
                'status': appt.status,
                'reason': appt.reason,
                'appointment_type': appt.appointment_type,
                'estimated_wait_time': appt.estimated_wait_time,
                'date': str(appt.date),
                # Vitals
                'bp': appt.bp or '',
                'heart_rate': appt.heart_rate or '',
                'weight': appt.weight or '',
                'temperature': appt.temperature or '',
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

        # Build profile image URL
        profile_image_url = None
        if patient.profile_image:
            profile_image_url = request.build_absolute_uri(patient.profile_image.url)

        reports = LabReport.objects.filter(patient=patient)
        reports_data = LabReportSerializer(reports, many=True, context={'request': request}).data

        data = {
            'profile': {
                'name':               request.user.get_full_name() or request.user.username,
                'username':           request.user.username,
                'age':                patient.age,
                'contact':            patient.contact,
                'gender':             patient.gender,
                'emergency_contact':  patient.emergency_contact,
                'blood_group':        patient.blood_group,
                'medical_history':    patient.medical_history,
                'allergies':          patient.allergies,
                'current_medication': patient.current_medication,
                'address':            patient.address,
                'profile_image':      profile_image_url,
                'profile_completed':  patient.profile_completed,
            },
            'patients_appointments': AppointmentSerializer(appointments, many=True).data,
            'upcoming_appointment': AppointmentSerializer(upcoming).data if upcoming else None,
            'token_number': upcoming.token_number if upcoming else None,
            'estimated_wait_time': upcoming.estimated_wait_time if upcoming else None,
            'lab_reports': reports_data,
        }
        return Response({'message': 'Success', 'data': data})

class LabReportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            patient = Patient.objects.get(user=request.user)
            reports = LabReport.objects.filter(patient=patient)
            serializer = LabReportSerializer(reports, many=True, context={'request': request})
            return Response({'message': 'Success', 'data': serializer.data})
        except Patient.DoesNotExist:
            return Response({'message': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'message': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LabReportSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(patient=patient)
            return Response({'message': 'Lab report uploaded successfully.', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Validation failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'PATIENT':
            return Response({'message': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            patient = Patient.objects.get(user=request.user)
            report = LabReport.objects.get(pk=pk, patient=patient)
            report.file.delete(save=False)
            report.delete()
            return Response({'message': 'Lab report deleted successfully.'}, status=status.HTTP_200_OK)
        except (Patient.DoesNotExist, LabReport.DoesNotExist):
            return Response({'message': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

