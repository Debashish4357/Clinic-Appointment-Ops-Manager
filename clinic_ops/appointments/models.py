from django.db import models
from users.models import Doctor, Patient


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = 'BOOKED', 'Booked'
        ARRIVED = 'ARRIVED', 'Arrived'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No-Show'

    class AppointmentType(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        FOLLOWUP = 'FOLLOWUP', 'Follow-Up'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField(db_index=True)
    time = models.TimeField()
    token_number = models.PositiveIntegerField()
    estimated_wait_time = models.PositiveIntegerField(help_text='Estimated wait time in minutes')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BOOKED, db_index=True)
    reason = models.TextField(blank=True, help_text='Reason for visit')
    appointment_type = models.CharField(max_length=20, choices=AppointmentType.choices, default=AppointmentType.NORMAL)
    doctor_remark = models.TextField(blank=True, null=True)
    prescription = models.JSONField(null=True, blank=True)
    advice = models.TextField(blank=True, null=True)
    bp = models.CharField(max_length=20, null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    doctor_notes = models.TextField(blank=True, null=True)
    fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'token_number']
        unique_together = ('doctor', 'date', 'token_number')

    def __str__(self):
        return f"Token {self.token_number} | {self.patient} with Dr. {self.doctor} on {self.date}"

class LabReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_reports')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='lab_reports/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} - {self.patient}"
