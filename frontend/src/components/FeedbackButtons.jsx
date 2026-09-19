import { useEffect, useState } from "react";
import { submitFeedback } from "../services/api";
import "./FeedbackButtons.css";

function FeedbackButtons({
   chatId,
   messageId,
   currentFeedback = null,
}) {
   const [feedback, setFeedback] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   /*
      Keep backend feedback synchronized if needed,
      but do not visually keep the button active.
   */
   useEffect(() => {
      setFeedback(null);
   }, [currentFeedback]);

   const handleFeedback = async (type) => {
      if (loading) return;

      setLoading(true);
      setError("");

      try {
         /*
            Save feedback to backend/database
         */
         await submitFeedback(
            chatId,
            messageId,
            type
         );

         /*
            Feedback has been successfully saved.
            Do NOT keep the button active.
         */
         setFeedback(null);

         console.log(
            `✅ ${type} feedback saved successfully.`
         );
      } catch (err) {
         console.error(
            "❌ Failed to submit feedback:",
            err
         );

         setError(
            err.message ||
            "Failed to submit feedback."
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="feedback-container">

         <button
            type="button"
            className={`feedback-button ${feedback === "positive"
                  ? "active positive"
                  : ""
               }`}
            onClick={() =>
               handleFeedback("positive")
            }
            disabled={loading}
            aria-label="Good response"
            title="Good response"
         >
            👍
         </button>

         <button
            type="button"
            className={`feedback-button ${feedback === "negative"
                  ? "active negative"
                  : ""
               }`}
            onClick={() =>
               handleFeedback("negative")
            }
            disabled={loading}
            aria-label="Bad response"
            title="Bad response"
         >
            👎
         </button>

         {error && (
            <span
               className="feedback-error"
               role="alert"
            >
               {error}
            </span>
         )}

      </div>
   );
}

export default FeedbackButtons;