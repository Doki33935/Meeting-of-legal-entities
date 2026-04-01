export interface StartSlotDto {
  day: number
  time: string
  status: boolean
}

export interface MeetRequestDto {
  id: number
  reason: string
}

export interface ThemeMode {
  value: 'light' | 'dark'
}
