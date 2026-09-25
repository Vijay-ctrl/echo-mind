import {
   useEffect,
   useState,
} from "react";

import {
   useNavigate,
} from "react-router-dom";

import "./Chat.css";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ConfirmModal from "../components/ConfirmModal";

import {
   clearMemory,
   clearChatMemory,
   deleteChat,
   getChat,
   getChats,
   sendMessage,
   regenerateMessage,
   renameChat,
} from "../services/api";

import {
   exportChatAsPdf,
   exportChatAsTxt,
   exportChatAsMarkdown,
} from "../utils/exportChat";

import {
   getUser,
   logout,
} from "../services/auth";


const MOBILE_BREAKPOINT = 768;


function Chat() {

   // ==========================================
   // NAVIGATION
   // ==========================================

   const navigate =
      useNavigate();


   // ==========================================
   // STATE
   // ==========================================

   const [
      messages,
      setMessages,
   ] = useState([]);


   const [
      isLoading,
      setIsLoading,
   ] = useState(false);


   const [
      regeneratingMessageId,
      setRegeneratingMessageId,
   ] = useState(null);


   const [
      currentChatId,
      setCurrentChatId,
   ] = useState(null);


   const [
      chatHistory,
      setChatHistory,
   ] = useState([]);


   const [
      isLoadingChats,
      setIsLoadingChats,
   ] = useState(true);


   const [
      errorMessage,
      setErrorMessage,
   ] = useState("");


   // ==========================================
   // MOBILE SIDEBAR
   // ==========================================

   const [
      isSidebarOpen,
      setIsSidebarOpen,
   ] = useState(false);


   // ==========================================
   // TEMPORARY CHAT
   // ==========================================

   const [
      isTemporaryChat,
      setIsTemporaryChat,
   ] = useState(false);


   // ==========================================
   // CURRENT CHAT MEMORY
   // ==========================================

   const [
      memoryStatus,
      setMemoryStatus,
   ] = useState({
      active: false,
      resetAt: null,
   });


   // ==========================================
   // CHAT MODE
   // ==========================================

   const [
      chatMode,
      setChatMode,
   ] = useState("auto");


   // ==========================================
   // MODAL STATE
   // ==========================================

   const [
      modal,
      setModal,
   ] = useState({
      isOpen: false,
      type: "delete",
      chatId: null,
   });


   // ==========================================
   // USER
   // ==========================================

   const user =
      getUser();


   // ==========================================
   // MOBILE SIDEBAR HELPERS
   // ==========================================

   const openSidebar = () => {

      if (
         isLoading ||
         regeneratingMessageId
      ) {
         return;
      }


      // The sidebar drawer is only opened
      // through mobile interactions.
      if (
         window.innerWidth >
         MOBILE_BREAKPOINT
      ) {
         return;
      }


      setIsSidebarOpen(true);

   };


   const closeSidebar = () => {

      setIsSidebarOpen(false);

   };


   const toggleSidebar = () => {

      if (
         isLoading ||
         regeneratingMessageId
      ) {
         return;
      }


      // Do not use the mobile drawer
      // behavior on desktop.
      if (
         window.innerWidth >
         MOBILE_BREAKPOINT
      ) {
         return;
      }


      setIsSidebarOpen(
         (previous) =>
            !previous
      );

   };


   // ==========================================
   // RESPONSIVE SIDEBAR STATE
   // ==========================================

   useEffect(() => {

      const mediaQuery =
         window.matchMedia(
            `(min-width: ${MOBILE_BREAKPOINT + 1
            }px)`
         );


      const handleMediaChange =
         (event) => {

            // The sidebar is a mobile
            // drawer. Always close it
            // when entering desktop.
            if (
               event.matches
            ) {

               setIsSidebarOpen(
                  false
               );

            }

         };


      // Initial desktop check
      if (
         mediaQuery.matches
      ) {

         setIsSidebarOpen(
            false
         );

      }


      if (
         typeof mediaQuery.addEventListener ===
         "function"
      ) {

         mediaQuery.addEventListener(
            "change",
            handleMediaChange
         );

      } else {

         // Safari fallback
         mediaQuery.addListener(
            handleMediaChange
         );

      }


      return () => {

         if (
            typeof mediaQuery.removeEventListener ===
            "function"
         ) {

            mediaQuery.removeEventListener(
               "change",
               handleMediaChange
            );

         } else {

            mediaQuery.removeListener(
               handleMediaChange
            );

         }

      };

   }, []);


   // ==========================================
   // RESET CURRENT CHAT
   // ==========================================

   const resetCurrentChat = () => {

      setMessages([]);

      setCurrentChatId(null);

      setIsTemporaryChat(false);

      setMemoryStatus({
         active: false,
         resetAt: null,
      });

   };


   // ==========================================
   // EXIT TEMPORARY CHAT
   // ==========================================

   const exitTemporaryChat =
      async () => {

         if (
            !isTemporaryChat
         ) {

            resetCurrentChat();

            return;

         }


         try {

            if (
               currentChatId
            ) {

               await deleteChat(
                  currentChatId
               );

            }

         } catch (error) {

            console.error(
               "Failed to remove temporary chat:",
               error
            );

            setErrorMessage(
               error.message ||
               "Failed to remove temporary chat."
            );

         } finally {

            resetCurrentChat();

         }

      };


   // ==========================================
   // REFRESH CHAT HISTORY
   // ==========================================

   const refreshChatHistory =
      async () => {

         try {

            const updatedChats =
               await getChats();


            const persistentChats =
               Array.isArray(
                  updatedChats
               )
                  ? updatedChats.filter(
                     (chat) =>
                        chat?.temporary !== true
                  )
                  : [];


            setChatHistory(
               persistentChats
            );


            return updatedChats;

         } catch (error) {

            console.error(
               "Failed to refresh chat history:",
               error
            );

            return null;

         }

      };


   // ==========================================
   // LOAD CHAT HISTORY
   // ==========================================

   useEffect(() => {

      let isMounted = true;


      const loadChats =
         async () => {

            try {

               setIsLoadingChats(
                  true
               );

               setErrorMessage(
                  ""
               );


               const chats =
                  await getChats();


               if (
                  isMounted
               ) {

                  const persistentChats =
                     Array.isArray(
                        chats
                     )
                        ? chats.filter(
                           (chat) =>
                              chat?.temporary !== true
                        )
                        : [];


                  setChatHistory(
                     persistentChats
                  );

               }

            } catch (error) {

               console.error(
                  "Failed to load chat history:",
                  error
               );


               if (
                  isMounted
               ) {

                  setErrorMessage(
                     error.message ||
                     "Failed to load chat history."
                  );

               }

            } finally {

               if (
                  isMounted
               ) {

                  setIsLoadingChats(
                     false
                  );

               }

            }

         };


      loadChats();


      return () => {

         isMounted = false;

      };

   }, []);


   // ==========================================
   // CHANGE CHAT MODE
   // ==========================================

   const handleModeChange =
      (mode) => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         const allowedModes = [
            "auto",
            "gemini",
            "web",
         ];


         if (
            !allowedModes.includes(
               mode
            )
         ) {

            console.error(
               "Invalid chat mode:",
               mode
            );

            return;

         }


         setChatMode(
            mode
         );

         setErrorMessage(
            ""
         );

      };


   // ==========================================
   // SEND MESSAGE
   // ==========================================

   const handleSendMessage =
      async (message) => {

         const trimmedMessage =
            message?.trim();


         if (
            !trimmedMessage ||
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         setErrorMessage(
            ""
         );

         setIsLoading(
            true
         );


         const temporaryUserMessage = {

            id:
               `temp-user-${Date.now()}`,

            role:
               "user",

            message:
               trimmedMessage,

         };


         setMessages(
            (previousMessages) => [

               ...previousMessages,

               temporaryUserMessage,

            ]
         );


         try {

            const response =
               await sendMessage(
                  trimmedMessage,
                  currentChatId,
                  chatMode,
                  isTemporaryChat
               );


            const chatId =
               response?.chat_id;


            if (
               !chatId
            ) {

               throw new Error(
                  "Backend did not return a chat ID."
               );

            }


            if (
               !currentChatId
            ) {

               setCurrentChatId(
                  chatId
               );

            }


            if (
               typeof response?.temporary ===
               "boolean"
            ) {

               setIsTemporaryChat(
                  response.temporary
               );

            }


            setMemoryStatus({
               active: true,
               resetAt: null,
            });


            const assistantMessage = {

               id:
                  response.message_id ||
                  `temp-assistant-${Date.now()}`,

               role:
                  "assistant",

               message:
                  response.answer ||
                  "I couldn't generate a response.",

               sources:
                  Array.isArray(
                     response.sources
                  )
                     ? response.sources
                     : [],

               usedWebSearch:
                  Boolean(
                     response.used_web_search
                  ),

               interactionId:
                  response.interaction_id ||
                  null,

               feedback:
                  response.feedback ||
                  null,

            };


            setMessages(
               (previousMessages) => [

                  ...previousMessages,

                  assistantMessage,

               ]
            );


            if (
               !isTemporaryChat
            ) {

               await refreshChatHistory();

            }

         } catch (error) {

            console.error(
               "Chat error:",
               error
            );


            setMessages(
               (previousMessages) =>
                  previousMessages.filter(
                     (item) =>
                        item.id !==
                        temporaryUserMessage.id
                  )
            );


            setErrorMessage(
               error.message ||
               "Sorry, something went wrong. Please try again."
            );

         } finally {

            setIsLoading(
               false
            );

         }

      };


   // ==========================================
   // REGENERATE ANSWER
   // ==========================================

   const handleRegenerateMessage =
      async (messageId) => {

         if (
            isLoading ||
            regeneratingMessageId ||
            !currentChatId ||
            !messageId
         ) {

            return;

         }


         const targetIndex =
            messages.findIndex(
               (message) =>
                  message.id ===
                  messageId
            );


         if (
            targetIndex === -1
         ) {

            setErrorMessage(
               "Unable to find the answer to regenerate."
            );

            return;

         }


         const targetMessage =
            messages[targetIndex];


         if (
            !targetMessage ||
            targetMessage.role !==
            "assistant"
         ) {

            setErrorMessage(
               "Only an AI answer can be regenerated."
            );

            return;

         }


         if (
            targetIndex !==
            messages.length - 1
         ) {

            setErrorMessage(
               "Only the latest answer can be regenerated."
            );

            return;

         }


         const userMessage =
            messages[targetIndex - 1];


         if (
            !userMessage ||
            userMessage.role !==
            "user"
         ) {

            setErrorMessage(
               "Unable to find the question for this answer."
            );

            return;

         }


         try {

            setErrorMessage(
               ""
            );

            setRegeneratingMessageId(
               messageId
            );


            const response =
               await regenerateMessage(
                  currentChatId,
                  messageId
               );


            if (
               !response ||
               typeof response.answer !==
               "string"
            ) {

               throw new Error(
                  "Backend did not return a valid regenerated answer."
               );

            }


            setMessages(
               (previousMessages) =>
                  previousMessages.map(
                     (message) => {

                        if (
                           message.id !==
                           messageId
                        ) {

                           return message;

                        }


                        return {

                           ...message,

                           message:
                              response.answer,

                           sources:
                              Array.isArray(
                                 response.sources
                              )
                                 ? response.sources
                                 : [],

                           usedWebSearch:
                              Boolean(
                                 response.used_web_search
                              ),

                           interactionId:
                              response.interaction_id ||
                              null,

                           feedback:
                              null,

                        };

                     }
                  )
            );


            setMemoryStatus({
               active: true,
               resetAt: null,
            });


            if (
               !isTemporaryChat
            ) {

               await refreshChatHistory();

            }

         } catch (error) {

            console.error(
               "Regenerate answer error:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to regenerate the answer. Please try again."
            );

         } finally {

            setRegeneratingMessageId(
               null
            );

         }

      };


   // ==========================================
   // NEW NORMAL CHAT
   // ==========================================

   const handleNewChat =
      async () => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         setErrorMessage(
            ""
         );


         if (
            isTemporaryChat
         ) {

            await exitTemporaryChat();

            closeSidebar();

            return;

         }


         resetCurrentChat();


         // Always close the mobile drawer
         // after creating a new chat.
         closeSidebar();

      };


   // ==========================================
   // START TEMPORARY CHAT
   // ==========================================

   const handleNewTemporaryChat =
      async () => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         setErrorMessage(
            ""
         );


         if (
            isTemporaryChat
         ) {

            await exitTemporaryChat();

         }


         setMessages([]);

         setCurrentChatId(
            null
         );


         setMemoryStatus({
            active: false,
            resetAt: null,
         });


         setIsTemporaryChat(
            true
         );


         closeSidebar();

      };


   // ==========================================
   // OPEN GLOBAL CLEAR MEMORY MODAL
   // ==========================================

   const handleClearMemory =
      () => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         setErrorMessage(
            ""
         );


         setModal({

            isOpen: true,

            type: "clear",

            chatId: null,

         });

      };


   // ==========================================
   // OPEN CURRENT CHAT MEMORY MODAL
   // ==========================================

   const handleClearChatMemory =
      (
         chatId = currentChatId
      ) => {

         if (
            isLoading ||
            regeneratingMessageId ||
            !chatId
         ) {

            return;

         }


         setErrorMessage(
            ""
         );


         setModal({

            isOpen: true,

            type: "clear-chat",

            chatId,

         });

      };


   // ==========================================
   // CONFIRM GLOBAL CLEAR MEMORY
   // ==========================================

   const handleConfirmClearMemory =
      async () => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         try {

            setIsLoading(
               true
            );

            setErrorMessage(
               ""
            );


            const result =
               await clearMemory();


            const resetAt =
               result?.memory_reset_at ||
               new Date().toISOString();


            setMemoryStatus({

               active: false,

               resetAt,

            });


            setChatHistory(
               (previousChats) =>
                  previousChats.map(
                     (chat) => ({

                        ...chat,

                        memory_active:
                           false,

                        memory_reset_at:
                           resetAt,

                     })
                  )
            );


            setModal({

               isOpen: false,

               type: "clear",

               chatId: null,

            });

         } catch (error) {

            console.error(
               "Clear Memory error:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to clear conversation memory."
            );

         } finally {

            setIsLoading(
               false
            );

         }

      };


   // ==========================================
   // CONFIRM CURRENT CHAT MEMORY CLEAR
   // ==========================================

   const handleConfirmClearChatMemory =
      async () => {

         const chatId =
            modal.chatId;


         if (
            !chatId
         ) {

            setModal({

               isOpen: false,

               type: "clear-chat",

               chatId: null,

            });

            return;

         }


         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         try {

            setIsLoading(
               true
            );

            setErrorMessage(
               ""
            );


            const result =
               await clearChatMemory(
                  chatId
               );


            const resetAt =
               result?.memory_reset_at ||
               new Date().toISOString();


            if (
               chatId ===
               currentChatId
            ) {

               setMemoryStatus({

                  active: false,

                  resetAt,

               });

            }


            setChatHistory(
               (previousChats) =>
                  previousChats.map(
                     (chat) => {

                        if (
                           chat?.id !==
                           chatId
                        ) {

                           return chat;

                        }


                        return {

                           ...chat,

                           memory_active:
                              false,

                           memory_reset_at:
                              resetAt,

                        };

                     }
                  )
            );


            setModal({

               isOpen: false,

               type: "clear-chat",

               chatId: null,

            });

         } catch (error) {

            console.error(
               "Clear chat memory error:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to clear memory for this chat."
            );

         } finally {

            setIsLoading(
               false
            );

         }

      };


   // ==========================================
   // SELECT CHAT
   // ==========================================

   const handleSelectChat =
      async (chat) => {

         if (
            isLoading ||
            regeneratingMessageId ||
            !chat?.id
         ) {

            return;

         }


         try {

            setIsLoading(
               true
            );

            setErrorMessage(
               ""
            );


            if (
               isTemporaryChat &&
               currentChatId &&
               currentChatId !==
               chat.id
            ) {

               await exitTemporaryChat();

            }


            const selectedChat =
               await getChat(
                  chat.id
               );


            const loadedMessages =
               Array.isArray(
                  selectedChat?.messages
               )
                  ? selectedChat.messages.map(
                     (message) => ({

                        id:
                           message.id,

                        role:
                           message.role,

                        message:
                           message.message,

                        sources:
                           Array.isArray(
                              message.sources
                           )
                              ? message.sources
                              : [],

                        usedWebSearch:
                           Boolean(
                              message.used_web_search
                           ),

                        interactionId:
                           message.interaction_id ||
                           null,

                        feedback:
                           message.feedback ||
                           null,

                     })
                  )
                  : [];


            setMessages(
               loadedMessages
            );


            setCurrentChatId(
               chat.id
            );


            setIsTemporaryChat(
               Boolean(
                  selectedChat?.temporary
               )
            );


            setMemoryStatus({

               active:
                  Boolean(
                     selectedChat?.memory?.active
                  ),

               resetAt:
                  selectedChat?.memory?.reset_at ||
                  null,

            });


            setRegeneratingMessageId(
               null
            );


            // Close the mobile drawer
            // after selecting a conversation.
            closeSidebar();

         } catch (error) {

            console.error(
               "Failed to load selected chat:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to load the selected chat."
            );

         } finally {

            setIsLoading(
               false
            );

         }

      };


   // ==========================================
   // DELETE CHAT
   // ==========================================

   const handleDeleteChat =
      (chatId) => {

         if (
            isLoading ||
            regeneratingMessageId ||
            !chatId
         ) {

            return;

         }


         setModal({

            isOpen: true,

            type: "delete",

            chatId,

         });

      };


   // ==========================================
   // CONFIRM DELETE CHAT
   // ==========================================

   const handleConfirmDelete =
      async () => {

         const chatId =
            modal.chatId;


         if (
            !chatId
         ) {

            setModal({

               isOpen: false,

               type: "delete",

               chatId: null,

            });

            return;

         }


         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         try {

            setIsLoading(
               true
            );

            setErrorMessage(
               ""
            );


            await deleteChat(
               chatId
            );


            await refreshChatHistory();


            if (
               currentChatId ===
               chatId
            ) {

               resetCurrentChat();

            }


            setModal({

               isOpen: false,

               type: "delete",

               chatId: null,

            });

         } catch (error) {

            console.error(
               "Delete chat error:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to delete the chat."
            );

         } finally {

            setIsLoading(
               false
            );

         }

      };


   // ==========================================
   // RENAME CHAT
   // ==========================================

   const handleRenameChat =
      async (
         chatId,
         newTitle
      ) => {

         if (
            isLoading ||
            regeneratingMessageId ||
            !chatId ||
            !newTitle?.trim()
         ) {

            return;

         }


         const trimmedTitle =
            newTitle.trim();


         try {

            setErrorMessage(
               ""
            );


            await renameChat(
               chatId,
               trimmedTitle
            );


            setChatHistory(
               (previousChats) =>
                  previousChats.map(
                     (chat) => {

                        if (
                           chat?.id !==
                           chatId
                        ) {

                           return chat;

                        }


                        return {

                           ...chat,

                           title:
                              trimmedTitle,

                        };

                     }
                  )
            );

         } catch (error) {

            console.error(
               "Rename chat error:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to rename the chat."
            );


            throw error;

         }

      };


   // ==========================================
   // EXPORT CURRENT CHAT
   // ==========================================

   const handleExportChat =
      (format) => {

         if (
            !currentChatId ||
            !Array.isArray(
               messages
            ) ||
            messages.length === 0
         ) {

            setErrorMessage(
               "There is no conversation to export."
            );

            return;

         }


         const currentChat =
            chatHistory.find(
               (chat) =>
                  chat?.id ===
                  currentChatId
            );


         const title =
            currentChat?.title ||
            "EchoMind";


         try {

            setErrorMessage(
               ""
            );


            switch (format) {

               case "pdf":

                  exportChatAsPdf(
                     title,
                     messages
                  );

                  break;


               case "txt":

                  exportChatAsTxt(
                     title,
                     messages
                  );

                  break;


               case "markdown":

                  exportChatAsMarkdown(
                     title,
                     messages
                  );

                  break;


               default:

                  throw new Error(
                     "Unsupported export format."
                  );

            }

         } catch (error) {

            console.error(
               "Chat export failed:",
               error
            );


            setErrorMessage(
               error.message ||
               "Failed to export the conversation."
            );

         }

      };


   // ==========================================
   // LOGOUT
   // ==========================================

   const handleLogout =
      () => {

         if (
            isLoading ||
            regeneratingMessageId
         ) {

            return;

         }


         setModal({

            isOpen: true,

            type: "logout",

            chatId: null,

         });

      };


   // ==========================================
   // CONFIRM LOGOUT
   // ==========================================

   const handleConfirmLogout =
      async () => {

         if (
            isTemporaryChat &&
            currentChatId
         ) {

            try {

               await deleteChat(
                  currentChatId
               );

            } catch (error) {

               console.error(
                  "Failed to remove temporary chat during logout:",
                  error
               );

            }

         }


         logout();


         navigate(
            "/login",
            {
               replace: true,
            }
         );

      };


   // ==========================================
   // CANCEL MODAL
   // ==========================================

   const handleCancelModal =
      () => {

         if (
            isLoading
         ) {

            return;

         }


         setModal({

            isOpen: false,

            type: "delete",

            chatId: null,

         });

      };


   // ==========================================
   // CLOSE ERROR
   // ==========================================

   const handleCloseError =
      () => {

         setErrorMessage(
            ""
         );

      };


   // ==========================================
   // MODAL CONFIRM HANDLER
   // ==========================================

   const getModalConfirmHandler =
      () => {

         switch (
         modal.type
         ) {

            case "delete":

               return handleConfirmDelete;


            case "clear":

               return handleConfirmClearMemory;


            case "clear-chat":

               return handleConfirmClearChatMemory;


            case "logout":

               return handleConfirmLogout;


            default:

               return handleCancelModal;

         }

      };


   // ==========================================
   // MODAL CONTENT
   // ==========================================

   const getModalContent =
      () => {

         switch (
         modal.type
         ) {

            case "delete":

               return {

                  title:
                     "Delete this chat?",

                  message:
                     "This conversation and all of its messages will be permanently deleted. This action cannot be undone.",

                  confirmText:
                     "Delete Chat",

               };


            case "clear":

               return {

                  title:
                     "Clear all conversation memory?",

                  message:
                     "This will reset the AI memory for all your chats. Your saved conversations and messages will not be deleted.",

                  confirmText:
                     "Clear All Memory",

               };


            case "clear-chat":

               return {

                  title:
                     "Clear this chat's memory?",

                  message:
                     "This will reset the AI memory for this chat only. Your existing messages will remain visible and will not be deleted.",

                  confirmText:
                     "Clear Chat Memory",

               };


            case "logout":

               return {

                  title:
                     "Logout?",

                  message:
                     "Are you sure you want to log out of your EchoMind account?",

                  confirmText:
                     "Logout",

               };


            default:

               return {

                  title:
                     "Confirm action",

                  message:
                     "Are you sure you want to continue?",

                  confirmText:
                     "Confirm",

               };

         }

      };


   const modalContent =
      getModalContent();


   // ==========================================
   // RENDER
   // ==========================================

   return (

      <div
         className={
            `app-layout ${isSidebarOpen
               ? "sidebar-is-open"
               : "sidebar-is-closed"
            }`
         }
         data-mobile-sidebar-open={
            isSidebarOpen
               ? "true"
               : "false"
         }
      >

         {/* =====================================
             SIDEBAR
         ===================================== */}

         <Sidebar

            isMobileOpen={
               isSidebarOpen
            }

            onMobileToggle={
               toggleSidebar
            }

            onMobileClose={
               closeSidebar
            }

            onNewChat={
               handleNewChat
            }

            onStartTemporaryChat={
               handleNewTemporaryChat
            }

            onExitTemporaryChat={
               exitTemporaryChat
            }

            onClearMemory={
               handleClearMemory
            }

            onClearChatMemory={
               handleClearChatMemory
            }

            onDeleteChat={
               handleDeleteChat
            }

            onRenameChat={
               handleRenameChat
            }

            onLogout={
               handleLogout
            }

            user={
               user
            }

            chatHistory={
               chatHistory
            }

            currentChatId={
               currentChatId
            }

            onSelectChat={
               handleSelectChat
            }

            isLoadingChats={
               isLoadingChats
            }

            isTemporaryChat={
               isTemporaryChat
            }

         />


         {/* =====================================
             MAIN CHAT AREA
         ===================================== */}

         <main
            className={
               `main-content ${isSidebarOpen
                  ? "mobile-sidebar-open"
                  : ""
               }`
            }
         >

            {/* =====================================
                ERROR MESSAGE
            ===================================== */}

            {errorMessage && (

               <div
                  className="chat-error-message"
                  role="alert"
               >

                  <div
                     className="chat-error-content"
                  >

                     <span
                        className="chat-error-icon"
                        aria-hidden="true"
                     >
                        ⚠️
                     </span>


                     <span
                        className="chat-error-text"
                     >
                        {errorMessage}
                     </span>

                  </div>


                  <button
                     type="button"
                     className="chat-error-close"
                     onClick={
                        handleCloseError
                     }
                     aria-label="Dismiss error"
                     title="Dismiss"
                  >
                     ×
                  </button>

               </div>

            )}


            {/* =====================================
                TEMPORARY CHAT INDICATOR
            ===================================== */}

            {isTemporaryChat && (

               <div
                  className="temporary-chat-indicator"
                  role="status"
               >

                  <span>
                     🕶️
                  </span>

                  <strong>
                     Temporary Chat
                  </strong>

                  <span>
                     This conversation won't appear in your chat history.
                  </span>

               </div>

            )}


            {/* =====================================
                CHAT WINDOW
            ===================================== */}

            <ChatWindow

               messages={
                  messages
               }

               isLoading={
                  isLoading
               }

               currentChatId={
                  currentChatId
               }

               onSendMessage={
                  handleSendMessage
               }

               onRegenerateMessage={
                  handleRegenerateMessage
               }

               regeneratingMessageId={
                  regeneratingMessageId
               }

               mode={
                  chatMode
               }

               onModeChange={
                  handleModeChange
               }

               onExportChat={
                  handleExportChat
               }

               /*
                  On mobile the existing
                  "Chats" button in ChatWindow
                  opens the sidebar.
               */
               onBackToChats={
                  openSidebar
               }

            />


         </main>


         {/* =====================================
             CONFIRMATION MODAL
         ===================================== */}

         <ConfirmModal

            isOpen={
               modal.isOpen
            }

            type={
               modal.type
            }

            onCancel={
               handleCancelModal
            }

            onConfirm={
               getModalConfirmHandler()
            }

            isLoading={

               modal.type === "delete" ||
                  modal.type === "clear" ||
                  modal.type === "clear-chat"

                  ? isLoading

                  : false

            }

            title={
               modalContent.title
            }

            message={
               modalContent.message
            }

            confirmText={
               modalContent.confirmText
            }

         />

      </div>

   );

}


export default Chat;