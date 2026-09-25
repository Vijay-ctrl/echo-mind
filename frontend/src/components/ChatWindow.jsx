import {
   useEffect,
   useRef,
   useState,
} from "react";

import {
   Sparkles,
   Globe,
   Zap,
   Menu,
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

   currentChatId = null,

   onExportChat,

   onBackToChats,

   // ==========================================
   // SIDEBAR TOGGLE
   // ==========================================

   onToggleSidebar,

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

   const messagesContainerRef =
      useRef(null);

   const messagesEndRef =
      useRef(null);

   const shouldAutoScrollRef =
      useRef(true);

   const exportMenuRef =
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
   // CHECK WHETHER CHAT IS BUSY
   // ==========================================

   const isBusy =
      Boolean(isLoading) ||
      Boolean(regeneratingMessageId);


   // ==========================================
   // CHECK WHETHER USER IS NEAR BOTTOM
   // ==========================================

   const isNearBottom = (
      container,
      threshold = 120
   ) => {

      if (!container) {
         return true;
      }

      const distanceFromBottom =
         container.scrollHeight -
         container.scrollTop -
         container.clientHeight;

      return distanceFromBottom <= threshold;

   };


   // ==========================================
   // TRACK USER SCROLL POSITION
   // ==========================================

   const handleMessagesScroll = () => {

      const container =
         messagesContainerRef.current;

      if (!container) {
         return;
      }

      shouldAutoScrollRef.current =
         isNearBottom(container);

   };


   // ==========================================
   // AUTO SCROLL
   // ==========================================

   useEffect(() => {

      const container =
         messagesContainerRef.current;

      const target =
         messagesEndRef.current;

      if (!container || !target) {
         return;
      }

      if (!shouldAutoScrollRef.current) {
         return;
      }

      requestAnimationFrame(() => {

         target.scrollIntoView({
            behavior: isStreaming
               ? "auto"
               : "smooth",
            block: "end",
         });

      });

   }, [
      normalizedMessages.length,
      normalizedMessages,
      isLoading,
      isStreaming,
   ]);


   // ==========================================
   // RESET SCROLL WHEN CHAT CHANGES
   // ==========================================

   useEffect(() => {

      shouldAutoScrollRef.current = true;

      requestAnimationFrame(() => {

         const container =
            messagesContainerRef.current;

         if (!container) {
            return;
         }

         container.scrollTop =
            container.scrollHeight;

      });

   }, [
      currentChatId,
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
   // CLOSE EXPORT MENU ON OUTSIDE CLICK
   // ==========================================

   useEffect(() => {

      if (!isExportMenuOpen) {
         return;
      }

      const handlePointerDown = (
         event
      ) => {

         const wrapper =
            exportMenuRef.current;

         if (
            wrapper &&
            !wrapper.contains(
               event.target
            )
         ) {

            setIsExportMenuOpen(false);

         }

      };


      document.addEventListener(
         "pointerdown",
         handlePointerDown
      );


      return () => {

         document.removeEventListener(
            "pointerdown",
            handlePointerDown
         );

      };

   }, [
      isExportMenuOpen,
   ]);


   // ==========================================
   // CLOSE EXPORT MENU WITH ESCAPE
   // ==========================================

   useEffect(() => {

      if (!isExportMenuOpen) {
         return;
      }

      const handleKeyDown = (
         event
      ) => {

         if (
            event.key === "Escape"
         ) {

            setIsExportMenuOpen(false);

         }

      };


      document.addEventListener(
         "keydown",
         handleKeyDown
      );


      return () => {

         document.removeEventListener(
            "keydown",
            handleKeyDown
         );

      };

   }, [
      isExportMenuOpen,
   ]);


   // ==========================================
   // MODE CHANGE
   // ==========================================

   const handleModeChange =
      (nextMode) => {

         if (isBusy) {
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

         if (
            nextMode === activeMode
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

         if (isBusy) {
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


         if (
            messageIndex !==
            normalizedMessages.length - 1
         ) {

            return;
         }


         if (
            message.isStreaming
         ) {

            return;
         }


         if (!message.id) {
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

      if (isBusy) {
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

      if (isBusy) {
         return;
      }

      onBackToChats();

   };


   // ==========================================
   // SIDEBAR TOGGLE
   // ==========================================

   const handleToggleSidebar = () => {

      if (
         typeof onToggleSidebar !==
         "function"
      ) {

         return;
      }

      onToggleSidebar();

   };


   // ==========================================
   // RENDER
   // ==========================================

   return (

      <section
         className="chat-window"
         aria-label="EchoMind chat"
      >

         {/* =====================================
             CHAT HEADER
         ===================================== */}

         <header className="chat-header">


            {/* ==================================
                HEADER LEFT
            ================================== */}

            <div className="chat-header-left">


               {/* ==================================
                   SIDEBAR TOGGLE
               ================================== */}

               {typeof onToggleSidebar ===
                  "function" && (

                     <button
                        type="button"
                        className="sidebar-toggle-button"
                        onClick={
                           handleToggleSidebar
                        }
                        aria-label="Open chats sidebar"
                        title="Open chats sidebar"
                     >

                        <Menu
                           size={19}
                           strokeWidth={2}
                           aria-hidden="true"
                        />

                     </button>

                  )}


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
                        disabled={isBusy}
                        aria-label="Back to chats"
                        title="Back to chats"
                     >

                        <span
                           className="mobile-back-icon"
                           aria-hidden="true"
                        >
                           ←
                        </span>

                        <span>
                           Chats
                        </span>

                     </button>

                  )}


               {/* ==================================
                   CHAT TITLE ICON
               ================================== */}

               <div
                  className="chat-title-icon"
                  aria-hidden="true"
               >

                  <Sparkles
                     size={18}
                  />

               </div>


               {/* ==================================
                   CHAT TITLE CONTENT
               ================================== */}

               <div className="chat-title-content">

                  <h1>
                     EchoMind
                  </h1>


                  <span className="chat-status">

                     <span
                        className={
                           isStreaming
                              ? "status-dot streaming"
                              : "status-dot"
                        }
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

               <div
                  ref={exportMenuRef}
                  className="chat-export-wrapper"
               >

                  <button
                     type="button"
                     className={
                        isExportMenuOpen
                           ? "chat-export-button open"
                           : "chat-export-button"
                     }
                     onClick={() =>
                        setIsExportMenuOpen(
                           (previous) =>
                              !previous
                        )
                     }
                     disabled={
                        isBusy ||
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
                        aria-label="Export conversation"
                     >

                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "pdf"
                              )
                           }
                        >

                           <span aria-hidden="true">
                              📄
                           </span>

                           <span>
                              Export PDF
                           </span>

                        </button>


                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "txt"
                              )
                           }
                        >

                           <span aria-hidden="true">
                              📝
                           </span>

                           <span>
                              Export TXT
                           </span>

                        </button>


                        <button
                           type="button"
                           role="menuitem"
                           onClick={() =>
                              handleExport(
                                 "markdown"
                              )
                           }
                        >

                           <span aria-hidden="true">
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
                     disabled={isBusy}
                     aria-pressed={
                        activeMode === "auto"
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
                     disabled={isBusy}
                     aria-pressed={
                        activeMode === "gemini"
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
                     disabled={isBusy}
                     aria-pressed={
                        activeMode === "web"
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

         <div
            ref={messagesContainerRef}
            className="chat-messages"
            onScroll={
               handleMessagesScroll
            }
         >

            {normalizedMessages.length === 0 &&
               !isLoading && (

                  <div className="chat-welcome">

                     <div
                        className="welcome-icon"
                        aria-hidden="true"
                     >

                        <Sparkles
                           size={28}
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


            {normalizedMessages.map(
               (message, index) => (

                  <ChatMessage

                     key={
                        message.id ||
                        `${message.role}-${index}`
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

                     chatId={
                        currentChatId
                     }

                     messageId={
                        message.id
                     }

                     feedback={
                        message.feedback ||
                        null
                     }

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


            {isLoading &&
               !isStreaming &&
               !regeneratingMessageId && (

                  <TypingIndicator />

               )}


            <div
               ref={messagesEndRef}
               className="chat-scroll-anchor"
               aria-hidden="true"
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
               isBusy
            }

         />

      </section>

   );

}


export default ChatWindow;