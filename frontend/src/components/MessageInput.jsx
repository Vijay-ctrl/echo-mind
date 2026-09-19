import { useState } from "react";
import { Send } from "lucide-react";

import "./MessageInput.css";


const MAX_MESSAGE_LENGTH = 4000;


function MessageInput({
   onSendMessage,
   disabled = false,
}) {

   const [message, setMessage] = useState("");


   // ==========================================
   // SUBMIT MESSAGE
   // ==========================================

   const handleSubmit = (event) => {

      event.preventDefault();

      const trimmedMessage = message.trim();


      // Prevent empty messages
      if (!trimmedMessage) {
         return;
      }


      // Prevent sending while loading
      if (disabled) {
         return;
      }


      // Safety check
      if (typeof onSendMessage !== "function") {

         console.error(
            "MessageInput: onSendMessage is not a function."
         );

         return;
      }


      try {

         // Send message to parent
         onSendMessage(trimmedMessage);

         // Clear input after successful call
         setMessage("");

      } catch (error) {

         console.error(
            "MessageInput: Failed to send message.",
            error
         );

      }

   };


   // ==========================================
   // KEYBOARD HANDLING
   //
   // Enter       → Send
   // Shift+Enter → New line
   // ==========================================

   const handleKeyDown = (event) => {

      if (
         event.key === "Enter" &&
         !event.shiftKey
      ) {

         event.preventDefault();

         handleSubmit(event);

      }

   };


   // ==========================================
   // HANDLE INPUT
   // ==========================================

   const handleChange = (event) => {

      const value = event.target.value;


      // Prevent values above maximum length
      if (
         value.length >
         MAX_MESSAGE_LENGTH
      ) {
         return;
      }


      setMessage(value);

   };


   // ==========================================
   // DERIVED VALUES
   // ==========================================

   const trimmedMessage = message.trim();


   const canSend =
      !disabled &&
      trimmedMessage.length > 0;


   const characterCount =
      message.length;


   const remainingCharacters =
      MAX_MESSAGE_LENGTH - characterCount;


   const isNearLimit =
      characterCount >=
      MAX_MESSAGE_LENGTH * 0.9;


   const isAtLimit =
      characterCount >=
      MAX_MESSAGE_LENGTH;


   return (

      <div className="input-container">


         {/* =====================================
             MESSAGE FORM
         ===================================== */}

         <form
            className="message-input-wrapper"
            onSubmit={handleSubmit}
         >

            <textarea
               value={message}

               onChange={handleChange}

               onKeyDown={handleKeyDown}

               placeholder={
                  disabled
                     ? "EchoMind is thinking..."
                     : "Ask me anything..."
               }

               className="message-input"

               disabled={disabled}

               rows={1}

               maxLength={MAX_MESSAGE_LENGTH}

               aria-label="Message input"

               aria-describedby="
                  message-input-hint
                  message-character-count
               "

               aria-disabled={disabled}

               autoComplete="off"

               spellCheck="true"
            />


            {/* =================================
                SEND BUTTON
            ================================= */}

            <button
               className="send-btn"

               type="submit"

               disabled={!canSend}

               aria-label={
                  disabled
                     ? "Sending message"
                     : "Send message"
               }

               title={
                  disabled
                     ? "Please wait for the response"
                     : "Send message"
               }
            >

               <Send
                  size={18}
                  aria-hidden="true"
               />

            </button>

         </form>


         {/* =====================================
             INPUT FOOTER
         ===================================== */}

         <div className="input-footer">


            {/* =================================
                KEYBOARD HINT
            ================================= */}

            <p
               id="message-input-hint"
               className="input-hint"
            >
               Enter to send
               {" • "}
               Shift + Enter for a new line
            </p>


            {/* =================================
                CHARACTER COUNT
            ================================= */}

            <span
               id="message-character-count"

               className={[
                  "character-count",
                  isNearLimit
                     ? "character-warning"
                     : "",
                  isAtLimit
                     ? "character-limit"
                     : "",
               ]
                  .filter(Boolean)
                  .join(" ")}

               aria-live="polite"

               aria-label={`${characterCount} of ${MAX_MESSAGE_LENGTH} characters used`}
            >
               {characterCount}/{MAX_MESSAGE_LENGTH}
            </span>

         </div>

      </div>

   );

}


export default MessageInput;