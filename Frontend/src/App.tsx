import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { bookMeeting, getAvailableStaff, getMeetingData } from './api/meeting'
import { useTheme } from './hooks/useTheme'
import type { AppointmentDto, StaffDto, StartDaySlot, StartSlotDto } from './types/api'
import './App.css'

type Locale = 'ru' | 'en'
type TimeFilter = 'all' | 'morning' | 'day' | 'evening' | '08-10' | '10-12' | '12-14' | '14-18'

const MOSCOW_TZ = 'Europe/Moscow'
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const defaultLocale = (import.meta.env.VITE_DEFAULT_LANGUAGE === 'en' ? 'en' : 'ru') as Locale

const i18n = {
  ru: {
    brand: 'Встречи для юрлиц',
    title: 'Назначение встречи',
    refresh: 'Обновить слоты',
    loading: 'Загружаем слоты...',
    loadError: 'Ошибка загрузки данных.',
    chooseDate: 'Выберите дату',
    chooseTime: 'Выберите время',
    noSlots: 'Слотов нет',
    reason: 'Цель встречи',
    docs: 'Документы',
    specialists: 'Специалисты',
    noStaff: 'На это время нет свободных специалистов.',
    loadingStaff: 'Загружаем специалистов...',
    age: 'Возраст',
    allSpecializations: 'Все специализации',
    summary: 'Сводка',
    date: 'Дата',
    time: 'Время',
    free: 'Свободно специалистов',
    selectedSpecialist: 'Выбранный специалист',
    place: 'Место встречи',
    placeText: 'Адрес подтверждается после бронирования',
    book: 'Назначить встречу',
    booking: 'Назначаем...',
    booked: 'Встреча назначена',
    bookError: 'Не удалось назначить встречу',
    appointments: 'У вас назначены встречи',
    appointmentsEmpty: 'Пока нет встреч',
    when: 'Когда',
    where: 'Где',
    why: 'Причина',
    whatTake: 'Что взять',
    toDetails: 'Перейти к выбору специалиста',
    any: 'Любое',
    morning: 'Утро',
    day: 'День',
    evening: 'Вечер',
  },
  en: {
    brand: 'Business Meetings',
    title: 'Meeting booking',
    refresh: 'Refresh slots',
    loading: 'Loading slots...',
    loadError: 'Failed to load data.',
    chooseDate: 'Choose date',
    chooseTime: 'Choose time',
    noSlots: 'No slots',
    reason: 'Meeting purpose',
    docs: 'Documents',
    specialists: 'Specialists',
    noStaff: 'No available specialists for selected time.',
    loadingStaff: 'Loading specialists...',
    age: 'Age',
    allSpecializations: 'All specializations',
    summary: 'Summary',
    date: 'Date',
    time: 'Time',
    free: 'Free specialists',
    selectedSpecialist: 'Selected specialist',
    place: 'Meeting place',
    placeText: 'Address is confirmed after booking',
    book: 'Book meeting',
    booking: 'Booking...',
    booked: 'Meeting booked',
    bookError: 'Booking failed',
    appointments: 'Your booked meetings',
    appointmentsEmpty: 'No meetings yet',
    when: 'When',
    where: 'Where',
    why: 'Reason',
    whatTake: 'What to take',
    toDetails: 'Go to specialist selection',
    any: 'Any',
    morning: 'Morning',
    day: 'Day',
    evening: 'Evening',
  },
} as const

const reasonOptions = {
  ru: ['Открытие расчётного счёта', 'Подключение эквайринга', 'Изменение данных компании', 'Консультация по тарифу'],
  en: ['Open account', 'Enable acquiring', 'Company data changes', 'Tariff consultation'],
} as const

const docsByReason: Record<string, string[]> = {
  'Открытие расчётного счёта': ['Паспорт', 'ИНН/ОГРН', 'Учредительные документы'],
  'Подключение эквайринга': ['Паспорт', 'Реквизиты счёта', 'Данные по торговой точке'],
  'Изменение данных компании': ['Паспорт', 'Документы-основания', 'Актуальная карточка организации'],
  'Консультация по тарифу': ['Паспорт', 'Текущий договор', 'Список операций'],
  'Open account': ['Passport', 'Tax IDs', 'Incorporation documents'],
  'Enable acquiring': ['Passport', 'Account details', 'Merchant data'],
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

const specializations: Record<string, { ru: string; en: string }> = {
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

const parseDate = (value: string) => new Date(value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`)
const toYmd = (d: string | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: MOSCOW_TZ }).format(typeof d === 'string' ? parseDate(d) : d)
const fDay = (d: string, l: Locale) => new Intl.DateTimeFormat(l === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', day: '2-digit', month: 'long', timeZone: MOSCOW_TZ }).format(parseDate(d))
const fTime = (d: string, l: Locale) => new Intl.DateTimeFormat(l === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit', timeZone: MOSCOW_TZ }).format(parseDate(d))
const monthTitle = (d: Date, l: Locale) => new Intl.DateTimeFormat(l === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric', timeZone: MOSCOW_TZ }).format(d)
const getImageUrl = (path: string) => (/^https?:\/\//i.test(path) ? path : `${API_URL ?? ''}${path}`)

function slotClass(count: number) {
  if (count <= 0) return 'count-badge count-badge--zero'
  if (count === 1) return 'count-badge count-badge--one'
  return 'count-badge count-badge--many'
}

function AppPage() {
  const { theme, toggleTheme } = useTheme()
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [slots, setSlots] = useState<StartSlotDto[]>([])
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<StartSlotDto | null>(null)
  const [staff, setStaff] = useState<StaffDto[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffDto | null>(null)
  const [reason, setReason] = useState<string>(reasonOptions[defaultLocale][0])
  const [spec, setSpec] = useState('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookStatus, setBookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bookMessage, setBookMessage] = useState('')
  const [month, setMonth] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)))
  const detailsRef = useRef<HTMLElement | null>(null)
  const appointmentsRef = useRef<HTMLElement | null>(null)
  const t = i18n[locale]

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { setReason(reasonOptions[locale][0]) }, [locale])

  const days = useMemo(() => {
    const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
    const shift = (first.getUTCDay() + 6) % 7
    const start = new Date(first)
    start.setUTCDate(first.getUTCDate() - shift)
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setUTCDate(start.getUTCDate() + i); return d })
  }, [month])

  const byDate = useMemo(() => {
    const map = new Map<string, StartDaySlot>()
    slots.filter((s) => parseDate(s.slot).getTime() > Date.now()).forEach((s) => {
      const key = toYmd(s.slot)
      const cur = map.get(key)
      const item = { slot: s.slot, count: s.count, time: fTime(s.slot, locale) }
      if (!cur) map.set(key, { date: key, dayLabel: fDay(s.slot, locale), slots: [item] })
      else cur.slots.push(item)
    })
    return Array.from(map.values())
  }, [slots, locale])

  const day = useMemo(() => byDate.find((d) => d.date === selectedDate) ?? null, [byDate, selectedDate])
  const daySlots = useMemo(() => {
    const src = day?.slots ?? []
    const byTime = (s: StartDaySlot['slots'][number]) => {
      const h = parseInt(s.time.slice(0, 2), 10)
      if (timeFilter === 'all') return true
      if (timeFilter === 'morning') return h < 12
      if (timeFilter === 'day') return h >= 12 && h < 17
      if (timeFilter === 'evening') return h >= 17
      const [a, b] = timeFilter.split('-').map(Number)
      return h >= a && h < b
    }
    return src.filter(byTime)
  }, [day?.slots, timeFilter])

  const staffLocalized = useMemo(() => staff.map((s) => ({ ...s, name: locale === 'ru' ? (staffRuNames[s.name] ?? s.name) : s.name, specialization: specializations[s.name] ? specializations[s.name][locale] : s.specialization })), [staff, locale])
  const specOptions = useMemo(() => ['all', ...new Set(staffLocalized.map((s) => s.specialization ?? '').filter(Boolean))], [staffLocalized])
  const staffFiltered = useMemo(() => (spec === 'all' ? staffLocalized : staffLocalized.filter((s) => s.specialization === spec)), [staffLocalized, spec])
  const docs = docsByReason[reason] ?? docsByReason[reasonOptions[locale][0]]

  const loadAll = async () => {
    setLoading(true); setError('')
    try { const data = await getMeetingData(); setSlots(data.timetable); setAppointments(data.appointments) }
    catch { setError(t.loadError) } finally { setLoading(false) }
  }

  const loadStaff = async (slot: string) => {
    setStaffLoading(true)
    const data = await getAvailableStaff({ slot })
    setStaff(data)
    setSelectedStaff(data[0] ?? null)
    setStaffLoading(false)
  }

  useEffect(() => { void loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedSlot) void loadStaff(selectedSlot.slot) }, [locale]) // eslint-disable-line react-hooks/exhaustive-deps

  const onBook = async () => {
    if (!selectedSlot || !selectedStaff) return
    setBookStatus('loading'); setBookMessage('')
    try {
      const res = await bookMeeting({ staffId: selectedStaff.id, appointmentTime: selectedSlot.slot, reason })
      setBookStatus('success'); setBookMessage(res.message ?? t.booked)
      setAppointments((p) => [...p, { staffImage: selectedStaff.image, staffName: selectedStaff.name, reason, appointmentTime: selectedSlot.slot }])
      appointmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      await loadAll()
    } catch { setBookStatus('error'); setBookMessage(t.bookError) }
  }

  return (
    <main className="page">
      <header className="topbar"><p className="topbar__brand">{t.brand}</p><div className="topbar__controls"><button className="chip-button" onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'}</button><button className="chip-button" onClick={() => setLocale((v) => (v === 'ru' ? 'en' : 'ru'))}>{locale === 'ru' ? 'EN' : 'RU'}</button></div></header>
      <section className="hero-section"><h1 className="hero-section__title">{t.title}</h1><button className="button button--primary" onClick={() => void loadAll()}>{t.refresh}</button></section>
      <section className="grid-section">
        <article className="card">
          <div className="calendar__header"><button className="calendar__nav" onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))}>‹</button><div className="calendar__title">{monthTitle(month, locale)}</div><button className="calendar__nav" onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))}>›</button></div>
          <div className="calendar__weekdays">{(locale === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((d) => <div key={d} className="calendar__weekday">{d}</div>)}</div>
          <div className="calendar__grid">{days.map((d) => { const ymd = toYmd(d); const has = byDate.some((x) => x.date === ymd); const past = ymd < toYmd(new Date()); return <button key={ymd} className={`calendar__day ${d.getUTCMonth() === month.getUTCMonth() ? '' : 'calendar__day--out'} ${selectedDate === ymd ? 'calendar__day--selected' : ''}`} disabled={!has || past} onClick={() => { setSelectedDate(ymd); setSelectedSlot(null) }}>{d.getUTCDate()}</button> })}</div>
          {loading && <p className="state-text">{t.loading}</p>}
          {error && <p className="state-text state-text--error">{error}</p>}
          {selectedDate && <div className="slots-block"><div className="chips chips--wrap">{([['all', t.any], ['morning', t.morning], ['day', t.day], ['evening', t.evening], ['08-10', '08-10'], ['10-12', '10-12'], ['12-14', '12-14'], ['14-18', '14-18']] as [TimeFilter, string][]).map(([v, label]) => <button key={v} className={`chip-button chip-button--ghost ${timeFilter === v ? 'chip-button--selected' : ''}`} onClick={() => setTimeFilter(v)}>{label}</button>)}</div><div className="slots-grid">{daySlots.map((s) => <button key={s.slot} className={`slot-card ${selectedSlot?.slot === s.slot ? 'slot-card--selected' : ''}`} onClick={() => { setSelectedSlot({ slot: s.slot, count: s.count }); void loadStaff(s.slot); detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><span className="slot-card__time">{s.time}</span><span className={slotClass(s.count)}>{s.count} {t.free}</span></button>)}</div></div>}
        </article>
        <article className="card" ref={detailsRef}>
          <h2 className="card__title">{t.summary}</h2>
          {selectedSlot ? <div className="summary-panel__content"><div className="summary-row"><span>{t.date}</span><strong>{fDay(selectedSlot.slot, locale)}</strong></div><div className="summary-row"><span>{t.time}</span><strong>{fTime(selectedSlot.slot, locale)}</strong></div><div className="summary-row"><span>{t.free}</span><strong>{selectedSlot.count}</strong></div>{selectedStaff && <div className="summary-row"><span>{t.selectedSpecialist}</span><strong>{selectedStaff.name}</strong></div>}</div> : <p className="state-text">{t.chooseDate}</p>}
          <div className="info-block"><h3 className="card__title card__title--small">{t.reason}</h3><select className="reason-select" value={reason} onChange={(e) => setReason(e.target.value)}>{reasonOptions[locale].map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="info-block"><h3 className="card__title card__title--small">{t.docs}</h3><ul className="chips chips--stacked">{docs.map((d) => <li key={d} className="chips__item">{d}</li>)}</ul></div>
          <div className="info-block"><h3 className="card__title card__title--small">{t.specialists}</h3>{staffLoading ? <p className="state-text">{t.loadingStaff}</p> : staffFiltered.length === 0 ? <p className="state-text">{t.noStaff}</p> : <><div className="chips chips--wrap"><button className={`chip-button chip-button--ghost ${spec === 'all' ? 'chip-button--selected' : ''}`} onClick={() => setSpec('all')}>{t.allSpecializations}</button>{specOptions.filter((x) => x !== 'all').map((x) => <button key={x} className={`chip-button chip-button--ghost ${spec === x ? 'chip-button--selected' : ''}`} onClick={() => setSpec(x)}>{x}</button>)}</div><ul className="staff-grid">{staffFiltered.map((s) => <li key={s.id} className={`staff-card staff-card--selectable ${selectedStaff?.id === s.id ? 'is-selected' : ''}`} onClick={() => setSelectedStaff(s)}><img className="staff-card__image" src={`${getImageUrl(s.image)}`} alt={s.name} onError={(e) => { const p = s.image.toLowerCase(); if (!e.currentTarget.dataset.alt && p.endsWith('/ethan.jpg')) { e.currentTarget.dataset.alt = '1'; e.currentTarget.src = `${API_URL}/images/staff/ethan.png`; return } e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }} /><div className="staff-card__body"><strong className="staff-card__name">{s.name}</strong><p className="staff-card__meta">{t.age}: {s.age}</p><p className="staff-card__meta">{s.specialization}</p></div></li>)}</ul></>}</div>
          <div className="info-block"><h3 className="card__title card__title--small">{t.place}</h3><p className="state-text">{t.placeText}</p></div>
        </article>
      </section>
      {selectedSlot && selectedStaff && <section className="booking-toast"><div className="booking-toast__info"><p className="booking-toast__title">{t.book}</p><p className="booking-toast__line">{fDay(selectedSlot.slot, locale)} • {fTime(selectedSlot.slot, locale)}</p><p className="booking-toast__line">{selectedStaff.name} • {reason}</p>{bookMessage && <p className={`booking-toast__message ${bookStatus === 'error' ? 'is-error' : 'is-success'}`}>{bookMessage}</p>}</div><button className="button button--primary booking-toast__action" disabled={bookStatus === 'loading'} onClick={() => void onBook()}>{bookStatus === 'loading' ? t.booking : t.book}</button></section>}
      <section className="card appointments" ref={appointmentsRef}><h2 className="card__title">{t.appointments}</h2>{appointments.length === 0 ? <p className="state-text">{t.appointmentsEmpty}</p> : <ul className="appointments-list">{appointments.filter((a) => parseDate(a.appointmentTime).getTime() > Date.now()).sort((a, b) => parseDate(a.appointmentTime).getTime() - parseDate(b.appointmentTime).getTime()).map((a, i) => <li key={`${a.staffName}-${i}`} className="appointment-card"><div className="appointment-line"><span>{t.when}:</span><strong>{fDay(a.appointmentTime, locale)} • {fTime(a.appointmentTime, locale)}</strong></div><div className="appointment-line"><span>{t.where}:</span><strong>{t.placeText}</strong></div><div className="appointment-line"><span>{t.why}:</span><strong>{a.reason}</strong></div><div className="appointment-line"><span>{t.whatTake}:</span><strong>{(docsByReason[a.reason] ?? docsByReason[reasonOptions[locale][0]]).join(', ')}</strong></div></li>)}</ul>}</section>
    </main>
  )
}

function App() { return <Routes><Route path="/" element={<Navigate to="/meeting-booking" replace />} /><Route path="/meeting-booking" element={<AppPage />} /></Routes> }

export default App
