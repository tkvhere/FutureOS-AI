import { useEffect, useRef } from 'react'
import * as faceapi from 'face-api.js'

const MODEL_URL = import.meta.env.VITE_FACE_API_MODEL_URL || `${import.meta.env.BASE_URL}models/face-api`

const EMOTION_TO_MOOD = {
  happy: 'focused',
  sad: 'low energy',
  angry: 'stressed',
  neutral: 'steady',
}

function getTopEmotion(expressions = {}) {
  let top = 'neutral'
  let topScore = -1

  for (const emotion of Object.keys(EMOTION_TO_MOOD)) {
    const score = Number(expressions[emotion] || 0)
    if (score > topScore) {
      top = emotion
      topScore = score
    }
  }

  return top
}

export default function EmotionDetector({ onMoodDetected, enabled = true, intervalMs = 1200 }) {
  const videoRef = useRef(null)
  const intervalRef = useRef(null)
  const streamRef = useRef(null)
  const lastMoodRef = useRef('')

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return undefined
    }

    let cancelled = false

    const start = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])

        if (cancelled) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()

        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return

          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.45,
            }))
            .withFaceExpressions()

          if (!result?.expressions) return

          const emotion = getTopEmotion(result.expressions)
          const mood = EMOTION_TO_MOOD[emotion] || 'steady'

          if (mood !== lastMoodRef.current) {
            lastMoodRef.current = mood
            onMoodDetected?.(mood)
          }
        }, intervalMs)
      } catch (error) {
        console.warn('Emotion detector unavailable:', error)
      }
    }

    start()

    return () => {
      cancelled = true
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [enabled, intervalMs, onMoodDetected])

  return <video ref={videoRef} className="hidden" muted playsInline autoPlay aria-hidden="true" />
}
