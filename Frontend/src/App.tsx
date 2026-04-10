import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { bookMeeting, getAvailableStaff, getMeetingSlots } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { StaffDto, StartDaySlot, StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'
type BookingStep = 'calendar' | 'slot' | 'details'

const MOSCOW_TZ = 'Europe/Moscow'
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const defaultLocale = (import.meta.env.VITE_DEFAULT_LANGUAGE === 'en' ? 'en' : 'ru') as Locale

const copy = {
  ru: {
    brand: 'Встречи для юрлиц',
    themeLight: 'Светлая тема',
    themeDark: 'Тёмная тема',
    languageRu: 'Русский',
    languageEn: 'English',
    title: 'Назначение встречи с представителем',
    description: 'Выберите дату, время, цель встречи и специалиста. Время на экране: Москва (UTC+3).',
    reload: 'Обновить слоты',
    loading: 'Загружаем расписание...',
    loadError: 'Не удалось загрузить данные.',
    empty: 'Свободных слотов нет.',
    availability: 'Доступные слоты',
    noSlotsForDay: 'На эту дату слотов нет.',
    chooseDate: 'Сначала выберите дату.',
    chooseTime: 'Теперь выберите время.',
    chooseAnotherDate: 'Выбрать другую дату',
    step1: 'Шаг 1: дата',
    step2: 'Шаг 2: время',
    step3: 'Шаг 3: детали',
    summary: 'Сводка',
    selectedDate: 'Дата',
    selectedTime: 'Время',
    selectedCount: 'Свободно специалистов',
    selectedSpecialist: 'Специалист',
    whoIsComing: 'Кто приедет',
    noStaff: 'На это время нет свободных сотрудников.',
    loadingStaff: 'Загружаем сотрудников...',
    age: 'Возраст',
    specialization: 'Специализация',
    allSpecializations: 'Все специализации',
    reason: 'Цель встречи',
    docsTitle: 'Документы по выбранной цели',
    docsHint: 'Подготовьте документы заранее, чтобы встреча прошла быстрее.',
    placeTitle: 'Место встречи',
    placeText: 'Адрес подтверждается после бронирования.',
    book: 'Назначить встречу',
    booking: 'Назначаем...',
    booked: 'Встреча успешно забронирована.',
    bookingError: 'Не удалось назначить встречу.',
    jumpToDetails: 'Перейти к выбору специалиста',
  },
  en: {
    brand: 'Business Meetings',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    languageRu: 'Russian',
    languageEn: 'English',
    title: 'Schedule a meeting with representative',
    description: 'Pick date, time, meeting purpose and specialist. Time shown in Moscow timezone (UTC+3).',
    reload: 'Reload slots',
    loading: 'Loading timetable...',
    loadError: 'Failed to load data.',
    empty: 'No free slots.',
    availability: 'Available slots',
    noSlotsForDay: 'No slots for this date.',
    chooseDate: 'Choose date first.',
    chooseTime: 'Now choose time.',
    chooseAnotherDate: 'Choose another date',
    step1: 'Step 1: date',
    step2: 'Step 2: time',
    step3: 'Step 3: details',
    summary: 'Summary',
    selectedDate: 'Date',
    selectedTime: 'Time',
    selectedCount: 'Free specialists',
    selectedSpecialist: 'Specialist',
    whoIsComing: 'Available specialists',
    noStaff: 'No available specialists for this time.',
    loadingStaff: 'Loading specialists...',
    age: 'Age',
    specialization: 'Specialization',
    allSpecializations: 'All specializations',
    reason: 'Meeting purpose',
    docsTitle: 'Documents for selected purpose',
    docsHint: 'Prepare documents in advance to speed up the meeting.',
    placeTitle: 'Meeting place',
    placeText: 'Address is confirmed after booking.',
    book: 'Book meeting',
    booking: 'Booking...',
    booked: 'Meeting booked successfully.',
    bookingError: 'Could not book meeting.',
    jumpToDetails: 'Go to specialist selection',
  },
} as const

const reasonOptions = {
  ru: [
    'Открытие расчётного счёта',
    'Подключение эквайринга',
    'Изменение данных компании',
    'Консультация по тарифу',
  ],
  en: ['Open account', 'Enable acquiring', 'Company data changes', 'Tariff consultation'],
} as const

const docsByReasonRu: Record<string, string[]> = {
  'Открытие расчётного счёта': [
    'Паспорт представителя компании',
    'ИНН и ОГРН',
    'Учредительные документы',
    'Доверенность (если подписант не директор)',
  ],
  'Подключение эквайринга': [
    'Паспорт представителя компании',
    'Реквизиты расчётного счёта',
    'Данные по торговой точке',
  ],
  'Изменение данных компании': [
    'Паспорт представителя компании',
    'Документы-основания изменений',
    'Актуальная карточка организации',
  ],
  'Консультация по тарифу': ['Паспорт представителя компании', 'Текущий договор', 'Список ожидаемых операций'],
}

const fallbackDocsRu = ['Паспорт представителя компании', 'ИНН', 'Учредительные документы']

const staffSpecializationMap: Record<string, string> = {
  'Alice Johnson': 'Корпоративное право',
  'Bob Smith': 'Налоги и бухгалтерия',
  'Charlie Brown': 'Помощник юриста',
  'Diana Prince': 'Договорное право',
  'Ethan Hunt': 'Риск-менеджмент',
  'Fiona Gallagher': 'HR и трудовое право',
  'George Martin': 'Стратегическое консультирование',
  'Hannah Lee': 'Сопровождение сделок',
  'Ivan Petrov': 'Комплаенс',
  'Julia Roberts': 'Бизнес-консалтинг',
}

function toMoscowYMD(input: string | Date) {
  const date = typeof input === 'string' ? new Date(input) : input
  return new Intl.DateTimeFormat('en-CA', { timeZone: MOSCOW_TZ }).format(date)
}

function formatDayLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: MOSCOW_TZ,
  }).format(new Date(value))
}

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TZ,
  }).format(new Date(value))
}

function monthTitle(year: number, monthIndex0: number, locale: Locale) {
  const date = new Date(Date.UTC(year, monthIndex0, 1))
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: MOSCOW_TZ,
  }).format(date)
}

function getMonthGrid(anchor: Date) {
  const year = anchor.getUTCFullYear()
  const month = anchor.getUTCMonth()
  const firstOfMonth = new Date(Date.UTC(year, month, 1))
  const firstDowMon0 = (firstOfMonth.getUTCDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDowMon0)

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart)
    day.setUTCDate(gridStart.getUTCDate() + i)
    days.push(day)
  }

  return { days }
}

function getImageUrl(path: string) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL ?? ''}${path}`
}

function avatarFallback(name: string) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='54%' text-anchor='middle' font-size='44' font-family='Arial,sans-serif' fill='#374151'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function slotAvailabilityClass(count: number) {
  if (count <= 1) return 'slot-card--low'
  if (count <= 3) return 'slot-card--medium'
  return 'slot-card--high'
}

function enrichStaff(data: StaffDto[]) {
  return data.map((staff) => ({
    ...staff,
    specialization: staff.specialization ?? staffSpecializationMap[staff.name] ?? 'Корпоративное право',
  }))
}

function groupSlotsByDate(slots: StartSlotDto[], locale: Locale): StartDaySlot[] {
  const grouped = new Map<string, StartDaySlot>()

  slots.forEach((slot) => {
    const key = toMoscowYMD(slot.slot)
    const current = grouped.get(key)
    const time = formatTime(slot.slot, locale)

    if (!current) {
      grouped.set(key, {
        date: key,
        dayLabel: formatDayLabel(slot.slot, locale),
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
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [specialization, setSpecialization] = useState('all')
  const [reason, setReason] = useState<string>(reasonOptions[defaultLocale][0])
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bookingMessage, setBookingMessage] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  })
  const [selectedDateYMD, setSelectedDateYMD] = useState<string | null>(null)

  const detailsRef = useRef<HTMLElement | null>(null)
  const t = copy[locale]
  const weekdayHeader = locale === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const slotsByDate = useMemo(() => groupSlotsByDate(slots, locale), [slots, locale])
  const availableDatesSet = useMemo(() => new Set(slots.map((slot) => toMoscowYMD(slot.slot))), [slots])
  const selectedDay = useMemo(
    () => (selectedDateYMD ? slotsByDate.find((day) => day.date === selectedDateYMD) ?? null : null),
    [selectedDateYMD, slotsByDate],
  )
  const selectedDaySlots = selectedDay?.slots ?? []
  const bookingStep: BookingStep = !selectedDateYMD ? 'calendar' : !selectedSlot ? 'slot' : 'details'

  const docs = useMemo(() => {
    if (locale === 'en') return fallbackDocsRu
    return docsByReasonRu[reason] ?? fallbackDocsRu
  }, [locale, reason])

  const specializationOptions = useMemo(
    () => ['all', ...new Set(staff.map((item) => item.specialization ?? 'Корпоративное право'))],
    [staff],
  )

  const filteredStaff = useMemo(
    () => (specialization === 'all' ? staff : staff.filter((item) => item.specialization === specialization)),
    [specialization, staff],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setReason(reasonOptions[locale][0])
  }, [locale])

  const loadStaff = async (slot: string) => {
    setLoadingStaff(true)
    setStaffError('')
    setSelectedStaff(null)
    setBookingStatus('idle')
    setBookingMessage('')

    try {
      const result = enrichStaff(await getAvailableStaff({ slot }))
      setStaff(result)
      setSelectedStaff(result[0] ?? null)
    } catch (cause) {
      console.error('[MeetingBookingPage] loadStaff failed', cause)
      setStaffError(t.loadError)
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
      setSpecialization('all')
      setBookingStatus('idle')
      setBookingMessage('')

      if (first) {
        const firstDate = new Date(first.slot)
        setSelectedDateYMD(toMoscowYMD(firstDate))
        setVisibleMonth(new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1)))
        await loadStaff(first.slot)
      } else {
        setSelectedDateYMD(null)
      }
    } catch (cause) {
      console.error('[MeetingBookingPage] loadSlots failed', cause)
      setError(t.loadError)
      setSlots([])
      setSelectedSlot(null)
      setSelectedDateYMD(null)
      setStaff([])
      setSelectedStaff(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const selectSlot = async (slot: string, count: number) => {
    setSelectedSlot({ slot, count })
    await loadStaff(slot)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBook = async () => {
    if (!selectedSlot || !selectedStaff) return

    setBookingStatus('loading')
    setBookingMessage('')
    try {
      const response = await bookMeeting({
        staffId: selectedStaff.id,
        appointmentTime: selectedSlot.slot,
        reason,
      })
      setBookingStatus('success')
      setBookingMessage(response.message ?? t.booked)
    } catch (cause) {
      console.error('[MeetingBookingPage] book failed', cause)
      setBookingStatus('error')
      setBookingMessage(t.bookingError)
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <p className="topbar__brand">{t.brand}</p>
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
        <h1 className="hero-section__title">{t.title}</h1>
        <p className="hero-section__description">{t.description}</p>
        <div className="hero-section__actions">
          <button type="button" className="button button--primary" onClick={() => void loadSlots()}>
            {t.reload}
          </button>
        </div>
      </section>

      <section className="summary-strip card">
        <div className={`summary-step ${bookingStep === 'calendar' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">1</span>
          <strong>{t.step1}</strong>
        </div>
        <div className={`summary-step ${bookingStep === 'slot' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">2</span>
          <strong>{t.step2}</strong>
        </div>
        <div className={`summary-step ${bookingStep === 'details' ? 'summary-step--active' : ''}`}>
          <span className="summary-step__badge">3</span>
          <strong>{t.step3}</strong>
        </div>
      </section>

      <section className="grid-section">
        <article className="card booking-card booking-card--calendar">
          <div className="section-head">
            <h2 className="card__title">{t.availability}</h2>
            <span className="section-head__legend">UTC backend / Moscow UI</span>
          </div>

          <div className="calendar">
            <div className="calendar__header">
              <button
                type="button"
                className="calendar__nav"
                onClick={() =>
                  setVisibleMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)))
                }
              >
                ‹
              </button>
              <div className="calendar__title">{monthTitle(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), locale)}</div>
              <button
                type="button"
                className="calendar__nav"
                onClick={() =>
                  setVisibleMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)))
                }
              >
                ›
              </button>
            </div>

            <div className="calendar__weekdays">
              {weekdayHeader.map((day) => (
                <div key={day} className="calendar__weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar__grid">
              {getMonthGrid(visibleMonth).days.map((date) => {
                const ymd = toMoscowYMD(date)
                const dayNum = date.getUTCDate()
                const isInMonth = date.getUTCMonth() === visibleMonth.getUTCMonth()
                const hasSlots = availableDatesSet.has(ymd)
                const isSelected = selectedDateYMD === ymd

                return (
                  <button
                    key={ymd}
                    type="button"
                    className={`calendar__day ${isInMonth ? '' : 'calendar__day--out'} ${isSelected ? 'calendar__day--selected' : ''} ${hasSlots ? 'calendar__day--has' : ''}`}
                    onClick={() => {
                      setSelectedDateYMD(ymd)
                      const first = slotsByDate.find((day) => day.date === ymd)?.slots[0]
                      if (first) void selectSlot(first.slot, first.count)
                    }}
                    disabled={!hasSlots}
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
                    <h3 className="card__title card__title--small">{selectedDay?.dayLabel}</h3>
                    <p className="card__subtitle">{selectedDaySlots.length ? t.chooseTime : t.noSlotsForDay}</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setSelectedDateYMD(null)
                      setSelectedSlot(null)
                      setStaff([])
                      setSelectedStaff(null)
                    }}
                  >
                    {t.chooseAnotherDate}
                  </button>
                </div>

                <div className="slots-grid">
                  {selectedDaySlots.map((slot) => {
                    const selected = selectedSlot?.slot === slot.slot
                    return (
                      <button
                        key={slot.slot}
                        type="button"
                        className={`slot-card ${slotAvailabilityClass(slot.count)} ${selected ? 'slot-card--selected' : ''}`}
                        onClick={() => void selectSlot(slot.slot, slot.count)}
                        disabled={slot.count <= 0}
                      >
                        <span className="slot-card__time">{slot.time}</span>
                        <span className="slot-card__status">{`${slot.count} / ${t.selectedCount}`}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedSlot && (
                  <button
                    type="button"
                    className="text-button scroll-cta"
                    onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    {t.jumpToDetails}
                  </button>
                )}
              </div>
            ) : (
              <div className="state-card state-card--muted">
                <p className="state-text">{t.chooseDate}</p>
              </div>
            )}
          </div>
        </article>

        <article className="card booking-card booking-card--details" ref={detailsRef}>
          <div className="summary-panel">
            <h2 className="card__title">{t.summary}</h2>
            {selectedSlot ? (
              <div className="summary-panel__content">
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedDate}</span>
                  <strong>{formatDayLabel(selectedSlot.slot, locale)}</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedTime}</span>
                  <strong>{formatTime(selectedSlot.slot, locale)}</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{t.selectedCount}</span>
                  <strong>{selectedSlot.count}</strong>
                </div>
                {selectedStaff && (
                  <div className="summary-row">
                    <span className="summary-row__label">{t.selectedSpecialist}</span>
                    <strong>{selectedStaff.name}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="state-text">{t.chooseDate}</p>
            )}
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.reason}</h3>
            <select className="reason-select" value={reason} onChange={(event) => setReason(event.target.value)}>
              {reasonOptions[locale].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.docsTitle}</h3>
            <p className="documents-section__text">{t.docsHint}</p>
            <ul className="chips chips--stacked">
              {docs.map((document) => (
                <li key={document} className="chips__item">
                  {document}
                </li>
              ))}
            </ul>
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.whoIsComing}</h3>
            {loadingStaff ? (
              <div className="state-card state-card--loading">
                <p className="state-text">{t.loadingStaff}</p>
              </div>
            ) : staffError ? (
              <div className="state-card state-card--error">
                <p className="state-text state-text--error">{staffError}</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="state-card state-card--muted">
                <p className="state-text">{t.noStaff}</p>
              </div>
            ) : (
              <>
                <p className="card__subtitle">{t.specialization}</p>
                <div className="chips chips--wrap">
                  <button
                    type="button"
                    className={`chip-button chip-button--ghost ${specialization === 'all' ? 'chip-button--selected' : ''}`}
                    onClick={() => {
                      setSpecialization('all')
                      setSelectedStaff(staff[0] ?? null)
                    }}
                  >
                    {t.allSpecializations}
                  </button>
                  {specializationOptions
                    .filter((item) => item !== 'all')
                    .map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`chip-button chip-button--ghost ${specialization === item ? 'chip-button--selected' : ''}`}
                        onClick={() => {
                          setSpecialization(item)
                          setSelectedStaff(staff.find((s) => s.specialization === item) ?? null)
                        }}
                      >
                        {item}
                      </button>
                    ))}
                </div>

                <ul className="staff-grid">
                  {filteredStaff.map((item) => {
                    const selected = selectedStaff?.id === item.id
                    return (
                      <li
                        key={item.id}
                        className={`staff-card staff-card--selectable ${selected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedStaff(item)}
                      >
                        <img
                          className="staff-card__image"
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = avatarFallback(item.name)
                          }}
                        />
                        <div className="staff-card__body">
                          <strong className="staff-card__name">{item.name}</strong>
                          <p className="staff-card__meta">
                            {t.age}: {item.age}
                          </p>
                          <p className="staff-card__meta">{item.specialization}</p>
                          <p className="staff-card__description">{item.description}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.placeTitle}</h3>
            <p className="state-text state-text--muted">{t.placeText}</p>
          </div>
        </article>
      </section>

      {selectedSlot && selectedStaff && (
        <div className="booking-toast" role="status" aria-live="polite">
          <div className="booking-toast__info">
            <p className="booking-toast__title">{t.book}</p>
            <p className="booking-toast__line">
              {formatDayLabel(selectedSlot.slot, locale)} • {formatTime(selectedSlot.slot, locale)}
            </p>
            <p className="booking-toast__line">
              {selectedStaff.name} • {reason}
            </p>
            {bookingMessage && (
              <p className={`booking-toast__message ${bookingStatus === 'error' ? 'is-error' : 'is-success'}`}>{bookingMessage}</p>
            )}
          </div>
          <button
            type="button"
            className="button button--primary booking-toast__action"
            onClick={() => void handleBook()}
            disabled={bookingStatus === 'loading'}
          >
            {bookingStatus === 'loading' ? t.booking : t.book}
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
