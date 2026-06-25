"use client";

import { Volume2, VolumeX } from "lucide-react";

interface TTSPlayerProps {
  enabled: boolean;
  onToggle: () => void;
  isSpeaking: boolean;
}

export default function TTSPlayer({ enabled, onToggle, isSpeaking }: TTSPlayerProps) {
  return (
    <button
      className={`tts-toggle ${enabled ? "tts-toggle--on" : ""} ${isSpeaking ? "tts-toggle--speaking" : ""}`}
      onClick={onToggle}
      title={enabled ? "Désactiver TTS" : "Activer TTS"}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span>{enabled ? "TTS On" : "TTS Off"}</span>
    </button>
  );
}
