import { test, expect } from '@playwright/test'

test('login opens dashboard with mocked API and forecast diagnostics', async ({ page }) => {
  const token = 'mock-token'

  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: 'u1',
          name: 'Mock User',
          email: 'mock@gmail.com',
          level: 'Focused',
          streak: 4,
          badges: ['Momentum Starter'],
        },
      }),
    })
  })

  await page.route('**/habits/history', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        entries: [
          { log_date: '2026-04-08', study_hours: 3.2, sleep_hours: 7.1, screen_time_hours: 2.1, exercise_minutes: 20, score: 52.1 },
          { log_date: '2026-04-09', study_hours: 3.7, sleep_hours: 7.3, screen_time_hours: 1.8, exercise_minutes: 25, score: 58.2 },
          { log_date: '2026-04-10', study_hours: 4.1, sleep_hours: 7.7, screen_time_hours: 1.5, exercise_minutes: 30, score: 64.5 },
        ],
        summary: {
          average_score: 58.27,
          streak: 4,
          level: 'Focused',
          badges: ['Momentum Starter', 'Consistency Core'],
          total_score: 174.81,
        },
      }),
    })
  })

  await page.route('**/simulate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scores: {
          '30_days': { knowledge: 88.4, productivity: 84.2 },
          '90_days': { knowledge: 96.5, productivity: 92.1 },
          '6_months': { knowledge: 99.1, productivity: 96.7 },
        },
        projections: {
          '30_days': { knowledge_score: 88.4, productivity_score: 84.2, energy: 78.9, stress: 21.2 },
          '90_days': { knowledge_score: 96.5, productivity_score: 92.1, energy: 84.1, stress: 18.0 },
          '6_months': { knowledge_score: 99.1, productivity_score: 96.7, energy: 86.4, stress: 16.2 },
        },
        forecast_method: 'trend',
      }),
    })
  })

  await page.route('**/mdp/optimal', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        policy: {
          best_action: 'study',
          next_state: { knowledge: 7.9, energy: 7.1, discipline: 7.3, stress: 2.5 },
        },
        recommendation: ['Increase study by 45 minutes today.'],
      }),
    })
  })

  await page.route('**/compare', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current_life: { knowledge: 84, productivity: 80, energy: 76, discipline: 74 },
        ideal_life: { knowledge: 95, productivity: 92, energy: 88, discipline: 86 },
        improvement_percent: { productivity: 15 },
      }),
    })
  })

  await page.route('**/forecast', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        method: 'trend',
        history_points: 12,
        forecast: {
          study_hours: Array.from({ length: 30 }, (_, idx) => Number((4 + idx * 0.02).toFixed(2))),
          sleep_hours: Array.from({ length: 30 }, () => 7.6),
          screen_time_hours: Array.from({ length: 30 }, (_, idx) => Number((1.9 - idx * 0.01).toFixed(2))),
          exercise_minutes: Array.from({ length: 30 }, () => 30),
        },
      }),
    })
  })

  await page.route('**/chatbot', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: 'Great momentum. Keep your deep-work blocks consistent today.',
        signals: {},
      }),
    })
  })

  await page.goto('/')
  await expect(page.getByText('Continue your future timeline')).toBeVisible()

  await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()

  await expect(page.getByText('Optimal next action')).toBeVisible()
  await expect(page.getByText('Model diagnostics')).toBeVisible()
  await expect(page.getByText('Confidence score:')).toBeVisible()
  await expect(page.getByText('Forecast method:')).toBeVisible()
})
