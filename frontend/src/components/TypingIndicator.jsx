import "./TypingIndicator.css";

function TypingIndicator() {
   return (
      <div
         className="typing-indicator"
         role="status"
         aria-live="polite"
         aria-label="EchoMind is typing"
      >
         <span aria-hidden="true"></span>
         <span aria-hidden="true"></span>
         <span aria-hidden="true"></span>
      </div>
   );
}

export default TypingIndicator;