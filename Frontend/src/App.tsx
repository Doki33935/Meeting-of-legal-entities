import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { createMeeting, getMeetingSlots } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'

const copy = {
  ru: {
    brand: 'Встречи для юрлиц',
    themeLabel: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    languageLabel: 'Язык',
    languageRu: 'Русский',
    languageEn: 'English',
    badge: 'Назначение встречи',
    title: 'Запланируйте встречу для юридического лица',
    description:
      'Выберите дату, время и место встречи, проверьте список документов и посмотрите, кто к вам приедет.',
    primaryAction: 'Обновить слоты',
    secondaryAction: 'Назначить встречу',
    loading: 'Загружаем доступные слоты...',
    loadingSubmit: 'Отправляем заявку...',
    errorFallback: 'Не удалось загрузить данные.',
    empty: 'Пока нет доступных слотов.',
    availabilityTitle: 'Доступность по дням',
    slotLegendAvailable: 'Свободно',
    slotLegendUnavailable: 'Занято',
    documentsTitle: 'Что нужно подготовить',
    documentsDescription:
      'Список документов позже можно будет подстраивать под тип компании и роль подписанта.',
    representativeTitle: 'Кто к вам едет',
    representativeText:
      'Пока здесь показана карточка-заглушка. Позже данные будут приходить с бэкенда вместе со слотом.',
    reasonLabel: 'Комментарий к встрече',
    reasonPlaceholder: 'Например: открытие счёта, выдача документов, уточнение данных',
    submitAction: 'Отправить заявку на встречу',
    submitted: 'Заявка отправлена. ID встречи: ',
    selectedSlotPrefix: 'Выбранный слот:',
    noSlot: 'Слот не выбран',
    dayLabel: 'День',
    footer: 'Контракт с бэкендом: GET /start — слоты, POST /meet — заявка на встречу',
  },
  en: {
    brand: 'Legal entity meetings',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageLabel: 'Language',
    languageRu: 'Russian',
    languageEn: 'English',
    badge: 'Meeting scheduling',
    title: 'Schedule a meeting for a legal entity',
    description:
      'Choose the date, time, and location, review required documents, and see who will arrive.',
    primaryAction: 'Reload slots',
    secondaryAction: 'Book a meeting',
    loading: 'Loading available slots...',
    loadingSubmit: 'Sending request...',
    errorFallback: 'Failed to load data.',
    empty: 'No available slots yet.',
    availabilityTitle: 'Availability by day',
    slotLegendAvailable: 'Available',
    slotLegendUnavailable: 'Busy',
    documentsTitle: 'Documents to prepare',
    documentsDescription:
      'This list can later be adjusted by company type and signatory role.',
    representativeTitle: 'Who is coming',
    representativeText:
      'This is a placeholder card for now. Later the data will come from the backend together with the slot.',
    reasonLabel: 'Meeting note',
    reasonPlaceholder: 'For example: account opening, document delivery, details clarification',
    submitAction: 'Submit meeting request',
    submitted: 'Request sent. Meeting ID: ',
    selectedSlotPrefix: 'Selected slot:',
    noSlot: 'No slot selected',
    dayLabel: 'Day',
    footer: 'Backend contract: GET /start — slots, POST /meet — meeting request',
  },
} as const

const documents = [
  'Паспорт представителя компании',
  'ИНН и регистрационные данные',
  'Устав или учредительные документы',
  'Доверенность, если подписант не учредитель',
]

function MeetingBookingPage() {
  const { theme, toggleTheme } = useTheme()
  const [locale, setLocale] = useState<Locale>('ru')
  const [slots, setSlots] = useState<StartSlotDto[]>([])
  const [selectedSlot, setSelectedSlot] = useState<StartSlotDto | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const t = copy[locale]

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const normalizedSlots = useMemo(() => {
    return slots.map((slot) => ({
      ...slot,
      status: Boolean(slot.status),
    }))
  }, [slots])

  const loadSlots = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getMeetingSlots()
      setSlots(data)
      setSelectedSlot(data.find((slot) => slot.status) ?? data[0] ?? null)
    } catch {
      setError(t.errorFallback)
      setSlots([])
      setSelectedSlot(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const handleSubmit = async () => {
    if (!selectedSlot) {
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      await createMeeting({
        id: selectedSlot.day,
        reason: reason.trim() || 'Не указана причина',
      })
      setMessage(`${t.submitted}${selectedSlot.day}`)
    } catch {
      setError(t.errorFallback)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="topbar__brand">{t.brand}</p>
          <p className="topbar__meta">React + TypeScript + Vite</p>
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
          <button type="button" className="button button--secondary" onClick={handleSubmit}>
            {t.secondaryAction}
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
          ) : normalizedSlots.length === 0 ? (
            <p className="state-text">{t.empty}</p>
          ) : (
            <div className="slots-grid">
              {normalizedSlots.map((slot) => (
                <button
                  key={`${slot.day}-${slot.time}`}
                  type="button"
                  className={`slot-card ${selectedSlot?.day === slot.day && selectedSlot?.time === slot.time ? 'slot-card--selected' : ''}`}
                  onClick={() => slot.status && setSelectedSlot(slot)}
                  disabled={!slot.status}
                >
                  <span className="slot-card__day">
                    {t.dayLabel} {slot.day}
                  </span>
                  <span className="slot-card__time">{slot.time}</span>
                  <span
                    className={`slot-card__status ${slot.status ? 'slot-card__status--available' : 'slot-card__status--busy'}`}
                  >
                    {slot.status ? t.slotLegendAvailable : t.slotLegendUnavailable}
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card card--accent">
          <h2 className="card__title">{t.representativeTitle}</h2>
          <div className="info-block">
            <p>{t.representativeText}</p>
            <p>
              <strong>{t.selectedSlotPrefix}</strong>{' '}
              {selectedSlot ? `${t.dayLabel} ${selectedSlot.day}, ${selectedSlot.time}` : t.noSlot}
            </p>
          </div>

          <label className="field">
            <span className="field__label">{t.reasonLabel}</span>
            <textarea
              className="field__control"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t.reasonPlaceholder}
            />
          </label>

          <button
            type="button"
            className="button button--primary button--full"
            onClick={handleSubmit}
            disabled={!selectedSlot || submitting}
          >
            {submitting ? t.loadingSubmit : t.submitAction}
          </button>

          {message ? <p className="state-text state-text--success">{message}</p> : null}
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

      <footer className="footer-note">
        <span>{t.footer}</span>
      </footer>
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
