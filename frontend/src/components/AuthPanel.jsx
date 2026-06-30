import { useEffect, useState } from 'react'

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-500">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.5 8 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-500">
      <path d="M7 11V8.5a5 5 0 0 1 10 0V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v5A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-5A1.5 1.5 0 0 1 6.5 11Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 14v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconTinyLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5 text-blue-400/90">
      <path d="M7.5 10V8.5a4.5 4.5 0 0 1 9 0V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.75 10h10.5a1.25 1.25 0 0 1 1.25 1.25v4.5A1.25 1.25 0 0 1 17.25 17h-10.5A1.25 1.25 0 0 1 5.5 15.75v-4.5A1.25 1.25 0 0 1 6.75 10Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-500">
      <path d="M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconEye({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-500">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-500">
      <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.3 7.6A9.7 9.7 0 0 1 12 7.1C18 7.1 21.5 12 21.5 12a14.6 14.6 0 0 1-3.3 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function AuthPanel({ mode, onSubmit, onResendVerification, loading, onToggleMode, verificationEmail, verificationCodeHint, verificationMessage }) {
  const [form, setForm] = useState({ name: 'Nova User', email: 'demo@gmail.com', password: 'demo1234', verificationCode: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (mode === 'verify') {
      setForm((current) => ({
        ...current,
        email: verificationEmail || current.email,
        verificationCode: verificationCodeHint || current.verificationCode,
      }))
    }
  }, [mode, verificationEmail, verificationCodeHint])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-7 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 shadow-[0_0_28px_rgba(59,130,246,0.18)]">
            <IconTinyLock />
          </div>
        </div>
        <h2 className="text-[2.35rem] font-semibold tracking-[-0.03em] text-white">{mode === 'signup' ? 'Sign up' : mode === 'verify' ? 'Verify Gmail' : 'Log in'}</h2>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-slate-400">
          {mode === 'signup'
            ? 'Create your account and start translating daily habits into future outcomes.'
            : mode === 'verify'
              ? 'Confirm the Gmail address you own before the account is activated.'
              : 'Log in to continue tracking habits, simulations, and AI coaching.'}
        </p>
      </div>

      {mode === 'verify' ? (
        <div className="mb-4 rounded-3xl border border-aurora-500/20 bg-aurora-500/10 px-4 py-3 text-sm text-aurora-100">
          <p className="font-medium">{verificationMessage || 'Enter the verification code sent to your Gmail inbox.'}</p>
          {verificationEmail ? <p className="mt-1 text-xs text-slate-300">{verificationEmail}</p> : null}
          {verificationCodeHint ? <p className="mt-2 text-xs text-slate-200">Local verification code: <span className="font-semibold text-white">{verificationCodeHint}</span></p> : null}
        </div>
      ) : null}

      {mode === 'signup' ? (
        <label className="mb-4 block space-y-2">
          <span className="sr-only">Full name</span>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-aurora-500 focus-within:shadow-[0_0_0_1px_rgba(45,212,191,0.16)]">
            <IconUser />
            <input name="name" value={form.name} onChange={handleChange} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Enter your full name" />
          </div>
        </label>
      ) : null}

      <label className="mb-4 block space-y-2">
        <span className="sr-only">Email</span>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-aurora-500 focus-within:shadow-[0_0_0_1px_rgba(45,212,191,0.16)]">
          <IconMail />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder={mode === 'verify' ? 'Enter the Gmail address you are verifying' : 'Enter your email address'}
          />
        </div>
      </label>

      {mode === 'verify' ? (
        <label className="mb-6 block space-y-2">
          <span className="sr-only">Verification code</span>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-aurora-500 focus-within:shadow-[0_0_0_1px_rgba(45,212,191,0.16)]">
            <IconTinyLock />
            <input
              name="verificationCode"
              inputMode="numeric"
              value={form.verificationCode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Enter the 6-digit verification code"
            />
          </div>
        </label>
      ) : null}

      {mode !== 'verify' ? (
      <label className="mb-6 block space-y-2">
        <span className="sr-only">Password</span>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-aurora-500 focus-within:shadow-[0_0_0_1px_rgba(45,212,191,0.16)]">
          <IconLock />
          <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Enter your password" />
          <button type="button" className="rounded-full p-1 transition hover:bg-white/5" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
            <IconEye open={showPassword} />
          </button>
        </div>
      </label>
      ) : null}

      <button disabled={loading} className="w-full rounded-full bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60">
        {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'verify' ? 'Verify Gmail' : 'Log in'}
      </button>

      {mode === 'verify' ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => onResendVerification?.(form.email)} disabled={loading} className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:opacity-60">
            Resend code
          </button>
          <button type="button" onClick={() => onToggleMode?.('login')} className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5">
            Back to log in
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-400">
        {['Facebook', 'Google', 'Apple'].map((label) => (
          <button key={label} type="button" className="rounded-full border border-white/10 bg-black/20 px-3 py-2 transition hover:border-white/20 hover:bg-white/5">
            {label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-slate-400">
        {mode === 'verify' ? 'Need to restart the flow?' : mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        {mode === 'verify' ? (
          <button type="button" className="font-medium text-aurora-500 underline-offset-4 hover:underline" onClick={() => onToggleMode?.('signup')}>
            Create a new account
          </button>
        ) : (
          <button type="button" className="font-medium text-aurora-500 underline-offset-4 hover:underline" onClick={() => onToggleMode?.(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        )}
      </p>
    </form>
  )
}
