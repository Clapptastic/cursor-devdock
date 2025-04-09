import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, createTheme, ThemeProvider } from 'react-bootstrap';

// Pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateSurvey from './pages/CreateSurvey';
import SurveyEditor from './pages/SurveyEditor';
import SurveyResponsesPage from './pages/SurveyResponsesPage';
import SurveySharePage from './pages/SurveySharePage';
import SurveyViewPage from './pages/SurveyViewPage';
import NotFoundPage from './pages/NotFoundPage';
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard';
import ParticipantFinder from './pages/ParticipantFinder';
import InterviewQuestionGenerator from './pages/InterviewQuestionGenerator';
import SurveyReportGenerator from './pages/SurveyReportGenerator';

// Components
import AuthGuard from './components/AuthGuard';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';

// Create theme
const theme = createTheme({
  // ... existing theme code ...
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="app-container d-flex flex-column min-vh-100">
          <NavBar />
          
          <main className="flex-grow-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/reset-password" element={<AuthPage resetPassword />} />
              <Route path="/auth/confirm" element={<AuthPage confirmation />} />
              
              {/* Survey public view for respondents */}
              <Route path="/s/:surveyId" element={<SurveyViewPage public />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              
              <Route path="/surveys/create" element={
                <AuthGuard>
                  <CreateSurvey />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/edit" element={
                <AuthGuard>
                  <SurveyEditor />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/responses" element={
                <AuthGuard>
                  <SurveyResponsesPage />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/share" element={
                <AuthGuard>
                  <SurveySharePage />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/view" element={
                <AuthGuard>
                  <SurveyViewPage />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/analytics" element={
                <AuthGuard>
                  <AnalyticsDashboard />
                </AuthGuard>
              } />
              
              <Route path="/participants" element={
                <AuthGuard>
                  <ParticipantFinder />
                </AuthGuard>
              } />
              
              <Route path="/interview-generator" element={
                <AuthGuard>
                  <InterviewQuestionGenerator />
                </AuthGuard>
              } />
              
              <Route path="/surveys/:id/report" element={
                <AuthGuard>
                  <SurveyReportGenerator />
                </AuthGuard>
              } />
              
              {/* Fallback routes */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App; 