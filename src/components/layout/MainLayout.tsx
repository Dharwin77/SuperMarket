import { ReactNode, useState, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { ChatSidebar } from "./ChatSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within MainLayout');
  }
  return context;
};

export function MainLayout({ children }: MainLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, toggleChat }}>
      <div className="min-h-screen bg-background">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl" />
        </div>

        <Sidebar />
        
        <main className="ml-64 min-h-screen p-8 relative">
          {children}
        </main>

        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </ChatContext.Provider>
  );
}
