import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
   LogIn,
   Sparkles,
   Eye,
   EyeOff,
} from "lucide-react";

import { loginUser } from "../services/api";
import { saveAuth } from "../services/auth";

import "./Login.css";
import "./Auth.css";

function Login() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const [showPassword, setShowPassword] = useState(false);

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState("");

   const handleSubmit = async (event) => {
      event.preventDefault();

      setError("");

      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password) {
         setError("Please enter your email and password.");
         return;
      }

      setIsLoading(true);

      try {
         const data = await loginUser(
            trimmedEmail,
            password
         );

         saveAuth(
            data.access_token,
            data.user
         );

         navigate("/chat", {
            replace: true,
         });
      } catch (error) {
         console.error("Login error:", error);

         setError(
            error?.message ||
            "Unable to login. Please try again."
         );
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <main className="auth-page">
         <section
            className="auth-card"
            aria-labelledby="login-title"
         >
            <div className="auth-header">
               <div
                  className="auth-logo"
                  aria-hidden="true"
               >
                  <Sparkles size={27} />
               </div>

               <h1 id="login-title">
                  Welcome back
               </h1>

               <p>
                  Sign in to continue to EchoMind.
               </p>
            </div>

            <form
               className="auth-form"
               onSubmit={handleSubmit}
               noValidate
            >
               <div className="form-group">
                  <label htmlFor="email">
                     Email
                  </label>

                  <input
                     id="email"
                     name="email"
                     type="email"
                     placeholder="Enter your email"
                     value={email}
                     onChange={(event) =>
                        setEmail(event.target.value)
                     }
                     autoComplete="email"
                     autoCapitalize="none"
                     spellCheck="false"
                     disabled={isLoading}
                     required
                  />
               </div>

               <div className="form-group">
                  <label htmlFor="password">
                     Password
                  </label>

                  <div className="password-input-wrapper">
                     <input
                        id="password"
                        name="password"
                        type={
                           showPassword
                              ? "text"
                              : "password"
                        }
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                           setPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                     />

                     <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                           setShowPassword(
                              (previous) => !previous
                           )
                        }
                        disabled={isLoading}
                        aria-label={
                           showPassword
                              ? "Hide password"
                              : "Show password"
                        }
                        title={
                           showPassword
                              ? "Hide password"
                              : "Show password"
                        }
                     >
                        {showPassword ? (
                           <EyeOff
                              size={19}
                              aria-hidden="true"
                           />
                        ) : (
                           <Eye
                              size={19}
                              aria-hidden="true"
                           />
                        )}
                     </button>
                  </div>
               </div>

               {/* Forgot Password */}
               <div className="forgot-password-row">
                  <Link to="/forgot-password">
                     Forgot password?
                  </Link>
               </div>

               {error && (
                  <div
                     className="auth-error"
                     role="alert"
                     aria-live="polite"
                  >
                     {error}
                  </div>
               )}

               <button
                  type="submit"
                  className="auth-submit"
                  disabled={isLoading}
               >
                  {isLoading ? (
                     <>
                        <span
                           className="auth-spinner"
                           aria-hidden="true"
                        />
                        Signing in...
                     </>
                  ) : (
                     <>
                        <LogIn
                           size={17}
                           aria-hidden="true"
                        />
                        Sign in
                     </>
                  )}
               </button>
            </form>

            <div className="auth-divider">
               <span>or</span>
            </div>

            <p className="auth-switch">
               Don't have an account?{" "}
               <Link to="/register">
                  Create account
               </Link>
            </p>
         </section>
      </main>
   );
}

export default Login;