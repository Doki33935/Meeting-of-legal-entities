const rawApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function normalizeApiUrl(url: string | undefined) {
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:'
      return parsed.toString().replace(/\/$/, '')
    }
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

const API_URL = normalizeApiUrl(rawApiUrl)

interface RequestOptions extends RequestInit {
  path: string
}

export async function apiRequest<T>({ path, headers, ...options }: RequestOptions): Promise<T> {
  if (!API_URL) {
    const error = new Error('VITE_API_URL is not set')
    console.error('[apiRequest]', error)
    throw error
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: options.credentials ?? 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    })

    if (!response.ok) {
      const message = await response.text()
      const error = new Error(message || `Request failed with status ${response.status}`)
      console.error('[apiRequest]', path, response.status, message)
      throw error
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error('[apiRequest]', path, error)
    throw error
  }
}
