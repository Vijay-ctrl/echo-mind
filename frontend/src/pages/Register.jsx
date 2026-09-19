import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
   UserPlus,
   Sparkles,
   Eye,
   EyeOff,
} from "lucide-react";

import { registerUser } from "../services/api";
import { saveAuth } from "../services/auth";

import "./Register.css";
import "./Auth.css";

function Register() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");

   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState("");

   const handleSubmit = async (event) => {
      event.preventDefault();

      setError("");

      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password || !confirmPassword) {
         setError("Please fill in all fields.");
         return;
      }

      if (password.length < 8) {
         setError("Password must be at least 8 characters long.");
         return;
      }

      if (password !== confirmPassword) {
         setError("Passwords do not match.");
         return;
      }

      setIsLoading(true);

      try {
         const data = await registerUser(
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
         console.error("Registration error:", error);

         setError(
            error?.message ||
            "Unable to create your account. Please try again."
         );
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <main className="auth-page register-page">
         <section
            className="auth-card register-card"
            aria-labelledby="register-title"
         >

            {/* Header */}
            <div className="auth-header">
               <div
                  className="auth-logo"
                  aria-hidden="true"
               >
                  <Sparkles size={27} />
               </div>

               <h1 id="register-title">
                  Create your account
               </h1>

               <p>
                  Create an account to save your
                  conversations and use EchoMind.
               </p>
            </div>

            {/* Registration Form */}
            <form
               className="auth-form"
               onSubmit={handleSubmit}
               noValidate
            >

               {/* Email */}
               <div className="form-group">
                  <label htmlFor="register-email">
                     Email
                  </label>

                  <input
                     id="register-email"
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

               {/* Password */}
               <div className="form-group">
                  <label htmlFor="register-password">
                     Password
                  </label>

                  <div className="password-input-wrapper">
                     <input
                        id="register-password"
                        name="password"
                        type={
                           showPassword
                              ? "text"
                              : "password"
                        }
                        placeholder="Create a password"
                        value={password}
                        onChange={(event) =>
                           setPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        disabled={isLoading}
                        minLength={8}
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
                              size={18}
                              aria-hidden="true"
                           />
                        ) : (
                           <Eye
                              size={18}
                              aria-hidden="true"
                           />
                        )}
                     </button>
                  </div>

                  <span className="password-hint">
                     Use at least 8 characters.
                  </span>
               </div>

               {/* Confirm Password */}
               <div className="form-group">
                  <label htmlFor="confirm-password">
                     Confirm password
                  </label>

                  <div className="password-input-wrapper">
                     <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={
                           showConfirmPassword
                              ? "text"
                              : "password"
                        }
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(event) =>
                           setConfirmPassword(
                              event.target.value
                           )
                        }
                        autoComplete="new-password"
                        disabled={isLoading}
                        minLength={8}
                        required
                     />

                     <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                           setShowConfirmPassword(
                              (previous) => !previous
                           )
                        }
                        disabled={isLoading}
                        aria-label={
                           showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                        }
                        title={
                           showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                        }
                     >
                        {showConfirmPassword ? (
                           <EyeOff
                              size={18}
                              aria-hidden="true"
                           />
                        ) : (
                           <Eye
                              size={18}
                              aria-hidden="true"
                           />
                        )}
                     </button>
                  </div>
               </div>

               {/* Error */}
               {error && (
                  <div
                     className="auth-error"
                     role="alert"
                     aria-live="polite"
                  >
                     {error}
                  </div>
               )}

               {/* Submit */}
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

                        Creating account...
                     </>
                  ) : (
                     <>
                        <UserPlus
                           size={17}
                           aria-hidden="true"
                        />

                        Create account
                     </>
                  )}
               </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
               <span>or</span>
            </div>

            {/* Login Link */}
            <p className="auth-switch">
               Already have an account?{" "}

               <Link to="/login">
                  Sign in
               </Link>
            </p>

         </section>
      </main>
   );
}

export default Register;