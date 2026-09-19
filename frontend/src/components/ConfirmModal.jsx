import { useEffect, useRef } from "react";
import "./ConfirmModal.css";

function ConfirmModal({
   isOpen,
   type = "delete",
   title,
   message,
   confirmText,
   cancelText = "Cancel",
   onConfirm,
   onCancel,
   isLoading = false,
}) {
   const cancelButtonRef = useRef(null);

   useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (event) => {
         if (event.key === "Escape" && !isLoading) {
            onCancel();
         }
      };

      document.addEventListener("keydown", handleKeyDown);

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Put keyboard focus inside the modal.
      cancelButtonRef.current?.focus();

      return () => {
         document.removeEventListener("keydown", handleKeyDown);
         document.body.style.overflow = previousOverflow;
      };
   }, [isOpen, isLoading, onCancel]);

   if (!isOpen) {
      return null;
   }

   const isDelete = type === "delete";
   const isClear = type === "clear";
   const isLogout = type === "logout";

   const defaultTitle = isDelete
      ? "Delete this chat?"
      : isClear
         ? "Clear conversation memory?"
         : "Logout?";

   const defaultMessage = isDelete
      ? "This conversation and all of its messages will be permanently deleted. This action cannot be undone."
      : isClear
         ? "This will clear the AI's current conversation memory. Your saved chat history will not be deleted."
         : "Are you sure you want to log out of your EchoMind account?";

   const defaultConfirmText = isDelete
      ? "Delete Chat"
      : isClear
         ? "Clear Memory"
         : "Logout";

   const modalIcon = isDelete
      ? "🗑️"
      : isClear
         ? "🧹"
         : "↪";

   const modalClass = isDelete
      ? "delete-modal"
      : isClear
         ? "clear-modal"
         : "logout-modal";

   const handleOverlayClick = (event) => {
      if (
         event.target === event.currentTarget &&
         !isLoading
      ) {
         onCancel();
      }
   };

   const handleConfirmClick = () => {
      if (isLoading) {
         return;
      }

      if (typeof onConfirm !== "function") {
         console.error(
            "ConfirmModal: onConfirm is not a function"
         );
         return;
      }

      onConfirm();
   };

   return (
      <div
         className="confirm-modal-overlay"
         onMouseDown={handleOverlayClick}
         role="presentation"
      >
         <div
            className={`confirm-modal ${modalClass}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
         >
            {/* Icon */}
            <div className="confirm-modal-icon-wrapper">
               <div
                  className="confirm-modal-icon"
                  aria-hidden="true"
               >
                  {modalIcon}
               </div>
            </div>

            {/* Content */}
            <div className="confirm-modal-content">
               <h2 id="confirm-modal-title">
                  {title || defaultTitle}
               </h2>

               <p id="confirm-modal-message">
                  {message || defaultMessage}
               </p>
            </div>

            {/* Buttons */}
            <div className="confirm-modal-actions">
               <button
                  ref={cancelButtonRef}
                  type="button"
                  className="confirm-cancel-button"
                  onClick={onCancel}
                  disabled={isLoading}
               >
                  {cancelText}
               </button>

               <button
                  type="button"
                  className={`confirm-action-button ${isDelete
                        ? "confirm-delete-button"
                        : isClear
                           ? "confirm-clear-button"
                           : "confirm-logout-button"
                     }`}
                  onClick={handleConfirmClick}
                  disabled={isLoading}
               >
                  {isLoading ? (
                     <>
                        <span
                           className="confirm-spinner"
                           aria-hidden="true"
                        ></span>

                        <span>Processing...</span>
                     </>
                  ) : (
                     confirmText || defaultConfirmText
                  )}
               </button>
            </div>

            {/* Keyboard Hint */}
            {!isLoading && (
               <div className="confirm-modal-hint">
                  Press <kbd>Esc</kbd> to cancel
               </div>
            )}
         </div>
      </div>
   );
}

export default ConfirmModal;