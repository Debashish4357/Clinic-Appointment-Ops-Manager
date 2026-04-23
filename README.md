# Clinic Appointment Ops Manager 🏥

A comprehensive Clinic Management System designed to streamline patient workflows, doctor consultations, and administrative tasks. Built with **Django REST Framework** and **React**.

## 🌟 Key Features

### 👨‍⚕️ Doctor Dashboard
- **Queue Management:** Real-time view of today's patients.
- **Digital Prescriptions (Rx):** Create and edit prescriptions with medication, dosage, and frequency.
- **Patient History:** Quick access to medical history, allergies, and past visit summaries.
- **Availability Toggle:** Set "Active" or "Inactive" status directly from the dashboard.

### 📋 Receptionist Dashboard
- **Walk-in Registration:** Register new patients instantly with comprehensive medical profiles (Address, Insurance, History).
- **Appointment Booking:** Manage slots for different doctors.
- **Smart Queue:** Reorder appointments and adjust estimated wait times.
- **Doctor Directory:** Manage doctor accounts and their consulting fees.

### 👤 Patient Portal
- **Profile Management:** Update personal and medical information.
- **Booking:** Select doctors and time slots.
- **Visit History:** View past prescriptions and doctor feedback.

---

## 🛠️ Tech Stack

- **Backend:** Django, Django REST Framework, SQLite (Local) / PostgreSQL (Production)
- **Frontend:** React, Tailwind CSS, Vite
- **Auth:** JWT (JSON Web Tokens)
- **Deployment:** Render (Backend), Vercel/Netlify (Frontend)

---

## 🚀 Local Setup

### Backend (clinic_ops)
1. **Navigate to backend:**
   ```bash
   cd clinic_ops
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Start server:**
   ```bash
   python manage.py runserver
   ```

### Frontend (frontend)
1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start development server:**
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment (Render)

### Environment Variables
Set these variables in your Render Web Service:
- `DATABASE_URL`: Your PostgreSQL Connection String (Use **External URL** for build stability).
- `SECRET_KEY`: A unique random string.
- `DEBUG`: `False`
- `CORS_ALLOWED_ORIGINS`: Your frontend URL.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: For automatic admin creation.

### Start Command
```bash
python manage.py migrate && python manage.py create_admin && gunicorn clinic_ops.wsgi
```

---

## 🔑 Admin Credentials
To create your first admin account without using a shell:
1. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your Environment Variables.
2. The `create_admin` command in the Start Command will automatically create the account if it doesn't exist.

---

## 📄 License
This project is for clinical operational management and private clinic use.
