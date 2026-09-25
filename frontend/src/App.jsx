import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { isAuthenticated } from "./services/auth";


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


// ==========================================
// PUBLIC ROUTE
// ==========================================

function PublicRoute({ children }) {
  const authenticated = isAuthenticated();

  if (authenticated) {
    return (
      <Navigate
        to="/chat"
        replace
      />
    );
  }

  return children;
}


// ==========================================
// APP
// ==========================================

function App() {
  const authenticated = isAuthenticated();

  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================
            AUTHENTICATION
        ================================== */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
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

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />


        {/* ==================================
            PROTECTED CHAT
        ================================== */}

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />


        {/* ==================================
            ROOT
        ================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to={authenticated ? "/chat" : "/login"}
              replace
            />
          }
        />


        {/* ==================================
            UNKNOWN ROUTES
        ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={authenticated ? "/chat" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;