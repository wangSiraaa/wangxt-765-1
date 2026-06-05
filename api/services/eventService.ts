import { getDatabase, saveDatabase } from '../database.js'
import { v4 as uuidv4 } from 'uuid'
import type {
  AdverseEvent,
  Rectification,
  EventStatusLog,
  CreateEventInput,
  CreateRectificationInput,
  UpdateRectificationInput,
  EventListParams,
  SeverityCheckResult,
  ArchiveCheckResult,
} from '../../shared/types.js'

function desensitizeName(name: string): string {
  if (!name || name.length === 0) return ''
  if (name.length === 1) return '*'
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

export function checkSeverity(input: CreateEventInput): SeverityCheckResult {
  if (input.severity === '严重' || input.severity === '特别严重') {
    const eventTime = new Date(input.event_time)
    const deadline = new Date(eventTime.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const hoursRemaining = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
    return {
      is_severe: true,
      deadline: deadline.toISOString(),
      hours_remaining: Math.round(hoursRemaining * 100) / 100,
      warning_message: `该事件为${input.severity}不良事件，根据法规要求必须在发现后24小时内完成上报！截止时间：${deadline.toLocaleString('zh-CN')}，剩余：${hoursRemaining.toFixed(1)}小时`,
    }
  }
  return { is_severe: false, deadline: null, hours_remaining: null, warning_message: null }
}

export function checkArchiveEligibility(eventId: string): ArchiveCheckResult {
  const db = getDatabase()
  const rows = db.exec("SELECT COUNT(*) as cnt FROM rectifications WHERE event_id = ? AND status != '已关闭'", [eventId])
  const openCount = rows.length > 0 ? (rows[0].values[0][0] as number) : 0
  if (openCount > 0) {
    return {
      can_archive: false,
      open_rectifications: openCount,
      warning_message: `该事件还有 ${openCount} 项未关闭的整改任务，请先完成所有整改后再进行归档操作`,
    }
  }
  return { can_archive: true, open_rectifications: 0, warning_message: null }
}

function rowToEvent(row: Record<string, any>, desensitize = true): AdverseEvent {
  return {
    id: row.id as string,
    event_code: row.event_code as string,
    event_name: row.event_name as string,
    severity: row.severity as any,
    status: row.status as any,
    event_time: row.event_time as string,
    discover_time: row.discover_time as string,
    description: row.description as string,
    device_name: row.device_name as string,
    device_model: row.device_model as string,
    manufacturer: row.manufacturer as string,
    batch_no: row.batch_no as string,
    patient_name: desensitize ? desensitizeName((row.patient_name as string) || '') : (row.patient_name as string),
    patient_age: row.patient_age as number,
    patient_gender: row.patient_gender as any,
    injury_level: row.injury_level as any,
    reporter_id: row.reporter_id as string,
    reporter_name: row.reporter_name as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function queryOne(sql: string, params: any[] = []): Record<string, any> | null {
  const db = getDatabase()
  const result = db.exec(sql, params)
  if (result.length === 0 || result[0].values.length === 0) return null
  const columns = result[0].columns
  const values = result[0].values[0]
  const obj: Record<string, any> = {}
  columns.forEach((col, i) => { obj[col] = values[i] })
  return obj
}

function queryAll(sql: string, params: any[] = []): Record<string, any>[] {
  const db = getDatabase()
  const result = db.exec(sql, params)
  if (result.length === 0) return []
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj: Record<string, any> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj
  })
}

export function createEvent(input: CreateEventInput): AdverseEvent {
  const db = getDatabase()
  const id = uuidv4()
  const eventCode = 'AE' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 5).toUpperCase()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.run(
    `INSERT INTO adverse_events (id, event_code, event_name, severity, status, event_time, discover_time, description, device_name, device_model, manufacturer, batch_no, patient_name, patient_age, patient_gender, injury_level, reporter_id, reporter_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, '已登记', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user001', '上报员', ?, ?)`,
    [id, eventCode, input.event_name, input.severity, input.event_time, input.discover_time, input.description, input.device_name, input.device_model, input.manufacturer, input.batch_no || '', input.patient_name || '', input.patient_age || 0, input.patient_gender || '未知', input.injury_level, now, now]
  )

  logStatusChange(id, null, '已登记', '上报员', '事件登记')
  saveDatabase()
  return getEventById(id)!
}

export function getEventById(id: string): AdverseEvent | null {
  const row = queryOne('SELECT * FROM adverse_events WHERE id = ?', [id])
  if (!row) return null
  return rowToEvent(row, true)
}

export function getEventByIdRaw(id: string): AdverseEvent | null {
  const row = queryOne('SELECT * FROM adverse_events WHERE id = ?', [id])
  if (!row) return null
  return rowToEvent(row, false)
}

export function listEvents(params: EventListParams): { items: AdverseEvent[]; total: number } {
  let where = '1=1'
  const values: any[] = []

  if (params.status) {
    where += ' AND status = ?'
    values.push(params.status)
  }
  if (params.severity) {
    where += ' AND severity = ?'
    values.push(params.severity)
  }
  if (params.keyword) {
    where += ' AND (event_name LIKE ? OR event_code LIKE ? OR device_name LIKE ?)'
    values.push(`%${params.keyword}%`, `%${params.keyword}%`, `%${params.keyword}%`)
  }

  const countRow = queryOne(`SELECT COUNT(*) as cnt FROM adverse_events WHERE ${where}`, values)
  const total = countRow ? (countRow.cnt as number) : 0

  const page = params.page || 1
  const pageSize = params.page_size || 10
  const offset = (page - 1) * pageSize

  const rows = queryAll(
    `SELECT * FROM adverse_events WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  )

  const items = rows.map(row => rowToEvent(row, true))
  return { items, total }
}

export function updateEventStatus(id: string, newStatus: string, operator: string, remark: string): AdverseEvent | null {
  const db = getDatabase()
  const event = getEventByIdRaw(id)
  if (!event) return null

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.run('UPDATE adverse_events SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, id])
  logStatusChange(id, event.status, newStatus, operator, remark)
  saveDatabase()
  return getEventById(id)
}

export function archiveEvent(id: string, operator: string): { success: boolean; event: AdverseEvent | null; check: ArchiveCheckResult } {
  const check = checkArchiveEligibility(id)
  if (!check.can_archive) {
    return { success: false, event: getEventById(id), check }
  }
  const event = updateEventStatus(id, '已归档', operator, '事件归档')
  return { success: true, event, check }
}

export function getEventStatusLog(eventId: string): EventStatusLog[] {
  const rows = queryAll('SELECT * FROM event_status_log WHERE event_id = ? ORDER BY operated_at ASC', [eventId])
  return rows as EventStatusLog[]
}

function logStatusChange(eventId: string, fromStatus: string | null, toStatus: string, operator: string, remark: string): void {
  const db = getDatabase()
  const id = uuidv4()
  db.run(
    'INSERT INTO event_status_log (id, event_id, from_status, to_status, operator, remark) VALUES (?, ?, ?, ?, ?, ?)',
    [id, eventId, fromStatus, toStatus, operator, remark || '']
  )
}

export function createRectification(input: CreateRectificationInput): Rectification {
  const db = getDatabase()
  const id = uuidv4()
  db.run(
    'INSERT INTO rectifications (id, event_id, measure, responsible_person, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.event_id, input.measure, input.responsible_person, input.deadline, '待执行']
  )
  const event = getEventByIdRaw(input.event_id)
  if (event && event.status === '审核通过') {
    updateEventStatus(input.event_id, '整改中', '系统', '分配整改任务，自动流转至整改中')
  }
  saveDatabase()
  return getRectificationById(id)!
}

export function getRectificationById(id: string): Rectification | null {
  const row = queryOne('SELECT * FROM rectifications WHERE id = ?', [id])
  return row as Rectification | null
}

export function listRectifications(eventId?: string, status?: string): Rectification[] {
  let sql = 'SELECT * FROM rectifications WHERE 1=1'
  const values: any[] = []
  if (eventId) {
    sql += ' AND event_id = ?'
    values.push(eventId)
  }
  if (status) {
    sql += ' AND status = ?'
    values.push(status)
  }
  sql += ' ORDER BY created_at DESC'
  return queryAll(sql, values) as Rectification[]
}

export function updateRectification(id: string, input: UpdateRectificationInput): Rectification | null {
  const db = getDatabase()
  const existing = getRectificationById(id)
  if (!existing) return null

  const sets: string[] = []
  const values: any[] = []
  if (input.measure !== undefined) { sets.push('measure = ?'); values.push(input.measure) }
  if (input.responsible_person !== undefined) { sets.push('responsible_person = ?'); values.push(input.responsible_person) }
  if (input.deadline !== undefined) { sets.push('deadline = ?'); values.push(input.deadline) }
  if (input.status !== undefined) { sets.push('status = ?'); values.push(input.status) }

  if (sets.length === 0) return existing

  values.push(id)
  db.run(`UPDATE rectifications SET ${sets.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return getRectificationById(id)
}

export function closeRectification(id: string): Rectification | null {
  const db = getDatabase()
  const existing = getRectificationById(id)
  if (!existing) return null

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.run("UPDATE rectifications SET status = '已关闭', closed_at = ? WHERE id = ?", [now, id])
  saveDatabase()
  return getRectificationById(id)
}

export function getStats(): { total: number; by_severity: Record<string, number>; by_status: Record<string, number> } {
  const totalRow = queryOne('SELECT COUNT(*) as cnt FROM adverse_events')
  const total = totalRow ? (totalRow.cnt as number) : 0

  const bySeverity: Record<string, number> = {}
  const sevRows = queryAll('SELECT severity, COUNT(*) as cnt FROM adverse_events GROUP BY severity')
  sevRows.forEach(row => { bySeverity[row.severity as string] = row.cnt as number })

  const byStatus: Record<string, number> = {}
  const statRows = queryAll('SELECT status, COUNT(*) as cnt FROM adverse_events GROUP BY status')
  statRows.forEach(row => { byStatus[row.status as string] = row.cnt as number })

  return { total, by_severity: bySeverity, by_status: byStatus }
}
