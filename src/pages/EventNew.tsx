import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useEventStore } from '@/store/eventStore'
import SeverityWarningModal from '@/components/SeverityWarningModal'
import type { Severity, InjuryLevel, Gender, CreateEventInput } from '../../shared/types'

export default function EventNew() {
  const navigate = useNavigate()
  const store = useEventStore()
  const [severityCheck, setSeverityCheck] = useState<any>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingData, setPendingData] = useState<CreateEventInput | null>(null)

  const [form, setForm] = useState<CreateEventInput>({
    event_name: '',
    severity: '一般',
    event_time: '',
    discover_time: '',
    description: '',
    device_name: '',
    device_model: '',
    manufacturer: '',
    batch_no: '',
    patient_name: '',
    patient_age: 0,
    patient_gender: '未知',
    injury_level: '无',
  })

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.severity === '严重' || form.severity === '特别严重') {
      const result = await store.createEvent(form)
      if (result && result.severityCheck && result.severityCheck.is_severe) {
        setSeverityCheck(result.severityCheck)
        setPendingData(form)
        setShowWarning(true)
      }
    } else {
      const result = await store.createEvent(form)
      if (result) {
        navigate(`/events/${result.event.id}`)
      }
    }
  }

  const handleConfirmSeverity = () => {
    setShowWarning(false)
    if (pendingData) {
      store.fetchEvents()
      navigate('/')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">登记不良事件</h1>
          <p className="text-sm text-slate-500 mt-1">填写医疗器械不良事件信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full"></span>
              基本信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">事件名称 *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.event_name}
                  onChange={(e) => updateForm('event_name', e.target.value)}
                  placeholder="请输入事件名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">严重等级 *</label>
                <div className="flex gap-2">
                  {(['一般', '严重', '特别严重'] as Severity[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateForm('severity', s)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        form.severity === s
                          ? s === '特别严重'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : s === '严重'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {s === '严重' || s === '特别严重' ? <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> : null}
                      {s}
                    </button>
                  ))}
                </div>
                {(form.severity === '严重' || form.severity === '特别严重') && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      {form.severity}不良事件必须在发现后24小时内上报！
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">伤害程度 *</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.injury_level}
                  onChange={(e) => updateForm('injury_level', e.target.value as InjuryLevel)}
                >
                  <option value="无">无</option>
                  <option value="轻度">轻度</option>
                  <option value="中度">中度</option>
                  <option value="重度">重度</option>
                  <option value="死亡">死亡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">发生时间 *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.event_time}
                  onChange={(e) => updateForm('event_time', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">发现时间 *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.discover_time}
                  onChange={(e) => updateForm('discover_time', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">事件描述 *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="详细描述事件经过、发现情况及初步判断"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              设备信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">设备名称 *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.device_name}
                  onChange={(e) => updateForm('device_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">设备型号</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.device_model}
                  onChange={(e) => updateForm('device_model', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">生产企业</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.manufacturer}
                  onChange={(e) => updateForm('manufacturer', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">批号</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.batch_no}
                  onChange={(e) => updateForm('batch_no', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              患者信息
              <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">患者信息将脱敏展示</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">患者姓名</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.patient_name}
                  onChange={(e) => updateForm('patient_name', e.target.value)}
                  placeholder="录入后将脱敏展示"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">年龄</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.patient_age || ''}
                  onChange={(e) => updateForm('patient_age', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.patient_gender}
                  onChange={(e) => updateForm('patient_gender', e.target.value as Gender)}
                >
                  <option value="未知">未知</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors shadow-md"
            >
              <Save className="w-4 h-4" />
              提交登记
            </button>
          </div>
        </div>
      </form>

      {showWarning && severityCheck && (
        <SeverityWarningModal
          check={severityCheck}
          onClose={() => setShowWarning(false)}
          onConfirm={handleConfirmSeverity}
        />
      )}
    </div>
  )
}
