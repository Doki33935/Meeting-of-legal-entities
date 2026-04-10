import { apiRequest } from './client'
import type {
  AppointmentDto,
  BookRequestDto,
  BookResponseDto,
  MeetRequestDto,
  StaffDto,
  StartResponseDto,
  StartSlotDto,
} from '../types/api'

export interface StartPayload {
  token?: string
  timetable: StartSlotDto[]
  appointments: AppointmentDto[]
}

export function getMeetingData() {
  return apiRequest<StartSlotDto[] | StartResponseDto>({
    path: '/api/start',
    method: 'GET',
  }).then((response) => {
    if (Array.isArray(response)) {
      return {
        timetable: response,
        appointments: [],
      } as StartPayload
    }

    if (response && Array.isArray(response.timetable)) {
      return {
        token: response.token,
        timetable: response.timetable,
        appointments: Array.isArray(response.appointments) ? response.appointments : [],
      } as StartPayload
    }

    return {
      timetable: [],
      appointments: [],
    } as StartPayload
  })
}

export function getAvailableStaff(request: MeetRequestDto) {
  return apiRequest<StaffDto[]>({
    path: '/api/meet',
    method: 'POST',
    body: JSON.stringify(request),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Нет свободных сотрудников') || message.includes('404')) {
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
