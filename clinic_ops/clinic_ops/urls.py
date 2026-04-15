from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

def home(request):
    return HttpResponse("Clinic Appointment Backend Running 🚀")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    # Auth: /api/token/, /api/token/refresh/
    path('api/', include('users.urls')),

    # Appointments: /api/appointments/, /api/appointments/<id>/
    # Analytics:    /api/analytics/daily-patients/, /api/analytics/revenue/
    path('api/', include('appointments.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
