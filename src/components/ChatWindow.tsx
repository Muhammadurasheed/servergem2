import { useState, useEffect, useRef } from "react";
import { X, Minus, Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onClose: () => void;
}

const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call in Phase 2)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Great! I'll help you with that. Here's what I found:\n\n\`\`\`python\n# Dockerfile for Flask app\nFROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["python", "app.py"]\n\`\`\`\n\nReady to deploy to Cloud Run?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-40
        w-full max-w-[400px] 
        ${isMinimized ? 'h-[60px]' : 'h-[600px] min-h-[400px]'}
        bg-background/95 backdrop-blur-xl
        border border-[rgba(139,92,246,0.3)]
        rounded-2xl shadow-2xl
        flex flex-col
        animate-in slide-in-from-bottom-4 fade-in duration-300
        md:w-[400px]
      `}
    >
      {/* Header */}
      <div className="relative border-b border-[rgba(139,92,246,0.3)] bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]" />
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-[#8b5cf6]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">ServerGem AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Minimize"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Welcome to ServerGem!</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    I can help you deploy to Cloud Run in minutes.
                  </p>
                </div>
                <div className="space-y-2 w-full max-w-xs">
                  <button
                    onClick={() => handleQuickAction("Deploy a Flask app")}
                    className="w-full px-4 py-3 bg-accent/50 hover:bg-accent rounded-lg text-sm font-medium transition-colors text-left"
                  >
                    🐍 Deploy a Flask app
                  </button>
                  <button
                    onClick={() => handleQuickAction("Fix a deployment error")}
                    className="w-full px-4 py-3 bg-accent/50 hover:bg-accent rounded-lg text-sm font-medium transition-colors text-left"
                  >
                    🔧 Fix a deployment error
                  </button>
                  <button
                    onClick={() => handleQuickAction("Set up CI/CD")}
                    className="w-full px-4 py-3 bg-accent/50 hover:bg-accent rounded-lg text-sm font-medium transition-colors text-left"
                  >
                    🚀 Set up CI/CD
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-[rgba(30,41,59,0.8)] border border-[rgba(139,92,246,0.3)] rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                        <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </>
      )}
    </div>
  );
};

export default ChatWindow;
