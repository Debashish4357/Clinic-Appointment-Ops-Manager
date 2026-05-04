from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        print(f"[AUTH] Attempting authenticate for: {username}")
        # We check both email and username. 'username' kwarg may contain an email address.
        try:
            user = User.objects.get(email__iexact=username)
            print(f"[AUTH] Found user by email: {user.username}")
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=username)
                print(f"[AUTH] Found user by username: {user.username}")
            except User.DoesNotExist:
                print(f"[AUTH] No user found for: {username}")
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            print(f"[AUTH] Password match for: {user.username}")
            return user
        print(f"[AUTH] Password MISMATCH for: {user.username}")
        return None
