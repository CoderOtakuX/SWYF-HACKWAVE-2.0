import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, RefreshCw,
  ChevronDown, Lightbulb, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SkinToneContext {
  tone?: string;
  season?: string;
  description?: string;
  recommendedColors?: string[];
  colors?: string[];
  gender?: 'masculine' | 'feminine' | 'neutral';
}

interface AIStylistProps {
  skinToneContext?: SkinToneContext | null;
}

// ── Suggested prompts ─────────────────────────────────────
const SUGGESTED_PROMPTS = [
  "What colors look best on me?",
  "Suggest an outfit for a formal event",
  "What should I wear to the office?",
  "Casual weekend outfit ideas?",
  "How do I style for my skin tone?",
  "What patterns complement my palette?",
];

// ── Simple markdown renderer ──────────────────────────────
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        );

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-brand-teal font-bold mt-0.5 flex-shrink-0">
                {line.match(/^(\d+)\./)?.[1]}.
              </span>
              <span>{rendered.slice(1)}</span>
            </div>
          );
        }

        // Bullet
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-brand-pink mt-0.5 flex-shrink-0">•</span>
              <span>{rendered.slice(1)}</span>
            </div>
          );
        }

        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
const AIStylist = ({ skinToneContext }: AIStylistProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(c => {
        if (c >= 3) { clearInterval(timer); return c; }
        return c + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasSkinTone = skinToneContext?.tone && skinToneContext?.season;
      const genderLabel = skinToneContext?.gender === 'masculine' ? 'masculine' : skinToneContext?.gender === 'feminine' ? 'feminine' : 'versatile';
      
      const welcomeText = hasSkinTone
        ? `Hello! I'm your SWYF AI Stylist Co-Pilot ✨\n\nI can see you've completed your **Chromatic Analysis** — you're a **${skinToneContext?.season}** type with a **${skinToneContext?.tone}** complexion and a preference for **${genderLabel}** styling. That's a great profile!\n\nAsk me anything about colors, outfits, or styling. I'll ensure my advice perfectly matches your profile.`
        : `Hello! I'm your SWYF AI Stylist Co-Pilot ✨\n\nI'm here to give you personalized fashion advice powered by **Seasonal Color Theory** and **Chromatic Pigment Analysis**.\n\n**Pro tip:** Complete the **Skin Tone Analysis** in the Projects tab first — it lets me give you advice tailored specifically to your unique complexion and styling preference!`;

      setMessages([{
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setShowSuggestions(false);

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build message history for the API (exclude the welcome message from history)
      const historyForApi = [...messages, userMessage]
        .filter(m => m.id !== messages[0]?.id || messages[0]?.role !== 'assistant')
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          skin_tone_context: skinToneContext || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm having a moment — please try again! 🙏",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [input, messages, isLoading, skinToneContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
    // Re-trigger welcome message
    const hasSkinTone = skinToneContext?.tone && skinToneContext?.season;
    const genderLabel = skinToneContext?.gender === 'masculine' ? 'masculine' : skinToneContext?.gender === 'feminine' ? 'feminine' : 'versatile';
    
    const welcomeText = hasSkinTone
      ? `Welcome back! I'm your SWYF AI Stylist Co-Pilot ✨\n\nYour **${skinToneContext?.season}** profile (${genderLabel}) is loaded. What can I help you with today?`
      : `Welcome back! I'm your SWYF AI Stylist Co-Pilot ✨\n\nWhat fashion advice can I give you today?`;
    setMessages([{
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date(),
    }]);
  };

  const hasSkinData = skinToneContext?.tone && skinToneContext?.season;

  return (
    <>
      {/* ── Floating Button ─────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-brand-teal/30"
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-brand-pink/20"
              animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
            />

            <motion.button
              onClick={() => setIsOpen(true)}
              className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00b4d8 0%, #e91e8c 100%)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Open AI Stylist Co-Pilot"
            >
              <Sparkles className="h-7 w-7 text-white" />
              {hasSkinData && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
              )}
            </motion.button>

            {/* Label tooltip */}
            <motion.div
              className="absolute bottom-full right-0 mb-2 whitespace-nowrap text-xs bg-background/90 backdrop-blur border border-white/10 text-foreground/80 px-2.5 py-1 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              AI Stylist Co-Pilot ✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex flex-col"
            style={{ width: '380px', maxHeight: '620px' }}
            initial={{ scale: 0.8, opacity: 0, y: 20, originX: 1, originY: 1 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div
              className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              style={{
                background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,20,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                maxHeight: isMinimized ? '60px' : '620px',
                transition: 'max-height 0.3s ease',
              }}
            >
              {/* ── Header ──────────────────────────── */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0 cursor-pointer"
                style={{ background: 'linear-gradient(90deg, #00b4d8 0%, #e91e8c 100%)' }}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">AI Stylist Co-Pilot</p>
                    <p className="text-white/70 text-[10px]">
                      {hasSkinData ? `${skinToneContext?.season} profile loaded ✓` : 'Powered by SWYF + Gemini'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={clearChat}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 transition-colors flex items-center justify-center"
                    title="Clear chat"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 transition-colors flex items-center justify-center"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-400/50 transition-colors flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* ── Skin Tone Badge ─────────────────── */}
              {!isMinimized && hasSkinData && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5 flex-shrink-0">
                  <Palette className="h-3.5 w-3.5 text-brand-teal" />
                  <span className="text-[11px] text-foreground/70">
                    Chromatic Profile: <strong className="text-foreground/90">{skinToneContext?.season}</strong> · <strong className="text-foreground/90">{skinToneContext?.tone}</strong>
                  </span>
                  {skinToneContext?.colors?.slice(0, 4).map((c, i) => (
                    <span key={i} className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              {/* ── Messages Area ───────────────────── */}
              {!isMinimized && (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" style={{ maxHeight: '360px' }}>
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #00b4d8, #e91e8c)' }}>
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${msg.role === 'user'
                              ? 'rounded-br-sm text-white'
                              : 'rounded-bl-sm text-foreground/90 bg-white/8 border border-white/8'
                            }`}
                          style={msg.role === 'user' ? {
                            background: 'linear-gradient(135deg, #00b4d8 0%, #e91e8c 100%)',
                          } : {}}
                        >
                          {msg.role === 'assistant'
                            ? <RenderMarkdown text={msg.content} />
                            : <p className="text-sm">{msg.content}</p>
                          }
                          <p className="text-[9px] opacity-50 mt-1 text-right">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                      <motion.div
                        className="flex items-start"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#00b4d8,#e91e8c)' }}>
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-white/8 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-teal"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* ── Suggested Prompts ───────────────── */}
              {!isMinimized && showSuggestions && messages.length <= 1 && (
                <div className="px-4 py-2 border-t border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3 w-3 text-brand-yellow" />
                    <span className="text-[10px] text-foreground/50 uppercase tracking-wider font-medium">Suggested</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        disabled={isLoading}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-brand-teal/20 hover:border-brand-teal/40 hover:text-foreground transition-all disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Input Area ──────────────────────── */}
              {!isMinimized && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about colors, outfits, occasions..."
                        className="resize-none min-h-[44px] max-h-[120px] text-sm bg-white/5 border-white/10 placeholder:text-foreground/30 rounded-xl pr-2 focus:ring-1 focus:ring-brand-teal/50 scrollbar-none"
                        rows={1}
                        style={{ fieldSizing: 'content' } as React.CSSProperties}
                      />
                    </div>
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-10 w-10 rounded-xl flex-shrink-0 disabled:opacity-40"
                      style={{
                        background: input.trim()
                          ? 'linear-gradient(135deg, #00b4d8 0%, #e91e8c 100%)'
                          : undefined,
                      }}
                    >
                      {isLoading
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                  <p className="text-center text-[9px] text-foreground/25 mt-2">
                    Powered by SWYF Chromatic Engine + Gemini AI
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIStylist;
