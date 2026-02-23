import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ProfileCreationProvider } from './contexts/ProfileCreationContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { useToastStore } from './stores/toast';
import { useAuthStore } from './stores/auth';
import { Icon } from './components/ui/Icon';

// Eagerly load the Home page (landing page)
import { Home } from './pages/Home';

// Lazy load all other pages for code splitting
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CreateProfileStep1 = lazy(() => import('./pages/profile/CreateProfileStep1').then(m => ({ default: m.CreateProfileStep1 })));
const CreateProfileStep2 = lazy(() => import('./pages/profile/CreateProfileStep2').then(m => ({ default: m.CreateProfileStep2 })));
const CreateProfileStep3 = lazy(() => import('./pages/profile/CreateProfileStep3').then(m => ({ default: m.CreateProfileStep3 })));
const CreateProfileSuccess = lazy(() => import('./pages/profile/CreateProfileSuccess').then(m => ({ default: m.CreateProfileSuccess })));
const EditProfile = lazy(() => import('./pages/profile/EditProfile').then(m => ({ default: m.EditProfile })));
const CreateActivity = lazy(() => import('./pages/activities/CreateActivity').then(m => ({ default: m.CreateActivity })));
const Activities = lazy(() => import('./pages/activities/Activities').then(m => ({ default: m.Activities })));
const ActivityDetail = lazy(() => import('./pages/activities/ActivityDetail').then(m => ({ default: m.ActivityDetail })));
const EditActivity = lazy(() => import('./pages/activities/EditActivity').then(m => ({ default: m.EditActivity })));
const ActivityPaymentSuccess = lazy(() =>
  import('./pages/activities/ActivityPaymentSuccess').then(m => ({ default: m.ActivityPaymentSuccess }))
);
const Chat = lazy(() => import('./pages/chat/Chat').then(m => ({ default: m.Chat })));
const Plans = lazy(() => import('./pages/subscription/Plans').then(m => ({ default: m.Plans })));
const SubscriptionSuccess = lazy(() => import('./pages/subscription/Success').then(m => ({ default: m.Success })));
const UserProfile = lazy(() => import('./pages/profile/UserProfile').then(m => ({ default: m.UserProfile })));
const Discover = lazy(() => import('./pages/discover/Discover').then(m => ({ default: m.Discover })));
const Calendar = lazy(() => import('./pages/calendar/Calendar').then(m => ({ default: m.Calendar })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const VerificationPage = lazy(() =>
  import('./pages/profile/VerificationPage').then(m => ({ default: m.VerificationPage }))
);
const VerificationSuccess = lazy(() =>
  import('./pages/profile/VerificationSuccess').then(m => ({ default: m.VerificationSuccess }))
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Icon name="sync" size="xl" className="text-gold animate-spin" />
  </div>
);

function App() {
  const { toasts, removeToast } = useToastStore();
  const { idToken, userId, nickname, verificationStatus, setUser, setNickname, setVerificationStatus, setChatCredits } = useAuthStore();

  // Extract and set userId from idToken on app initialization
  useEffect(() => {
    if (idToken && !userId) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const extractedUserId = payload.sub;
        if (extractedUserId) {
          setUser(null, extractedUserId);
          console.log('UserId extracted from token:', extractedUserId);
        }
      } catch (e) {
        console.error('Failed to extract userId from idToken:', e);
      }
    }
  }, [idToken, userId, setUser]);

  // Fetch user profile to get nickname
  useEffect(() => {
    const fetchProfile = async () => {
      if (userId && (!nickname || verificationStatus !== 'approved')) {
        try {
          const { getUserProfile } = await import('./services/api');
          const profile = await getUserProfile();
          if (profile.nickname) {
            setNickname(profile.nickname);
            console.log('Nickname loaded:', profile.nickname);
          }
          if (profile.verificationStatus) {
            setVerificationStatus(profile.verificationStatus);
          }
          if (profile.chatCredits !== undefined) {
            setChatCredits(profile.chatCredits);
          }
        } catch (e) {
          console.error('Failed to fetch user profile:', e);
        }
      }
    };

    fetchProfile();
  }, [userId, nickname, verificationStatus, setNickname, setVerificationStatus, setChatCredits]);

  return (
    <BrowserRouter>
      <ProfileCreationProvider>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
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
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
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
          <Route
            path="/profile/verification"
            element={
              <ProtectedRoute>
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/verification/success"
            element={
              <ProtectedRoute>
                <VerificationSuccess />
              </ProtectedRoute>
            }
          />

          {/* User profile route */}
          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Discovery route */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
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
          <Route
            path="/activities/:activityId/edit"
            element={
              <ProtectedRoute>
                <EditActivity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/:activityId/payment/success"
            element={
              <ProtectedRoute>
                <ActivityPaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* Calendar route */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />

          {/* Chat routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:chatRoomId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Subscription routes */}
          <Route
            path="/subscription/plans"
            element={<Plans />}
          />
          <Route
            path="/subscription/success"
            element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            }
          />

          {/* Catch all - 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ProfileCreationProvider>
    </BrowserRouter>
  );
}

export default App;
