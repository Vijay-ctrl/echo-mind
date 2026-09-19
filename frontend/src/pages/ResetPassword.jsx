import { useEffect, useState } from "react";
import {
   Link,
   useNavigate,
   useSearchParams,
} from "react-router-dom";

import {
   ArrowLeft,
   CheckCircle,
   Eye,
   EyeOff,
   Lock,
   LoaderCircle,
} from "lucide-react";

import { resetPassword } from "../services/api";

import "./ResetPassword.css";


function ResetPassword() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();

   const token = searchParams.get("token");

   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] =
      useState("");

   const [showPassword, setShowPassword] =
      useState(false);

   const [showConfirmPassword, setShowConfirmPassword] =
      useState(false);

   const [isLoading, setIsLoading] = useState(false);

   const [errorMessage, setErrorMessage] =
      useState("");

   const [successMessage, setSuccessMessage] =
      useState("");


   /*
    * Redirect to login after successful reset.
    * Cleanup prevents the timer from running after
    * the component has been unmounted.
    */
   useEffect(() => {
      if (!successMessage) {
         return undefined;
      }

      const redirectTimer = setTimeout(() => {
         navigate("/login", {
            replace: true,
         });
      }, 1500);

      return () => {
         clearTimeout(redirectTimer);
      };
   }, [successMessage, navigate]);


   const handleSubmit = async (event) => {
      event.preventDefault();

      setErrorMessage("");
      setSuccessMessage("");

      /*
       * Validate reset token first.
       */
      if (!token) {
         setErrorMessage(
            "This password reset link is invalid or missing."
         );
         return;
      }

      /*
       * Validate password fields.
       */
      if (!password || !confirmPassword) {
         setErrorMessage(
            "Please fill in both password fields."
         );
         return;
      }

      /*
       * Validate password length.
       */
      if (password.length < 8) {
         setErrorMessage(
            "Password must contain at least 8 characters."
         );
         return;
      }

      /*
       * Validate password confirmation.
       */
      if (password !== confirmPassword) {
         setErrorMessage(
            "Passwords do not match."
         );
         return;
      }

      setIsLoading(true);

      try {
         const response = await resetPassword(
            token,
            password
         );

         setSuccessMessage(
            response?.message ||
            "Password reset successful. You can now log in."
         );

         setPassword("");
         setConfirmPassword("");

      } catch (error) {
         console.error(
            "Reset password error:",
            error
         );

         setErrorMessage(
            error?.message ||
            "Unable to reset your password. The link may have expired."
         );

      } finally {
         setIsLoading(false);
      }
   };


   return (
      <main className="reset-password-page">

         <section
            className="reset-password-card"
            aria-labelledby="reset-password-title"
         >

            {/* =========================================
                HEADER
            ========================================== */}

            <div className="reset-password-header">

               <div
                  className="reset-password-icon"
                  aria-hidden="true"
               >
                  <Lock size={26} />
               </div>

               <h1 id="reset-password-title">
                  Reset Password
               </h1>

               <p>
                  Create a new password for your
                  EchoMind account.
               </p>

            </div>


            {/* =========================================
                ERROR MESSAGE
            ========================================== */}

            {errorMessage && (
               <div
                  className="reset-password-message reset-error"
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
                  className="reset-password-message reset-success"
                  role="status"
                  aria-live="polite"
               >
                  <CheckCircle
                     size={18}
                     aria-hidden="true"
                  />

                  <span>
                     {successMessage}
                  </span>
               </div>
            )}


            {/* =========================================
                FORM
            ========================================== */}

            <form
               onSubmit={handleSubmit}
               className="reset-password-form"
               noValidate
            >

               {/* =====================================
                   NEW PASSWORD
               ====================================== */}

               <div className="reset-form-group">

                  <label htmlFor="reset-password">
                     New Password
                  </label>

                  <div className="reset-password-input-wrapper">

                     <input
                        id="reset-password"
                        name="new-password"
                        type={
                           showPassword
                              ? "text"
                              : "password"
                        }
                        value={password}
                        onChange={(event) =>
                           setPassword(
                              event.target.value
                           )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={
                           isLoading ||
                           Boolean(successMessage)
                        }
                        required
                        minLength={8}
                        aria-invalid={
                           Boolean(errorMessage)
                        }
                     />

                     <button
                        type="button"
                        className="reset-password-toggle"
                        onClick={() =>
                           setShowPassword(
                              (previous) =>
                                 !previous
                           )
                        }
                        disabled={
                           isLoading ||
                           Boolean(successMessage)
                        }
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

               </div>


               {/* =====================================
                   CONFIRM PASSWORD
               ====================================== */}

               <div className="reset-form-group">

                  <label htmlFor="confirm-reset-password">
                     Confirm Password
                  </label>

                  <div className="reset-password-input-wrapper">

                     <input
                        id="confirm-reset-password"
                        name="confirm-password"
                        type={
                           showConfirmPassword
                              ? "text"
                              : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) =>
                           setConfirmPassword(
                              event.target.value
                           )
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={
                           isLoading ||
                           Boolean(successMessage)
                        }
                        required
                        minLength={8}
                        aria-invalid={
                           Boolean(errorMessage)
                        }
                     />

                     <button
                        type="button"
                        className="reset-password-toggle"
                        onClick={() =>
                           setShowConfirmPassword(
                              (previous) =>
                                 !previous
                           )
                        }
                        disabled={
                           isLoading ||
                           Boolean(successMessage)
                        }
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


               {/* =====================================
                   SUBMIT
               ====================================== */}

               <button
                  type="submit"
                  className="reset-password-submit"
                  disabled={
                     isLoading ||
                     !token ||
                     Boolean(successMessage)
                  }
               >
                  {isLoading ? (
                     <>
                        <LoaderCircle
                           className="reset-password-spinner"
                           size={18}
                           aria-hidden="true"
                        />

                        <span>
                           Resetting...
                        </span>
                     </>
                  ) : (
                     "Reset Password"
                  )}
               </button>

            </form>


            {/* =========================================
                BACK TO LOGIN
            ========================================== */}

            <div className="reset-password-footer">

               <Link
                  to="/login"
                  className="reset-back-link"
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


export default ResetPassword;