"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Track, OverPlayerState, OverPlayerControls } from "./types";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface UseOverPlayerOptions {
  tracks: Track[];
  shuffle?: boolean;
  autoplay?: boolean;
  volume?: number;
  storageKey?: string;
  onTrackChange?: (track: Track, index: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

export function useOverPlayer({
  tracks,
  shuffle: initialShuffle = true,
  autoplay = true,
  volume: initialVolume = 0.3,
  storageKey = "overplayer",
  onTrackChange,
  onPlay,
  onPause,
  onEnd,
}: UseOverPlayerOptions): [OverPlayerState, OverPlayerControls, Track[]] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const orderedTracksRef = useRef<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [muted, setMuted] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(initialShuffle);
  const [repeatOne, setRepeatOne] = useState(false);
  const prevVolumeRef = useRef(initialVolume);
  const callbacksRef = useRef({ onTrackChange, onPlay, onPause, onEnd });
  callbacksRef.current = { onTrackChange, onPlay, onPause, onEnd };

  // Initialize audio
  useEffect(() => {
    let ordered: Track[];
    try {
      const savedOrder = sessionStorage.getItem(`${storageKey}-order`);
      if (savedOrder) {
        const order: string[] = JSON.parse(savedOrder);
        const restored = order.map((src) => tracks.find((t) => t.src === src)).filter(Boolean) as Track[];
        ordered = restored.length === tracks.length ? restored : (initialShuffle ? shuffleArray(tracks) : [...tracks]);
      } else {
        ordered = initialShuffle ? shuffleArray(tracks) : [...tracks];
      }
    } catch {
      ordered = initialShuffle ? shuffleArray(tracks) : [...tracks];
    }

    orderedTracksRef.current = ordered;
    try { sessionStorage.setItem(`${storageKey}-order`, JSON.stringify(ordered.map((t) => t.src))); } catch {}

    let restoredIndex = 0;
    let restoredTime = 0;
    let shouldPlay = autoplay;

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const { src, time, wasPlaying } = JSON.parse(saved);
        const idx = ordered.findIndex((t) => t.src === src);
        if (idx >= 0) { restoredIndex = idx; restoredTime = time || 0; shouldPlay = wasPlaying; }
      }
    } catch {}

    const audio = new Audio(ordered[restoredIndex].src);
    audio.volume = initialVolume;
    audio.preload = "auto";
    if (restoredTime > 0) audio.currentTime = restoredTime;
    audioRef.current = audio;
    setTrackIndex(restoredIndex);

    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); setDuration(audio.duration || 0); };
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    if (shouldPlay) {
      audio.play().then(() => setPlaying(true)).catch(() => {
        const events = ["click", "touchstart", "keydown", "mousemove", "scroll", "pointerdown"];
        const unlock = () => {
          audio.play().then(() => setPlaying(true)).catch(() => {});
          events.forEach((e) => document.removeEventListener(e, unlock));
        };
        events.forEach((e) => document.addEventListener(e, unlock, { once: true, passive: true }));
      });
    }

    const saveId = setInterval(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          src: orderedTracksRef.current[restoredIndex]?.src || "",
          time: audio.currentTime || 0,
          wasPlaying: !audio.paused,
        }));
      } catch {}
    }, 500);

    return () => {
      clearInterval(saveId);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle track end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      callbacksRef.current.onEnd?.();
      if (repeatOne) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const tracks = orderedTracksRef.current;
      let nextIdx: number;
      if (shuffleOn) {
        nextIdx = Math.floor(Math.random() * tracks.length);
        if (nextIdx === trackIndex && tracks.length > 1) nextIdx = (nextIdx + 1) % tracks.length;
      } else {
        nextIdx = (trackIndex + 1) % tracks.length;
      }
      setTrackIndex(nextIdx);
      audio.src = tracks[nextIdx].src;
      audio.play().then(() => setPlaying(true)).catch(() => {});
      callbacksRef.current.onTrackChange?.(tracks[nextIdx], nextIdx);
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [trackIndex, repeatOne, shuffleOn]);

  const controls: OverPlayerControls = {
    play: useCallback(() => {
      audioRef.current?.play().then(() => { setPlaying(true); callbacksRef.current.onPlay?.(); }).catch(() => {});
    }, []),
    pause: useCallback(() => {
      audioRef.current?.pause();
      setPlaying(false);
      callbacksRef.current.onPause?.();
    }, []),
    toggle: useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(() => { setPlaying(true); callbacksRef.current.onPlay?.(); }).catch(() => {});
      } else {
        audio.pause(); setPlaying(false); callbacksRef.current.onPause?.();
      }
    }, []),
    next: useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const tracks = orderedTracksRef.current;
      const nextIdx = (trackIndex + 1) % tracks.length;
      setTrackIndex(nextIdx);
      audio.src = tracks[nextIdx].src;
      if (playing) audio.play().catch(() => {});
      callbacksRef.current.onTrackChange?.(tracks[nextIdx], nextIdx);
    }, [trackIndex, playing]),
    prev: useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const tracks = orderedTracksRef.current;
      const prevIdx = (trackIndex - 1 + tracks.length) % tracks.length;
      setTrackIndex(prevIdx);
      audio.src = tracks[prevIdx].src;
      if (playing) audio.play().catch(() => {});
      callbacksRef.current.onTrackChange?.(tracks[prevIdx], prevIdx);
    }, [trackIndex, playing]),
    seek: useCallback((time: number) => {
      if (audioRef.current) audioRef.current.currentTime = time;
    }, []),
    setVolume: useCallback((vol: number) => {
      if (audioRef.current) audioRef.current.volume = vol;
      setVolumeState(vol);
      setMuted(vol === 0);
    }, []),
    toggleMute: useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (muted) {
        const restored = prevVolumeRef.current || 0.3;
        audio.volume = restored; setVolumeState(restored); setMuted(false);
      } else {
        prevVolumeRef.current = volume;
        audio.volume = 0; setVolumeState(0); setMuted(true);
      }
    }, [muted, volume]),
    toggleShuffle: useCallback(() => setShuffleOn((s) => !s), []),
    toggleRepeat: useCallback(() => setRepeatOne((r) => !r), []),
    jumpTo: useCallback((index: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const tracks = orderedTracksRef.current;
      if (index < 0 || index >= tracks.length) return;
      setTrackIndex(index);
      audio.src = tracks[index].src;
      if (playing) audio.play().catch(() => {});
      callbacksRef.current.onTrackChange?.(tracks[index], index);
    }, [playing]),
  };

  const state: OverPlayerState = {
    playing,
    currentTrack: orderedTracksRef.current[trackIndex] || null,
    trackIndex,
    currentTime,
    duration,
    volume,
    muted,
    shuffleOn,
    repeatOne,
  };

  return [state, controls, orderedTracksRef.current];
}
