from django.db import models
from users.models import Doctor, Patient


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = 'BOOKED', 'Booked'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No-Show'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    token_number = models.PositiveIntegerField()
    estimated_wait_time = models.PositiveIntegerField(help_text='Estimated wait time in minutes')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BOOKED)
    doctor_remark = models.TextField(blank=True, null=True)
    prescription = models.TextField(blank=True, null=True)
    advice = models.TextField(blank=True, null=True)
    fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'token_number']
        unique_together = ('doctor', 'date', 'token_number')

    def __str__(self):
        return f"Token {self.token_number} | {self.patient} with Dr. {self.doctor} on {self.date}"
