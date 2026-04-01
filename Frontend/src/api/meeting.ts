import { apiRequest } from './client'
import type { MeetRequestDto, StartSlotDto } from '../types/api'

export function getMeetingSlots() {
  return apiRequest<StartSlotDto[]>({
    path: '/start',
    method: 'GET',
  })
}

export function createMeeting(payload: MeetRequestDto) {
  return apiRequest<void>({
    path: '/meet',
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
