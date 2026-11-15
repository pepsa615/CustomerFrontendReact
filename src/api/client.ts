import { env } from '../schemas/env'
import { SpanStatusCode } from '@opentelemetry/api'
import { webTracer } from '../telemetry'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string
  readonly details?: unknown
  constructor(status: number, code: string, message: string, requestId?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
    this.details = details
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const span = webTracer.startSpan('api.request', { attributes: { 'http.request.method': init.method ?? 'GET', 'url.template': path } })
  const requestId = crypto.randomUUID()
  let response: Response
  try { response = await fetch(`${env.VITE_API_URL}${path}`, {
      ...init, credentials: 'include', signal,
      headers: { ...(init.body instanceof FormData ? {} : { 'content-type': 'application/json' }), 'x-request-id': requestId, ...(readCookie('pepsa_csrf') ? { 'x-csrf-token': readCookie('pepsa_csrf')! } : {}), ...init.headers },
    })
  } catch (error) { if (error instanceof Error) span.recordException(error); span.setStatus({code:SpanStatusCode.ERROR}); span.end(); throw error }
  const body = await response.json().catch(() => null) as { data?: T; error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null
  span.setAttribute('http.response.status_code', response.status)
  if (!response.ok) { span.setStatus({ code: SpanStatusCode.ERROR }); span.end(); throw new ApiError(response.status, body?.error?.code ?? 'REQUEST_FAILED', body?.error?.message ?? 'Request failed', body?.requestId, body?.error?.details) }
  span.setStatus({ code: SpanStatusCode.OK }); span.end(); return (body?.data ?? body) as T
}

function readCookie(name: string) {
  return document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
}
