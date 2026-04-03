import { apiRequest } from './client'
import type { MeetRequestDto, StaffDto, StartSlotDto } from '../types/api'

export function getMeetingSlots() {
  return apiRequest<StartSlotDto[]>({
    path: '/api/start',
    method: 'GET',
  })
}

export function getAvailableStaff(request: MeetRequestDto) {
  return apiRequest<StaffDto[]>({
    path: '/api/meet',
    method: 'POST',
    body: JSON.stringify(request),
  })
}
