import { create } from 'zustand'
import type { AdverseEvent, Rectification, EventStatusLog, SeverityCheckResult, ArchiveCheckResult, Severity, EventStatus } from '../../shared/types'

interface EventState {
  events: AdverseEvent[]
  total: number
  currentPage: number
  pageSize: number
  loading: boolean
  currentEvent: AdverseEvent | null
  statusLog: EventStatusLog[]
  rectifications: Rectification[]
  severityCheck: SeverityCheckResult | null
  archiveCheck: ArchiveCheckResult | null
  desensitizedNotice: string | null
  filterStatus: EventStatus | ''
  filterSeverity: Severity | ''
  filterKeyword: string
  severityWarningVisible: boolean
  archiveWarningVisible: boolean

  fetchEvents: () => Promise<void>
  fetchEventDetail: (id: string) => Promise<void>
  createEvent: (data: any) => Promise<{ event: AdverseEvent; severityCheck: SeverityCheckResult } | null>
  updateEventStatus: (id: string, status: string, operator: string, remark: string) => Promise<void>
  archiveEvent: (id: string, operator: string) => Promise<boolean>
  checkSeverity: (data: any) => Promise<SeverityCheckResult>
  createRectification: (data: any) => Promise<void>
  closeRectification: (id: string) => Promise<void>
  fetchRectifications: (eventId?: string, status?: string) => Promise<void>
  setFilterStatus: (status: EventStatus | '') => void
  setFilterSeverity: (severity: Severity | '') => void
  setFilterKeyword: (keyword: string) => void
  setCurrentPage: (page: number) => void
  setSeverityWarningVisible: (visible: boolean) => void
  setArchiveWarningVisible: (visible: boolean) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  total: 0,
  currentPage: 1,
  pageSize: 10,
  loading: false,
  currentEvent: null,
  statusLog: [],
  rectifications: [],
  severityCheck: null,
  archiveCheck: null,
  desensitizedNotice: null,
  filterStatus: '',
  filterSeverity: '',
  filterKeyword: '',
  severityWarningVisible: false,
  archiveWarningVisible: false,

  fetchEvents: async () => {
    set({ loading: true })
    try {
      const { filterStatus, filterSeverity, filterKeyword, currentPage, pageSize } = get()
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterSeverity) params.set('severity', filterSeverity)
      if (filterKeyword) params.set('keyword', filterKeyword)
      params.set('page', currentPage.toString())
      params.set('page_size', pageSize.toString())
      const res = await fetch(`/api/events?${params}`)
      const json = await res.json()
      if (json.code === 0) {
        set({ events: json.data.items, total: json.data.total })
      }
    } finally {
      set({ loading: false })
    }
  },

  fetchEventDetail: async (id: string) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/events/${id}`)
      const json = await res.json()
      if (json.code === 0) {
        set({
          currentEvent: json.data.event,
          statusLog: json.data.status_log,
          rectifications: json.data.rectifications,
          desensitizedNotice: json.data.desensitized_notice,
        })
      }
    } finally {
      set({ loading: false })
    }
  },

  createEvent: async (data: any) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.code === 0) {
      return { event: json.data.event, severityCheck: json.data.severity_check }
    }
    return null
  },

  updateEventStatus: async (id: string, status: string, operator: string, remark: string) => {
    const res = await fetch(`/api/events/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operator, remark }),
    })
    const json = await res.json()
    if (json.code === 0) {
      set({ currentEvent: json.data })
    } else {
      throw new Error(json.message || '状态更新失败')
    }
  },

  archiveEvent: async (id: string, operator: string) => {
    const res = await fetch(`/api/events/${id}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    })
    const json = await res.json()
    if (json.code === 0) {
      set({ currentEvent: json.data, archiveWarningVisible: false })
      return true
    } else {
      set({ archiveCheck: json.data?.check, archiveWarningVisible: true })
      return false
    }
  },

  checkSeverity: async (data: any) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.code === 0) {
      return json.data.severity_check
    }
    return { is_severe: false, deadline: null, hours_remaining: null, warning_message: null }
  },

  createRectification: async (data: any) => {
    const res = await fetch('/api/rectifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.code === 0) {
      const { currentEvent } = get()
      if (currentEvent) {
        get().fetchEventDetail(currentEvent.id)
      }
    }
  },

  closeRectification: async (id: string) => {
    const res = await fetch(`/api/rectifications/${id}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (json.code === 0) {
      const { currentEvent } = get()
      if (currentEvent) {
        await get().fetchEventDetail(currentEvent.id)
      }
    }
  },

  fetchRectifications: async (eventId?: string, status?: string) => {
    const params = new URLSearchParams()
    if (eventId) params.set('event_id', eventId)
    if (status) params.set('status', status)
    const res = await fetch(`/api/rectifications?${params}`)
    const json = await res.json()
    if (json.code === 0) {
      set({ rectifications: json.data })
    }
  },

  setFilterStatus: (status) => { set({ filterStatus: status, currentPage: 1 }) },
  setFilterSeverity: (severity) => { set({ filterSeverity: severity, currentPage: 1 }) },
  setFilterKeyword: (keyword) => { set({ filterKeyword: keyword, currentPage: 1 }) },
  setCurrentPage: (page) => set({ currentPage: page }),
  setSeverityWarningVisible: (visible) => set({ severityWarningVisible: visible }),
  setArchiveWarningVisible: (visible) => set({ archiveWarningVisible: visible }),
}))
