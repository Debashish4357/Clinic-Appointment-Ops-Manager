from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name  = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

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
