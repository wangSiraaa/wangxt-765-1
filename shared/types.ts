export type Severity = '一般' | '严重' | '特别严重'

export type EventStatus = '已登记' | '已上报' | '审核通过' | '审核驳回' | '整改中' | '已归档'

export type RectificationStatus = '待执行' | '执行中' | '已关闭'

export type InjuryLevel = '无' | '轻度' | '中度' | '重度' | '死亡'

export type Gender = '男' | '女' | '未知'

export interface AdverseEvent {
  id: string
  event_code: string
  event_name: string
  severity: Severity
  status: EventStatus
  event_time: string
  discover_time: string
  description: string
  device_name: string
  device_model: string
  manufacturer: string
  batch_no: string
  patient_name: string
  patient_age: number
  patient_gender: Gender
  injury_level: InjuryLevel
  reporter_id: string
  reporter_name: string
  created_at: string
  updated_at: string
}

export interface Rectification {
  id: string
  event_id: string
  measure: string
  responsible_person: string
  deadline: string
  status: RectificationStatus
  closed_at: string | null
  created_at: string
}

export interface EventStatusLog {
  id: string
  event_id: string
  from_status: EventStatus | null
  to_status: EventStatus
  operator: string
  operated_at: string
  remark: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface SeverityCheckResult {
  is_severe: boolean
  deadline: string | null
  hours_remaining: number | null
  warning_message: string | null
}

export interface ArchiveCheckResult {
  can_archive: boolean
  open_rectifications: number
  warning_message: string | null
}

export interface CreateEventInput {
  event_name: string
  severity: Severity
  event_time: string
  discover_time: string
  description: string
  device_name: string
  device_model: string
  manufacturer: string
  batch_no?: string
  patient_name?: string
  patient_age?: number
  patient_gender?: Gender
  injury_level: InjuryLevel
}

export interface CreateRectificationInput {
  event_id: string
  measure: string
  responsible_person: string
  deadline: string
}

export interface UpdateRectificationInput {
  measure?: string
  responsible_person?: string
  deadline?: string
  status?: RectificationStatus
}

export interface EventListParams {
  status?: EventStatus
  severity?: Severity
  keyword?: string
  page?: number
  page_size?: number
}
