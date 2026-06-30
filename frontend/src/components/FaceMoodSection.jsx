import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as faceapi from 'face-api.js'

const MODEL_URL = import.meta.env.VITE_FACE_API_MODEL_URL || `${import.meta.env.BASE_URL}models/face-api`

const EMOTION_TO_MOOD = {
  happy: 'focused',
  sad: 'low energy',
  angry: 'stressed',
  neutral: 'steady',
}

const EMOTION_HINT = {
  happy: 'Your expression looks positive and engaged, so the system maps it to focused.',
  sad: 'Your facial expression appears low-energy, so the system maps it to low energy.',
  angry: 'Your expression shows facial tension, so the system maps it to stressed.',
  neutral: 'No strong emotion dominates, so the system maps it to steady.',
}

function toPercent(value) {
  return Math.round(Number(value || 0) * 100)
}

function pickEmotion(expressions = {}) {
  const tracked = ['happy', 'sad', 'angry', 'neutral']
  let bestEmotion = 'neutral'
  let bestScore = -1

  for (const emotion of tracked) {
    const score = Number(expressions[emotion] || 0)
    if (score > bestScore) {
      bestEmotion = emotion
      bestScore = score
    }
  }

  return { emotion: bestEmotion, confidence: bestScore }
}

function buildReason(expressions, emotion) {
  const sorted = Object.entries(expressions || {})
    .map(([key, value]) => ({ key, value: Number(value || 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)

  if (!sorted.length) {
    return EMOTION_HINT[emotion] || 'Mood estimated from current expression.'
  }

  const details = sorted.map((item) => `${item.key} ${toPercent(item.value)}%`).join(', ')
  return `${EMOTION_HINT[emotion] || 'Mood estimated from current expression.'} Main signals: ${details}.`
}

export default function FaceMoodSection({ currentMood = 'steady', onMoodDetected }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const tickerRef = useRef(null)
  const modelsLoadedRef = useRef(false)

  const [isStarting, setIsStarting] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [error, setError] = useState('')
  const [detectedEmotion, setDetectedEmotion] = useState('neutral')
  const [confidence, setConfidence] = useState(0)
  const [reason, setReason] = useState('Click start to open camera and analyze mood.')

  const badgeTone = useMemo(() => {
    if (currentMood === 'focused') return 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
    if (currentMood === 'stressed') return 'border-red-300/30 bg-red-500/10 text-red-200'
    if (currentMood === 'low energy') return 'border-amber-300/30 bg-amber-500/10 text-amber-200'
    return 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'
  }, [currentMood])

  const stopCamera = useCallback(() => {
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current)
      tickerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) {
      video.srcObject = null
    }
    setCameraOn(false)
  }, [])

  const startCamera = async () => {
    setIsStarting(true)
    setError('')

    try {
      if (!modelsLoadedRef.current) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        modelsLoadedRef.current = true
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('Camera view is unavailable.')
      }

      streamRef.current = stream
      video.srcObject = stream
      await video.play()

      if (tickerRef.current) {
        window.clearInterval(tickerRef.current)
      }

      tickerRef.current = window.setInterval(async () => {
        const target = videoRef.current
        if (!target) return

        const result = await faceapi
          .detectSingleFace(target, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.45,
          }))
          .withFaceExpressions()

        if (!result?.expressions) {
          return
        }

        const { emotion, confidence: topConfidence } = pickEmotion(result.expressions)
        const mood = EMOTION_TO_MOOD[emotion] || 'steady'
        const explanation = buildReason(result.expressions, emotion)

        setDetectedEmotion(emotion)
        setConfidence(topConfidence)
        setReason(explanation)
        onMoodDetected?.({ mood, emotion, confidence: topConfidence, reason: explanation })
      }, 1200)

      setCameraOn(true)
    } catch (startError) {
      stopCamera()
      setError(startError?.message || 'Unable to start camera mood analysis.')
    } finally {
      setIsStarting(false)
    }
  }

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopCamera()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopCamera()
    }
  }, [stopCamera])

  return (
    <motion.section
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Mood camera</p>
          <h3 className="text-2xl font-semibold text-white">Face emotion analysis</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone}`}>
          Mood: {currentMood}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={startCamera}
              disabled={isStarting || cameraOn}
              className="rounded-xl bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {isStarting ? 'Starting...' : cameraOn ? 'Camera Running' : 'Start Camera'}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              disabled={!cameraOn}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Stop Camera
            </button>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detected emotion</p>
          <p className="text-xl font-semibold text-white">
            {detectedEmotion} ({toPercent(confidence)}%)
          </p>

          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">How this mood was inferred</p>
          <p className="text-sm leading-6 text-slate-300">{reason}</p>

          <p className="text-xs text-slate-400">
            Mapping used: happy {'->'} focused, sad {'->'} low energy, angry {'->'} stressed, neutral {'->'} steady.
          </p>
        </div>
      </div>
    </motion.section>
  )
}
