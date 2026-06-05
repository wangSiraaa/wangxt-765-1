import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useEventStore } from '@/store/eventStore'
import type { Rectification, RectificationStatus } from '../../shared/types'

export default function RectificationList() {
  const store = useEventStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<RectificationStatus | ''>('')
  const [rects, setRects] = useState<Rectification[]>([])

  useEffect(() => {
    loadRectifications()
  }, [filter])

  const loadRectifications = async () => {
    await store.fetchRectifications(undefined, filter || undefined)
    setRects(store.rectifications)
  }

  useEffect(() => {
    setRects(store.rectifications)
  }, [store.rectifications])

  const handleClose = async (id: string) => {
    await store.closeRectification(id)
    loadRectifications()
  }

  const statusIcon = (status: RectificationStatus) => {
    switch (status) {
      case '已关闭': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case '执行中': return <Clock className="w-5 h-5 text-blue-500" />
      default: return <AlertCircle className="w-5 h-5 text-slate-400" />
    }
  }

  const statusColor: Record<RectificationStatus, string> = {
    '待执行': 'border-l-slate-400',
    '执行中': 'border-l-blue-500',
    '已关闭': 'border-l-emerald-500',
  }

  const isOverdue = (deadline: string, status: RectificationStatus) => {
    if (status === '已关闭') return false
    return new Date(deadline) < new Date()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">整改跟踪</h1>
          <p className="text-sm text-slate-500 mt-1">管理所有不良事件的整改任务</p>
        </div>
        <div className="flex items-center gap-2">
          {(['', '待执行', '执行中', '已关闭'] as (RectificationStatus | '')[]).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s || '全部'}
            </button>
          ))}
        </div>
      </div>

      {rects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">暂无整改任务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rects.map((rect) => (
            <div
              key={rect.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 ${statusColor[rect.status]} p-5 hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => navigate(`/events/${rect.event_id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcon(rect.status)}
                  <span className={`text-sm font-medium ${
                    rect.status === '已关闭' ? 'text-emerald-700' : rect.status === '执行中' ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    {rect.status}
                  </span>
                </div>
                {rect.status !== '已关闭' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClose(rect.id) }}
                    className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    关闭
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-800 mb-3 line-clamp-2">{rect.measure}</p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{rect.responsible_person}</span>
                <span className={`flex items-center gap-1 ${isOverdue(rect.deadline, rect.status) ? 'text-red-500 font-medium' : ''}`}>
                  {isOverdue(rect.deadline, rect.status) && <AlertCircle className="w-3 h-3" />}
                  截止：{rect.deadline}
                </span>
              </div>

              {rect.closed_at && (
                <p className="text-xs text-emerald-600 mt-2">关闭时间：{rect.closed_at}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
