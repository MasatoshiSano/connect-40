import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ProfileCreationProvider } from './contexts/ProfileCreationContext';
import { Home } from './pages/Home';
import { SignUp } from './pages/auth/SignUp';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateProfileStep1 } from './pages/profile/CreateProfileStep1';
import { CreateProfileStep2 } from './pages/profile/CreateProfileStep2';
import { CreateProfileStep3 } from './pages/profile/CreateProfileStep3';
import { CreateProfileSuccess } from './pages/profile/CreateProfileSuccess';
import { EditProfile } from './pages/profile/EditProfile';
import { CreateActivity } from './pages/activities/CreateActivity';
import { Activities } from './pages/activities/Activities';
import { ActivityDetail } from './pages/activities/ActivityDetail';
import { ChatList } from './pages/chat/ChatList';
import { Plans } from './pages/subscription/Plans';

function App() {
  return (
    <BrowserRouter>
      <ProfileCreationProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicRoute redirectIfAuthenticated="/dashboard">
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute redirectIfAuthenticated="/dashboard">
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicRoute redirectIfAuthenticated="/dashboard">
                <VerifyEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute redirectIfAuthenticated="/dashboard">
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Profile creation routes */}
          <Route
            path="/profile/create/step1"
            element={
              <ProtectedRoute>
                <CreateProfileStep1 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/create/step2"
            element={
              <ProtectedRoute>
                <CreateProfileStep2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/create/step3"
            element={
              <ProtectedRoute>
                <CreateProfileStep3 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/create/success"
            element={
              <ProtectedRoute>
                <CreateProfileSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Activity routes */}
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/create"
            element={
              <ProtectedRoute>
                <CreateActivity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/:activityId"
            element={
              <ProtectedRoute>
                <ActivityDetail />
              </ProtectedRoute>
            }
          />

          {/* Chat routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatList />
              </ProtectedRoute>
            }
          />

          {/* Subscription routes */}
          <Route
            path="/subscription/plans"
            element={
              <ProtectedRoute>
                <Plans />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileCreationProvider>
    </BrowserRouter>
  );
}

export default App;
