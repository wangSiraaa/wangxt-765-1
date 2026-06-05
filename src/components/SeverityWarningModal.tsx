import { AlertTriangle, Clock, X } from 'lucide-react'
import type { SeverityCheckResult } from '../../shared/types'

export default function SeverityWarningModal({
  check,
  onClose,
  onConfirm,
}: {
  check: SeverityCheckResult
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-amber-500 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">严重事件上报时限提示</h2>
                <p className="text-sm text-white/80">法规要求必须在24小时内上报</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-red-800 text-sm font-medium leading-relaxed">
              {check.warning_message}
            </p>
          </div>

          {check.hours_remaining !== null && (
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 bg-slate-100 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{check.hours_remaining?.toFixed(1)}h</p>
                <p className="text-xs text-slate-500 mt-1">剩余上报时间</p>
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{check.is_severe ? '是' : '否'}</p>
                <p className="text-xs text-slate-500 mt-1">是否严重事件</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-xs text-amber-700">
              ⚠️ 根据《医疗器械不良事件监测和再评价管理办法》，严重/特别严重不良事件应当在发现后24小时内上报。逾期未上报将面临监管处罚。
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              返回修改
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-md"
            >
              我已知晓，确认提交
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
