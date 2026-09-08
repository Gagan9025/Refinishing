# Refinishing Department Production Management System

A full-stack, responsive web application for managing daily production, hourly achievements, employee attendance, and executive monitoring in the refinishing department.

## 🚀 Key Modules
1. **Scanning Production Dashboard**: Real-time hourly piece scanning, target tracking, and pending metrics.
2. **Batch Production Dashboard**: Hourly batch monitoring and target completion analysis.
3. **Employee Attendance Management**: 50-employee roster tracking Present/Absent statuses, total counts, and attendance rates.
4. **HOD Executive Overview**: Comprehensive department analytics, target vs. achievement summaries, and CSV report export.
5. **System Administration**: Role-based access control, user management, and instant data reset.

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore (with local persistent emulator fallback)
- **Export**: Excel Spreadsheet (.xlsx / .xls) & UTF-8 BOM CSV Export Engine

## 💻 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Running Locally
```bash
# Install dependencies
npm install

# Start the server
npm start
```
Open `http://localhost:3000` in your web browser.

### 🔑 Demo Accounts
- **Scanning Supervisor**: `scan.supervisor` / `Scan@123`
- **Batch Supervisor**: `batch.supervisor` / `Batch@123`
- **Dispatch Supervisor (Attendance)**: `dispatch.supervisor` / `Dispatch@123`
- **HOD Overview**: `hod` / `HOD@123`
- **System Admin**: `admin` / `Admin@123`
