import { useState } from "react";

import {
   Bot,
   User,
   Globe,
   Copy,
   Check,
   RotateCcw,
   LoaderCircle,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import SourceCard from "./SourceCard";
import FeedbackButtons from "./FeedbackButtons";

import "./ChatMessage.css";


function ChatMessage({
   role,
   message,
   sources = [],
   usedWebSearch = false,
   error = false,

   // ==========================================
   // MESSAGE IDENTIFIERS
   // ==========================================

   chatId = null,
   messageId = null,
   feedback = null,

   // ==========================================
   // REGENERATE
   // ==========================================

   onRegenerate,
   isRegenerating = false,

   // ==========================================
   // STREAMING
   // ==========================================

   isStreaming = false,
}) {

   const isUser = role === "user";

   const [copied, setCopied] = useState(false);


   // ==========================================
   // SAFELY HANDLE MESSAGE
   // ==========================================

   const hasMessage =
      typeof message === "string" &&
      message.trim().length > 0;


   /*
      During streaming, the assistant message
      can temporarily be empty.

      We should NOT show:
      "No message content available."

      Instead, we show the streaming indicator.
   */

   const displayMessage =
      hasMessage
         ? message.trim()
         : "";


   // ==========================================
   // SAFELY HANDLE SOURCES
   // ==========================================

   const webSources = Array.isArray(sources)
      ? sources.filter(
         (source) =>
            source &&
            typeof source === "object"
      )
      : [];


   // ==========================================
   // COPY ANSWER
   // ==========================================

   const handleCopy = async () => {

      /*
         Don't allow copying while Gemini is
         still generating the response.
      */

      if (
         !displayMessage ||
         isRegenerating ||
         isStreaming
      ) {

         return;

      }


      try {

         await navigator.clipboard.writeText(
            displayMessage
         );


         setCopied(true);


         setTimeout(() => {

            setCopied(false);

         }, 2000);


      } catch (error) {

         console.error(
            "Failed to copy answer:",
            error
         );

      }

   };


   // ==========================================
   // REGENERATE ANSWER
   // ==========================================

   const handleRegenerate = () => {

      /*
         Regeneration should not be possible
         while streaming is active.
      */

      if (
         isRegenerating ||
         isStreaming ||
         typeof onRegenerate !== "function"
      ) {

         return;

      }


      setCopied(false);

      onRegenerate();

   };


   // ==========================================
   // MESSAGE CLASS
   // ==========================================

   const messageRowClass = [

      "message-row",

      isUser
         ? "user-message"
         : "ai-message",

      isStreaming
         ? "message-streaming"
         : "",

   ]
      .filter(Boolean)
      .join(" ");


   const bubbleClass = [

      "message-bubble",

      error
         ? "message-bubble-error"
         : "",

      isStreaming
         ? "message-bubble-streaming"
         : "",

   ]
      .filter(Boolean)
      .join(" ");


   // ==========================================
   // RENDER
   // ==========================================

   return (

      <div
         className={messageRowClass}
         data-role={
            isUser
               ? "user"
               : "assistant"
         }
      >


         {/* =====================================
             MESSAGE AVATAR
         ===================================== */}

         <div
            className="message-avatar"
            aria-hidden="true"
         >

            {isUser ? (

               <User size={18} />

            ) : (

               <Bot size={18} />

            )}

         </div>


         {/* =====================================
             MESSAGE CONTENT
         ===================================== */}

         <div className="message-content">


            {/* =================================
                MESSAGE BUBBLE
            ================================= */}

            <div
               className={bubbleClass}
               role={
                  error
                     ? "alert"
                     : undefined
               }
            >


               {/* =================================
                   MESSAGE ROLE
               ================================= */}

               <div className="message-role">

                  {isUser
                     ? "You"
                     : "EchoMind"}

               </div>


               {/* =================================
                   MESSAGE TEXT / MARKDOWN
               ================================= */}

               <div
                  className={
                     error
                        ? "message-text error-message"
                        : "message-text"
                  }
               >

                  {displayMessage ? (

                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                     >
                        {displayMessage}
                     </ReactMarkdown>

                  ) : (

                     /*
                        Empty assistant message during
                        the first streaming event.
                     */

                     !isUser &&
                     isStreaming && (

                        <span
                           className="streaming-placeholder"
                           aria-label="EchoMind is generating a response"
                        >

                           <span className="streaming-dots">

                              <span>.</span>
                              <span>.</span>
                              <span>.</span>

                           </span>

                        </span>

                     )

                  )}


                  {/* =================================
                      STREAMING CURSOR
                  ================================= */}

                  {!isUser &&
                     isStreaming &&
                     !error && (

                        <span
                           className="streaming-cursor"
                           aria-hidden="true"
                        >
                           ▌
                        </span>

                     )}

               </div>


               {/* =================================
                   STREAMING STATUS
               ================================= */}

               {!isUser &&
                  isStreaming &&
                  !error && (

                     <div
                        className="streaming-message-status"
                        role="status"
                        aria-live="polite"
                     >

                        <LoaderCircle
                           size={13}
                           className="streaming-spinner"
                           aria-hidden="true"
                        />

                        <span>
                           EchoMind is generating...
                        </span>

                     </div>

                  )}


               {/* =================================
                   ANSWER ACTIONS
               ================================= */}

               {!isUser &&
                  !error &&
                  !isStreaming && (

                     <div className="message-actions">


                        {/* =============================
                            COPY ANSWER
                        ============================= */}

                        <button
                           type="button"
                           className={
                              copied
                                 ? "copy-answer-button copied"
                                 : "copy-answer-button"
                           }
                           onClick={handleCopy}
                           disabled={
                              isRegenerating ||
                              !displayMessage
                           }
                           aria-label={
                              copied
                                 ? "Answer copied"
                                 : "Copy answer"
                           }
                        >

                           {copied ? (

                              <>

                                 <Check
                                    size={15}
                                    aria-hidden="true"
                                 />

                                 <span>
                                    Copied
                                 </span>

                              </>

                           ) : (

                              <>

                                 <Copy
                                    size={15}
                                    aria-hidden="true"
                                 />

                                 <span>
                                    Copy
                                 </span>

                              </>

                           )}

                        </button>


                        {/* =============================
                            REGENERATE ANSWER
                        ============================= */}

                        {typeof onRegenerate ===
                           "function" && (

                              <button
                                 type="button"
                                 className="regenerate-answer-button"
                                 onClick={
                                    handleRegenerate
                                 }
                                 disabled={
                                    isRegenerating
                                 }
                                 aria-label={
                                    isRegenerating
                                       ? "Regenerating answer"
                                       : "Regenerate answer"
                                 }
                                 title={
                                    isRegenerating
                                       ? "Generating a new answer"
                                       : "Regenerate answer"
                                 }
                              >

                                 {isRegenerating ? (

                                    <>

                                       <LoaderCircle
                                          size={15}
                                          className="regenerate-spinner"
                                          aria-hidden="true"
                                       />

                                       <span>
                                          Regenerating...
                                       </span>

                                    </>

                                 ) : (

                                    <>

                                       <RotateCcw
                                          size={15}
                                          aria-hidden="true"
                                       />

                                       <span>
                                          Regenerate
                                       </span>

                                    </>

                                 )}

                              </button>

                           )}

                     </div>

                  )}


               {/* =================================
                   FEEDBACK BUTTONS
               ================================= */}

               {!isUser &&
                  !error &&
                  !isStreaming &&
                  chatId &&
                  messageId && (

                     <FeedbackButtons
                        chatId={chatId}
                        messageId={messageId}
                        currentFeedback={feedback}
                     />

                  )}

            </div>


            {/* =================================
                WEB SEARCH INDICATOR
            ================================= */}

            {!isUser &&
               !isStreaming &&
               usedWebSearch && (

                  <div
                     className="web-search-indicator"
                     aria-label="Web search was used for this answer"
                  >

                     <Globe
                        size={13}
                        aria-hidden="true"
                     />

                     <span>
                        Web Search Used
                     </span>

                  </div>

               )}


            {/* =================================
                WEB SOURCES
            ================================= */}

            {!isUser &&
               !isStreaming &&
               usedWebSearch &&
               webSources.length > 0 && (

                  <div
                     className="sources-section"
                     aria-label="Web sources used for this answer"
                  >


                     {/* =========================
                         SOURCES HEADING
                     ========================= */}

                     <div className="sources-heading">

                        <Globe
                           size={14}
                           aria-hidden="true"
                        />

                        <span>
                           Web Sources
                        </span>

                        <span className="sources-count">
                           {webSources.length}
                        </span>

                     </div>


                     {/* =========================
                         SOURCES LIST
                     ========================= */}

                     <div className="sources-list">

                        {webSources.map(
                           (source, index) => (

                              <SourceCard
                                 key={
                                    `${source.url || "source"}-${index}`
                                 }

                                 title={
                                    typeof source.title === "string"
                                       ? source.title
                                       : "Web Source"
                                 }

                                 content={
                                    typeof source.content === "string"
                                       ? source.content
                                       : ""
                                 }

                                 snippet={
                                    typeof source.snippet === "string"
                                       ? source.snippet
                                       : ""
                                 }

                                 url={
                                    typeof source.url === "string"
                                       ? source.url
                                       : ""
                                 }

                                 domain={
                                    typeof source.domain === "string"
                                       ? source.domain
                                       : ""
                                 }

                                 source_name={
                                    typeof source.source_name === "string"
                                       ? source.source_name
                                       : ""
                                 }

                                 sourceNumber={
                                    index + 1
                                 }
                              />

                           )
                        )}

                     </div>

                  </div>

               )}

         </div>

      </div>

   );

}


export default ChatMessage;