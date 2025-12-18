import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full",
          "bg-gradient-to-r from-primary to-secondary",
          "flex items-center justify-center",
          "shadow-xl glow-primary",
          "hover:scale-110 transition-transform duration-300",
          isOpen && "hidden"
        )}
      >
        <Mic className="h-7 w-7 text-primary-foreground" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Voice Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-80 glass-panel rounded-3xl p-6 border border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Voice Assistant</h3>
                  <p className="text-xs text-muted-foreground">
                    {isListening ? "Listening..." : "Tap to speak"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Voice Visualization */}
            <div className="flex justify-center mb-6">
              <motion.button
                onClick={toggleListening}
                className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300",
                  isListening
                    ? "bg-destructive glow-primary"
                    : "bg-gradient-to-r from-primary to-secondary glow-primary"
                )}
              >
                {isListening ? (
                  <MicOff className="h-10 w-10 text-destructive-foreground" />
                ) : (
                  <Mic className="h-10 w-10 text-primary-foreground" />
                )}
                
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-destructive/50"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-destructive/30"
                      animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                  </>
                )}
              </motion.button>
            </div>

            {/* Commands */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center mb-3">Try saying:</p>
              {[
                "Add 3 bottles of Sprite to bill",
                "Show stock for biscuits",
                "Compare price for Dove soap",
              ].map((command, index) => (
                <motion.div
                  key={command}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm text-muted-foreground bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                >
                  "{command}"
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
