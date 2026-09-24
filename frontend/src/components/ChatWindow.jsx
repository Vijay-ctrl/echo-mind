
import {
   useEffect,
   useRef,
   useState,
} from "react";

import {
   Sparkles,
   Globe,
   Zap,
} from "lucide-react";

import ChatMessage from "./ChatMessage";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

import "./ChatWindow.css";


function ChatWindow({

   messages = [],

   isLoading = false,

   onSendMessage,

   onRegenerateMessage,

   regeneratingMessageId = null,

   mode = "auto",

   onModeChange,

   // ==========================================
   // CURRENT CHAT ID
   // ==========================================

   currentChatId = null,

   // ==========================================
   // EXPORT CHAT
   // ==========================================

   onExportChat,

   // ==========================================
   // MOBILE NAVIGATION
   // ==========================================

   onBackToChats,

}) {


   // ==========================================
   // STATE
   // ==========================================

   const [
      isExportMenuOpen,
      setIsExportMenuOpen,
   ] = useState(false);


   // ==========================================
   // REFS
   // ==========================================

   const messagesEndRef =
      useRef(null);


   // ==========================================
   // NORMALIZE MESSAGES
   // ==========================================

   const normalizedMessages =
      Array.isArray(messages)
         ? messages
         : [];


   // ==========================================
   // VALIDATE MODE
   // ==========================================

   const allowedModes = [
      "auto",
      "gemini",
      "web",
   ];


   const activeMode =
      allowedModes.includes(mode)
         ? mode
         : "auto";


   // ==========================================
   // CHECK ACTIVE STREAM
   // ==========================================

   const isStreaming =
      normalizedMessages.some(
         (message) =>
            message?.role === "assistant" &&
            message?.isStreaming === true
      );


   // ==========================================
   // AUTO SCROLL
   // ==========================================

   useEffect(() => {

      messagesEndRef.current?.scrollIntoView({
         behavior: "smooth",
      });

   }, [
      normalizedMessages.length,
      normalizedMessages,
      isLoading,
   ]);


   // ==========================================
   // CLOSE EXPORT MENU WHEN CHAT CHANGES
   // ==========================================

   useEffect(() => {

      setIsExportMenuOpen(false);

   }, [
      currentChatId,
   ]);


   // ==========================================
   // MODE CHANGE
   // ==========================================

   const handleModeChange =
      (nextMode) => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         if (
            !allowedModes.includes(
               nextMode
            )
         ) {

            return;

         }


         if (
            typeof onModeChange !==
            "function"
         ) {

            return;

         }


         onModeChange(
            nextMode
         );

      };


   // ==========================================
   // REGENERATE MESSAGE
   // ==========================================

   const handleRegenerate =
      (messageIndex) => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         if (
            typeof onRegenerateMessage !==
            "function"
         ) {

            return;

         }


         if (
            messageIndex < 0 ||
            messageIndex >=
            normalizedMessages.length
         ) {

            return;

         }


         const message =
            normalizedMessages[
            messageIndex
            ];


         if (
            !message ||
            message.role !==
            "assistant"
         ) {

            return;

         }


         // ======================================
         // ONLY LATEST ASSISTANT MESSAGE
         // ======================================

         if (
            messageIndex !==
            normalizedMessages.length - 1
         ) {

            return;

         }


         // ======================================
         // NEVER REGENERATE STREAMING MESSAGE
         // ======================================

         if (
            message.isStreaming
         ) {

            return;

         }


         onRegenerateMessage(
            message.id
         );

      };


   // ==========================================
   // EXPORT CHAT
   // ==========================================

   const handleExport = (
      format
   ) => {

      if (
         isLoading ||
         regeneratingMessageId
      ) {

         return;

      }


      if (
         typeof onExportChat !==
         "function"
      ) {

         return;

      }


      if (
         normalizedMessages.length === 0
      ) {

         return;

      }


      const allowedFormats = [
         "pdf",
         "txt",
         "markdown",
      ];


      if (
         !allowedFormats.includes(
            format
         )
      ) {

         console.error(
            "Invalid export format:",
            format
         );

         return;

      }


      onExportChat(
         format
      );


      setIsExportMenuOpen(
         false
      );

   };


   // ==========================================
   // MOBILE BACK TO CHATS
   // ==========================================

   const handleBackToChats = () => {

      if (
         typeof onBackToChats !==
         "function"
      ) {

         return;

      }


      onBackToChats();

   };


   // ==========================================
   // RENDER
   // ==========================================

   return (

      <section className="chat-window">


         {/* =====================================
             CHAT HEADER
         ===================================== */}

         <header className="chat-header">


            {/* ==================================
                HEADER LEFT
            ================================== */}

            <div className="chat-header-left">


               {/* ==================================
                   MOBILE BACK TO CHATS
               ================================== */}

               {typeof onBackToChats ===
                  "function" && (

                     <button
                        type="button"
                        className="mobile-back-to-chats"
                        onClick={
                           handleBackToChats
                        }
                        aria-label="Back to chats"
                        title="Back to chats"
                     >

                        <span
                           aria-hidden="true"
                        >
                           ←
                        </span>

                        <span>
                           Chats
                        </span>

                     </button>

                  )}


               <div className="chat-title-icon">

                  <Sparkles
                     size={18}
                     aria-hidden="true"
                  />

               </div>


               <div>

                  <h1>
                     EchoMind
                  </h1>


                  <span className="chat-status">

                     <span
                        className="status-dot"
                        aria-hidden="true"
                     />

                     {isStreaming
                        ? "Generating..."
                        : "Online"}

                  </span>

               </div>

            </div>


            {/* ==================================
                HEADER RIGHT
            ================================== */}

            <div className="chat-header-right">


               {/* ==================================
                   EXPORT CHAT
               ================================== */}

               <div className="chat-export-wrapper">


                  <button
                     type="button"
                     className="chat-export-button"
                     onClick={() =>
                        setIsExportMenuOpen(
                           (previous) =>
                              !previous
                        )
                     }
                     disabled={
                        isLoading ||
                        Boolean(
                           regeneratingMessageId
                        ) ||
                        normalizedMessages.length === 0
                     }
                     aria-haspopup="menu"
                     aria-expanded={
                        isExportMenuOpen
                     }
                     title="Export this conversation"
                  >

                     <span>
                        Export
                     </span>


                     <span
                        className="chat-export-arrow"
                        aria-hidden="true"
                     >
                        ▾
                     </span>

                  </button>


                  {isExportMenuOpen && (

                     <div
                        className="chat-export-menu"
                        role="menu"
                     >


                        {/* ==========================
                            PDF
                        ========================== */}

                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "pdf"
                              )
                           }
                        >

                           <span>
                              📄
                           </span>

                           <span>
                              Export PDF
                           </span>

                        </button>


                        {/* ==========================
                            TXT
                        ========================== */}

                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "txt"
                              )
                           }
                        >

                           <span>
                              📝
                           </span>

                           <span>
                              Export TXT
                           </span>

                        </button>


                        {/* ==========================
                            MARKDOWN
                        ========================== */}

                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "markdown"
                              )
                           }
                        >

                           <span>
                              📋
                           </span>

                           <span>
                              Export Markdown
                           </span>

                        </button>


                     </div>

                  )}

               </div>


               {/* ==================================
                   CHAT MODE
               ================================== */}

               <div
                  className="chat-mode-selector"
                  role="group"
                  aria-label="Chat mode"
               >


                  {/* ==================================
                      AUTO MODE
                  ================================== */}

                  <button
                     type="button"
                     className={
                        activeMode === "auto"
                           ? "mode-button active"
                           : "mode-button"
                     }
                     onClick={() =>
                        handleModeChange(
                           "auto"
                        )
                     }
                     disabled={
                        isLoading ||
                        Boolean(
                           regeneratingMessageId
                        )
                     }
                     title="Automatically decide whether web search is needed"
                  >

                     <Zap
                        size={14}
                        aria-hidden="true"
                     />

                     <span>
                        Auto
                     </span>

                  </button>


                  {/* ==================================
                      GEMINI MODE
                  ================================== */}

                  <button
                     type="button"
                     className={
                        activeMode === "gemini"
                           ? "mode-button active"
                           : "mode-button"
                     }
                     onClick={() =>
                        handleModeChange(
                           "gemini"
                        )
                     }
                     disabled={
                        isLoading ||
                        Boolean(
                           regeneratingMessageId
                        )
                     }
                     title="Use EchoMind without web search"
                  >

                     <Sparkles
                        size={14}
                        aria-hidden="true"
                     />

                     <span>
                        Gemini
                     </span>

                  </button>


                  {/* ==================================
                      WEB MODE
                  ================================== */}

                  <button
                     type="button"
                     className={
                        activeMode === "web"
                           ? "mode-button active"
                           : "mode-button"
                     }
                     onClick={() =>
                        handleModeChange(
                           "web"
                        )
                     }
                     disabled={
                        isLoading ||
                        Boolean(
                           regeneratingMessageId
                        )
                     }
                     title="Always use web search"
                  >

                     <Globe
                        size={14}
                        aria-hidden="true"
                     />

                     <span>
                        Web
                     </span>

                  </button>


               </div>


            </div>


         </header>


         {/* =====================================
             MESSAGE AREA
         ===================================== */}

         <div className="chat-messages">


            {/* ==================================
                WELCOME SCREEN
            ================================== */}

            {normalizedMessages.length === 0 &&
               !isLoading && (

                  <div className="chat-welcome">

                     <div className="welcome-icon">

                        <Sparkles
                           size={28}
                           aria-hidden="true"
                        />

                     </div>


                     <h2>
                        How can I help you?
                     </h2>


                     <p>
                        Ask me anything. I can remember
                        your conversation and search the
                        web when current information is needed.
                     </p>

                  </div>

               )}


            {/* ==================================
                MESSAGES
            ================================== */}

            {normalizedMessages.map(
               (message, index) => (

                  <ChatMessage

                     key={
                        message.id ||
                        `${message.role} -${index} `
                     }


                     role={
                        message.role
                     }


                     message={
                        message.message
                     }


                     sources={
                        message.sources
                     }


                     usedWebSearch={
                        message.usedWebSearch
                     }


                     error={
                        message.error
                     }


                     /*
                        ==================================
                        FEEDBACK DATA
                        ==================================

                        These values are passed to
                        ChatMessage.jsx, which passes them
                        to FeedbackButtons.jsx.
                     */

                     chatId={
                        currentChatId
                     }


                     messageId={
                        message.id
                     }


                     feedback={
                        message.feedback || null
                     }


                     /*
                        ==================================
                        STREAMING STATE
                        ==================================
                     */

                     isStreaming={
                        message.isStreaming === true
                     }


                     onRegenerate={

                        message.role ===
                           "assistant" &&

                           index ===
                           normalizedMessages.length - 1 &&

                           !message.isStreaming

                           ? () =>
                              handleRegenerate(
                                 index
                              )

                           : undefined

                     }


                     isRegenerating={

                        message.id ===
                        regeneratingMessageId

                     }

                  />

               )
            )}


            {/* ==================================
                TYPING INDICATOR
            ================================== */}

            {isLoading &&
               !isStreaming &&
               !regeneratingMessageId && (

                  <TypingIndicator />

               )}


            {/* ==================================
                AUTO SCROLL TARGET
            ================================== */}

            <div
               ref={
                  messagesEndRef
               }
            />


         </div>


         {/* =====================================
             MESSAGE INPUT
         ===================================== */}

         <MessageInput

            onSendMessage={
               onSendMessage
            }

            disabled={
               isLoading ||
               Boolean(
                  regeneratingMessageId
               )
            }

         />


      </section>

   );

}


export default ChatWindow;

