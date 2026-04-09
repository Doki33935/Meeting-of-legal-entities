import { apiRequest } from './client'
import type { BookRequestDto, BookResponseDto, MeetRequestDto, StaffDto, StartSlotDto } from '../types/api'

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

export function bookMeeting(request: BookRequestDto) {
  return apiRequest<BookResponseDto>({
    path: '/api/book',
    method: 'POST',
    body: JSON.stringify(request),
  })
}
