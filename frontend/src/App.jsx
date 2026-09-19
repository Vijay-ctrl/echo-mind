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

  if (!isAuthenticated()) {

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

  if (isAuthenticated()) {

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

  const authenticated =
    isAuthenticated();

  return (
    <BrowserRouter>

      <Routes>

        {/* ==============================
                    LOGIN
                ============================== */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />


        {/* ==============================
                    REGISTER
                ============================== */}

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />


        {/* ==============================
                    FORGOT PASSWORD
                ============================== */}

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />


        {/* ==============================
                    RESET PASSWORD
                ============================== */}

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />


        {/* ==============================
                    CHAT
                ============================== */}

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />


        {/* ==============================
                    DEFAULT
                ============================== */}

        <Route
          path="/"
          element={
            <Navigate
              to={
                authenticated
                  ? "/chat"
                  : "/login"
              }
              replace
            />
          }
        />


        {/* ==============================
                    UNKNOWN ROUTE
                ============================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;