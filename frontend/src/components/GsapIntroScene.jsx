import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function GsapIntroScene({ onComplete, onSkip }) {
  const rootRef = useRef(null)
  const giraffeRef = useRef(null)
  const headRef = useRef(null)
  const neckRef = useRef(null)
  const eyeRef = useRef(null)
  const spotsRef = useRef([])
  const legsRef = useRef([])
  const pulseRef = useRef(null)
  const titleRef = useRef(null)
  const credentialsRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      gsap.set(credentialsRef.current, { autoAlpha: 0, y: 44, scale: 0.96 })
      gsap.set(giraffeRef.current, { x: -420, autoAlpha: 0, rotate: -4 })
      gsap.set(headRef.current, { transformOrigin: '50% 78%' })
      gsap.set(neckRef.current, { transformOrigin: '50% 100%', rotate: -2 })
      gsap.set(eyeRef.current, { transformOrigin: '50% 50%' })

      gsap.to(spotsRef.current, {
        opacity: 0.45,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        stagger: 0.08,
        ease: 'sine.inOut',
      })

      tl.from(rootRef.current, { autoAlpha: 0, duration: 0.45 })
        .from(titleRef.current, { y: 24, autoAlpha: 0, duration: 0.95, ease: 'power2.out' }, '<')
        .to(giraffeRef.current, { x: 0, autoAlpha: 1, rotate: 0, duration: 1.7, ease: 'power2.inOut' }, '-=0.35')
        .to(
          legsRef.current,
          {
            keyframes: [
              { y: -6, rotate: 4, duration: 0.2 },
              { y: 0, rotate: -2, duration: 0.2 },
              { y: -4, rotate: 3, duration: 0.2 },
              { y: 0, rotate: 0, duration: 0.2 },
            ],
            stagger: 0.05,
          },
          '-=1.25',
        )
        .to(neckRef.current, { rotate: 3, duration: 0.3, yoyo: true, repeat: 1 }, '-=0.4')
        .to(headRef.current, { rotate: 8, duration: 0.28, yoyo: true, repeat: 1 }, '-=0.3')
        .to(eyeRef.current, { scaleY: 0.08, duration: 0.1, yoyo: true, repeat: 1 }, '-=0.2')
        .fromTo(
          pulseRef.current,
          { scale: 0.8, autoAlpha: 0.25 },
          { scale: 1.22, autoAlpha: 0.75, duration: 1.15, repeat: 1, yoyo: true },
          '-=0.35',
        )
        .to(credentialsRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' }, '-=0.15')
        .to({}, { duration: 0.55 })
        .call(() => onComplete?.())
    }, rootRef)

    return () => ctx.revert()
  }, [onComplete])

  return (
    <section ref={rootRef} className="intro-stage relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center overflow-hidden rounded-[38px] border border-white/10 p-6 sm:p-10">
      <div className="intro-background absolute inset-0" />
      <div ref={pulseRef} className="intro-pulse absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <button
        type="button"
        onClick={onSkip}
        className="absolute right-5 top-5 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 hover:bg-white/20"
      >
        Skip Intro
      </button>

      <div className="relative z-10 grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200">
            FUTURE YOU GIRAFFE SEQUENCE
          </p>
          <h1 ref={titleRef} className="font-title max-w-2xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
            A smart giraffe guide arrives to unlock your login gate.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
            Watch the guide walk in from the left and open your secure credential channel.
          </p>
        </div>

        <div className="relative h-[420px]">
          <div ref={giraffeRef} className="absolute left-1/2 top-1/2 h-[320px] w-[230px] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-[96px] top-[16px] h-8 w-3 rounded-full bg-[#c18435]" />
            <div className="absolute left-[132px] top-[16px] h-8 w-3 rounded-full bg-[#c18435]" />
            <div className="absolute left-[89px] top-[8px] h-5 w-5 rounded-full bg-[#f5d58f]" />
            <div className="absolute left-[125px] top-[8px] h-5 w-5 rounded-full bg-[#f5d58f]" />

            <div ref={neckRef} className="absolute left-[98px] top-[38px] h-28 w-38 rounded-[28px] bg-gradient-to-b from-[#f2d48a] via-[#deb36b] to-[#c8934a]" style={{ width: '38px' }} />

            <div ref={headRef} className="absolute left-[72px] top-[48px] h-[74px] w-[96px] rounded-[40px] bg-gradient-to-b from-[#f5da9b] via-[#e4bb72] to-[#c58e46]">
              <div ref={eyeRef} className="absolute left-[58px] top-[28px] h-[8px] w-[8px] rounded-full bg-slate-900" />
              <div className="absolute left-[18px] top-[42px] h-[18px] w-[58px] rounded-[20px] bg-[#f0d49a]" />
              <div className="absolute left-[26px] top-[50px] h-[2px] w-[42px] rounded-full bg-[#8c5a2f]" />
            </div>

            <div className="absolute left-[48px] top-[146px] h-[112px] w-[136px] rounded-[56px] bg-gradient-to-b from-[#f4d489] via-[#dfb366] to-[#b87e3c]" />

            {[{ l: 62, t: 168 }, { l: 96, t: 186 }, { l: 126, t: 164 }, { l: 142, t: 194 }, { l: 84, t: 214 }].map((spot, index) => (
              <div
                key={`spot-${index}`}
                ref={(element) => {
                  spotsRef.current[index] = element
                }}
                className="absolute h-4 w-4 rounded-full bg-[#9b5f2c]"
                style={{ left: `${spot.l}px`, top: `${spot.t}px` }}
              />
            ))}

            {[64, 96, 128, 160].map((left, index) => (
              <div
                key={`leg-${index}`}
                ref={(element) => {
                  legsRef.current[index] = element
                }}
                className="absolute top-[250px] h-[62px] w-[16px] rounded-b-[14px] rounded-t-[10px] bg-gradient-to-b from-[#d49e54] to-[#835129]"
                style={{ left: `${left}px` }}
              />
            ))}

            <div className="absolute left-[178px] top-[168px] h-[48px] w-[8px] rounded-full bg-[#b37939]" />
            <div className="absolute left-[180px] top-[210px] h-[9px] w-[9px] rounded-full bg-[#8f5527]" />
          </div>

          <div ref={credentialsRef} className="intro-credential-card absolute bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 rounded-3xl border border-white/15 bg-slate-950/75 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Identity Gateway</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Opening Login Credentials</h3>
            <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-300" />
            <p className="mt-3 text-sm leading-6 text-slate-300">Giraffe guide authenticated your entry path. Proceed to login and enter hero mode.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
