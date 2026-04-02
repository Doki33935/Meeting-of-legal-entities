export interface StartSlotDto {
  slot: string
  count: number
}

export interface MeetRequestDto {
  id: number
  reason: string
}

export interface StartDaySlot {
  date: string
  dayLabel: string
  slots: {
    time: string
    count: number
  }[]
}
