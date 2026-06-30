export const GOAL_PROFILES = {
  ips: {
    label: 'Crack IPS',
    studyWeight: 1.35,
    sleepWeight: 1.1,
    screenPenalty: 1.2,
    exerciseWeight: 0.85,
    focusTarget: 'Discipline and exam readiness',
  },
  exam: {
    label: 'Crack exam',
    studyWeight: 1.35,
    sleepWeight: 1.1,
    screenPenalty: 1.2,
    exerciseWeight: 0.85,
    focusTarget: 'Deep study consistency',
  },
  job: {
    label: 'Get job',
    studyWeight: 1.15,
    sleepWeight: 1.0,
    screenPenalty: 1.05,
    exerciseWeight: 1.1,
    focusTarget: 'Skill velocity and reliability',
  },
  focus: {
    label: 'Improve focus',
    studyWeight: 1.05,
    sleepWeight: 1.35,
    screenPenalty: 1.35,
    exerciseWeight: 1.15,
    focusTarget: 'Attention stability and recovery',
  },
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function roundNumber(value, digits = 2) {
  return Number(value.toFixed(digits))
}

export function calculateRealtimeScores(inputs, goalKey = 'focus') {
  const normalizedGoal = goalKey === 'ips' ? 'exam' : goalKey
  const goal = GOAL_PROFILES[normalizedGoal] || GOAL_PROFILES.focus
  const study = Number(inputs.study_hours || 0)
  const sleep = Number(inputs.sleep_hours || 0)
  const screen = Number(inputs.screen_time_hours || 0)
  const exercise = Number(inputs.exercise_minutes || 0)

  const productivityRaw =
    (study * 9.2 * goal.studyWeight)
    + (sleep * 4.4 * goal.sleepWeight)
    + (exercise * 0.25 * goal.exerciseWeight)
    - (screen * 8.8 * goal.screenPenalty)

  const knowledgeRaw =
    (study * 10.5 * goal.studyWeight)
    + (sleep * 2.5 * goal.sleepWeight)
    + (exercise * 0.12 * goal.exerciseWeight)
    - (screen * 5.4 * goal.screenPenalty)

  const disciplineRaw =
    (study * 8.5)
    + (sleep * 5.2)
    + (exercise * 0.28)
    - (screen * 7.6)

  return {
    productivity: Math.round(clamp(productivityRaw, 0, 100)),
    knowledge: Math.round(clamp(knowledgeRaw, 0, 100)),
    discipline: Math.round(clamp(disciplineRaw, 0, 100)),
  }
}

export function calculateImprovementDelta(current, baseline) {
  const safeBaseline = baseline > 0 ? baseline : 1
  const delta = ((current - safeBaseline) / safeBaseline) * 100
  return Math.round(delta)
}

export function buildWhatIfProjection(inputs, goalKey = 'focus') {
  const scores = calculateRealtimeScores(inputs, goalKey)
  const momentum = Math.round((scores.productivity + scores.knowledge + scores.discipline) / 3)
  return {
    in30: clamp(Math.round(momentum * 0.88), 0, 100),
    in90: clamp(Math.round(momentum * 1.04), 0, 100),
    in180: clamp(Math.round(momentum * 1.18), 0, 100),
    burnoutRisk: clamp(Math.round((Number(inputs.screen_time_hours || 0) * 9) - (Number(inputs.sleep_hours || 0) * 5) - (Number(inputs.exercise_minutes || 0) * 0.12)), 0, 100),
  }
}

export function buildTrendPreview(inputs, goalKey = 'focus', days = 7) {
  const normalizedGoal = goalKey === 'ips' ? 'exam' : goalKey
  const goal = GOAL_PROFILES[normalizedGoal] || GOAL_PROFILES.focus
  const targets = {
    study_hours: goalKey === 'job' ? 4.4 : goalKey === 'ips' || goalKey === 'exam' ? 5.8 : 4.5,
    sleep_hours: 7.4,
    screen_time_hours: goalKey === 'job' ? 1.5 : goalKey === 'ips' || goalKey === 'exam' ? 1.1 : 1.2,
    exercise_minutes: goalKey === 'job' ? 32 : 30,
  }

  const series = {
    study_hours: [],
    sleep_hours: [],
    screen_time_hours: [],
    exercise_minutes: [],
  }

  let study = Number(inputs.study_hours || 0)
  let sleep = Number(inputs.sleep_hours || 0)
  let screen = Number(inputs.screen_time_hours || 0)
  let exercise = Number(inputs.exercise_minutes || 0)

  for (let day = 0; day < days; day += 1) {
    study += (targets.study_hours - study) * 0.22 * goal.studyWeight
    sleep += (targets.sleep_hours - sleep) * 0.18 * goal.sleepWeight
    screen += (targets.screen_time_hours - screen) * 0.2 * goal.screenPenalty
    exercise += (targets.exercise_minutes - exercise) * 0.16 * goal.exerciseWeight

    series.study_hours.push(roundNumber(clamp(study, 0, 12), 1))
    series.sleep_hours.push(roundNumber(clamp(sleep, 0, 12), 1))
    series.screen_time_hours.push(roundNumber(clamp(screen, 0, 12), 1))
    series.exercise_minutes.push(roundNumber(clamp(exercise, 0, 240), 0))
  }

  return series
}

export function buildPredictionStory(goalKey, projection) {
  const normalizedGoal = goalKey === 'ips' ? 'exam' : goalKey
  const goal = GOAL_PROFILES[normalizedGoal] || GOAL_PROFILES.focus
  return `If you continue this routine, your ${goal.focusTarget.toLowerCase()} can reach ${projection.in90}% in 90 days, with a 180-day trajectory near ${projection.in180}%.`
}

export function buildGamification(summary = {}, projection = { in30: 0 }, liveScores = {}) {
  const total = Number(summary.total_score || 0)
  const streak = Number(summary.streak || 0)
  const xp = Math.round(total * 11 + streak * 45 + projection.in30 * 2)
  const level = xp > 2200 ? 'Elite' : xp > 1100 ? 'Focused' : 'Beginner'
  const progress = level === 'Elite' ? 100 : level === 'Focused' ? Math.round(((xp - 1100) / 1100) * 100) : Math.round((xp / 1100) * 100)
  const liveProductivity = Number(liveScores.productivity || 0)
  const liveKnowledge = Number(liveScores.knowledge || 0)
  const liveDiscipline = Number(liveScores.discipline || 0)
  const liveAverage = Math.round((liveProductivity + liveKnowledge + liveDiscipline) / 3)
  const liveScreenTime = Number(liveScores.screen_time_hours || 0)
  const liveSleep = Number(liveScores.sleep_hours || 0)

  const missions = [
    { label: 'Study 5 hours', completed: (Number(summary.average_score || 0) >= 55) || (liveAverage >= 55), reward: 50 },
    { label: 'Keep screen time under 2h', completed: projection.burnoutRisk < 25 || liveScreenTime <= 2, reward: 40 },
    { label: 'Protect sleep above 7h', completed: projection.in30 >= 60 || liveSleep >= 7, reward: 35 },
  ]

  return {
    xp,
    level,
    progress: clamp(progress, 0, 100),
    missions,
  }
}

export function buildTwinState(scores = {}, goalKey = 'focus') {
  const productivity = Number(scores.productivity || 0)
  const knowledge = Number(scores.knowledge || 0)
  const discipline = Number(scores.discipline || 0)
  const average = Math.round((productivity + knowledge + discipline) / 3)

  if (average > 70) {
    return {
      state: 'Optimized',
      tone: 'neon',
      average,
      hint: `Your twin is optimized for ${goalKey === 'job' ? 'job readiness' : goalKey === 'ips' || goalKey === 'exam' ? 'exam performance' : 'focus resilience'}. Keep the current execution rhythm.`,
    }
  }

  if (average >= 40) {
    return {
      state: 'Stable',
      tone: 'stable',
      average,
      hint: `Stable for ${goalKey === 'job' ? 'job outcomes' : goalKey === 'ips' || goalKey === 'exam' ? 'IPS/exam preparation' : 'focus training'}, but a few stronger sessions will improve momentum.`,
    }
  }

  return {
    state: 'At Risk',
    tone: 'dull',
    average,
    hint: `At risk for ${goalKey === 'job' ? 'career progress' : goalKey === 'ips' || goalKey === 'exam' ? 'IPS/exam target' : 'focus stability'}. Reduce distraction and protect one non-negotiable deep-work block.`,
  }
}
