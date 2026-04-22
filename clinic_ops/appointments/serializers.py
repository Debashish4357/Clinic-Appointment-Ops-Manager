from rest_framework import serializers
from .models import Appointment, LabReport


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name  = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    contact      = serializers.SerializerMethodField()  # Fix 5: QueuePage searches by contact

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['token_number', 'estimated_wait_time', 'created_at']

    def get_doctor_name(self, obj):
        try:
            u = obj.doctor.user
            return u.get_full_name() or u.username
        except Exception:
            return None

    def get_patient_name(self, obj):
        try:
            u = obj.patient.user
            return u.get_full_name() or u.username
        except Exception:
            return None

    def get_contact(self, obj):
        try:
            return obj.patient.contact or ''
        except Exception:
            return ''

class LabReportSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LabReport
        fields = ['id', 'patient', 'title', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ['patient', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
