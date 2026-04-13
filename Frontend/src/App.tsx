import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { bookMeeting, getAvailableStaff, getMeetingData } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { AppointmentDto, StaffDto, StartDaySlot, StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'

const MOSCOW_TZ = 'Europe/Moscow'
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const defaultLocale = (import.meta.env.VITE_DEFAULT_LANGUAGE === 'en' ? 'en' : 'ru') as Locale
const LOCAL_APPOINTMENTS_KEY = 'meeting-local-appointments-v1'
const LOCAL_TOKEN_KEY = 'meeting-last-token-v1'

const text = {
  ru: {
    brand: 'Встречи для юрлиц',
    title: 'Назначение встречи',
    subtitle: 'Выберите дату, время, причину и специалиста. Время показывается по Москве (UTC+3).',
    refresh: 'Обновить слоты',
    loading: 'Загружаем доступные даты...',
    loadError: 'Не удалось загрузить данные.',
    chooseDate: 'Выберите дату',
    chooseTime: 'Выберите время',
    noSlotsForDate: 'На эту дату свободных слотов нет.',
    reason: 'Причина встречи',
    docs: 'Документы',
    docsHint: 'Список документов обновляется автоматически по выбранной причине.',
    specialists: 'Специалисты',
    noStaff: 'На это время нет свободных специалистов.',
    loadingStaff: 'Загружаем специалистов...',
    age: 'Возраст',
    allSpecs: 'Все специализации',
    summary: 'Сводка',
    date: 'Дата',
    time: 'Время',
    free: 'Свободно специалистов',
    selectedSpecialist: 'Выбранный специалист',
    place: 'Место встречи',
    placeValue: 'Адрес уточняется после подтверждения встречи',
    book: 'Назначить встречу',
    booking: 'Назначаем...',
    bookError: 'Не удалось назначить встречу',
    booked: 'Встреча назначена',
    appointments: 'У вас назначены встречи',
    appointmentsEmpty: 'Пока нет назначенных встреч.',
    when: 'Когда',
    where: 'Где',
    why: 'Причина',
    whatTake: 'Что взять',
    toDetails: 'Перейти к выбору специалиста',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    cookieIssue:
      'Backend выставляет Secure-cookie. На HTTP она не сохраняется в браузере, поэтому история встреч может не совпадать между перезагрузками.',
  },
  en: {
    brand: 'Business meetings',
    title: 'Book a meeting',
    subtitle: 'Pick date, time, reason and specialist. Time is shown in Moscow timezone (UTC+3).',
    refresh: 'Refresh slots',
    loading: 'Loading available dates...',
    loadError: 'Failed to load data.',
    chooseDate: 'Choose date',
    chooseTime: 'Choose time',
    noSlotsForDate: 'No free slots for this date.',
    reason: 'Meeting reason',
    docs: 'Documents',
    docsHint: 'Documents list updates automatically for selected reason.',
    specialists: 'Specialists',
    noStaff: 'No specialists available for this time.',
    loadingStaff: 'Loading specialists...',
    age: 'Age',
    allSpecs: 'All specializations',
    summary: 'Summary',
    date: 'Date',
    time: 'Time',
    free: 'Free specialists',
    selectedSpecialist: 'Selected specialist',
    place: 'Meeting place',
    placeValue: 'Address is confirmed after booking',
    book: 'Book meeting',
    booking: 'Booking...',
    bookError: 'Failed to book meeting',
    booked: 'Meeting booked',
    appointments: 'Your booked meetings',
    appointmentsEmpty: 'No booked meetings yet.',
    when: 'When',
    where: 'Where',
    why: 'Reason',
    whatTake: 'What to take',
    toDetails: 'Go to specialist section',
    themeLight: 'Light',
    themeDark: 'Dark',
    cookieIssue:
      'Backend sets Secure cookie. On HTTP it is not persisted by browser, so meeting history can differ after page reload.',
  },
} as const

const reasonOptions = {
  ru: ['Открытие расчётного счёта', 'Подключение эквайринга', 'Изменение данных компании', 'Консультация по тарифу'],
  en: ['Open account', 'Enable acquiring', 'Company data changes', 'Tariff consultation'],
} as const

const docsByReason: Record<string, string[]> = {
  'Открытие расчётного счёта': ['Паспорт', 'ИНН / ОГРН', 'Учредительные документы'],
  'Подключение эквайринга': ['Паспорт', 'Реквизиты счёта', 'Данные по торговой точке'],
  'Изменение данных компании': ['Паспорт', 'Документы-основания', 'Новая карточка организации'],
  'Консультация по тарифу': ['Паспорт', 'Текущий договор', 'Список операций'],
  'Open account': ['Passport', 'Tax IDs', 'Incorporation documents'],
  'Enable acquiring': ['Passport', 'Account details', 'Merchant location data'],
  'Company data changes': ['Passport', 'Change documents', 'Updated company card'],
  'Tariff consultation': ['Passport', 'Current agreement', 'Operations list'],
}

const staffRuNames: Record<string, string> = {
  'Alice Johnson': 'Алиса Джонсон',
  'Bob Smith': 'Боб Смит',
  'Charlie Brown': 'Чарли Браун',
  'Diana Prince': 'Диана Принс',
  'Ethan Hunt': 'Итан Хант',
  'Fiona Gallagher': 'Фиона Галлахер',
  'George Martin': 'Джордж Мартин',
  'Hannah Lee': 'Ханна Ли',
  'Ivan Petrov': 'Иван Петров',
  'Julia Roberts': 'Джулия Робертс',
}

const staffSpec: Record<string, { ru: string; en: string }> = {
  'Alice Johnson': { ru: 'Корпоративное право', en: 'Corporate law' },
  'Bob Smith': { ru: 'Налоги и бухгалтерия', en: 'Tax and accounting' },
  'Charlie Brown': { ru: 'Юридическая поддержка', en: 'Legal support' },
  'Diana Prince': { ru: 'Договорное право', en: 'Contract law' },
  'Ethan Hunt': { ru: 'Риск-менеджмент', en: 'Risk management' },
  'Fiona Gallagher': { ru: 'Трудовое право', en: 'Labor law' },
  'George Martin': { ru: 'Стратегический консалтинг', en: 'Strategic consulting' },
  'Hannah Lee': { ru: 'Сопровождение сделок', en: 'Deal support' },
  'Ivan Petrov': { ru: 'Комплаенс', en: 'Compliance' },
  'Julia Roberts': { ru: 'Бизнес-консалтинг', en: 'Business consulting' },
}

function parseSlot(slot: string) {
  if (slot.endsWith('Z') || /[+-]\d\d:\d\d$/.test(slot)) return new Date(slot)
  return new Date(`${slot}Z`)
}

function toMoscowYmd(value: string | Date) {
  const date = typeof value === 'string' ? parseSlot(value) : value
  return new Intl.DateTimeFormat('en-CA', { timeZone: MOSCOW_TZ }).format(date)
}

function formatDay(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: MOSCOW_TZ,
  }).format(parseSlot(value))
}

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TZ,
  }).format(parseSlot(value))
}

function monthLabel(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: MOSCOW_TZ,
  }).format(date)
}

function isFutureSlot(slot: string) {
  return parseSlot(slot).getTime() > Date.now()
}

function getImageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL ?? ''}${path}`
}

function fixBrokenStaffImage(path: string) {
  const p = path.toLowerCase()
  if (p.endsWith('/ethan.jpg')) return `${API_URL}/images/staff/ethan.png`
  if (p.endsWith('/hannah.jpg')) return `${API_URL}/images/staff/hannah.png`
  return ''
}

function avatarFallback(name: string) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() ?? '')
    .join('')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='#F5F5F8'/><text x='50%' y='54%' text-anchor='middle' font-size='42' font-family='Arial,sans-serif' fill='#333333'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function calendarDays(anchor: Date) {
  const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
  const shift = (first.getUTCDay() + 6) % 7
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - shift)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    return d
  })
}

function groupSlotsByDate(slots: StartSlotDto[], locale: Locale): StartDaySlot[] {
  const grouped = new Map<string, StartDaySlot>()
  slots.forEach((slot) => {
    if (!isFutureSlot(slot.slot)) return
    const key = toMoscowYmd(slot.slot)
    const item = { slot: slot.slot, time: formatTime(slot.slot, locale), count: slot.count }
    const current = grouped.get(key)
    if (!current) {
      grouped.set(key, { date: key, dayLabel: formatDay(slot.slot, locale), slots: [item] })
      return
    }
    current.slots.push(item)
  })
  return Array.from(grouped.values())
}

function countClass(count: number) {
  if (count <= 0) return 'count-badge count-badge--zero'
  if (count === 1) return 'count-badge count-badge--one'
  return 'count-badge count-badge--many'
}

function localizeStaff(staff: StaffDto, locale: Locale): StaffDto {
  const nameEn = staff.name
  return {
    ...staff,
    name: locale === 'ru' ? (staffRuNames[nameEn] ?? nameEn) : nameEn,
    specialization: staffSpec[nameEn] ? staffSpec[nameEn][locale] : staff.specialization,
  }
}

function readLocalAppointments() {
  try {
    const raw = window.localStorage.getItem(LOCAL_APPOINTMENTS_KEY)
    if (!raw) return [] as AppointmentDto[]
    const parsed = JSON.parse(raw) as AppointmentDto[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as AppointmentDto[]
  }
}

function writeLocalAppointments(appointments: AppointmentDto[]) {
  window.localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(appointments))
}

function mergeAppointments(serverAppointments: AppointmentDto[], localAppointments: AppointmentDto[]) {
  const map = new Map<string, AppointmentDto>()
  ;[...serverAppointments, ...localAppointments].forEach((appointment) => {
    if (!appointment?.appointmentTime || !isFutureSlot(appointment.appointmentTime)) return
    const key = `${appointment.appointmentTime}|${appointment.staffName}|${appointment.reason}`
    map.set(key, appointment)
  })
  return Array.from(map.values()).sort((a, b) => parseSlot(a.appointmentTime).getTime() - parseSlot(b.appointmentTime).getTime())
}

function MeetingPage() {
  const { theme, toggleTheme } = useTheme()
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [month, setMonth] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)))
  const [slots, setSlots] = useState<StartSlotDto[]>([])
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<StartSlotDto | null>(null)
  const [staff, setStaff] = useState<StaffDto[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [specFilter, setSpecFilter] = useState('all')
  const [reason, setReason] = useState<string>(reasonOptions[defaultLocale][0])
  const [slotActualCount, setSlotActualCount] = useState<Record<string, number>>({})
  const [cookieWarning, setCookieWarning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [error, setError] = useState('')
  const [staffError, setStaffError] = useState('')
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bookingMessage, setBookingMessage] = useState('')

  const detailsRef = useRef<HTMLElement | null>(null)
  const appointmentsRef = useRef<HTMLElement | null>(null)
  const t = text[locale]

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setReason(reasonOptions[locale][0])
  }, [locale])

  const grouped = useMemo(() => groupSlotsByDate(slots, locale), [slots, locale])
  const day = useMemo(() => grouped.find((d) => d.date === selectedDate) ?? null, [grouped, selectedDate])
  const availableDateSet = useMemo(() => new Set(grouped.map((d) => d.date)), [grouped])
  const docs = docsByReason[reason] ?? docsByReason[reasonOptions[locale][0]]

  const localizedStaff = useMemo(() => staff.map((member) => localizeStaff(member, locale)), [staff, locale])
  const selectedStaff = useMemo(
    () => localizedStaff.find((member) => member.id === selectedStaffId) ?? null,
    [localizedStaff, selectedStaffId],
  )

  const specOptions = useMemo(
    () => ['all', ...new Set(localizedStaff.map((member) => member.specialization ?? '').filter(Boolean))],
    [localizedStaff],
  )

  const filteredStaff = useMemo(
    () => (specFilter === 'all' ? localizedStaff : localizedStaff.filter((member) => member.specialization === specFilter)),
    [localizedStaff, specFilter],
  )

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMeetingData()
      setSlots(data.timetable)
      const localAppointments = readLocalAppointments()
      setAppointments(mergeAppointments(data.appointments, localAppointments))

      const savedToken = window.localStorage.getItem(LOCAL_TOKEN_KEY)
      if (savedToken && data.token && savedToken !== data.token && (API_URL ?? '').startsWith('http://')) {
        setCookieWarning(true)
      }
      if (data.token) {
        window.localStorage.setItem(LOCAL_TOKEN_KEY, data.token)
      }
    } catch {
      setError(t.loadError)
    } finally {
      setLoading(false)
    }
  }

  const loadStaffForSlot = async (slot: string) => {
    setLoadingStaff(true)
    setStaffError('')
    setSelectedStaffId(null)
    setBookingStatus('idle')
    setBookingMessage('')
    try {
      const data = await getAvailableStaff({ slot })
      setStaff(data)
      setSlotActualCount((prev) => ({ ...prev, [slot]: data.length }))
      setSelectedSlot((current) => (current && current.slot === slot ? { ...current, count: data.length } : current))
      if (data.length > 0) {
        setSelectedStaffId(data[0].id)
      }
    } catch {
      setStaff([])
      setSlotActualCount((prev) => ({ ...prev, [slot]: 0 }))
      setSelectedSlot((current) => (current && current.slot === slot ? { ...current, count: 0 } : current))
      setStaffError(t.loadError)
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedSlot) return
    void loadStaffForSlot(selectedSlot.slot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const selectSlot = async (slot: string, count: number) => {
    const effective = slotActualCount[slot] ?? count
    if (effective <= 0) return
    setSelectedSlot({ slot, count: effective })
    await loadStaffForSlot(slot)
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

      const appointment: AppointmentDto = {
        staffImage: selectedStaff.image,
        staffName: selectedStaff.name,
        reason,
        appointmentTime: selectedSlot.slot,
      }

      const localAppointments = mergeAppointments([], [...readLocalAppointments(), appointment])
      writeLocalAppointments(localAppointments)
      setAppointments((prev) => mergeAppointments(prev, [appointment]))
      setBookingStatus('success')
      setBookingMessage(response.message ?? t.booked)
      appointmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      await loadAll()
    } catch {
      setBookingStatus('error')
      setBookingMessage(t.bookError)
    }
  }

  const weekDays = locale === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <main className="page">
      <header className="topbar">
        <p className="topbar__brand">{t.brand}</p>
        <div className="topbar__controls">
          <button type="button" className="chip-button" onClick={toggleTheme}>
            {theme === 'light' ? t.themeDark : t.themeLight}
          </button>
          <button type="button" className="chip-button" onClick={() => setLocale((cur) => (cur === 'ru' ? 'en' : 'ru'))}>
            {locale === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
      </header>

      {cookieWarning && <p className="cookie-warning">{t.cookieIssue}</p>}

      <section className="hero-section">
        <div>
          <h1 className="hero-section__title">{t.title}</h1>
          <p className="hero-section__description">{t.subtitle}</p>
        </div>
        <button type="button" className="button button--primary" onClick={() => void loadAll()}>
          {t.refresh}
        </button>
      </section>

      <section className="grid-section">
        <article className="card">
          <div className="calendar__header">
            <button type="button" className="calendar__nav" onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))}>
              ‹
            </button>
            <div className="calendar__title">{monthLabel(month, locale)}</div>
            <button type="button" className="calendar__nav" onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))}>
              ›
            </button>
          </div>

          <div className="calendar__weekdays">
            {weekDays.map((dayName) => (
              <div key={dayName} className="calendar__weekday">
                {dayName}
              </div>
            ))}
          </div>

          <div className="calendar__grid">
            {calendarDays(month).map((dayDate) => {
              const ymd = toMoscowYmd(dayDate)
              const isPast = ymd < toMoscowYmd(new Date())
              const isInMonth = dayDate.getUTCMonth() === month.getUTCMonth()
              const isSelected = selectedDate === ymd
              const hasSlots = availableDateSet.has(ymd)
              return (
                <button
                  key={ymd}
                  type="button"
                  className={`calendar__day ${isInMonth ? '' : 'calendar__day--out'} ${isSelected ? 'calendar__day--selected' : ''}`}
                  disabled={isPast}
                  onClick={() => {
                    setSelectedDate(ymd)
                    setSelectedSlot(null)
                    setStaff([])
                    setSelectedStaffId(null)
                    if (!hasSlots) setStaffError('')
                  }}
                >
                  {dayDate.getUTCDate()}
                </button>
              )
            })}
          </div>

          {loading && <p className="state-text">{t.loading}</p>}
          {error && <p className="state-text state-text--error">{error}</p>}

          {selectedDate && (
            <div className="slots-block">
              <h3 className="card__title card__title--small">{day?.dayLabel ?? t.chooseDate}</h3>
              {!day || day.slots.length === 0 ? (
                <p className="state-text">{t.noSlotsForDate}</p>
              ) : (
                <>
                  <p className="card__subtitle">{t.chooseTime}</p>
                  <div className="slots-grid">
                    {day.slots.map((slotItem) => {
                      const effective = slotActualCount[slotItem.slot] ?? slotItem.count
                      return (
                        <button
                          key={slotItem.slot}
                          type="button"
                          className={`slot-card ${selectedSlot?.slot === slotItem.slot ? 'slot-card--selected' : ''}`}
                          disabled={effective <= 0}
                          onClick={() => void selectSlot(slotItem.slot, effective)}
                        >
                          <span className="slot-card__time">{slotItem.time}</span>
                          <span className={countClass(effective)}>
                            {effective} {t.free}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedSlot && (
                    <button type="button" className="text-button scroll-cta" onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      {t.toDetails}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </article>

        <article className="card" ref={detailsRef}>
          <h2 className="card__title">{t.summary}</h2>
          {selectedSlot ? (
            <div className="summary-panel__content">
              <div className="summary-row">
                <span>{t.date}</span>
                <strong>{formatDay(selectedSlot.slot, locale)}</strong>
              </div>
              <div className="summary-row">
                <span>{t.time}</span>
                <strong>{formatTime(selectedSlot.slot, locale)}</strong>
              </div>
              <div className="summary-row">
                <span>{t.free}</span>
                <strong>{selectedSlot.count}</strong>
              </div>
              {selectedStaff && (
                <div className="summary-row">
                  <span>{t.selectedSpecialist}</span>
                  <strong>{selectedStaff.name}</strong>
                </div>
              )}
            </div>
          ) : (
            <p className="state-text">{t.chooseDate}</p>
          )}

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.reason}</h3>
            <select className="reason-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {reasonOptions[locale].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.docs}</h3>
            <p className="documents-section__text">{t.docsHint}</p>
            <ul className="chips chips--stacked">
              {docs.map((doc) => (
                <li key={doc} className="chips__item">
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.specialists}</h3>
            {loadingStaff ? (
              <p className="state-text">{t.loadingStaff}</p>
            ) : staffError ? (
              <p className="state-text state-text--error">{staffError}</p>
            ) : filteredStaff.length === 0 ? (
              <p className="state-text">{t.noStaff}</p>
            ) : (
              <>
                <div className="chips chips--wrap">
                  <button type="button" className={`chip-button chip-button--ghost ${specFilter === 'all' ? 'chip-button--selected' : ''}`} onClick={() => setSpecFilter('all')}>
                    {t.allSpecs}
                  </button>
                  {specOptions
                    .filter((option) => option !== 'all')
                    .map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`chip-button chip-button--ghost ${specFilter === option ? 'chip-button--selected' : ''}`}
                        onClick={() => setSpecFilter(option)}
                      >
                        {option}
                      </button>
                    ))}
                </div>
                <ul className="staff-grid">
                  {filteredStaff.map((member) => (
                    <li
                      key={`${member.id}-${member.name}`}
                      className={`staff-card staff-card--selectable ${selectedStaffId === member.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedStaffId(member.id)}
                    >
                      <img
                        className="staff-card__image"
                        src={getImageUrl(member.image)}
                        alt={member.name}
                        onError={(event) => {
                          const fallback = fixBrokenStaffImage(member.image)
                          if (fallback && event.currentTarget.dataset.retry !== '1') {
                            event.currentTarget.dataset.retry = '1'
                            event.currentTarget.src = fallback
                            return
                          }
                          event.currentTarget.src = avatarFallback(member.name)
                        }}
                      />
                      <div className="staff-card__body">
                        <strong className="staff-card__name">{member.name}</strong>
                        <p className="staff-card__meta">
                          {t.age}: {member.age}
                        </p>
                        <p className="staff-card__meta">{member.specialization}</p>
                        <p className="staff-card__description">{member.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="info-block">
            <h3 className="card__title card__title--small">{t.place}</h3>
            <p className="state-text">{t.placeValue}</p>
          </div>
        </article>
      </section>

      {selectedSlot && selectedStaff && (
        <section className="booking-toast">
          <div className="booking-toast__info">
            <p className="booking-toast__title">{t.book}</p>
            <p className="booking-toast__line">
              {formatDay(selectedSlot.slot, locale)} • {formatTime(selectedSlot.slot, locale)}
            </p>
            <p className="booking-toast__line">
              {selectedStaff.name} • {reason}
            </p>
            {bookingMessage && <p className={`booking-toast__message ${bookingStatus === 'error' ? 'is-error' : 'is-success'}`}>{bookingMessage}</p>}
          </div>
          <button type="button" className="button button--primary booking-toast__action" disabled={bookingStatus === 'loading'} onClick={() => void handleBook()}>
            {bookingStatus === 'loading' ? t.booking : t.book}
          </button>
        </section>
      )}

      <section className="card appointments" ref={appointmentsRef}>
        <h2 className="card__title">{t.appointments}</h2>
        {appointments.length === 0 ? (
          <p className="state-text">{t.appointmentsEmpty}</p>
        ) : (
          <ul className="appointments-list">
            {appointments.map((appointment, idx) => {
              const appointmentDocs = docsByReason[appointment.reason] ?? docsByReason[reasonOptions[locale][0]]
              const translatedName = locale === 'ru' ? (staffRuNames[appointment.staffName] ?? appointment.staffName) : appointment.staffName
              return (
                <li key={`${appointment.appointmentTime}-${idx}`} className="appointment-card">
                  <div className="appointment-line">
                    <span>{t.when}:</span>
                    <strong>
                      {formatDay(appointment.appointmentTime, locale)} • {formatTime(appointment.appointmentTime, locale)}
                    </strong>
                  </div>
                  <div className="appointment-line">
                    <span>{t.where}:</span>
                    <strong>{t.placeValue}</strong>
                  </div>
                  <div className="appointment-line">
                    <span>{t.why}:</span>
                    <strong>{appointment.reason}</strong>
                  </div>
                  <div className="appointment-line">
                    <span>{t.selectedSpecialist}:</span>
                    <strong>{translatedName}</strong>
                  </div>
                  <div className="appointment-line">
                    <span>{t.whatTake}:</span>
                    <strong>{appointmentDocs.join(', ')}</strong>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/meeting-booking" replace />} />
      <Route path="/meeting-booking" element={<MeetingPage />} />
    </Routes>
  )
}

export default App
