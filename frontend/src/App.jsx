import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { DepartmentsPage } from './pages/DepartmentsPage.jsx';
import { FaqPage } from './pages/FaqPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { HowItWorksPage } from './pages/HowItWorksPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { TrackGrievancePage } from './pages/TrackGrievancePage.jsx';
import { CitizenDashboardPage } from './pages/citizen/CitizenDashboardPage.jsx';
import { CitizenGrievanceDetailPage } from './pages/citizen/CitizenGrievanceDetailPage.jsx';
import { SubmitGrievancePage } from './pages/citizen/SubmitGrievancePage.jsx';
import { CmoDashboardPage } from './pages/cmo/CmoDashboardPage.jsx';
import { CmoGrievanceDetailPage } from './pages/cmo/CmoGrievanceDetailPage.jsx';
import { OfficerDashboardPage } from './pages/officer/OfficerDashboardPage.jsx';
import { OfficerGrievanceDetailPage } from './pages/officer/OfficerGrievanceDetailPage.jsx';

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/track" element={<TrackGrievancePage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Citizen Portal */}
            <Route
              path="/citizen/dashboard"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <CitizenDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/submit"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <SubmitGrievancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <CitizenGrievanceDetailPage />
                </ProtectedRoute>
              }
            />

            {/* CMO Dashboard */}
            <Route
              path="/cmo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['cmo_admin']}>
                  <CmoDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cmo/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['cmo_admin']}>
                  <CmoGrievanceDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Department Officer Dashboard */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['department_officer']}>
                  <OfficerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['department_officer']}>
                  <OfficerGrievanceDetailPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </PreferencesProvider>
  );
}
