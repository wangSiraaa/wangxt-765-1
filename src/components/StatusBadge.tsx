import type { EventStatus } from '../../shared/types'

const statusConfig: Record<EventStatus, { bg: string; text: string; dot: string }> = {
  '已登记': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  '已上报': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  '审核通过': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  '审核驳回': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  '整改中': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  '已归档': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export default function StatusBadge({ status }: { status: EventStatus }) {
  const config = statusConfig[status] || statusConfig['已登记']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  )
}
