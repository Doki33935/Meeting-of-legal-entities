import { apiRequest } from './client'
import type {
  BookRequestDto,
  BookResponseDto,
  MeetRequestDto,
  StaffDto,
  StartResponseDto,
  StartSlotDto,
} from '../types/api'

export function getMeetingSlots() {
  return apiRequest<StartSlotDto[] | StartResponseDto>({
    path: '/api/start',
    method: 'GET',
  }).then((response) => {
    if (Array.isArray(response)) {
      return response
    }

    if (response && Array.isArray(response.timetable)) {
      return response.timetable
    }

    return []
  })
}

export function getAvailableStaff(request: MeetRequestDto) {
  return apiRequest<StaffDto[]>({
    path: '/api/meet',
    method: 'POST',
    body: JSON.stringify(request),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Нет свободных сотрудников')) {
      return []
    }

    throw error
  })
}

export function bookMeeting(request: BookRequestDto) {
  return apiRequest<BookResponseDto>({
    path: '/api/book',
    method: 'POST',
    body: JSON.stringify(request),
  })
}
