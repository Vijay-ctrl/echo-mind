import { getToken } from "./auth";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_URL =
   import.meta.env.VITE_API_URL ||
   "http://127.0.0.1:8000";

const USE_MOCK = false;


// ==========================================
// AUTHORIZATION HEADERS
// ==========================================

function getAuthHeaders() {

   const token = getToken();

   if (!token) {

      throw new Error(
         "You are not logged in."
      );

   }

   return {
      Authorization:
         `Bearer ${token}`,

      "Content-Type":
         "application/json",
   };

}


// ==========================================
// SAFE JSON RESPONSE
// ==========================================

async function getResponseData(response) {

   try {

      return await response.json();

   } catch {

      return {};

   }

}


// ==========================================
// COMMON ERROR MESSAGE
// ==========================================

function getValidationMessage(data) {

   // FastAPI validation errors
   if (
      Array.isArray(data?.detail)
   ) {

      return data.detail
         .map(
            (item) =>
               item?.msg
         )
         .filter(Boolean)
         .join(", ");

   }


   // Custom backend error object
   if (
      data?.detail &&
      typeof data.detail === "object"
   ) {

      return (
         data.detail.message ||
         data.detail.msg ||
         "An unexpected error occurred."
      );

   }


   // Normal string error
   if (
      typeof data?.detail === "string"
   ) {

      return data.detail;

   }


   // Fallback
   if (
      typeof data?.message === "string"
   ) {

      return data.message;

   }


   return null;

}


// ==========================================
// COMMON FETCH ERROR
// ==========================================

function throwNetworkError() {

   throw new Error(
      "Unable to connect to the backend server."
   );

}


// ==========================================
// REGISTER USER
// ==========================================

export async function registerUser(
   email,
   password
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 800)
      );

      return {
         access_token:
            "mock-token",

         token_type:
            "bearer",

         user: {
            id:
               "mock-user-id",

            email,

            created_at:
               new Date().toISOString(),
         },
      };

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/auth/register`,
            {
               method:
                  "POST",

               headers: {
                  "Content-Type":
                     "application/json",
               },

               body:
                  JSON.stringify({
                     email,
                     password,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 409
      ) {

         throw new Error(
            "An account with this email already exists."
         );

      }


      if (
         response.status === 422
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Please enter valid registration details."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Unable to create your account."
      );

   }


   return data;

}


// ==========================================
// LOGIN USER
// ==========================================

export async function loginUser(
   email,
   password
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 800)
      );

      return {
         access_token:
            "mock-token",

         token_type:
            "bearer",

         user: {
            id:
               "mock-user-id",

            email,

            created_at:
               new Date().toISOString(),
         },
      };

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/auth/login`,
            {
               method:
                  "POST",

               headers: {
                  "Content-Type":
                     "application/json",
               },

               body:
                  JSON.stringify({
                     email,
                     password,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Invalid email or password."
         );

      }


      if (
         response.status === 422
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Please enter a valid email and password."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Unable to login. Please try again."
      );

   }


   return data;

}


// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function forgotPassword(
   email
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 800)
      );

      return {
         success:
            true,

         message:
            "If an account exists for that email, a password reset link has been sent.",
      };

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/auth/forgot-password`,
            {
               method:
                  "POST",

               headers: {
                  "Content-Type":
                     "application/json",
               },

               body:
                  JSON.stringify({
                     email,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 422
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Please enter a valid email address."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Unable to send the password reset email. Please try again later."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Unable to process your password reset request."
      );

   }


   return data;

}


// ==========================================
// RESET PASSWORD
// ==========================================

export async function resetPassword(
   token,
   password
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 800)
      );

      return {
         success:
            true,

         message:
            "Password reset successful. You can now log in.",
      };

   }


   if (!token) {

      throw new Error(
         "Password reset token is missing."
      );

   }


   if (!password) {

      throw new Error(
         "Please enter a new password."
      );

   }


   const encodedToken =
      encodeURIComponent(
         token
      );


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/auth/reset-password?token=${encodedToken}`,
            {
               method:
                  "POST",

               headers: {
                  "Content-Type":
                     "application/json",
               },

               body:
                  JSON.stringify({
                     password,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The password reset link is invalid or has expired."
         );

      }


      if (
         response.status === 422
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Please enter a valid password."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Unable to reset your password."
      );

   }


   return data;

}


// ==========================================
// GET CURRENT USER
// ==========================================

export async function getCurrentUser() {

   if (USE_MOCK) {

      return {
         id:
            "mock-user-id",

         email:
            "test@example.com",

         created_at:
            new Date().toISOString(),
      };

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/auth/me`,
            {
               method:
                  "GET",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to load user information."
      );

   }


   return data;

}


// ==========================================
// SEND MESSAGE
// ==========================================
//
// mode:
//
// "auto"   → Automatically detect web search.
// "gemini" → Gemini only.
// "web"    → Always perform web search.
//
// temporary:
//
// false → Normal persistent chat.
// true  → Temporary chat.
//
// ==========================================

export async function sendMessage(
   message,
   chatId = null,
   mode = "auto",
   temporary = false
) {

   // ========================================
   // MOCK MODE
   // ========================================

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 800)
      );

      const mockChatId =
         chatId ||
         "mock-chat-id";


      return {

         chat_id:
            mockChatId,

         user_message_id:
            `mock-user-${Date.now()}`,

         message_id:
            `mock-assistant-${Date.now()}`,

         answer:
            "This is a mock response from the EchoMind.",

         sources:
            mode === "web"
               ? [
                  {
                     title:
                        "Mock Web Source",

                     content:
                        "This is a mock web search result.",

                     url:
                        "https://example.com",
                  },
               ]
               : [],

         used_web_search:
            mode === "web",

         interaction_id:
            null,

         mode,

         temporary:
            Boolean(temporary),

      };

   }


   // ========================================
   // VALIDATE MESSAGE
   // ========================================

   if (
      !message ||
      !message.trim()
   ) {

      throw new Error(
         "Message cannot be empty."
      );

   }


   // ========================================
   // VALIDATE MODE
   // ========================================

   const allowedModes = [
      "auto",
      "gemini",
      "web",
   ];


   if (
      !allowedModes.includes(mode)
   ) {

      throw new Error(
         "Invalid chat mode."
      );

   }


   // ========================================
   // NORMALIZE TEMPORARY FLAG
   // ========================================

   const isTemporary =
      Boolean(temporary);


   // ========================================
   // BUILD REQUEST BODY
   // ========================================

   const body = {

      message:
         message.trim(),

      mode,

      temporary:
         isTemporary,

   };


   // ========================================
   // INCLUDE CHAT ID WHEN AVAILABLE
   // ========================================

   if (chatId) {

      body.chat_id =
         chatId;

   }


   console.log(
      "📤 Sending chat request:",
      {
         chat_id:
            chatId,

         mode,

         temporary:
            isTemporary,
      }
   );


   // ========================================
   // SEND REQUEST
   // ========================================

   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chat`,
            {
               method:
                  "POST",

               headers:
                  getAuthHeaders(),

               body:
                  JSON.stringify(
                     body
                  ),
            }
         );

   } catch {

      throwNetworkError();

   }


   // ========================================
   // READ RESPONSE
   // ========================================

   const data =
      await getResponseData(
         response
      );


   // ========================================
   // HANDLE ERRORS
   // ========================================

   if (!response.ok) {

      if (
         response.status === 429
      ) {

         const errorCode =
            data?.detail?.code;

         if (
            errorCode ===
            "AI_LIMIT_REACHED"
         ) {

            throw new Error(
               "EchoMind has temporarily reached its AI request limit. Please try again later."
            );

         }

         throw new Error(
            getValidationMessage(data) ||
            "EchoMind is temporarily unavailable. Please try again later."
         );

      }


      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Invalid chat request."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Chat endpoint was not found."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to send message."
      );

   }


   // ========================================
   // VALIDATE RESPONSE
   // ========================================

   if (
      !data ||
      typeof data !== "object" ||
      typeof data.answer !== "string"
   ) {

      throw new Error(
         "Backend returned an invalid chat response."
      );

   }


   console.log(
      "📥 Chat response received:",
      {
         chat_id:
            data.chat_id,

         temporary:
            data.temporary,

         used_web_search:
            data.used_web_search,
      }
   );


   return data;

}

// ============================================================
// STREAMING CHAT
// ============================================================

export async function streamMessage(
   message,
   chatId = null,
   mode = "auto",
   temporary = false,
   callbacks = {}
) {
   if (!message || !message.trim()) {
      throw new Error("Message cannot be empty.");
   }

   const allowedModes = ["auto", "gemini", "web"];

   if (!allowedModes.includes(mode)) {
      throw new Error("Invalid chat mode.");
   }

   const {
      onStart = () => { },
      onChunk = () => { },
      onComplete = () => { },
      onError = () => { },
   } = callbacks;

   const body = {
      message: message.trim(),
      mode,
      temporary: Boolean(temporary),
   };

   if (chatId) {
      body.chat_id = chatId;
   }

   console.log("🌊 Starting streaming chat request:", {
      chat_id: chatId,
      mode,
      temporary: Boolean(temporary),
   });

   let response;

   try {
      response = await fetch(
         `${API_URL}/api/chat/stream`,
         {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
         }
      );
   } catch (error) {
      console.error(
         "❌ Network error while starting stream:",
         error
      );

      throwNetworkError();
   }

   // ----------------------------------------------------------
   // Handle HTTP errors before starting the stream
   // ----------------------------------------------------------

   if (!response.ok) {
      const data = await getResponseData(response);

      // -------------------------------------------------------
      // AI LIMIT REACHED
      // -------------------------------------------------------

      if (response.status === 429) {
         const errorCode =
            data?.detail?.code;

         if (
            errorCode ===
            "AI_LIMIT_REACHED"
         ) {
            const error =
               new Error(
                  "EchoMind has temporarily reached its AI request limit. Please try again later."
               );

            console.error(
               "❌ EchoMind AI limit reached."
            );

            onError(
               error,
               data
            );

            throw error;
         }

         const error =
            new Error(
               getValidationMessage(data) ||
               "EchoMind is temporarily unavailable. Please try again later."
            );

         onError(
            error,
            data
         );

         throw error;
      }

      // -------------------------------------------------------
      // UNAUTHORIZED
      // -------------------------------------------------------

      if (response.status === 401) {
         throw new Error(
            "Your session has expired. Please log in again."
         );
      }

      // -------------------------------------------------------
      // BAD REQUEST
      // -------------------------------------------------------

      if (response.status === 400) {
         throw new Error(
            getValidationMessage(data) ||
            "Invalid streaming chat request."
         );
      }

      // -------------------------------------------------------
      // NOT FOUND
      // -------------------------------------------------------

      if (response.status === 404) {
         throw new Error(
            getValidationMessage(data) ||
            "Streaming chat endpoint was not found."
         );
      }

      // -------------------------------------------------------
      // SERVER ERROR
      // -------------------------------------------------------

      if (response.status >= 500) {
         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );
      }

      // -------------------------------------------------------
      // FALLBACK ERROR
      // -------------------------------------------------------

      throw new Error(
         getValidationMessage(data) ||
         "Failed to start streaming response."
      );
   }

   // ----------------------------------------------------------
   // Check streaming support
   // ----------------------------------------------------------

   if (!response.body) {
      throw new Error(
         "Streaming is not supported by this browser."
      );
   }

   const reader =
      response.body.getReader();

   const decoder =
      new TextDecoder("utf-8");

   let buffer = "";

   // ----------------------------------------------------------
   // Process one SSE event
   // ----------------------------------------------------------

   const processEvent = (eventText) => {
      const lines =
         eventText.split(/\r?\n/);

      const dataLines = [];

      for (const line of lines) {

         // Ignore SSE comments
         if (line.startsWith(":")) {
            continue;
         }

         if (line.startsWith("data:")) {
            dataLines.push(
               line
                  .slice(5)
                  .trimStart()
            );
         }
      }

      if (dataLines.length === 0) {
         return;
      }

      const dataText =
         dataLines.join("\n");

      if (!dataText.trim()) {
         return;
      }

      let eventData;

      try {
         eventData =
            JSON.parse(dataText);
      } catch (error) {
         console.error(
            "❌ Failed to parse SSE event:",
            dataText,
            error
         );

         return;
      }

      // -------------------------------------------------------
      // START EVENT
      // -------------------------------------------------------

      if (eventData.type === "start") {
         console.log(
            "🚀 Streaming started:",
            eventData
         );

         onStart(eventData);

         return;
      }

      // -------------------------------------------------------
      // CHUNK EVENT
      // -------------------------------------------------------

      if (eventData.type === "chunk") {
         const text =
            typeof eventData.text ===
               "string"
               ? eventData.text
               : "";

         if (text) {
            onChunk(
               text,
               eventData
            );
         }

         return;
      }

      // -------------------------------------------------------
      // COMPLETE EVENT
      // -------------------------------------------------------

      if (
         eventData.type ===
         "complete"
      ) {
         console.log(
            "✅ Streaming completed:",
            eventData
         );

         onComplete(eventData);

         return;
      }

      // -------------------------------------------------------
      // ERROR EVENT
      // -------------------------------------------------------

      if (
         eventData.type ===
         "error"
      ) {
         const errorCode =
            eventData.code;

         let errorMessage;

         // EchoMind-specific AI limit
         if (
            errorCode ===
            "AI_LIMIT_REACHED"
         ) {
            errorMessage =
               "EchoMind has temporarily reached its AI request limit. Please try again later.";
         }

         // EchoMind-specific general AI failure
         else if (
            errorCode ===
            "AI_REQUEST_FAILED"
         ) {
            errorMessage =
               "EchoMind could not generate a response. Please try again later.";
         }

         // Backend-provided safe message
         else {
            errorMessage =
               typeof eventData.message ===
                  "string"
                  ? eventData.message
                  : "EchoMind could not complete the request. Please try again later.";
         }

         const error =
            new Error(errorMessage);

         console.error(
            "❌ Server streaming error:",
            errorMessage
         );

         onError(
            error,
            eventData
         );

         return;
      }

      console.warn(
         "⚠️ Unknown SSE event:",
         eventData
      );
   };

   // ----------------------------------------------------------
   // Read streaming response
   // ----------------------------------------------------------

   try {
      while (true) {
         const {
            value,
            done,
         } = await reader.read();

         if (done) {
            break;
         }

         buffer +=
            decoder.decode(
               value,
               {
                  stream: true,
               }
            );

         // ----------------------------------------------------
         // Process complete SSE events
         //
         // SSE normally uses:
         //
         // \n\n
         //
         // or:
         //
         // \r\n\r\n
         // ----------------------------------------------------

         while (true) {
            const newlineIndex =
               buffer.indexOf(
                  "\n\n"
               );

            const carriageReturnIndex =
               buffer.indexOf(
                  "\r\n\r\n"
               );

            let separatorIndex = -1;
            let separatorLength = 0;

            if (
               carriageReturnIndex !==
               -1 &&
               (
                  newlineIndex ===
                  -1 ||
                  carriageReturnIndex <
                  newlineIndex
               )
            ) {
               separatorIndex =
                  carriageReturnIndex;

               separatorLength = 4;
            }

            else if (
               newlineIndex !==
               -1
            ) {
               separatorIndex =
                  newlineIndex;

               separatorLength = 2;
            }

            if (
               separatorIndex ===
               -1
            ) {
               break;
            }

            const eventText =
               buffer.slice(
                  0,
                  separatorIndex
               );

            buffer =
               buffer.slice(
                  separatorIndex +
                  separatorLength
               );

            processEvent(
               eventText
            );
         }
      }

      // -------------------------------------------------------
      // Flush remaining decoder data
      // -------------------------------------------------------

      buffer +=
         decoder.decode();

      if (buffer.trim()) {
         processEvent(buffer);
      }

      console.log(
         "✅ Streaming chat request finished."
      );

   } catch (error) {
      console.error(
         "❌ Streaming chat error:",
         error
      );

      try {
         await reader.cancel();
      } catch {
         // Ignore cancellation errors.
      }

      onError(error);

      throw error;
   }
}

// ==========================================
// REGENERATE ANSWER
// ==========================================

export async function regenerateMessage(
   chatId,
   messageId
) {

   // ----------------------------------------------------------
   // MOCK MODE
   // ----------------------------------------------------------

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 1200)
      );

      return {

         success:
            true,

         chat_id:
            chatId,

         message_id:
            messageId,

         answer:
            "This is a newly regenerated mock answer.",

         sources:
            [],

         used_web_search:
            false,

         interaction_id:
            null,

      };

   }


   // ----------------------------------------------------------
   // VALIDATION
   // ----------------------------------------------------------

   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   if (!messageId) {

      throw new Error(
         "Message ID is required."
      );

   }


   // ----------------------------------------------------------
   // SEND REGENERATE REQUEST
   // ----------------------------------------------------------

   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chat/regenerate`,
            {
               method:
                  "POST",

               headers:
                  getAuthHeaders(),

               body:
                  JSON.stringify({
                     chat_id:
                        chatId,

                     message_id:
                        messageId,
                  }),
            }
         );

   } catch (error) {

      console.error(
         "❌ Network error while regenerating message:",
         error
      );

      throwNetworkError();

   }


   // ----------------------------------------------------------
   // READ RESPONSE
   // ----------------------------------------------------------

   const data =
      await getResponseData(
         response
      );


   // ----------------------------------------------------------
   // HANDLE ERRORS
   // ----------------------------------------------------------

   if (!response.ok) {

      // -------------------------------------------------------
      // AI LIMIT REACHED
      // -------------------------------------------------------

      if (
         response.status === 429
      ) {

         const errorCode =
            data?.detail?.code;

         if (
            errorCode ===
            "AI_LIMIT_REACHED"
         ) {

            throw new Error(
               "EchoMind has temporarily reached its AI request limit. Please try again later."
            );

         }

         throw new Error(
            getValidationMessage(data) ||
            "EchoMind is temporarily unavailable. Please try again later."
         );

      }


      // -------------------------------------------------------
      // UNAUTHORIZED
      // -------------------------------------------------------

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      // -------------------------------------------------------
      // BAD REQUEST
      // -------------------------------------------------------

      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "This answer cannot be regenerated."
         );

      }


      // -------------------------------------------------------
      // NOT FOUND
      // -------------------------------------------------------

      if (
         response.status === 404
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The chat or message could not be found."
         );

      }


      // -------------------------------------------------------
      // SERVER ERROR
      // -------------------------------------------------------

      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The server could not regenerate the answer."
         );

      }


      // -------------------------------------------------------
      // FALLBACK ERROR
      // -------------------------------------------------------

      throw new Error(
         getValidationMessage(data) ||
         "Failed to regenerate the answer."
      );

   }


   // ----------------------------------------------------------
   // VALIDATE SUCCESS RESPONSE
   // ----------------------------------------------------------

   if (
      !data ||
      typeof data.answer !==
      "string"
   ) {

      throw new Error(
         "Backend returned an invalid regenerated response."
      );

   }


   // ----------------------------------------------------------
   // RETURN RESPONSE
   // ----------------------------------------------------------

   return data;

}

// ==========================================
// SUBMIT MESSAGE FEEDBACK
// ==========================================
//
// feedback:
// "positive" → 👍
// "negative" → 👎
//
// ==========================================

export async function submitFeedback(
   chatId,
   messageId,
   feedback
) {

   // ========================================
   // MOCK MODE
   // ========================================

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 300)
      );

      return {

         success:
            true,

         chat_id:
            chatId,

         message_id:
            messageId,

         feedback,

      };

   }


   // ========================================
   // VALIDATE CHAT ID
   // ========================================

   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   // ========================================
   // VALIDATE MESSAGE ID
   // ========================================

   if (!messageId) {

      throw new Error(
         "Message ID is required."
      );

   }


   // ========================================
   // VALIDATE FEEDBACK
   // ========================================

   const allowedFeedback = [
      "positive",
      "negative",
   ];


   if (
      !allowedFeedback.includes(
         feedback
      )
   ) {

      throw new Error(
         "Invalid feedback type."
      );

   }


   // ========================================
   // SEND FEEDBACK REQUEST
   // ========================================

   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chat/feedback`,
            {
               method:
                  "POST",

               headers:
                  getAuthHeaders(),

               body:
                  JSON.stringify({
                     chat_id:
                        chatId,

                     message_id:
                        messageId,

                     feedback:
                        feedback,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   // ========================================
   // READ RESPONSE
   // ========================================

   const data =
      await getResponseData(
         response
      );


   // ========================================
   // HANDLE ERRORS
   // ========================================

   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Invalid feedback request."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The assistant message could not be found."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to submit feedback."
      );

   }


   // ========================================
   // VALIDATE RESPONSE
   // ========================================

   if (
      !data ||
      typeof data !== "object" ||
      typeof data.feedback !== "string"
   ) {

      throw new Error(
         "Backend returned an invalid feedback response."
      );

   }


   // ========================================
   // SUCCESS
   // ========================================

   console.log(
      "✅ Feedback submitted:",
      {
         chat_id:
            chatId,

         message_id:
            messageId,

         feedback:
            data.feedback,
      }
   );


   return data;

}


// ==========================================
// GET ALL CHATS
// ==========================================
//
// The backend should already exclude
// temporary chats.
//
// The frontend also filters them as a
// safety measure.
//
// ==========================================

export async function getChats() {

   if (USE_MOCK) {

      return [];

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chats`,
            {
               method:
                  "GET",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to load chats."
      );

   }


   // ========================================
   // SUPPORT BOTH RESPONSE FORMATS
   // ========================================

   let chats = [];


   if (
      Array.isArray(data)
   ) {

      chats =
         data;

   } else if (
      Array.isArray(
         data?.chats
      )
   ) {

      chats =
         data.chats;

   }


   // ========================================
   // SAFETY FILTER
   // ========================================
   //
   // Temporary chats should not appear in
   // persistent chat history.
   //
   // ========================================

   return chats.filter(
      (chat) =>
         chat?.temporary !== true
   );

}


// ==========================================
// GET SINGLE CHAT
// ==========================================

export async function getChat(
   chatId
) {

   if (USE_MOCK) {

      return {

         id:
            chatId,

         title:
            "Mock Chat",

         temporary:
            false,

         memory: {

            active:
               false,

            reset_at:
               null,

         },

         messages:
            [],

      };

   }


   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chats/${chatId}`,
            {
               method:
                  "GET",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            "Chat not found."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to load chat."
      );

   }


   if (
      !data ||
      typeof data !== "object"
   ) {

      throw new Error(
         "Backend returned an invalid chat response."
      );

   }


   return data;

}


// ==========================================
// RENAME CHAT
// ==========================================

export async function renameChat(
   chatId,
   newTitle
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 300)
      );

      return {

         success:
            true,

         chat_id:
            chatId,

         title:
            newTitle.trim(),

      };

   }


   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   const trimmedTitle =
      newTitle?.trim();


   if (!trimmedTitle) {

      throw new Error(
         "Chat title cannot be empty."
      );

   }


   if (
      trimmedTitle.length >
      100
   ) {

      throw new Error(
         "Chat title cannot exceed 100 characters."
      );

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chats/${chatId}`,
            {
               method:
                  "PATCH",

               headers:
                  getAuthHeaders(),

               body:
                  JSON.stringify({
                     title:
                        trimmedTitle,
                  }),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Invalid chat title."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Chat not found."
         );

      }


      if (
         response.status === 422
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Please enter a valid chat title."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to rename the chat."
      );

   }


   if (
      !data ||
      typeof data !== "object"
   ) {

      throw new Error(
         "Backend returned an invalid rename response."
      );

   }


   return data;

}


// ==========================================
// DELETE CHAT
// ==========================================
//
// Used for:
//
// 1. Normal chat deletion.
// 2. Temporary chat cleanup when exiting
//    Temporary Chat.
//
// ==========================================

export async function deleteChat(
   chatId
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 300)
      );

      return {
         success:
            true,
      };

   }


   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chats/${chatId}`,
            {
               method:
                  "DELETE",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch {

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            "Chat not found."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to delete chat."
      );

   }


   return data;

}


// ==========================================
// CLEAR MEMORY FOR ALL CHATS
// ==========================================
//
// Clears Gemini interaction memory for
// every chat belonging to the current user.
//
// IMPORTANT:
//
// This does NOT delete chat messages.
//
// ==========================================

export async function clearMemory() {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 500)
      );

      return {

         success:
            true,

         message:
            "AI conversation memory cleared for all chats.",

         chats_updated:
            1,

         memory_reset_at:
            new Date().toISOString(),

      };

   }


   console.log(
      "🧹 Clear Memory: starting request..."
   );


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/clear-memory`,
            {
               method:
                  "POST",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch (error) {

      console.error(
         "❌ Clear Memory network error:",
         error
      );

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   console.log(
      "📥 Clear Memory HTTP status:",
      response.status
   );


   console.log(
      "📥 Clear Memory response:",
      data
   );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            "Clear Memory endpoint was not found. Please check the backend server."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to clear conversation memory."
      );

   }


   if (
      !data ||
      typeof data !== "object"
   ) {

      throw new Error(
         "Backend returned an invalid memory response."
      );

   }


   console.log(
      "✅ Clear Memory completed successfully."
   );


   return data;

}


// ==========================================
// CLEAR MEMORY FOR ONE CHAT
// ==========================================
//
// clearMemory()
// → Clears memory for ALL chats.
//
// clearChatMemory(chatId)
// → Clears memory ONLY for one chat.
//
// Messages are NOT deleted.
//
// ==========================================

export async function clearChatMemory(
   chatId
) {

   if (USE_MOCK) {

      await new Promise(
         (resolve) =>
            setTimeout(resolve, 500)
      );

      return {

         success:
            true,

         message:
            "Memory cleared for this chat.",

         chat_id:
            chatId,

         memory_reset_at:
            new Date().toISOString(),

      };

   }


   if (!chatId) {

      throw new Error(
         "Chat ID is required."
      );

   }


   console.log(
      "🧹 Clear Chat Memory: starting request..."
   );


   let response;

   try {

      response =
         await fetch(
            `${API_URL}/api/chats/${chatId}/clear-memory`,
            {
               method:
                  "POST",

               headers:
                  getAuthHeaders(),
            }
         );

   } catch (error) {

      console.error(
         "❌ Clear Chat Memory network error:",
         error
      );

      throwNetworkError();

   }


   const data =
      await getResponseData(
         response
      );


   console.log(
      "📥 Clear Chat Memory HTTP status:",
      response.status
   );


   console.log(
      "📥 Clear Chat Memory response:",
      data
   );


   if (!response.ok) {

      if (
         response.status === 401
      ) {

         throw new Error(
            "Your session has expired. Please log in again."
         );

      }


      if (
         response.status === 400
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Invalid chat ID."
         );

      }


      if (
         response.status === 404
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "Chat not found."
         );

      }


      if (
         response.status >= 500
      ) {

         throw new Error(
            getValidationMessage(data) ||
            "The backend server encountered an error."
         );

      }


      throw new Error(
         getValidationMessage(data) ||
         "Failed to clear chat memory."
      );

   }


   if (
      !data ||
      typeof data !== "object"
   ) {

      throw new Error(
         "Backend returned an invalid memory response."
      );

   }


   console.log(
      "✅ Chat memory cleared successfully."
   );


   return data;

}
