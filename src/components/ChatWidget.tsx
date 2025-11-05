import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Window */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-5 right-5 z-50
          w-[60px] h-[60px] rounded-full
          bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6]
          text-white shadow-[0_0_40px_rgba(139,92,246,0.5)]
          flex items-center justify-center
          transition-all duration-300
          hover:scale-105 hover:shadow-[0_0_50px_rgba(139,92,246,0.7)]
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}
        aria-label="Toggle chat"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </>
  );
};

export default ChatWidget;
