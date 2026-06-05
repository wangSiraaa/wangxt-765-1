import { AlertTriangle, X } from 'lucide-react'
import type { ArchiveCheckResult } from '../../shared/types'

export default function ArchiveWarningModal({
  check,
  onClose,
}: {
  check: ArchiveCheckResult
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">归档操作被拦截</h2>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
              {check.warning_message}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">未关闭整改任务数</span>
              <span className="text-2xl font-bold text-amber-600">{check.open_rectifications}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-5">
            请先完成所有整改任务的关闭操作，然后再尝试归档。整改未全部完成的事件不能归档。
          </p>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            知晓，去处理整改
          </button>
        </div>
      </div>
    </div>
  )
}
