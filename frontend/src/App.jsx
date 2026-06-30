import { FutureJourneyShell } from './components/FutureJourney'
import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from './services/api'
import AuthPanel from './components/AuthPanel'
import HabitForm from './components/HabitForm'
import MetricCard from './components/MetricCard'
import LineChartPanel from './components/LineChartPanel'
import ChatPanel from './components/ChatPanel'
import ComparisonChart from './components/ComparisonChart'
import OnboardingWizard from './components/OnboardingWizard'
import GoalMissionPanel from './components/GoalMissionPanel'
import DigitalTwinPanel from './components/DigitalTwinPanel'
import PredictionStoryPanel from './components/PredictionStoryPanel'
import SystemStatusPanel from './components/SystemStatusPanel'
import ProductivityHeatmapPanel from './components/ProductivityHeatmapPanel'
import FaceMoodSection from './components/FaceMoodSection'
import ProfileDrawer from './components/ProfileDrawer'
import GsapIntroScene from './components/GsapIntroScene'
import HeroSection from './components/HeroSection'
import {
  buildGamification,
  buildPredictionStory,
  buildTwinState,
  buildTrendPreview,
  buildWhatIfProjection,
  calculateImprovementDelta,
  calculateRealtimeScores,
} from './services/realtimeEngine'

const initialAuth = { mode: 'login', loading: false, error: '' }

function decodeJwtPayload(token) {
  try {
    const [, encodedPayload] = token.split('.')
    if (!encodedPayload) return null
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

function isTokenExpired(token) {
  const expiry = getTokenExpiryMs(token)
  if (!expiry) return false
  return Date.now() >= expiry
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function standardDeviation(values = []) {
  if (!values.length) return 0
  const mean = values.reduce((sum, item) => sum + item, 0) / values.length
  const variance = values.reduce((sum, item) => sum + ((item - mean) ** 2), 0) / values.length
  return Math.sqrt(variance)
}

function detectForecastAnomalies(forecast) {
  if (!forecast) return []
  const warnings = []
  const screen = forecast.screen_time_hours || []
  const sleep = forecast.sleep_hours || []
  const study = forecast.study_hours || []

  for (let index = 1; index < screen.length; index += 1) {
    if (screen[index] - screen[index - 1] > 1.2) {
      warnings.push(`Screen time spike around day ${index + 1}`)
      break
    }
  }
  for (let index = 1; index < sleep.length; index += 1) {
    if (sleep[index - 1] - sleep[index] > 1.0) {
      warnings.push(`Sleep drop around day ${index + 1}`)
      break
    }
  }
  for (let index = 1; index < study.length; index += 1) {
    if (study[index - 1] - study[index] > 1.0) {
      warnings.push(`Study consistency dip around day ${index + 1}`)
      break
    }
  }
  return warnings
}

function App() {
  const [auth, setAuth] = useState(initialAuth)
  const [entryView, setEntryView] = useState('landing')
  const [showIntroSequence, setShowIntroSequence] = useState(true)
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('lifeSimToken') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('lifeSimUser')
    return raw ? JSON.parse(raw) : null
  })
  const [dashboard, setDashboard] = useState(null)
  const [habitLoading, setHabitLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatStatusText, setChatStatusText] = useState('')
  const [refreshError, setRefreshError] = useState('')
  const [sessionNotice, setSessionNotice] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [showFutureJourney, setShowFutureJourney] = useState(false)

  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'I read your habits and will respond with concrete adjustments.' },
  ])
  const [goalMode, setGoalMode] = useState('focus')
  const [tasks, setTasks] = useState([])
  const [targetStudyHours, setTargetStudyHours] = useState(0)
  const [liveInputs, setLiveInputs] = useState({
    study_hours: 4,
    sleep_hours: 7.5,
    screen_time_hours: 2,
    exercise_minutes: 30,
    mood: 'focused',
  })
  const chatQueueRef = useRef([])
  const isProcessingChatQueueRef = useRef(false)

  function performLogout(reason = '') {
    localStorage.removeItem('lifeSimToken')
    localStorage.removeItem('lifeSimUser')
    setToken('')
    setUser(null)
    setDashboard(null)
    setShowOnboarding(false)
    setPendingVerification(null)
    setAuth({ ...initialAuth, mode: 'login' })
    setEntryView('landing')
    setShowIntroSequence(true)
    setMessages([{ role: 'assistant', text: 'You are signed out. Please log in to continue.' }])
    setIsRouteTransitioning(false)
    setProfileOpen(false)
    if (reason) {
      setSessionNotice(reason)
    } else {
      setSessionNotice('Signed out successfully. Please log in again.')
    }
  }

  function handleLogout(reason = '') {
    performLogout(reason)
  }

  useEffect(() => {
    if (token) {
      setShowIntroSequence(false)
      return
    }
    setShowIntroSequence(true)
    setEntryView('landing')
  }, [token])

  useEffect(() => {
    if (!token) return
    if (isTokenExpired(token)) {
      handleLogout('Session expired. Please sign in again.')
      return
    }

    const expiry = getTokenExpiryMs(token)
    const timeoutMs = expiry ? Math.max(0, expiry - Date.now()) : null
    const timerId = timeoutMs !== null
      ? window.setTimeout(() => handleLogout('Session expired. Please sign in again.'), timeoutMs)
      : null

    refreshDashboard(token)

    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [token])

  useEffect(() => {
    if (!token || !user?.id) {
      setShowOnboarding(false)
      return
    }
    const key = `lifeSimOnboarded:${user.id}`
    setShowOnboarding(localStorage.getItem(key) !== 'yes')
  }, [token, user?.id])

  const refreshDashboard = async (authToken = token) => {
    if (!authToken) return
    try {
      const [history, simulation, mdp, compare, forecast] = await Promise.all([
        apiRequest('/habits/history', { token: authToken }),
        apiRequest('/simulate', { token: authToken }),
        apiRequest('/mdp/optimal', { token: authToken }),
        apiRequest('/compare', { token: authToken }),
        apiRequest('/forecast', { token: authToken }),
      ])

      setDashboard({ history, simulation, mdp, compare, forecast })
      if (history?.summary) {
        setUser((current) => current ? { ...current, ...history.summary } : current)
      }
      setRefreshError('')
    } catch (error) {
      const message = error.message || ''
      const lower = message.toLowerCase()
      if (lower.includes('authentication') || lower.includes('invalid') || lower.includes('token')) {
        handleLogout('Session invalid. Please sign in again.')
        return
      }
      setRefreshError(error.message || 'Dashboard refresh failed')
    }
  }

  const handleAuthSubmit = async (payload) => {
    setAuth((current) => ({ ...current, loading: true, error: '' }))
    try {
      if (auth.mode === 'signup') {
        const response = await apiRequest('/auth/signup', { method: 'POST', body: payload })
        setPendingVerification({
          email: response.email,
          code: response.dev_verification_code || '',
          message: response.message,
        })
        setAuth((current) => ({ ...current, mode: 'verify', error: '' }))
        setSessionNotice(response.message)
        setMessages([{ role: 'assistant', text: 'Account created. Verify the Gmail address before logging in.' }])
        return
      }

      if (auth.mode === 'verify') {
        const verificationEmail = payload.email || pendingVerification?.email
        const response = await apiRequest('/auth/verify', {
          method: 'POST',
          body: {
            email: verificationEmail,
            code: payload.verificationCode,
          },
        })
        localStorage.setItem('lifeSimToken', response.access_token)
        localStorage.setItem('lifeSimUser', JSON.stringify(response.user))
        setToken(response.access_token)
        setUser(response.user)
        setPendingVerification(null)
        setSessionNotice('Gmail verified. Session opened.')
        setMessages([{ role: 'assistant', text: 'Gmail verified. I can now tune recommendations to your profile.' }])
        await refreshDashboard(response.access_token)
        return
      }

      const response = await apiRequest('/auth/login', { method: 'POST', body: payload })
      localStorage.setItem('lifeSimToken', response.access_token)
      localStorage.setItem('lifeSimUser', JSON.stringify(response.user))
      setToken(response.access_token)
      setUser(response.user)
      setSessionNotice('')
      setMessages([{ role: 'assistant', text: 'Session opened. I can now tune recommendations to your profile.' }])
      await refreshDashboard(response.access_token)
    } catch (error) {
      const message = (error.message || '').toLowerCase()
      if (auth.mode === 'login' && message.includes('verified')) {
        setPendingVerification({
          email: payload.email,
          code: '',
          message: error.message,
        })
        setAuth((current) => ({ ...current, mode: 'verify', error: error.message }))
        setSessionNotice(error.message)
        return
      }
      setAuth((current) => ({ ...current, error: error.message }))
    } finally {
      setAuth((current) => ({ ...current, loading: false }))
    }
  }

  const handleResendVerification = async (email) => {
    setAuth((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: { email },
      })
      setPendingVerification({
        email: response.email,
        code: response.dev_verification_code || '',
        message: response.message,
      })
      setAuth((current) => ({ ...current, mode: 'verify', error: '' }))
      setSessionNotice(response.message)
    } catch (error) {
      setAuth((current) => ({ ...current, error: error.message }))
    } finally {
      setAuth((current) => ({ ...current, loading: false }))
    }
  }

  const handleHabitSubmit = async (payload) => {
    setHabitLoading(true)
    try {
      await apiRequest('/habits/add', { method: 'POST', body: { ...payload, goal: goalMode }, token })
      await refreshDashboard(token)
    } finally {
      setHabitLoading(false)
    }
  }

  const handleFaceMoodDetected = ({ mood }) => {
    if (!mood) return
    setLiveInputs((current) => {
      if (current.mood === mood) {
        return current
      }
      return {
        ...current,
        mood,
      }
    })
  }

  const handleProfileSave = (updates = {}) => {
    setUser((current) => {
      if (!current) return current
      const merged = { ...current, ...updates }
      localStorage.setItem('lifeSimUser', JSON.stringify(merged))
      return merged
    })
  }

  const streamAssistantReply = (fullReply) => new Promise((resolve) => {
    if (!fullReply) {
      setChatStatusText('')
      resolve()
      return
    }

    let index = 0
    setChatStatusText('Streaming response...')
    const streamTicker = window.setInterval(() => {
      index += 1
      const chunk = fullReply.slice(0, index)
      setMessages((current) => {
        const next = [...current]
        for (let cursor = next.length - 1; cursor >= 0; cursor -= 1) {
          if (next[cursor].role === 'assistant') {
            next[cursor] = { ...next[cursor], text: chunk }
            break
          }
        }
        return next
      })

      if (index >= fullReply.length) {
        window.clearInterval(streamTicker)
        setChatStatusText('')
        resolve()
      }
    }, 12)
  })

  const processChatQueue = async () => {
    if (isProcessingChatQueueRef.current) return
    isProcessingChatQueueRef.current = true

    while (chatQueueRef.current.length > 0) {
      const queueItem = chatQueueRef.current.shift()
      if (!queueItem) {
        continue
      }

      setChatLoading(true)
      setChatStatusText('Parsing behavior graph...')

      const loadingStages = ['Parsing behavior graph...', 'Running risk model...', 'Synthesizing strategy response...']
      let stageIndex = 0
      const loadingTicker = window.setInterval(() => {
        stageIndex = (stageIndex + 1) % loadingStages.length
        setChatStatusText(loadingStages[stageIndex])
      }, 650)

      try {
        const contextEnvelope = `[goal=${goalMode}; study=${liveInputs.study_hours}; sleep=${liveInputs.sleep_hours}; screen=${liveInputs.screen_time_hours}; exercise=${liveInputs.exercise_minutes}] ${queueItem}`
        const response = await apiRequest('/chatbot', { method: 'POST', body: { message: contextEnvelope }, token })
        window.clearInterval(loadingTicker)

        const fullReply = response.reply || 'I could not generate a response right now. Please try again.'
        setMessages((current) => [...current, { role: 'assistant', text: '' }])
        await streamAssistantReply(fullReply)
      } catch (error) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', text: error.message || 'Chat request failed. Please try again.' },
        ])
        setChatStatusText('')
      } finally {
        window.clearInterval(loadingTicker)
      }
    }

    setChatLoading(false)
    setChatStatusText('')
    isProcessingChatQueueRef.current = false
  }

  const handleChatSend = async (message) => {
    const normalized = message.trim()
    if (!normalized) return

    setMessages((current) => [...current, { role: 'user', text: normalized }])
    chatQueueRef.current.push(normalized)
    await processChatQueue()
  }

  const completeOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`lifeSimOnboarded:${user.id}`, 'yes')
    }
    setShowOnboarding(false)
  }

  const skipOnboarding = () => {
    completeOnboarding()
  }

  const scoreCards = dashboard?.history?.summary
    ? [
        { label: 'Daily score', value: typeof dashboard.history.summary.total_score === 'number' ? dashboard.history.summary.total_score.toFixed(2) : dashboard.history.summary.total_score || 0, hint: 'Accumulated habit output', accent: 'aurora' },
        { label: 'Streak', value: `${dashboard.history.summary.streak} days`, hint: 'Consecutive logged days', accent: 'gold' },
        { label: 'Level', value: dashboard.history.summary.level, hint: 'Current gamification tier', accent: 'ember' },
        { label: 'Badges', value: dashboard.history.summary.badges?.length || 0, hint: 'Unlocked milestones', accent: 'aurora' },
      ]
    : []

  const liveScores = calculateRealtimeScores(liveInputs, goalMode)
  const habitTrendPreview = useMemo(() => buildTrendPreview(liveInputs, goalMode, 7), [liveInputs, goalMode])
  const liveForecastPreview = useMemo(() => buildTrendPreview(liveInputs, goalMode, 30), [liveInputs, goalMode])

  useEffect(() => {
    const latestGoalPlan = dashboard?.history?.entries?.[0]?.goal_plan
    if (latestGoalPlan?.tasks?.length) {
      setTasks(Array.from(new Set(latestGoalPlan.tasks)))
      setTargetStudyHours(Number(latestGoalPlan.target_study_hours || 0))
      return
    }

    const plannedTasks = []
    const normalizedGoal = String(goalMode || '').toLowerCase()
    const disciplineLow = Number(liveScores.discipline || 0) < 50
    const screenHigh = Number(liveInputs.screen_time_hours || 0) > 3
    const productivityLow = Number(liveScores.productivity || 0) < 50
    const knowledgeLow = Number(liveScores.knowledge || 0) < 50

    if (normalizedGoal === 'ips' || normalizedGoal === 'exam') {
      if (disciplineLow) {
        plannedTasks.push('Increase study hours')
      }
      if (screenHigh) {
        plannedTasks.push('Reduce screen time')
      }
      plannedTasks.push('Study', 'Revision', 'Newspaper')
    } else if (normalizedGoal === 'job') {
      plannedTasks.push('DSA practice', 'Project work')
      if (productivityLow || knowledgeLow) {
        plannedTasks.push('Interview prep')
      }
    }

    setTasks(Array.from(new Set(plannedTasks)))
    setTargetStudyHours(goalMode === 'job' ? 4 : goalMode === 'ips' || goalMode === 'exam' ? 6 : 0)
  }, [
    dashboard?.history?.entries,
    goalMode,
    liveInputs.study_hours,
    liveInputs.sleep_hours,
    liveInputs.screen_time_hours,
    liveInputs.exercise_minutes,
    liveScores.productivity,
    liveScores.knowledge,
    liveScores.discipline,
  ])

  const baselineProductivity = Number(dashboard?.compare?.current_life?.productivity || 50)
  const improvementDelta = calculateImprovementDelta(liveScores.productivity, baselineProductivity)
  const whatIfProjection = buildWhatIfProjection(liveInputs, goalMode)
  const predictionStory = buildPredictionStory(goalMode, whatIfProjection)
  const gamification = buildGamification(dashboard?.history?.summary || {}, whatIfProjection, { ...liveInputs, ...liveScores })
  const twinState = buildTwinState(liveScores, goalMode)

  const habitHistory = dashboard?.history?.entries?.slice(0, 7) || []
  const habitLabels = habitTrendPreview.study_hours.map((_, index) => `Day ${index + 1}`)
  const habitDatasets = [
    {
      label: 'Live habit trend',
      data: habitTrendPreview.study_hours,
      borderColor: '#67e8f9',
      backgroundColor: 'rgba(103, 232, 249, 0.16)',
      borderDash: [4, 4],
      tension: 0.35,
    },
    {
      label: 'Live sleep trend',
      data: habitTrendPreview.sleep_hours,
      borderColor: '#d8b4fe',
      backgroundColor: 'rgba(216, 180, 254, 0.12)',
      borderDash: [4, 4],
      tension: 0.35,
    },
    {
      label: 'Live screen trend',
      data: habitTrendPreview.screen_time_hours,
      borderColor: '#f9a8d4',
      backgroundColor: 'rgba(249, 168, 212, 0.12)',
      borderDash: [4, 4],
      tension: 0.35,
    },
    ...(habitHistory.length ? [
      {
        label: 'Saved study',
        data: habitHistory.map((entry) => entry.study_hours).reverse(),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        tension: 0.35,
      },
      {
        label: 'Saved sleep',
        data: habitHistory.map((entry) => entry.sleep_hours).reverse(),
        borderColor: '#c084fc',
        backgroundColor: 'rgba(192, 132, 252, 0.08)',
        tension: 0.35,
      },
      {
        label: 'Saved screen',
        data: habitHistory.map((entry) => entry.screen_time_hours).reverse(),
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244, 114, 182, 0.08)',
        tension: 0.35,
      },
    ] : []),
  ]

  const comparisonCurrent = dashboard?.compare
    ? [
        dashboard.compare.current_life?.knowledge,
        dashboard.compare.current_life?.productivity,
        dashboard.compare.current_life?.energy,
        dashboard.compare.current_life?.discipline,
      ]
    : []

  const comparisonIdeal = dashboard?.compare
    ? [
        dashboard.compare.ideal_life?.knowledge,
        dashboard.compare.ideal_life?.productivity,
        dashboard.compare.ideal_life?.energy,
        dashboard.compare.ideal_life?.discipline,
      ]
    : []

  const forecastLabels = liveForecastPreview.study_hours.map((_, index) => `Day ${index + 1}`)
  const forecastDatasets = [
    {
      label: 'Live study preview',
      data: liveForecastPreview.study_hours,
      borderColor: '#67e8f9',
      backgroundColor: 'rgba(103, 232, 249, 0.12)',
      borderDash: [6, 4],
      tension: 0.32,
    },
    {
      label: 'Live sleep preview',
      data: liveForecastPreview.sleep_hours,
      borderColor: '#d8b4fe',
      backgroundColor: 'rgba(216, 180, 254, 0.1)',
      borderDash: [6, 4],
      tension: 0.32,
    },
    {
      label: 'Live screen preview',
      data: liveForecastPreview.screen_time_hours,
      borderColor: '#f9a8d4',
      backgroundColor: 'rgba(249, 168, 212, 0.1)',
      borderDash: [6, 4],
      tension: 0.32,
    },
    ...(dashboard?.forecast?.forecast ? [
        {
          label: 'Study forecast',
          data: dashboard.forecast.forecast.study_hours || [],
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.22)',
          tension: 0.32,
        },
        {
          label: 'Sleep forecast',
          data: dashboard.forecast.forecast.sleep_hours || [],
          borderColor: '#c084fc',
          backgroundColor: 'rgba(192, 132, 252, 0.2)',
          tension: 0.32,
        },
        {
          label: 'Screen forecast',
          data: dashboard.forecast.forecast.screen_time_hours || [],
          borderColor: '#f472b6',
          backgroundColor: 'rgba(244, 114, 182, 0.2)',
          tension: 0.32,
        },
    ] : []),
  ]
  const forecastMethod = dashboard?.forecast?.method || dashboard?.simulation?.forecast_method || 'trend'
  const goalDaysPrediction = dashboard?.forecast?.goal_days_prediction || dashboard?.simulation?.goal_days_prediction || null
  const goalModelQuality = dashboard?.forecast?.goal_model_quality || null
  const goalDaysToGoal = goalDaysPrediction?.days_to_goal
  const goalDaysMethod = goalDaysPrediction?.method || 'rule_based'
  const forecastSeries = dashboard?.forecast?.forecast
  const volatility = forecastSeries
    ? (
      standardDeviation(forecastSeries.study_hours || [])
      + standardDeviation(forecastSeries.sleep_hours || [])
      + standardDeviation(forecastSeries.screen_time_hours || [])
    ) / 3
    : 0
  const forecastConfidence = clamp(Math.round((forecastMethod === 'lstm' ? 84 : 66) - (volatility * 8)), 35, 96)
  const forecastWarnings = detectForecastAnomalies(forecastSeries)
  const profileInitial = (user?.name || 'U').trim().charAt(0).toUpperCase()
  const featureImportance = [
    { label: 'Study Hours', value: 14.31 },
    { label: 'Sleep Hours', value: 0.0 },
    { label: 'Screen Time', value: 2.23 },
    { label: 'Mood', value: 83.45 },
  ]

  if (!token || !user) {
    return (
      <main className="relative min-h-screen overflow-hidden p-4 text-white sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(255,122,89,0.14),_transparent_20%),linear-gradient(180deg,_#050816_0%,_#070b18_45%,_#050816_100%)]" />
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          {showIntroSequence ? (
            <GsapIntroScene
              onComplete={() => {
                setShowIntroSequence(false)
                setEntryView('auth')
                setAuth((current) => ({ ...current, mode: 'login', error: '' }))
              }}
              onSkip={() => {
                setShowIntroSequence(false)
                setEntryView('auth')
                setAuth((current) => ({ ...current, mode: 'login', error: '' }))
              }}
            />
          ) : null}
        </div>

        {entryView === 'auth' && !showIntroSequence ? (
          <div className="auth-overlay fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center sm:p-6">
            <div className="auth-glow auth-shell relative w-full max-w-xl rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,45,0.96),rgba(8,11,22,0.98))] p-4 shadow-[0_35px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl animate-[loginOpen_420ms_cubic-bezier(0.19,1,0.22,1)]">
              <div className="pointer-events-none absolute inset-0 rounded-[38px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,118,110,0.12),transparent_34%)] opacity-90" />
              <div className="absolute inset-x-10 -top-1 h-px bg-gradient-to-r from-transparent via-aurora-500/80 to-transparent" />
              <div className="rounded-[30px] border border-white/8 bg-black/15 p-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowIntroSequence(true)
                    setEntryView('landing')
                    setAuth((current) => ({ ...current, mode: 'login', error: '' }))
                    setPendingVerification(null)
                  }}
                  className="mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10"
                >
                  Close login
                </button>
                <AuthPanel
                  mode={auth.mode}
                  onSubmit={handleAuthSubmit}
                  onResendVerification={handleResendVerification}
                  loading={auth.loading}
                  verificationEmail={pendingVerification?.email || ''}
                  verificationCodeHint={pendingVerification?.code || ''}
                  verificationMessage={pendingVerification?.message || ''}
                  onToggleMode={(mode) => {
                    setPendingVerification(null)
                    setAuth((current) => ({ ...current, mode }))
                  }}
                />
                {sessionNotice ? <p className="mt-4 rounded-2xl border border-gold-400/30 bg-gold-500/10 p-3 text-sm text-gold-200">{sessionNotice}</p> : null}
                {auth.error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{auth.error}</p> : null}
              </div>
            </div>
          </div>
        ) : null}
        {isRouteTransitioning ? <div className="transition-veil" /> : null}
      </main>
    )
  }
  
  if (showFutureJourney) {
  return <FutureJourneyShell />;
}

  return (
    <main className="min-h-screen p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <HeroSection user={user} score={dashboard?.history?.summary?.total_score || 0} goalMode={goalMode}
         />
         <div className="flex justify-end">
  <button
    type="button"
    onClick={() => setShowFutureJourney(true)}
    className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:scale-105"
  >
    🚀 Enter Future Journey
  </button>
</div>
        {showOnboarding ? <OnboardingWizard onComplete={completeOnboarding} onSkip={skipOnboarding} /> : null}
        {refreshError ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{refreshError}</div> : null}

        <button
          type="button"
          aria-label="Open profile"
          onClick={() => setProfileOpen(true)}
          className="fixed right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(34,211,238,0.24),rgba(168,85,247,0.18))] text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur sm:right-6 sm:top-6"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.7-2.7 4-4 7-4s5.3 1.3 7 4" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" opacity="0.35" />
          </svg>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-900/40 bg-emerald-300 text-[10px] font-semibold text-slate-950 shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
            {profileInitial}
          </span>
        </button>

        <ProfileDrawer
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          summary={dashboard?.history?.summary}
          goalMode={goalMode}
          mood={liveInputs.mood}
          onSaveProfile={handleProfileSave}
        />

        <button
          onClick={() => handleLogout()}
          className="fixed bottom-4 right-4 z-50 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition hover:bg-white/10 sm:bottom-6 sm:right-6"
        >
          Sign out
        </button>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <HabitForm
              onSubmit={handleHabitSubmit}
              loading={habitLoading}
              onLiveChange={setLiveInputs}
              externalMood={liveInputs.mood}
              liveScores={liveScores}
              improvementDelta={improvementDelta}
              whatIfProjection={whatIfProjection}
              tasks={tasks}
              targetStudyHours={targetStudyHours}
              goalModelQuality={goalModelQuality}
            />
            <GoalMissionPanel goal={goalMode} onGoalChange={setGoalMode} gamification={gamification} />
            <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
              {scoreCards.map((card) => (
                <div key={card.label} className="flex-1 basis-0 min-w-0">
                  <MetricCard {...card} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
              <div className="flex-1 basis-0 min-w-0">
                <MetricCard
                  label="30 day knowledge"
                  value={dashboard?.simulation?.scores?.['30_days']?.knowledge?.toFixed?.(1) || 0}
                  hint="Short-term compounding forecast"
                  accent="aurora"
                />
              </div>
              <div className="flex-1 basis-0 min-w-0">
                <MetricCard
                  label="90 day productivity"
                  value={dashboard?.simulation?.scores?.['90_days']?.productivity?.toFixed?.(1) || 0}
                  hint="Performance projection"
                  accent="ember"
                />
              </div>
            </div>
            <LineChartPanel
              title="Habit trend"
              subtitle="Live habit tracker signal"
              labels={habitLabels}
              datasets={habitDatasets}
            />
            <DigitalTwinPanel twinState={twinState} scores={liveScores} history={dashboard?.history?.entries || []} goalMode={goalMode} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr]">
          <FaceMoodSection currentMood={liveInputs.mood} onMoodDetected={handleFaceMoodDetected} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <ComparisonChart current={comparisonCurrent} ideal={comparisonIdeal} />

          <div className="glass-panel rounded-[28px] p-6 shadow-glow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">MDP output</p>
                <h3 className="text-2xl font-semibold text-white">Optimal next action</h3>
              </div>
              <div className="rounded-full border border-ember-500/30 bg-ember-500/10 px-3 py-1 text-xs text-ember-400">
                {dashboard?.mdp?.policy?.best_action || 'study'}
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p><span className="text-white">Best action:</span> {dashboard?.mdp?.policy?.best_action || 'study'}</p>
              <p><span className="text-white">Next state:</span> {dashboard?.mdp?.policy?.next_state ? JSON.stringify(dashboard.mdp.policy.next_state) : 'N/A'}</p>
              <p><span className="text-white">Recommendations:</span></p>
              <ul className="list-disc space-y-2 pl-5">
                {(dashboard?.mdp?.recommendation || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p><span className="text-white">Improvement:</span> {dashboard?.compare?.improvement_percent?.productivity || 0}% productivity lift in the ideal path.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[28px] p-6 shadow-glow">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Simulation engine</p>
              <h3 className="text-2xl font-semibold text-white">Future outcome horizons</h3>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              {dashboard?.simulation ? Object.entries(dashboard.simulation.projections).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{label.replace('_', ' ')}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <span>Knowledge: {value.knowledge_score}</span>
                    <span>Productivity: {value.productivity_score}</span>
                    <span>Energy: {value.energy}</span>
                    <span>Stress: {value.stress}</span>
                  </div>
                </div>
              )) : null}
            </div>
          </div>

          <ChatPanel onSend={handleChatSend} messages={messages} loading={chatLoading} statusText={chatStatusText} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <PredictionStoryPanel story={predictionStory} whatIf={whatIfProjection} />
          <SystemStatusPanel forecastMethod={forecastMethod} latency="real-time" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr]">
          <ProductivityHeatmapPanel entries={dashboard?.history?.entries || []} liveScore={liveScores} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <LineChartPanel
            title="30-day forecast"
            subtitle={`Method: ${forecastMethod} | live habit tracker preview`}
            labels={forecastLabels}
            datasets={forecastDatasets}
          />

          <div className="glass-panel rounded-[28px] p-6 shadow-glow">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Forecast metadata</p>
              <h3 className="text-2xl font-semibold text-white">Model diagnostics</h3>
            </div>
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Feature importance</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {featureImportance.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-300">{item.value.toFixed(2)}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/8 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Model performance</p>
                  <p className="mt-1 text-lg font-semibold text-white">Decision Tree Regressor</p>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Good Generalization
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Dataset Size</p>
                  <p className="text-lg font-semibold text-cyan-300">{goalModelQuality?.dataset_size || 5000}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">R² Score</p>
                  <p className="text-lg font-semibold text-fuchsia-300">
                    {typeof goalModelQuality?.r2_score === 'number' ? `${(goalModelQuality.r2_score * 100).toFixed(2)}%` : '98.38%'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">MAE</p>
                  <p className="text-lg font-semibold text-amber-300">
                    {typeof goalModelQuality?.mae_days === 'number' ? `${goalModelQuality.mae_days.toFixed(2)} days` : '10.03 days'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">RMSE</p>
                  <p className="text-lg font-semibold text-emerald-300">
                    {typeof goalModelQuality?.rmse_days === 'number' ? `${goalModelQuality.rmse_days.toFixed(2)} days` : '12.72 days'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Goal ETA</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {typeof goalDaysToGoal === 'number' ? `${goalDaysToGoal} days` : 'N/A'}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                Prediction method: {goalDaysMethod}
              </p>
            </div>
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Model quality</p>
              {goalModelQuality?.available ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">Train R²</p>
                    <p className="text-lg font-semibold text-cyan-300">{goalModelQuality.train_r2}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Train MAE</p>
                    <p className="text-lg font-semibold text-fuchsia-300">{goalModelQuality.train_mae_days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">LOOCV MAE</p>
                    <p className="text-lg font-semibold text-amber-300">{goalModelQuality.loocv_mae_days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Within 15 days</p>
                    <p className="text-lg font-semibold text-emerald-300">{goalModelQuality.within_15_days}%</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-300">{goalModelQuality?.message || 'Model quality metrics unavailable.'}</p>
              )}
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p><span className="text-white">Forecast method:</span> {forecastMethod}</p>
              <p><span className="text-white">History points:</span> {dashboard?.forecast?.history_points || 0}</p>
              <p><span className="text-white">Confidence score:</span> {forecastConfidence}%</p>
              <p><span className="text-white">Fallback behavior:</span> when LSTM is unavailable or history is short, trend projection is used automatically.</p>
              {forecastWarnings.length ? (
                <div>
                  <p className="mb-2 text-white">Anomaly warnings:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {forecastWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              ) : (
                <p><span className="text-white">Anomaly warnings:</span> no major instability detected.</p>
              )}
            </div>
          </div>
        </section>
      </div>
      {isRouteTransitioning ? <div className="transition-veil" /> : null}
    </main>
  )
}

export default App
