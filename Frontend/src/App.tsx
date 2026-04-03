import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getAvailableStaff, getMeetingSlots } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { StaffDto, StartDaySlot, StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'

const copy = {
  ru: {
    brand: 'Встречи для юрлиц',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    languageRu: 'Русский',
    languageEn: 'English',
    badge: 'Назначение встречи',
    title: 'Запланируйте встречу для юридического лица',
    description:
      'Выберите дату, время и место встречи, проверьте список документов и посмотрите, кто к вам приедет.',
    primaryAction: 'Обновить слоты',
    loading: 'Загружаем доступные слоты...',
    errorFallback: 'Не удалось загрузить данные.',
    empty: 'Пока нет доступных слотов.',
    availabilityTitle: 'Доступность по датам',
    slotLegendAvailable: 'Свободно',
    slotLegendUnavailable: 'Занято',
    documentsTitle: 'Что нужно подготовить',
    documentsDescription:
      'Список документов позже можно будет подстраивать под тип компании и роль подписанта.',
    dayLabel: 'Дата',
    countLabel: 'Доступно мест',
    notAvailable: 'Нет мест',
  },
  en: {
    brand: 'Legal entity meetings',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageRu: 'Russian',
    languageEn: 'English',
    badge: 'Meeting scheduling',
    title: 'Schedule a meeting for a legal entity',
    description:
      'Choose the date, time, and location, review required documents, and see who will arrive.',
    primaryAction: 'Reload slots',
    loading: 'Loading available slots...',
    errorFallback: 'Failed to load data.',
    empty: 'No available slots yet.',
    availabilityTitle: 'Availability by date',
    slotLegendAvailable: 'Available',
    slotLegendUnavailable: 'Busy',
    documentsTitle: 'Documents to prepare',
    documentsDescription:
      'This list can later be adjusted by company type and signatory role.',
    dayLabel: 'Date',
    countLabel: 'Available seats',
    notAvailable: 'No seats',
  },
} as const

const documents = [
  'Паспорт представителя компании',
  'ИНН и регистрационные данные',
  'Устав или учредительные документы',
  'Доверенность, если подписант не учредитель',
]

function formatDateTime(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(value))
}

function groupSlotsByDate(slots: StartSlotDto[]): StartDaySlot[] {
  const grouped = new Map<string, StartDaySlot>()

  slots.forEach((slot) => {
    const date = new Date(slot.slot)
    const key = date.toISOString().slice(0, 10)
    const current = grouped.get(key)
    const time = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)

    if (!current) {
      grouped.set(key, {
        date: key,
        dayLabel: formatDayLabel(slot.slot),
        slots: [{ time, count: slot.count, slot: slot.slot }],
      })
      return
    }

    current.slots.push({ time, count: slot.count, slot: slot.slot })
  })

  return Array.from(grouped.values())
}

function MeetingBookingPage() {
  const { theme, toggleTheme } = useTheme()
  const [locale, setLocale] = useState<Locale>('ru')
  const [slots, setSlots] = useState<StartSlotDto[]>([])
  const [selectedSlot, setSelectedSlot] = useState<StartSlotDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staff, setStaff] = useState<StaffDto[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')

  const t = copy[locale]

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots])

  const loadStaff = async (slot: string) => {
    setLoadingStaff(true)
    setStaffError('')
    try {
      const data = await getAvailableStaff({ slot })
      console.log('[MeetingBookingPage] staff loaded', data)
      setStaff(data)
    } catch (cause) {
      console.error('[MeetingBookingPage] Failed to load staff', cause)
      setStaffError(t.errorFallback)
      setStaff([])
    } finally {
      setLoadingStaff(false)
    }
  }

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMeetingSlots()
      console.log('[MeetingBookingPage] slots loaded', data)
      setSlots(data)

      const first = data[0] ?? null
      setSelectedSlot(first)
      setStaff([])

      if (first) {
        void loadStaff(first.slot)
      }
    } catch (cause) {
      console.error('[MeetingBookingPage] Failed to load slots', cause)
      setError(t.errorFallback)
      setSlots([])
      setSelectedSlot(null)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="topbar__brand">{t.brand}</p>
        </div>

        <div className="topbar__controls">
          <button type="button" className="chip-button" onClick={toggleTheme}>
            {theme === 'light' ? t.themeDark : t.themeLight}
          </button>
          <button
            type="button"
            className="chip-button"
            onClick={() => setLocale((current) => (current === 'ru' ? 'en' : 'ru'))}
          >
            {locale === 'ru' ? t.languageEn : t.languageRu}
          </button>
        </div>
      </header>

      <section className="hero-section">
        <span className="hero-section__badge">{t.badge}</span>
        <h1 className="hero-section__title">{t.title}</h1>
        <p className="hero-section__description">{t.description}</p>

        <div className="hero-section__actions">
          <button type="button" className="button button--primary" onClick={() => void loadSlots()}>
            {t.primaryAction}
          </button>
        </div>
      </section>

      <section className="grid-section">
        <article className="card">
          <div className="section-head">
            <h2 className="card__title">{t.availabilityTitle}</h2>
            <span className="section-head__legend">
              {t.slotLegendAvailable} / {t.slotLegendUnavailable}
            </span>
          </div>

          {loading ? (
            <p className="state-text">{t.loading}</p>
          ) : error ? (
            <p className="state-text state-text--error">{error}</p>
          ) : slotsByDate.length === 0 ? (
            <p className="state-text">{t.empty}</p>
          ) : (
            <div className="date-groups">
              {slotsByDate.map((day) => (
                <div key={day.date} className="date-group">
                  <div className="date-group__header">
                    <h3 className="date-group__title">{day.dayLabel}</h3>
                    <span className="date-group__count">
                      {day.slots.reduce((sum, slot) => sum + slot.count, 0)} {t.countLabel}
                    </span>
                  </div>

                  <div className="slots-grid">
                    {day.slots.map((slot) => (
                      <button
                        key={slot.slot}
                        type="button"
                        className={`slot-card ${selectedSlot?.slot === slot.slot ? 'slot-card--selected' : ''}`}
                        onClick={() => {
                          const next = { slot: slot.slot, count: slot.count }
                          setSelectedSlot(next)
                          void loadStaff(next.slot)
                        }}
                      >
                        <span className="slot-card__day">{slot.time}</span>
                        <span className="slot-card__time">{day.dayLabel}</span>
                        <span className="slot-card__status slot-card__status--available">
                          {slot.count > 0 ? `${t.slotLegendAvailable} (${slot.count})` : t.notAvailable}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card card--accent">
          <h2 className="card__title">{t.documentsTitle}</h2>
          <div className="info-block">
            <p>{t.documentsDescription}</p>
            <p>
              <strong>{t.dayLabel}</strong>{' '}
              {selectedSlot ? formatDateTime(selectedSlot.slot) : t.notAvailable}
            </p>
          </div>
          <div className="info-block">
            <h3 className="card__title" style={{ marginTop: 0 }}>
              {locale === 'ru' ? 'Кто приедет' : 'Who is coming'}
            </h3>
            {loadingStaff ? (
              <p className="state-text">{locale === 'ru' ? 'Загружаем сотрудников...' : 'Loading staff...'}</p>
            ) : staffError ? (
              <p className="state-text state-text--error">{staffError}</p>
            ) : staff.length === 0 ? (
              <p className="state-text">{locale === 'ru' ? 'На выбранное время никто не доступен.' : 'No staff available for the selected time.'}</p>
            ) : (
              <ul className="chips">
                {staff.map((s) => (
                  <li key={s.id} className="chips__item" title={s.description}>
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      <section className="card documents-section">
        <div>
          <h2 className="card__title">{t.documentsTitle}</h2>
          <p className="documents-section__text">{t.documentsDescription}</p>
        </div>

        <ul className="chips">
          {documents.map((document) => (
            <li key={document} className="chips__item">
              {document}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/meeting-booking" replace />} />
      <Route path="/meeting-booking" element={<MeetingBookingPage />} />
    </Routes>
  )
}

export default App
