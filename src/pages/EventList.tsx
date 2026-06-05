import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, ChevronLeft, ChevronRight, EyeOff, Activity } from 'lucide-react'
import { useEventStore } from '@/store/eventStore'
import StatusBadge from '@/components/StatusBadge'
import SeverityBadge from '@/components/SeverityBadge'
import DesensitizedInfo from '@/components/DesensitizedInfo'
import type { EventStatus, Severity } from '../../shared/types'

export default function EventList() {
  const store = useEventStore()
  const navigate = useNavigate()

  useEffect(() => {
    store.fetchEvents()
  }, [store.filterStatus, store.filterSeverity, store.filterKeyword, store.currentPage])

  const totalPages = Math.ceil(store.total / store.pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">不良事件列表</h1>
          <p className="text-sm text-slate-500 mt-1">管理和跟踪所有医疗器械不良事件</p>
        </div>
        <Link
          to="/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          登记新事件
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 flex items-center gap-2">
        <EyeOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-xs text-amber-700">患者姓名已脱敏展示，仅保留首尾字符。悬停脱敏标识可查看提示。</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索事件名称、编号、设备名称..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={store.filterKeyword}
              onChange={(e) => store.setFilterKeyword(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={store.filterStatus}
            onChange={(e) => store.setFilterStatus(e.target.value as EventStatus | '')}
          >
            <option value="">全部状态</option>
            <option value="已登记">已登记</option>
            <option value="已上报">已上报</option>
            <option value="审核通过">审核通过</option>
            <option value="审核驳回">审核驳回</option>
            <option value="整改中">整改中</option>
            <option value="已归档">已归档</option>
          </select>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={store.filterSeverity}
            onChange={(e) => store.setFilterSeverity(e.target.value as Severity | '')}
          >
            <option value="">全部等级</option>
            <option value="一般">一般</option>
            <option value="严重">严重</option>
            <option value="特别严重">特别严重</option>
          </select>
        </div>

        {store.loading ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-3" />
            加载中...
          </div>
        ) : store.events.length === 0 ? (
          <div className="p-12 text-center text-slate-400">暂无不良事件数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">事件编号</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">事件名称</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">设备</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">严重等级</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">患者姓名</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">发生时间</th>
                </tr>
              </thead>
              <tbody>
                {store.events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-100 hover:bg-teal-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-teal-700">{event.event_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{event.event_name}</td>
                    <td className="px-4 py-3 text-slate-600">{event.device_name}</td>
                    <td className="px-4 py-3 text-center">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3">
                      <DesensitizedInfo value={event.patient_name} label="患者姓名已脱敏" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{event.event_time?.replace('T', ' ').slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              共 {store.total} 条记录，第 {store.currentPage}/{totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={store.currentPage <= 1}
                onClick={() => store.setCurrentPage(store.currentPage - 1)}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={store.currentPage >= totalPages}
                onClick={() => store.setCurrentPage(store.currentPage + 1)}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
