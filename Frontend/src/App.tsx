import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { bookMeeting, getAvailableStaff, getMeetingSlots } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { StaffDto, StartDaySlot, StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'
type BookingStep = 'calendar' | 'slot' | 'details'

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
    placeTitle: 'Место встречи',
    placeEmpty: 'Место встречи будет показано после получения данных от backend.',
    stepCalendar: 'Шаг 1',
    stepSlot: 'Шаг 2',
    stepDetails: 'Шаг 3',
    stepCalendarLabel: 'Выберите дату',
    stepSlotLabel: 'Выберите время',
    stepDetailsLabel: 'Проверьте детали',
    summaryTitle: 'Сводка встречи',
    summaryEmpty: 'Сначала выберите дату и время встречи.',
    selectedDate: 'Выбранная дата',
    selectedTime: 'Выбранное время',
    selectedCount: 'Доступных представителей',
    loadingStaff: 'Загружаем сотрудников...',
    noStaff: 'На выбранное время никто не доступен.',
    selectDateHint: 'Сначала выберите дату с доступными слотами.',
    selectSlotHint: 'Теперь выберите удобное время.',
    noSlots: 'На эту дату нет доступных слотов.',
    whoIsComing: 'Кто приедет',
    representativeAge: 'Возраст',
    chooseAnotherDate: 'Выбрать другую дату',
    unavailable: 'Недоступно',
    specializationTitle: 'Специализация',
    specializationAny: 'Любая специализация',
    selectSpecialist: 'Выберите специалиста',
    bookCta: 'Назначить встречу',
    bookSuccess: 'Встреча назначена. Мы подтвердим детали по контакту в заявке.',
    bookError: 'Не удалось назначить встречу. Попробуйте позже.',
    summarySpecialist: 'Выбранный специалист',
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
    placeTitle: 'Meeting place',
    placeEmpty: 'The meeting place will be shown after the backend provides it.',
    stepCalendar: 'Step 1',
    stepSlot: 'Step 2',
    stepDetails: 'Step 3',
    stepCalendarLabel: 'Choose a date',
    stepSlotLabel: 'Choose a time',
    stepDetailsLabel: 'Review details',
    summaryTitle: 'Meeting summary',
    summaryEmpty: 'Select a meeting date and time first.',
    selectedDate: 'Selected date',
    selectedTime: 'Selected time',
    selectedCount: 'Available representatives',
    loadingStaff: 'Loading staff...',
    noStaff: 'No staff available for the selected time.',
    selectDateHint: 'Start by choosing a date with available slots.',
    selectSlotHint: 'Now choose a convenient time.',
    noSlots: 'No available slots for this date.',
    whoIsComing: 'Who is coming',
    representativeAge: 'Age',
    chooseAnotherDate: 'Choose another date',
    unavailable: 'Unavailable',
    specializationTitle: 'Specialization',
    specializationAny: 'Any specialization',
    selectSpecialist: 'Select a specialist',
    bookCta: 'Book meeting',
    bookSuccess: 'Meeting booked. We will confirm the details via your contacts.',
    bookError: 'Could not book the meeting. Please try again.',
    summarySpecialist: 'Chosen specialist',
  },
} as const

const documents = [
  'Паспорт представителя компании',
  'ИНН и регистрационные данные',
  'Устав или учредительные документы',
  'Доверенность, если подписант не учредитель',
]

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const defaultLocale = (import.meta.env.VITE_DEFAULT_LANGUAGE === 'en' ? 'en' : 'ru') as Locale

const staffSpecializationMap: Record<string, string> = {
  'Alice Johnson': 'Корпоративное право',
  'Bob Smith': 'Налоги и бухгалтерия',
  'Charlie Brown': 'Помощник юриста',
  'Diana Prince': 'Договорное право',
  'Ethan Hunt': 'Риск-менеджмент',
  'Fiona Gallagher': 'HR / трудовое право',
  'George Martin': 'Стратегическое консультирование',
  'Hannah Lee': 'Сопровождение сделок',
  'Ivan Petrov': 'Комплаенс',
  'Julia Roberts': 'Бизнес-консалтинг',
}

function enrichStaff(data: StaffDto[]): StaffDto[] {
  return data.map((s) => ({
    ...s,
    specialization: s.specialization ?? staffSpecializationMap[s.name] ?? 'Корпоративное право',
  }))
}

function getImageUrl(path: string) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL ?? ''}${path}`
}

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

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getMonthGrid(anchor: Date) {
  const year = anchor.getUTCFullYear()
  const month = anchor.getUTCMonth()
  const firstOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  const firstDowMon0 = (firstOfMonth.getUTCDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDowMon0)

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setUTCDate(gridStart.getUTCDate() + i)
    days.push(d)
  }

  return { year, month, days }
}

const weekdayHeaderRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

function monthTitleRu(year: number, monthIndex0: number) {
  const d = new Date(Date.UTC(year, monthIndex0, 1))
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d)
}

function groupSlotsByDate(slots: StartSlotDto[]): StartDaySlot[] {
  const grouped = new Map<string, StartDaySlot>()

  slots.forEach((slot) => {
    const date = new Date(slot.slot)
    const key = toYMD(date)
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
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [slots, setSlots] = useState<StartSlotDto[]>([])
  const [selectedSlot, setSelectedSlot] = useState<StartSlotDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staff, setStaff] = useState<StaffDto[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffDto | null>(null)
  const [clientSpecialization, setClientSpecialization] = useState<string>('all')
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bookingMessage, setBookingMessage] = useState('')
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = new Date()
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  })
  const [selectedDateYMD, setSelectedDateYMD] = useState<string | null>(null)

  const t = copy[locale]

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots])
  const availableDatesSet = useMemo(() => new Set(slots.map((s) => toYMD(new Date(s.slot)))), [slots])
  const selectedDay = useMemo(() => {
    if (!selectedDateYMD) return null
    return slotsByDate.find((d) => d.date === selectedDateYMD) ?? null
  }, [selectedDateYMD, slotsByDate])
  const selectedDaySlots = selectedDay?.slots ?? []
  const bookingStep: BookingStep = !selectedDateYMD ? 'calendar' : !selectedSlot ? 'slot' : 'details'
  const specializationOptions = useMemo(
    () => ['all', ...new Set(staff.map((s) => s.specialization ?? 'Корпоративное право'))],
    [staff],
  )
  const filteredStaff = useMemo(
    () =>
      clientSpecialization === 'all'
        ? staff
        : staff.filter((s) => s.specialization === clientSpecialization),
    [clientSpecialization, staff],
  )

  const loadStaff = async (slot: string) => {
    setLoadingStaff(true)
    setStaffError('')
    setSelectedStaff(null)
    setBookingStatus('idle')
    setBookingMessage('')
    try {
      const data = enrichStaff(await getAvailableStaff({ slot }))
      setStaff(data)
      const preferred =
        clientSpecialization === 'all'
          ? data[0] ?? null
          : data.find((s) => s.specialization === clientSpecialization) ?? null
      setSelectedStaff(preferred)
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
      setSlots(data)

      const first = data[0] ?? null
      setSelectedSlot(first)
      setStaff([])
      setSelectedStaff(null)
      setStaffError('')
      setClientSpecialization('all')
      setBookingStatus('idle')
      setBookingMessage('')

      if (first) {
        const firstDate = new Date(first.slot)
        setSelectedDateYMD(toYMD(firstDate))
        setVisibleMonth(new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1)))
        void loadStaff(first.slot)
      } else {
        setSelectedDateYMD(null)
        setSelectedSlot(null)
      }
    } catch (cause) {
      console.error('[MeetingBookingPage] Failed to load slots', cause)
      setError(t.errorFallback)
      setSlots([])
      setSelectedSlot(null)
      setSelectedDateYMD(null)
      setStaff([])
      setStaffError('')
      setSelectedStaff(null)
      setBookingStatus('idle')
      setBookingMessage('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const handleBook = async () => {
    if (!selectedSlot || !selectedStaff) return
    setBookingStatus('loading')
    setBookingMessage('')
    try {
      const response = await bookMeeting({
        slot: selectedSlot.slot,
        staffId: selectedStaff.id,
        specialization: clientSpecialization === 'all' ? selectedStaff.specialization : clientSpecialization,
      })
      setBookingStatus('success')
      setBookingMessage(response.message ?? t.bookSuccess)
    } catch (cause) {
      console.error('[MeetingBookingPage] Failed to book meeting', cause)
      setBookingStatus('error')
      setBookingMessage(t.bookError)
    }
  }

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

      <section className="summary-strip card">
        <div className={`summary-step ${bookingStep === 'calendar' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">{t.stepCalendar}</span>
          <strong>{t.stepCalendarLabel}</strong>
        </div>
        <div className={`summary-step ${bookingStep === 'slot' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">{t.stepSlot}</span>
          <strong>{t.stepSlotLabel}</strong>
        </div>
        <div className={`summary-step ${bookingStep === 'details' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">{t.stepDetails}</span>
          <strong>{t.stepDetailsLabel}</strong>
        </div>
      </section>

      <section className="grid-section">
        <article className="card booking-card booking-card--calendar">
          <div className="section-head">
            <div>
              <h2 className="card__title">{t.availabilityTitle}</h2>
              <p className="card__subtitle">{t.selectDateHint}</p>
            </div>
            <span className="section-head__legend">
              {t.slotLegendAvailable} / {t.slotLegendUnavailable}
            </span>
          </div>

          <div className="calendar">
            <div className="calendar__header">
              <button
                type="button"
                className="calendar__nav"
                onClick={() => {
                  setVisibleMonth((cur) => new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - 1, 1)))
                }}
              >
                ‹
              </button>
              <div className="calendar__title">
                {monthTitleRu(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth())}
              </div>
              <button
                type="button"
                className="calendar__nav"
                onClick={() => {
                  setVisibleMonth((cur) => new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1)))
                }}
              >
                ›
              </button>
            </div>

            <div className="calendar__weekdays">
              {weekdayHeaderRu.map((d) => (
                <div key={d} className="calendar__weekday">
                  {d}
                </div>
              ))}
            </div>

            <div className="calendar__grid">
              {getMonthGrid(visibleMonth).days.map((d) => {
                const ymd = toYMD(d)
                const dayNum = d.getUTCDate()
                const isInMonth = d.getUTCMonth() === visibleMonth.getUTCMonth()
                const hasSlots = availableDatesSet.has(ymd)
                const isSelected = selectedDateYMD === ymd

                return (
                  <button
                    key={ymd}
                    type="button"
                    className={`calendar__day ${isInMonth ? '' : 'calendar__day--out'} ${isSelected ? 'calendar__day--selected' : ''} ${hasSlots ? 'calendar__day--has' : ''}`}
                    onClick={() => {
                      setSelectedDateYMD(ymd)
                      const first = slotsByDate.find((day) => day.date === ymd)?.slots[0]?.slot ?? null
                      if (first) {
                        const source = slots.find((s) => s.slot === first) ?? null
                        setSelectedSlot(source)
                        void loadStaff(first)
                      } else {
                        setSelectedSlot(null)
                        setStaff([])
                        setStaffError('')
                        setSelectedStaff(null)
                        setBookingStatus('idle')
                        setBookingMessage('')
                      }
                    }}
                    disabled={!hasSlots}
                    aria-label={`Day ${ymd}`}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="state-card state-card--loading">
                <p className="state-text">{t.loading}</p>
              </div>
            ) : error ? (
              <div className="state-card state-card--error">
                <p className="state-text state-text--error">{error}</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="state-card">
                <p className="state-text">{t.empty}</p>
              </div>
            ) : selectedDateYMD ? (
              <div className="slots-block">
                <div className="slots-block__head">
                  <div>
                    <h3 className="card__title card__title--small">{selectedDay?.dayLabel ?? t.dayLabel}</h3>
                    <p className="card__subtitle">{selectedDaySlots.length > 0 ? t.selectSlotHint : t.noSlots}</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setSelectedDateYMD(null)
                      setSelectedSlot(null)
                      setStaff([])
                      setStaffError('')
                      setSelectedStaff(null)
                      setBookingStatus('idle')
                      setBookingMessage('')
                    }}
                  >
                    {t.chooseAnotherDate}
                  </button>
                </div>

                <div className="slots-grid">
                  {selectedDaySlots.length > 0 ? (
                    selectedDaySlots.map((s) => {
                      const isSelected = selectedSlot?.slot === s.slot
                      const isAvailable = s.count > 0

                      return (
                        <button
                          key={s.slot}
                          type="button"
                          className={`slot-card ${isSelected ? 'slot-card--selected' : ''}`}
                          onClick={() => {
                        const source = slots.find((item) => item.slot === s.slot) ?? { slot: s.slot, count: s.count }
                        setSelectedSlot(source)
                        setSelectedStaff(null)
                        setBookingStatus('idle')
                        setBookingMessage('')
                        void loadStaff(s.slot)
                      }}
                        >
                          <span className="slot-card__time">{s.time}</span>
                          <span className={`slot-card__status ${isAvailable ? 'slot-card__status--available' : 'slot-card__status--busy'}`}>
                            {isAvailable ? `${t.slotLegendAvailable} (${s.count})` : t.notAvailable}
                          </span>
                          <span className="slot-card__meta">{isAvailable ? t.countLabel : t.unavailable}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="state-card state-card--muted">
                      <p className="state-text">{t.noSlots}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="state-card state-card--muted">
                <p className="state-text">{t.selectDateHint}</p>
              </div>
            )}
          </div>
        </article>

        <article className="card booking-card booking-card--details">
          <div className="summary-panel">
            <h2 className="card__title">{t.summaryTitle}</h2>
            {selectedSlot ? (
              <div className="summary-panel__content">
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedDate}</span>
                  <strong>{formatDayLabel(selectedSlot.slot)}</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedTime}</span>
                  <strong>{formatDateTime(selectedSlot.slot).split(', ')[1] ?? formatDateTime(selectedSlot.slot)}</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedCount}</span>
                  <strong>{selectedSlot.count}</strong>
                </div>
                {selectedStaff && (
                  <div className="summary-row">
                    <span className="summary-row__label">{t.summarySpecialist}</span>
                    <strong>{selectedStaff.name}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="state-text state-text--muted">{t.summaryEmpty}</p>
            )}
          </div>

          <div className="info-block">
            <div className="section-head section-head--stacked">
              <div>
                <h3 className="card__title card__title--small">{t.whoIsComing}</h3>
                <p className="card__subtitle">{t.selectSlotHint}</p>
              </div>
            </div>

            {loadingStaff ? (
              <div className="state-card state-card--loading">
                <p className="state-text">{t.loadingStaff}</p>
              </div>
            ) : staffError ? (
              <div className="state-card state-card--error">
                <p className="state-text state-text--error">{staffError}</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="state-card state-card--muted">
                <p className="state-text">{t.noStaff}</p>
              </div>
            ) : (
              <>
                <p className="card__subtitle">{t.specializationTitle}</p>
                <div className="chips chips--wrap">
                  <button
                    type="button"
                    className={`chip-button chip-button--ghost ${clientSpecialization === 'all' ? 'chip-button--selected' : ''}`}
                    onClick={() => {
                      setClientSpecialization('all')
                      setSelectedStaff(null)
                    }}
                  >
                    {t.specializationAny}
                  </button>
                  {specializationOptions
                    .filter((spec) => spec !== 'all')
                    .map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        className={`chip-button chip-button--ghost ${clientSpecialization === spec ? 'chip-button--selected' : ''}`}
                        onClick={() => {
                          setClientSpecialization(spec)
                          const candidate = staff.find((s) => s.specialization === spec) ?? null
                          setSelectedStaff(candidate)
                        }}
                      >
                        {spec}
                      </button>
                    ))}
                </div>

                <ul className="staff-grid">
                  {filteredStaff.map((s) => {
                    const isSelected = selectedStaff?.id === s.id
                    return (
                      <li
                        key={s.id}
                        className={`staff-card staff-card--selectable ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedStaff(s)
                          setBookingStatus('idle')
                          setBookingMessage('')
                        }}
                      >
                        <img className="staff-card__image" src={getImageUrl(s.image)} alt={s.name} loading="lazy" />
                        <div className="staff-card__body">
                          <strong className="staff-card__name">{s.name}</strong>
                          <p className="staff-card__meta">
                            {t.representativeAge}: {s.age}
                          </p>
                          <p className="staff-card__meta">{s.specialization}</p>
                          <p className="staff-card__description">{s.description}</p>
                        </div>
                      </li>
                    )
                  })}

                  {filteredStaff.length === 0 && (
                    <li className="state-card state-card--muted">
                      <p className="state-text">{t.noStaff}</p>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.placeTitle}</h3>
            <p className="state-text state-text--muted">{t.placeEmpty}</p>
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.documentsTitle}</h3>
            <p className="documents-section__text">{t.documentsDescription}</p>
            <ul className="chips chips--stacked">
              {documents.map((document) => (
                <li key={document} className="chips__item">
                  {document}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      {selectedSlot && selectedStaff && (
        <div className="booking-toast" role="status" aria-live="polite">
          <div className="booking-toast__info">
            <p className="booking-toast__title">{t.bookCta}</p>
            <p className="booking-toast__line">
              {formatDayLabel(selectedSlot.slot)} • {formatDateTime(selectedSlot.slot).split(', ')[1] ?? ''}
            </p>
            <p className="booking-toast__line">
              {selectedStaff.name} · {selectedStaff.specialization}
            </p>
            {bookingMessage && (
              <p className={`booking-toast__message ${bookingStatus === 'error' ? 'is-error' : 'is-success'}`}>
                {bookingMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            className="button button--primary booking-toast__action"
            onClick={() => void handleBook()}
            disabled={bookingStatus === 'loading'}
          >
            {bookingStatus === 'loading' ? 'Назначаем…' : t.bookCta}
          </button>
        </div>
      )}
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
