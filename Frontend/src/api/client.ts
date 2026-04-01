const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

interface RequestOptions extends RequestInit {
  path: string
}

export async function apiRequest<T>({ path, headers, ...options }: RequestOptions): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not set')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
