export interface StartSlotDto {
  slot: string
  count: number
}

export interface StartResponseDto {
  token?: string
  timetable: StartSlotDto[]
  appointments?: unknown[]
}

export interface MeetRequestDto {
  slot: string
}

export interface StaffDto {
  id: number
  name: string
  age: number
  description: string
  image: string
  specialization?: string
}

export interface BookRequestDto {
  staffId: number
  appointmentTime: string
  reason: string
}

export interface BookResponseDto {
  success: boolean
  message?: string
}

export interface StartDaySlot {
  date: string
  dayLabel: string
  slots: {
    time: string
    count: number
    slot: string
  }[]
}
