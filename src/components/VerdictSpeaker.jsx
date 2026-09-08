import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function VerdictSpeaker({ verdict, t, lang }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isMuted || !verdict || verdict === "Connecting…") return;

    // Build the sentence to speak using the translation dictionary
    const verdictText = t[verdict] || verdict;
    const sentence = `${t.speech_alert || "Attention."} ${verdictText}.`;

    // Initialize Web Speech API
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(sentence);
    
    // Map standard ISO codes to Browser Speech Locales
    const localeMap = {
      "en": "en-US", "ta": "ta-IN", "hi": "hi-IN", 
      "te": "te-IN", "ml": "ml-IN", "kn": "kn-IN",
      "es": "es-ES", "fr": "fr-FR"
    };
    
    utterance.lang = localeMap[lang] || "en-US";
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Cancel any currently playing speech and speak the new one
    synth.cancel();
    synth.speak(utterance);

  }, [verdict, lang, isMuted, t]);

  return (
    <button 
      onClick={() => setIsMuted(!isMuted)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
        isMuted 
          ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      }`}
    >
      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      {isMuted ? "Voice Disabled" : "Voice Active"}
    </button>
  );
}