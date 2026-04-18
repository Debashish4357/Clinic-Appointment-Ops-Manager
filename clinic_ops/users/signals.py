from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model


@receiver(post_migrate)
def create_default_admin(sender, **kwargs):
    """Auto-create the one system admin after every migration if absent."""
    if sender.name != 'users':
        return
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@clinic.local',
            password='admin123',
        )
        print('[signals] Default admin created  →  admin / admin123')
