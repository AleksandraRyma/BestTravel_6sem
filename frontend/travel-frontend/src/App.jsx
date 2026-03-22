import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OAuthCallback from "./pages/auth/OAuthCallback";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";

import TourGuigeHomePage from "./pages/guide/TourGuigeHomePage";
import CreateTourPage from "./pages/guide/CreateTourPage";
import RequestsPage from "./pages/guide/RequestsPage";
import SchedulePage from "./pages/guide/SchedulePage";
import MessagesPage from "./pages/guide/MessagesPage";
import StatsPage from "./pages/guide/StatsPage";
import ReportPage from "./pages/guide/ReportPage";

import TravelerHomePage from "./pages/traveler/TravelerHomePage";
import TravelerProfilePage from "./pages/traveler/TravelerProfilePage";
import TravelerRoutesPage from "./pages/traveler/TravelerRoutesPage";
import TravelerRouteDetailPage from "./pages/traveler/TravelerRouteDetailPage";
import TravelerCreateRoutePage from "./pages/traveler/TravelerCreateRoutePage";
import TravelerCalendarPage from "./pages/traveler/TravelerCalendarPage";
import TravelerRecommendedPage from "./pages/traveler/TravelerRecommendedPage";
import TravelerFavoritesPage from "./pages/traveler/TravelerFavoritesPage";
import TravelerNotificationsPage from "./pages/traveler/TravelerNotificationsPage";
import TravelerCollaborationPage from "./pages/traveler/TravelerCollaborationPage";
import TravelerSearchPage from "./pages/traveler/TravelerSearchPage";
import TravelerReviewPage from "./pages/traveler/TravelerReviewPage";

import PrivateRoute from "./routes/PrivateRoute";

function App() {

  return (

    <Router>

      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/oauth-callback" element={<OAuthCallback />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/traveler"
          element={
            <PrivateRoute>
              <TravelerHomePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/guide"
          element={
            <PrivateRoute>
              <TourGuigeHomePage />
            </PrivateRoute>
          }
        />

  <Route path="/guide/create-tour" element={<CreateTourPage />} />
  <Route path="/guide/requests" element={<RequestsPage />} />
  <Route path="/guide/schedule" element={<SchedulePage />} />
  <Route path="/guide/messages" element={<MessagesPage />} />
  <Route path="/guide/stats" element={<StatsPage />} />
  <Route path="/guide/report" element={<ReportPage />} />


<Route path="/traveler/profile" element={<PrivateRoute><TravelerProfilePage /></PrivateRoute>} />
<Route path="/traveler/my-routes" element={<PrivateRoute><TravelerRoutesPage /></PrivateRoute>} />
<Route path="/traveler/routes" element={<PrivateRoute><TravelerRoutesPage /></PrivateRoute>} />
<Route path="/traveler/routes/:id" element={<PrivateRoute><TravelerRouteDetailPage /></PrivateRoute>} />
<Route path="/traveler/routes/:id/edit"
          element={<PrivateRoute><TravelerCreateRoutePage /></PrivateRoute>} />

<Route path="/traveler/create-route" element={<PrivateRoute><TravelerCreateRoutePage /></PrivateRoute>} />
<Route path="/traveler/calendar" element={<PrivateRoute><TravelerCalendarPage /></PrivateRoute>} />
<Route path="/traveler/recommended" element={<PrivateRoute><TravelerRecommendedPage /></PrivateRoute>} />
<Route path="/traveler/favorites" element={<PrivateRoute><TravelerFavoritesPage /></PrivateRoute>} />
<Route path="/traveler/notifications" element={<PrivateRoute><TravelerNotificationsPage /></PrivateRoute>} />
<Route path="/traveler/collaboration" element={<PrivateRoute><TravelerCollaborationPage /></PrivateRoute>} />
<Route path="/traveler/search" element={<PrivateRoute><TravelerSearchPage /></PrivateRoute>} />
<Route path="/traveler/review/:routeId" element={<PrivateRoute><TravelerReviewPage /></PrivateRoute>} />



      </Routes>


    </Router>

  );

}

export default App;