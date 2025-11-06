import { useState } from "react";
import { MessageCircle, X, Send, User, MoreHorizontal, Mail, Save, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Helper function to clean markdown and make responses look cleaner
const cleanResponse = (text: string) => {
  // Strip ** markdown bold syntax for cleaner output
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

const RAGAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your networking assistant. Ask me anything about tracking companies, outreach strategies, or the recruiting tracker! 💼",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Helpers for actions menu
  const getTranscriptText = () => {
    try {
      const lines = messages.map((m) => {
        const role = m.role === "assistant" ? "Assistant" : "You";
        const time = m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const text = m.role === "assistant" ? cleanResponse(m.content) : m.content;
        return `${role} (${time}):\n${text}`;
      });
      return lines.join("\n\n");
    } catch {
      return "";
    }
  };

  const handleEmailChat = () => {
    const subject = encodeURIComponent("Networking Assistant Chat");
    const body = encodeURIComponent(getTranscriptText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSaveChat = () => {
    try {
      const historyKey = "ragChatHistory";
      const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const entry = { id: Date.now(), createdAt: new Date().toISOString(), messages };
      localStorage.setItem(historyKey, JSON.stringify([entry, ...existing].slice(0, 20)));
      toast.success("Chat saved locally");
    } catch (e) {
      toast.error("Failed to save chat");
    }
  };

  const handlePinLatestAnswer = () => {
    try {
      const latest = [...messages].reverse().find((m) => m.role === "assistant");
      if (!latest) {
        toast.info("No assistant answer to pin");
        return;
      }
      const pinKey = "pinnedAssistantAnswers";
      const existing = JSON.parse(localStorage.getItem(pinKey) || "[]");
      const pin = { id: Date.now(), createdAt: new Date().toISOString(), content: cleanResponse(latest.content) };
      localStorage.setItem(pinKey, JSON.stringify([pin, ...existing].slice(0, 50)));
      toast.success("Pinned to dashboard");
    } catch (e) {
      toast.error("Failed to pin answer");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/rag/query", {
        query: input.trim(),
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.answer || "I couldn't find information about that. Try asking about tiers, outreach, or the tracker format!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("RAG query error:", error);
      toast.error("Failed to get response");
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble right now. Please try again!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {messages.length > 1 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {messages.length - 1}
          </span>
        )}
      </Button>

      {/* Chat Side Panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-white">Networking Assistant</SheetTitle>
                  <SheetDescription className="text-blue-100">
                    Ask me about recruiting strategies
                  </SheetDescription>
                </div>
              </div>
              {/* Ephemeral status + actions (non-functional MVP) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-100 hidden sm:inline">Ephemeral chat</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Chat actions">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEmailChat}>
                      <Mail className="mr-2 h-4 w-4" /> Email me this chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSaveChat}>
                      <Save className="mr-2 h-4 w-4" /> Save my chat history
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePinLatestAnswer}>
                      <Pin className="mr-2 h-4 w-4" /> Pin key answers to my dashboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.role === "assistant" ? cleanResponse(message.content) : message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about tiers, outreach, or tracking..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Try: "What's the difference between Tier 1 and Tier 2?"
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default RAGAssistant;

