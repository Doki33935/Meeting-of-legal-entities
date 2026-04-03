export interface StartSlotDto {
  slot: string
  count: number
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
