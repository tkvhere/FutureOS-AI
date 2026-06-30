import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-white break-words">{value || 'N/A'}</p>
    </div>
  )
}

export default function ProfileDrawer({ open, onClose, user, summary, goalMode, mood, onSaveProfile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftPhoto, setDraftPhoto] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setDraftName(user?.name || '')
    setDraftPhoto(user?.avatar || '')
    setIsEditing(false)
  }, [open, user?.name, user?.avatar])

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      if (value) {
        setDraftPhoto(value)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const nextName = (draftName || '').trim() || user?.name || 'Student'
    onSaveProfile?.({ name: nextName, avatar: draftPhoto || '' })
    setIsEditing(false)
  }

  const displayName = (draftName || user?.name || 'Student').trim() || 'Student'
  const profileInitial = displayName.charAt(0).toUpperCase()

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close profile"
            className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-[80] h-screen w-full max-w-md border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,12,28,0.98),rgba(9,15,34,0.98))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.9 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Student Profile</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">This is your profile</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white"
              >
                Close
              </button>
            </div>

            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile Photo</p>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200"
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-4">
                {draftPhoto ? (
                  <img
                    src={draftPhoto}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border border-white/15 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(34,211,238,0.24),rgba(168,85,247,0.18))] text-2xl font-semibold text-white">
                    {profileInitial}
                  </div>
                )}

                <div className="flex-1">
                  {isEditing ? (
                    <>
                      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60"
                      />

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoPick}
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-xl bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-3 py-2 text-xs font-semibold text-slate-950"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftName(user?.name || '')
                            setDraftPhoto(user?.avatar || '')
                            setIsEditing(false)
                          }}
                          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-white">{user?.name || 'Student'}</p>
                      <p className="text-sm text-slate-300">{user?.email || 'No email available'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 pb-8" style={{ maxHeight: 'calc(100vh - 110px)' }}>
              <DetailRow label="Full name" value={user?.name} />
              <DetailRow label="Email" value={user?.email} />
              <DetailRow label="User ID" value={user?.id} />
              <DetailRow label="Level" value={user?.level} />
              <DetailRow label="Current streak" value={summary?.streak ? `${summary.streak} days` : user?.streak ? `${user.streak} days` : '0 days'} />
              <DetailRow label="Total score" value={summary?.total_score ?? 0} />
              <DetailRow label="Current goal mode" value={goalMode} />
              <DetailRow label="Current mood" value={mood} />
              <DetailRow label="Badges" value={Array.isArray(summary?.badges) && summary.badges.length ? summary.badges.join(', ') : Array.isArray(user?.badges) && user.badges.length ? user.badges.join(', ') : 'No badges yet'} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
