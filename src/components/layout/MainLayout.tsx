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
      <div className="min-h-dvh bg-background overflow-x-hidden">
        <Sidebar />
        
        <main className="ml-64 min-h-dvh p-4 sm:p-6 lg:p-8 relative overflow-x-hidden">
          {children}
        </main>

        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </ChatContext.Provider>
  );
}
