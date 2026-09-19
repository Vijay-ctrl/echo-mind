import { useState } from "react";
import { Link } from "react-router-dom";
import {
   Mail,
   ArrowLeft,
   LoaderCircle,
} from "lucide-react";

import { forgotPassword } from "../services/api";

import "./ForgotPassword.css";


function ForgotPassword() {
   const [email, setEmail] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const [errorMessage, setErrorMessage] = useState("");
   const [successMessage, setSuccessMessage] = useState("");


   const handleSubmit = async (event) => {
      event.preventDefault();

      setErrorMessage("");
      setSuccessMessage("");

      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
         setErrorMessage(
            "Please enter your email address."
         );
         return;
      }

      setIsLoading(true);

      try {
         const response = await forgotPassword(
            trimmedEmail
         );

         setSuccessMessage(
            response?.message ||
            "If an account exists for that email, a password reset link has been sent."
         );

         setEmail("");

      } catch (error) {
         console.error(
            "Forgot password error:",
            error
         );

         setErrorMessage(
            error?.message ||
            "Unable to process your request. Please try again."
         );

      } finally {
         setIsLoading(false);
      }
   };


   return (
      <main className="forgot-password-page">

         <section
            className="forgot-password-card"
            aria-labelledby="forgot-password-title"
         >

            {/* =========================================
                HEADER
            ========================================== */}

            <div className="forgot-password-header">

               <div
                  className="forgot-password-icon"
                  aria-hidden="true"
               >
                  <Mail size={26} />
               </div>

               <h1 id="forgot-password-title">
                  Forgot Password?
               </h1>

               <p>
                  Enter your email address and we'll
                  send you a link to reset your password.
               </p>

            </div>


            {/* =========================================
                ERROR MESSAGE
            ========================================== */}

            {errorMessage && (
               <div
                  className="forgot-password-message forgot-error"
                  role="alert"
                  aria-live="assertive"
               >
                  {errorMessage}
               </div>
            )}


            {/* =========================================
                SUCCESS MESSAGE
            ========================================== */}

            {successMessage && (
               <div
                  className="forgot-password-message forgot-success"
                  role="status"
                  aria-live="polite"
               >
                  {successMessage}
               </div>
            )}


            {/* =========================================
                FORM
            ========================================== */}

            <form
               onSubmit={handleSubmit}
               className="forgot-password-form"
               noValidate
            >

               <div className="forgot-form-group">

                  <label htmlFor="forgot-email">
                     Email address
                  </label>

                  <div className="forgot-email-wrapper">

                     <Mail
                        className="forgot-email-icon"
                        size={18}
                        aria-hidden="true"
                     />

                     <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                           setEmail(event.target.value)
                        }
                        placeholder="Enter your email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck="false"
                        disabled={isLoading}
                        required
                        aria-invalid={
                           Boolean(errorMessage)
                        }
                     />

                  </div>

               </div>


               {/* =========================================
                   SUBMIT BUTTON
               ========================================== */}

               <button
                  type="submit"
                  className="forgot-password-submit"
                  disabled={isLoading}
               >

                  {isLoading ? (
                     <>
                        <LoaderCircle
                           className="forgot-password-spinner"
                           size={18}
                           aria-hidden="true"
                        />

                        <span>
                           Sending...
                        </span>
                     </>
                  ) : (
                     "Send Reset Link"
                  )}

               </button>

            </form>


            {/* =========================================
                BACK TO LOGIN
            ========================================== */}

            <div className="forgot-password-footer">

               <Link
                  to="/login"
                  className="forgot-back-link"
               >
                  <ArrowLeft
                     size={16}
                     aria-hidden="true"
                  />

                  <span>
                     Back to Login
                  </span>
               </Link>

            </div>

         </section>

      </main>
   );
}


export default ForgotPassword;