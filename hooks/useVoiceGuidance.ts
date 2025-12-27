"use client";

import { useCallback, useRef, useEffect, useState } from "react";

// Voice guidance phrases for different capture phases
export interface VoiceGuidancePhrases {
  getReady: string;
  countdown: string[]; // e.g., ["3", "2", "1"]
  capture: string;
  afterCapture: string[];
  betweenPhotos: string[];
  complete: string;
}

// Default English phrases - fun, energetic, and encouraging!
const DEFAULT_PHRASES: VoiceGuidancePhrases = {
  getReady: "Okay! Here we go!",
  countdown: ["Three!", "Two!", "One!"],
  capture: "Smile!!",
  afterCapture: [
    "Yay!! Love it!",
    "Woo!! Amazing!",
    "Yes!! Gorgeous!",
    "Oh wow!! Beautiful!",
    "Fantastic!! Nailed it!",
  ],
  betweenPhotos: [
    "Okay next one!! Strike a pose!",
    "Woohoo!! Show me what you got!",
    "Alright!! Give me your best smile!",
    "Let's go!! Make it fun!",
    "Yes!! Keep that energy going!",
  ],
  complete: "Woohoo! Amazing shots! Let's check them out!",
};

interface UseVoiceGuidanceOptions {
  enabled?: boolean;
  volume?: number; // 0 to 1
  rate?: number; // 0.1 to 10 (1 is normal)
  pitch?: number; // 0 to 2 (1 is normal)
  phrases?: Partial<VoiceGuidancePhrases>;
  voiceName?: string; // Specific voice name to use
}

interface VoiceGuidanceReturn {
  speak: (text: string, options?: { interrupt?: boolean }) => void;
  speakGetReady: () => void;
  speakCountdown: (number: number) => void;
  speakCapture: () => void;
  speakAfterCapture: () => void;
  speakBetweenPhotos: () => void;
  speakComplete: () => void;
  stop: () => void;
  isSupported: boolean;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

export function useVoiceGuidance(
  options: UseVoiceGuidanceOptions = {}
): VoiceGuidanceReturn {
  const {
    enabled = true,
    volume = 1,
    rate = 1,
    pitch = 1,
    phrases: customPhrases,
    voiceName,
  } = options;

  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const afterCaptureIndexRef = useRef(0);
  const betweenPhotosIndexRef = useRef(0);

  // Merge default phrases with custom phrases
  const phrases: VoiceGuidancePhrases = {
    ...DEFAULT_PHRASES,
    ...customPhrases,
  };

  // Initialize speech synthesis and load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Try to find a good English voice
      if (voiceName) {
        selectedVoiceRef.current =
          voices.find((v) => v.name === voiceName) || null;
      }

      if (!selectedVoiceRef.current) {
        // Prefer English voices, prioritize female voices for energetic, friendly tone
        const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

        // Common female voice names across different platforms
        const femaleVoiceNames = [
          // Windows voices
          "zira", "hazel", "susan", "linda", "catherine", "heather",
          // macOS/iOS voices
          "samantha", "karen", "moira", "tessa", "fiona", "victoria", "alex",
          // Google/Android voices
          "female", "woman",
          // Microsoft Azure/Edge voices
          "jenny", "aria", "sara", "michelle", "emma", "olivia", "ava",
        ];

        // Find a female English voice
        const femaleVoice = englishVoices.find((v) => {
          const nameLower = v.name.toLowerCase();
          return femaleVoiceNames.some((name) => nameLower.includes(name));
        });

        // Fallback: prefer any voice that sounds friendly (not robotic)
        const preferredVoice = englishVoices.find(
          (v) => !v.name.toLowerCase().includes("male") && v.localService
        );

        selectedVoiceRef.current =
          femaleVoice || preferredVoice || englishVoices[0] || voices[0] || null;
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voiceschanged event (needed for some browsers)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceName]);

  // Core speak function
  const speak = useCallback(
    (text: string, speakOptions?: { interrupt?: boolean }) => {
      if (!enabled || !isSupported || !text) return;

      const synth = window.speechSynthesis;

      // Cancel current speech if interrupt is true (default)
      if (speakOptions?.interrupt !== false) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;

      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    },
    [enabled, isSupported, volume, rate, pitch]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Speak "Get ready!"
  const speakGetReady = useCallback(() => {
    speak(phrases.getReady);
  }, [speak, phrases.getReady]);

  // Speak countdown number
  const speakCountdown = useCallback(
    (number: number) => {
      // Only speak if within countdown range
      if (number >= 1 && number <= 3) {
        speak(String(number));
      }
    },
    [speak]
  );

  // Speak capture phrase ("Smile!")
  const speakCapture = useCallback(() => {
    speak(phrases.capture);
  }, [speak, phrases.capture]);

  // Speak after capture phrase (cycles through available phrases)
  const speakAfterCapture = useCallback(() => {
    const phraseList = phrases.afterCapture;
    const phrase = phraseList[afterCaptureIndexRef.current % phraseList.length];
    afterCaptureIndexRef.current++;
    speak(phrase);
  }, [speak, phrases.afterCapture]);

  // Speak between photos phrase (cycles through available phrases)
  const speakBetweenPhotos = useCallback(() => {
    const phraseList = phrases.betweenPhotos;
    const phrase =
      phraseList[betweenPhotosIndexRef.current % phraseList.length];
    betweenPhotosIndexRef.current++;
    speak(phrase);
  }, [speak, phrases.betweenPhotos]);

  // Speak completion phrase
  const speakComplete = useCallback(() => {
    speak(phrases.complete);
  }, [speak, phrases.complete]);

  return {
    speak,
    speakGetReady,
    speakCountdown,
    speakCapture,
    speakAfterCapture,
    speakBetweenPhotos,
    speakComplete,
    stop,
    isSupported,
    isSpeaking,
    availableVoices,
  };
}
