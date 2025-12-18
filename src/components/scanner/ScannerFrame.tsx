import { motion } from "framer-motion";
import { Camera, Zap } from "lucide-react";

interface ScannerFrameProps {
  isScanning: boolean;
  uploadedImage?: string | null;
}

export function ScannerFrame({ isScanning, uploadedImage }: ScannerFrameProps) {
  return (
    <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden glass-card border border-white/20">
      {/* Camera placeholder or uploaded image */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
        {uploadedImage ? (
          <img 
            src={uploadedImage} 
            alt="Uploaded preview" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center">
            <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Camera Feed</p>
          </div>
        )}
      </div>

      {/* Scanning overlay */}
      {isScanning && (
        <>
          {/* Scanning line */}
          <motion.div
            initial={{ top: "10%" }}
            animate={{ top: ["10%", "85%", "10%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent glow-primary"
          />

          {/* Corner markers */}
          <div className="absolute inset-8">
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-primary rounded-tl-lg" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-primary rounded-tr-lg" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-primary rounded-bl-lg" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-primary rounded-br-lg" />
          </div>

          {/* Scanning indicator */}
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Scanning...</span>
          </motion.div>
        </>
      )}

      {/* Gesture hints */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="glass-card p-2 border border-white/10 text-center">
            <span className="text-muted-foreground">↓ Add to Bill</span>
          </div>
          <div className="glass-card p-2 border border-white/10 text-center">
            <span className="text-muted-foreground">← Compare Price</span>
          </div>
          <div className="glass-card p-2 border border-white/10 text-center">
            <span className="text-muted-foreground">→ Add to Stock</span>
          </div>
          <div className="glass-card p-2 border border-white/10 text-center">
            <span className="text-muted-foreground">↑ Full Details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
