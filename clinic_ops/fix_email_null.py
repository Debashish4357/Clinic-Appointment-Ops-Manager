"""
Run this script via: python manage.py shell < fix_email_null.py
Or: python manage.py shell --command="exec(open('fix_email_null.py').read())"
"""
from django.db import connection

with connection.cursor() as cursor:
    # Step 1: Make the column nullable (allows NULL values)
    cursor.execute("ALTER TABLE users_user ALTER COLUMN email DROP NOT NULL")
    print("Step 1: email column is now nullable.")

    # Step 2: Convert empty strings '' to NULL
    cursor.execute("UPDATE users_user SET email = NULL WHERE email = ''")
    print(f"Step 2: Converted empty email strings to NULL.")

    # Step 3: Add unique constraint (NULL values are exempt from uniqueness)
    # First drop any existing unique index to avoid conflict
    try:
        cursor.execute("DROP INDEX IF EXISTS users_user_email_243f6e77_uniq")
        print("Step 3a: Dropped old unique index (if any).")
    except Exception as e:
        print(f"Step 3a note: {e}")

    cursor.execute("""
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_user_email_unique_idx
        ON users_user (email)
        WHERE email IS NOT NULL
    """)
    print("Step 3: Unique index created on non-null emails.")

print("\n=== Email fix complete! ===")
print("Users without emails store NULL (safe). Duplicate emails will now be rejected.")
