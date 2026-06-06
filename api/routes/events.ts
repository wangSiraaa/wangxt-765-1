import { Router, type Request, type Response } from 'express'
import {
  createEvent,
  getEventById,
  listEvents,
  updateEventStatus,
  archiveEvent,
  getEventStatusLog,
  checkSeverity,
  getStats,
} from '../services/eventService.js'
import {
  createRectification,
  listRectifications,
  getRectificationById,
  updateRectification,
  closeRectification,
} from '../services/eventService.js'
import type { CreateEventInput, CreateRectificationInput, UpdateRectificationInput } from '../../shared/types.js'

const router = Router()

router.get('/events', (req: Request, res: Response) => {
  try {
    const params = {
      status: req.query.status as any,
      severity: req.query.severity as any,
      keyword: req.query.keyword as string,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 10,
    }
    const result = listEvents(params)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.get('/events/stats', (req: Request, res: Response) => {
  try {
    const stats = getStats()
    res.json({ code: 0, message: 'ok', data: stats })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.get('/events/:id', (req: Request, res: Response) => {
  try {
    const event = getEventById(req.params.id)
    if (!event) {
      res.status(404).json({ code: 404, message: '事件不存在', data: null })
      return
    }
    const logs = getEventStatusLog(req.params.id)
    const rectifications = listRectifications(req.params.id)
    res.json({
      code: 0,
      message: 'ok',
      data: {
        event,
        status_log: logs,
        rectifications,
        desensitized_notice: '患者姓名已脱敏展示，仅保留首尾字符',
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.post('/events', (req: Request, res: Response) => {
  try {
    const input: CreateEventInput = req.body
    if (!input.event_name || !input.severity || !input.event_time || !input.discover_time || !input.description || !input.device_name || !input.injury_level) {
      res.status(400).json({ code: 400, message: '缺少必填字段', data: null })
      return
    }
    const severityCheck = checkSeverity(input)
    const event = createEvent(input)
    res.status(201).json({
      code: 0,
      message: '事件创建成功',
      data: { event, severity_check: severityCheck },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.put('/events/:id/status', (req: Request, res: Response) => {
  try {
    const { status, operator, remark } = req.body
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少状态参数', data: null })
      return
    }
    const event = updateEventStatus(req.params.id, status, operator || '操作员', remark || '')
    if (!event) {
      res.status(404).json({ code: 404, message: '事件不存在', data: null })
      return
    }
    res.json({ code: 0, message: '状态更新成功', data: event })
  } catch (error: any) {
    res.status(400).json({ code: 400, message: error.message, data: null })
  }
})

router.put('/events/:id/archive', (req: Request, res: Response) => {
  try {
    const { operator } = req.body
    const result = archiveEvent(req.params.id, operator || '操作员')
    if (!result.success) {
      res.status(400).json({
        code: 400,
        message: result.check.warning_message,
        data: { event: result.event, check: result.check },
      })
      return
    }
    res.json({ code: 0, message: '归档成功', data: result.event })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.get('/events/:id/severity-check', (req: Request, res: Response) => {
  try {
    const event = getEventById(req.params.id)
    if (!event) {
      res.status(404).json({ code: 404, message: '事件不存在', data: null })
      return
    }
    const severityCheck = checkSeverity(event as any)
    res.json({ code: 0, message: 'ok', data: severityCheck })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.get('/rectifications', (req: Request, res: Response) => {
  try {
    const items = listRectifications(req.query.event_id as string, req.query.status as string)
    res.json({ code: 0, message: 'ok', data: items })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.get('/rectifications/:id', (req: Request, res: Response) => {
  try {
    const item = getRectificationById(req.params.id)
    if (!item) {
      res.status(404).json({ code: 404, message: '整改任务不存在', data: null })
      return
    }
    res.json({ code: 0, message: 'ok', data: item })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.post('/rectifications', (req: Request, res: Response) => {
  try {
    const input: CreateRectificationInput = req.body
    if (!input.event_id || !input.measure || !input.responsible_person || !input.deadline) {
      res.status(400).json({ code: 400, message: '缺少必填字段', data: null })
      return
    }
    const item = createRectification(input)
    res.status(201).json({ code: 0, message: '整改任务创建成功', data: item })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.put('/rectifications/:id', (req: Request, res: Response) => {
  try {
    const input: UpdateRectificationInput = req.body
    const item = updateRectification(req.params.id, input)
    if (!item) {
      res.status(404).json({ code: 404, message: '整改任务不存在', data: null })
      return
    }
    res.json({ code: 0, message: '整改任务更新成功', data: item })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

router.put('/rectifications/:id/close', (req: Request, res: Response) => {
  try {
    const item = closeRectification(req.params.id)
    if (!item) {
      res.status(404).json({ code: 404, message: '整改任务不存在', data: null })
      return
    }
    res.json({ code: 0, message: '整改任务已关闭', data: item })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router
