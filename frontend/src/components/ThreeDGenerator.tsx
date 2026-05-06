import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const GENERATOR_URL = "https://vast-ai-triposg.hf.space";

const ThreeDGenerator = () => {
  const [embedKey, setEmbedKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 2800);
    return () => window.clearTimeout(timer);
  }, [embedKey]);

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-20">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Reload generator"
          onClick={() => setEmbedKey(key => key + 1)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <section className="relative rounded-2xl border border-white/10 bg-background/70 shadow-lg backdrop-blur-sm overflow-hidden">
        <div className="relative h-[720px] overflow-hidden bg-background/60">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              </div>
            </div>
          )}
          <iframe
            key={embedKey}
            src={GENERATOR_URL}
            title="AI 3D Model Generator"
            className="h-[1400px] w-full -translate-y-[475px] border-0 bg-background"
            allow="clipboard-read; clipboard-write; fullscreen"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </section>
    </div>
  );
};

export default ThreeDGenerator;
