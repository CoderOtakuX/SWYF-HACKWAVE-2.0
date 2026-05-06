import { createContext, useContext, useState, ReactNode } from 'react';

interface SkinToneData {
  tone: string;
  season: string;
  description: string;
  recommendedColors: string[];
  colors: string[];
  gender: 'masculine' | 'feminine' | 'neutral';
}

interface SkinToneContextType {
  skinToneData: SkinToneData | null;
  setSkinToneData: (data: SkinToneData | null) => void;
}

const SkinToneContext = createContext<SkinToneContextType>({
  skinToneData: null,
  setSkinToneData: () => {},
});

export const useSkinTone = () => useContext(SkinToneContext);

export const SkinToneProvider = ({ children }: { children: ReactNode }) => {
  const [skinToneData, setSkinToneData] = useState<SkinToneData | null>(() => {
    // Persist across page navigation via localStorage
    try {
      const saved = localStorage.getItem('swyf_skin_tone');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetSkinToneData = (data: SkinToneData | null) => {
    setSkinToneData(data);
    try {
      if (data) {
        localStorage.setItem('swyf_skin_tone', JSON.stringify(data));
      } else {
        localStorage.removeItem('swyf_skin_tone');
      }
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <SkinToneContext.Provider value={{ skinToneData, setSkinToneData: handleSetSkinToneData }}>
      {children}
    </SkinToneContext.Provider>
  );
};
