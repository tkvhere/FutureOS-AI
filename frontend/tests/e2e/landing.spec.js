import { test, expect } from '@playwright/test'

test('landing and auth panel render', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Build a life timeline from the habits you repeat every day.')).toBeVisible()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page.getByText('Start your future timeline')).toBeVisible()
  await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
})

