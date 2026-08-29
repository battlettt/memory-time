import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Live speech-to-text while a voice note is recording.
 *
 * The point is to get typing out of the way entirely: someone speaks for
 * twenty seconds and the words arrive in the answer box on their own. The
 * recording is still the thing that matters — a familiar voice is the
 * stronger cue — but a transcript makes the memory searchable and saves the
 * contributor from writing it out twice.
 *
 * A real limitation, stated plainly: this uses the browser's own speech
 * recognition, so it works on web (Chrome, Edge, Safari) and does nothing on
 * iOS or Android. Anthropic's API has no audio input, so Claude cannot do
 * this; a native build would need either expo-speech-recognition (which
 * requires a development build, not Expo Go) or a paid speech-to-text
 * service. `transcriptionAvailable()` is the single place that decides, so
 * dropping a native provider in later means changing one function.
 */

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function transcriptionAvailable(): boolean {
  return getRecognitionConstructor() !== null;
}

export function useLiveTranscription(lang = 'en-GB') {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
    return finalRef.current.trim();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return false;

    stop();
    finalRef.current = '';
    setTranscript('');

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalRef.current += result[0].transcript;
        else interim += result[0].transcript;
      }
      setTranscript((finalRef.current + interim).trim());
    };

    // Recognition dying mid-sentence must not take the recording with it —
    // the audio is the important half.
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    try {
      rec.start();
    } catch {
      return false;
    }

    recognitionRef.current = rec;
    setListening(true);
    return true;
  }, [lang, stop]);

  // Wrapped rather than passed directly: stop() returns the transcript, and a
  // cleanup function must return void or a destructor.
  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );

  return { transcript, listening, start, stop, available: transcriptionAvailable() };
}
