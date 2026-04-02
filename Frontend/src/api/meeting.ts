import { apiRequest } from './client'
import type { StartSlotDto } from '../types/api'

export function getMeetingSlots() {
  return apiRequest<StartSlotDto[]>({
    path: '/start',
    method: 'GET',
  })
}
