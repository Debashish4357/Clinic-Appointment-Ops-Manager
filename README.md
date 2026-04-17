# Clinic Appointment Ops Manager 🏥

A robust, full-stack clinic management system designed for seamless patient flow, role-based dashboards, and real-time queue management.

---
---

## 🚀 Overview

**Clinic Appointment Ops Manager** is a complete solution for clinics to manage appointments, patient records, and doctor schedules. It features a sophisticated token-based queue system, smart wait-time estimation, and dedicated dashboards for Admin, Doctors, Receptionists, and Patients.

---

Deploy Link-
https://clinic-frontend-49mz.onrender.com


## ✨ Key Features

### 🔐 Secure Authentication
- **JWT-Based Auth**: Secure login and signup using SimpleJWT.
- **Role-Based Access Control (RBAC)**: Specific views and permissions for **Admin, Doctor, Receptionist, and Patient**.

### 👥 Role-Specific Dashboards
- **👨‍⚕️ Doctor Dashboard**: View today's schedule, mark patients as arrived/completed, and manage prescriptions/medical notes in real-time.
- **🏢 Receptionist Dashboard**: Manage the "Token Queue," perform patient check-ins (ARRIVED) and check-outs, and reorder the queue with simple Up/Down controls.
- **👤 Patient Portal**: Complete one-time medical profiles, book appointments (New or Follow-up), and track live token status and estimated wait times.
- **⚙️ Admin Panel**: Oversight of all users, doctor performance, and clinic revenue analytics.

### 📅 Smart Appointment System
- **Token-Based Queue**: Automated token generation per doctor, per day.
- **Wait Time Estimation**: Dynamically calculates wait times based on the queue status.
- **Queue Management**: Specialized flow: `BOOKED` → `ARRIVED` (Check-in) → `COMPLETED` (Check-out).

---

## 🛠 Tech Stack

### Backend
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: PostgreSQL  , SQL lite
- **Auth**: SimpleJWT (JSON Web Tokens)
- **Logic**: Custom ORM queries for queue management and analytics.

### Frontend
- **Library**: React (Vite)
- **Styling**: Tailwind CSS
- **API Client**: Axios (with custom interceptors for JWT handling)
- **Routing**: React Router DOM

---

## 📂 Project Structure

```text
Clinic appointment/
├── clinic_ops/             # Django Backend
│   ├── appointments/       # Appointment logic, models, and views
│   ├── users/              # Custom User & Profile models
│   └── clinic_ops/         # Main settings & URL config
├── frontend/               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI & Dashboards
│   │   ├── pages/          # Login, Signup, Appointments
│   │   └── services/       # API & Auth service logic (Axios)
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.x
- Node.js & npm
- PostgreSQL

### 2. Backend Setup
```bash
# Navigate to backend
cd clinic_ops

# Install dependencies
pip install -r requirements.txt

# Configure Database in clinic_ops/settings.py (Postgres)

# Run Migrations
python manage.py makemigrations
python manage.py migrate

# Start Server
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Dev Server
npm run dev
```

---

## 📸 API Reference Highlights
- `POST /api/token/`: Get Access & Refresh tokens.
- `GET /api/dashboard/doctor/`: Doctor status and today's queue.
- `PATCH /api/appointments/{id}/move/`: Receptionist reorders the queue.
- `POST /api/patient/profile/`: One-time patient medical history setup.

---

## 📝 License
This project is for educational and operational demonstration purposes.

---

*Built with ❤️ by [Your Name/Repo Owner]*

## 🚀 Overview

**Clinic Appointment Ops Manager** is a complete solution for clinics to manage appointments, patient records, and doctor schedules. It features a sophisticated token-based queue system, smart wait-time estimation, and dedicated dashboards for Admin, Doctors, Receptionists, and Patients.

---

## ✨ Key Features

### 🔐 Secure Authentication
- **JWT-Based Auth**: Secure login and signup using SimpleJWT.
- **Role-Based Access Control (RBAC)**: Specific views and permissions for **Admin, Doctor, Receptionist, and Patient**.

### 👥 Role-Specific Dashboards
- **👨‍⚕️ Doctor Dashboard**: View today's schedule, mark patients as arrived/completed, and manage prescriptions/medical notes in real-time.
- **🏢 Receptionist Dashboard**: Manage the "Token Queue," perform patient check-ins (ARRIVED) and check-outs, and reorder the queue with simple Up/Down controls.
- **👤 Patient Portal**: Complete one-time medical profiles, book appointments (New or Follow-up), and track live token status and estimated wait times.
- **⚙️ Admin Panel**: Oversight of all users, doctor performance, and clinic revenue analytics.

### 📅 Smart Appointment System
- **Token-Based Queue**: Automated token generation per doctor, per day.
- **Wait Time Estimation**: Dynamically calculates wait times based on the queue status.
- **Queue Management**: Specialized flow: `BOOKED` → `ARRIVED` (Check-in) → `COMPLETED` (Check-out).

---

## 🛠 Tech Stack

### Backend
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: PostgreSQL
- **Auth**: SimpleJWT (JSON Web Tokens)
- **Logic**: Custom ORM queries for queue management and analytics.

### Frontend
- **Library**: React (Vite)
- **Styling**: Tailwind CSS
- **API Client**: Axios (with custom interceptors for JWT handling)
- **Routing**: React Router DOM

---

## 📂 Project Structure

```text
Clinic appointment/
├── clinic_ops/             # Django Backend
│   ├── appointments/       # Appointment logic, models, and views
│   ├── users/              # Custom User & Profile models
│   └── clinic_ops/         # Main settings & URL config
├── frontend/               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI & Dashboards
│   │   ├── pages/          # Login, Signup, Appointments
│   │   └── services/       # API & Auth service logic (Axios)
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.x
- Node.js & npm
- PostgreSQL

### 2. Backend Setup
```bash
# Navigate to backend
cd clinic_ops

# Install dependencies
pip install -r requirements.txt

# Configure Database in clinic_ops/settings.py (Postgres)

# Run Migrations
python manage.py makemigrations
python manage.py migrate

# Start Server
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Dev Server
npm run dev
```

---

## 📸 API Reference Highlights
- `POST /api/token/`: Get Access & Refresh tokens.
- `GET /api/dashboard/doctor/`: Doctor status and today's queue.
- `PATCH /api/appointments/{id}/move/`: Receptionist reorders the queue.
- `POST /api/patient/profile/`: One-time patient medical history setup.

---

## 📝 License
This project is for educational and operational demonstration purposes.

---

*Built with ❤️ by [Your Name/Repo Owner]*
