import { useCallback, useEffect, useState } from 'react'
import { DATA_SCHEMA_VERSION, type BusinessProfile } from '@/domain/models'
import { useServices } from '@/app/services'
import { newId, validateProfile, type FieldErrors } from '@/features/quotes/draft'

type Status = 'loading' | 'ready' | 'error'

const emptyProfile = (): BusinessProfile => ({ id: newId(), legalName: '', schemaVersion: DATA_SCHEMA_VERSION })

/** Formulario del perfil emisor sobre `ProfileService`. */
export function useProfileForm() {
  const { profile: service } = useServices()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<Error>()
  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile)
  const [baseline, setBaseline] = useState('')
  const [exists, setExists] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const stored = await service.get()
      const current = stored ?? emptyProfile()
      setExists(Boolean(stored))
      setProfile(current)
      setBaseline(JSON.stringify(current))
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setStatus('error')
    }
  }, [service])

  useEffect(() => {
    void load()
  }, [load])

  const update = useCallback((patch: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }, [])

  const save = useCallback(async () => {
    const result = validateProfile(profile)
    if (!result.ok) {
      setErrors(result.errors)
      return false
    }
    setSaving(true)
    try {
      const saved = await service.save(result.value)
      setProfile(saved)
      setBaseline(JSON.stringify(saved))
      setExists(true)
      return true
    } finally {
      setSaving(false)
    }
  }, [profile, service])

  return { status, error, reload: load, profile, exists, errors, saving, dirty: JSON.stringify(profile) !== baseline, update, save }
}
