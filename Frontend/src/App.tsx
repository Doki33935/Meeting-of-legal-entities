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
    badge: 'Назначение встречи',
    title: 'Запланируйте встречу для юридического лица',
    description:
      'Выберите дату, время, цель встречи и представителя. Время отображается по Москве (UTC+3).',
    primaryAction: 'Обновить слоты',
    loading: 'Загружаем доступные слоты...',
    errorFallback: 'Не удалось загрузить данные.',
    empty: 'Доступных слотов пока нет.',
    availabilityTitle: 'Доступность по датам',
    slotLegendAvailable: 'Свободно',
    slotLegendUnavailable: 'Занято',
    dayLabel: 'Дата',
    countLabel: 'Свободных специалистов',
    notAvailable: 'Нет мест',
    placeTitle: 'Место встречи',
    placeEmpty: 'Адрес встречи будет уточнён после бронирования.',
    stepCalendar: 'Шаг 1',
    stepSlot: 'Шаг 2',
    stepDetails: 'Шаг 3',
    stepCalendarLabel: 'Выберите дату',
    stepSlotLabel: 'Выберите время',
    stepDetailsLabel: 'Причина и представитель',
    summaryTitle: 'Сводка встречи',
    summaryEmpty: 'Выберите дату и время встречи.',
    selectedDate: 'Выбранная дата',
    selectedTime: 'Выбранное время',
    selectedCount: 'Свободно представителей',
    loadingStaff: 'Загружаем представителей...',
    noStaff: 'На выбранное время никто не доступен.',
    selectDateHint: 'Сначала выберите дату с доступными слотами.',
    selectSlotHint: 'Теперь выберите удобное время.',
    noSlots: 'На эту дату нет доступных слотов.',
    whoIsComing: 'Кто приедет',
    representativeAge: 'Возраст',
    chooseAnotherDate: 'Выбрать другую дату',
    unavailable: 'Недоступно',
    specializationTitle: 'Специализация',
    specializationAny: 'Все специализации',
    summarySpecialist: 'Выбранный специалист',
    selectSpecialist: 'Выберите специалиста',
    timezoneHint: 'Показываем время по Москве (UTC+3)',
    reasonTitle: 'Цель встречи',
    reasonPlaceholder: 'Кратко опишите цель встречи',
    scrollToDetails: '+ Цель встречи и специалисты',
    documentsTitle: 'Какие документы подготовить',
    documentsDescription: 'Список меняется в зависимости от выбранной цели встречи.',
    bookCta: 'Назначить встречу',
    bookingInProgress: 'Назначаем...',
    bookSuccess: 'Встреча успешно забронирована',
    bookError: 'Не удалось назначить встречу. Попробуйте позже.',
    availableScale: 'Цвет слота: зелёный — много, жёлтый — средне, красный — мало.',
  },
  en: {
    brand: 'Legal Entity Meetings',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    languageRu: 'Russian',
    languageEn: 'English',
    badge: 'Meeting booking',
    title: 'Schedule a meeting for a legal entity',
    description:
      'Pick date, time, meeting purpose and representative. Time is shown in Moscow timezone (UTC+3).',
    primaryAction: 'Reload slots',
    loading: 'Loading available slots...',
    errorFallback: 'Failed to load data.',
    empty: 'No available slots.',
    availabilityTitle: 'Availability by date',
    slotLegendAvailable: 'Available',
    slotLegendUnavailable: 'Busy',
    dayLabel: 'Date',
    countLabel: 'Free specialists',
    notAvailable: 'No seats',
    placeTitle: 'Meeting place',
    placeEmpty: 'Address will be confirmed after booking.',
    stepCalendar: 'Step 1',
    stepSlot: 'Step 2',
    stepDetails: 'Step 3',
    stepCalendarLabel: 'Pick a date',
    stepSlotLabel: 'Pick a time',
    stepDetailsLabel: 'Reason and specialist',
    summaryTitle: 'Meeting summary',
    summaryEmpty: 'Pick date and time first.',
    selectedDate: 'Selected date',
    selectedTime: 'Selected time',
    selectedCount: 'Free specialists',
    loadingStaff: 'Loading representatives...',
    noStaff: 'No one is available for this time.',
    selectDateHint: 'Start by selecting a date with free slots.',
    selectSlotHint: 'Now select a suitable time.',
    noSlots: 'No slots for this date.',
    whoIsComing: 'Who is coming',
    representativeAge: 'Age',
    chooseAnotherDate: 'Choose another date',
    unavailable: 'Unavailable',
    specializationTitle: 'Specialization',
    specializationAny: 'All specializations',
    summarySpecialist: 'Chosen specialist',
    selectSpecialist: 'Select a specialist',
    timezoneHint: 'Time is shown in Moscow timezone (UTC+3)',
    reasonTitle: 'Meeting purpose',
    reasonPlaceholder: 'Describe purpose briefly',
    scrollToDetails: '+ Purpose and specialists',
    documentsTitle: 'Documents to prepare',
    documentsDescription: 'The list adapts to selected meeting purpose.',
    bookCta: 'Book meeting',
    bookingInProgress: 'Booking...',
    bookSuccess: 'Meeting booked successfully',
    bookError: 'Could not book the meeting. Try again later.',
    availableScale: 'Slot color: green — many, yellow — medium, red — low.',
  },
} as const

const reasons = {
  ru: [
    'Открытие расчётного счёта',
    'Подключение эквайринга',
    'Изменение данных компании',
    'Консультация по тарифу',
  ],
  en: [
    'Open business account',
    'Enable acquiring',
    'Company data changes',
    'Tariff consultation',
  ],
} as const

const documentsByReason: Record<string, string[]> = {
  'Открытие расчётного счёта': [
    'Паспорт представителя компании',
    'ИНН и ОГРН',
    'Устав или учредительные документы',
    'Доверенность, если подписант не директор',
  ],
  'Подключение эквайринга': [
    'Паспорт представителя',
    'Реквизиты расчётного счёта',
    'Договор аренды или адрес торговой точки',
    'Описание бизнес-модели',
  ],
  'Изменение данных компании': [
    'Паспорт представителя',
    'Документы-основания изменения',
    'Новая карточка организации',
    'Доверенность (если требуется)',
  ],
  'Консультация по тарифу': [
    'Паспорт представителя',
    'Текущий договор обслуживания',
    'Список ожидаемых операций',
  ],
}

const fallbackDocumentsRu = [
  'Паспорт представителя компании',
  'ИНН и регистрационные данные',
  'Учредительные документы',
]

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

function avatarFallback(name: string) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='54%' text-anchor='middle' font-size='44' font-family='Arial,sans-serif' fill='#374151'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
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

function getImageUrl(path: string) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL ?? ''}${path}`
}

function enrichStaff(data: StaffDto[]) {
  return data.map((staff) => ({
    ...staff,
    specialization: staff.specialization ?? staffSpecializationMap[staff.name] ?? 'Корпоративное право',
  }))
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

  return { year, month, days }
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

function slotAvailabilityClass(count: number) {
  if (count <= 1) return 'slot-card--low'
  if (count <= 3) return 'slot-card--medium'
  return 'slot-card--high'
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
  const [clientSpecialization, setClientSpecialization] = useState('all')
  const [bookingReason, setBookingReason] = useState<string>(reasons[defaultLocale][0])
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

  const specializationOptions = useMemo(
    () => ['all', ...new Set(staff.map((person) => person.specialization ?? 'Корпоративное право'))],
    [staff],
  )

  const filteredStaff = useMemo(
    () => (clientSpecialization === 'all' ? staff : staff.filter((person) => person.specialization === clientSpecialization)),
    [clientSpecialization, staff],
  )

  const documents = useMemo(() => {
    if (locale === 'en') return fallbackDocumentsRu
    return documentsByReason[bookingReason] ?? fallbackDocumentsRu
  }, [bookingReason, locale])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setBookingReason(reasons[locale][0])
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
        setSelectedDateYMD(toMoscowYMD(firstDate))
        setVisibleMonth(new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1)))
        await loadStaff(first.slot)
      } else {
        setSelectedDateYMD(null)
      }
    } catch (cause) {
      console.error('[MeetingBookingPage] loadSlots failed', cause)
      setError(t.errorFallback)
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

  const handleSlotSelect = async (slot: string, count: number) => {
    setSelectedSlot({ slot, count })
    await loadStaff(slot)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBook = async () => {
    if (!selectedSlot || !selectedStaff || !bookingReason.trim()) return
    setBookingStatus('loading')
    setBookingMessage('')
    try {
      const response = await bookMeeting({
        staffId: selectedStaff.id,
        appointmentTime: selectedSlot.slot,
        reason: bookingReason.trim(),
      })
      setBookingStatus('success')
      setBookingMessage(response.message ?? t.bookSuccess)
    } catch (cause) {
      console.error('[MeetingBookingPage] booking failed', cause)
      setBookingStatus('error')
      setBookingMessage(t.bookError)
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
              <p className="card__subtitle">{t.timezoneHint}</p>
            </div>
            <span className="section-head__legend">{t.availableScale}</span>
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
                      const first = slotsByDate.find((day) => day.date === ymd)?.slots[0] ?? null
                      if (!first) return
                      void handleSlotSelect(first.slot, first.count)
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
                      setSelectedStaff(null)
                    }}
                  >
                    {t.chooseAnotherDate}
                  </button>
                </div>

                <div className="slots-grid">
                  {selectedDaySlots.length > 0 ? (
                    selectedDaySlots.map((slot) => {
                      const isSelected = selectedSlot?.slot === slot.slot
                      const isAvailable = slot.count > 0
                      return (
                        <button
                          key={slot.slot}
                          type="button"
                          className={`slot-card ${slotAvailabilityClass(slot.count)} ${isSelected ? 'slot-card--selected' : ''}`}
                          onClick={() => void handleSlotSelect(slot.slot, slot.count)}
                          disabled={!isAvailable}
                        >
                          <span className="slot-card__time">{slot.time}</span>
                          <span className={`slot-card__status ${isAvailable ? 'slot-card__status--available' : 'slot-card__status--busy'}`}>
                            {isAvailable ? `${t.slotLegendAvailable} (${slot.count})` : t.notAvailable}
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

                {selectedSlot && (
                  <button
                    type="button"
                    className="text-button scroll-cta"
                    onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    {t.scrollToDetails}
                  </button>
                )}
              </div>
            ) : (
              <div className="state-card state-card--muted">
                <p className="state-text">{t.selectDateHint}</p>
              </div>
            )}
          </div>
        </article>

        <article className="card booking-card booking-card--details" ref={detailsRef}>
          <div className="summary-panel">
            <h2 className="card__title">{t.summaryTitle}</h2>
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
            <h3 className="card__title card__title--small">{t.reasonTitle}</h3>
            <select className="reason-select" value={bookingReason} onChange={(event) => setBookingReason(event.target.value)}>
              {reasons[locale].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <textarea
              className="reason-textarea"
              value={bookingReason}
              onChange={(event) => setBookingReason(event.target.value)}
              placeholder={t.reasonPlaceholder}
              rows={3}
            />
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.whoIsComing}</h3>
            <p className="card__subtitle">{t.selectSpecialist}</p>

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
                      setSelectedStaff(filteredStaff[0] ?? null)
                    }}
                  >
                    {t.specializationAny}
                  </button>
                  {specializationOptions
                    .filter((specialization) => specialization !== 'all')
                    .map((specialization) => (
                      <button
                        key={specialization}
                        type="button"
                        className={`chip-button chip-button--ghost ${clientSpecialization === specialization ? 'chip-button--selected' : ''}`}
                        onClick={() => {
                          setClientSpecialization(specialization)
                          setSelectedStaff(staff.find((person) => person.specialization === specialization) ?? null)
                        }}
                      >
                        {specialization}
                      </button>
                    ))}
                </div>

                <ul className="staff-grid">
                  {filteredStaff.map((person) => {
                    const selected = selectedStaff?.id === person.id
                    return (
                      <li
                        key={person.id}
                        className={`staff-card staff-card--selectable ${selected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedStaff(person)}
                      >
                        <img
                          className="staff-card__image"
                          src={getImageUrl(person.image)}
                          alt={person.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = avatarFallback(person.name)
                          }}
                        />
                        <div className="staff-card__body">
                          <strong className="staff-card__name">{person.name}</strong>
                          <p className="staff-card__meta">
                            {t.representativeAge}: {person.age}
                          </p>
                          <p className="staff-card__meta">{person.specialization}</p>
                          <p className="staff-card__description">{person.description}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
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

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.placeTitle}</h3>
            <p className="state-text state-text--muted">{t.placeEmpty}</p>
          </div>
        </article>
      </section>

      {selectedSlot && selectedStaff && (
        <div className="booking-toast" role="status" aria-live="polite">
          <div className="booking-toast__info">
            <p className="booking-toast__title">{t.bookCta}</p>
            <p className="booking-toast__line">
              {formatDayLabel(selectedSlot.slot, locale)} • {formatTime(selectedSlot.slot, locale)}
            </p>
            <p className="booking-toast__line">
              {selectedStaff.name} · {selectedStaff.specialization}
            </p>
            <p className="booking-toast__line">{bookingReason}</p>
            {bookingMessage && (
              <p className={`booking-toast__message ${bookingStatus === 'error' ? 'is-error' : 'is-success'}`}>{bookingMessage}</p>
            )}
          </div>
          <button
            type="button"
            className="button button--primary booking-toast__action"
            onClick={() => void handleBook()}
            disabled={bookingStatus === 'loading' || !bookingReason.trim()}
          >
            {bookingStatus === 'loading' ? t.bookingInProgress : t.bookCta}
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
