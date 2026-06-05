import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Wrench, Archive, EyeOff, Clock, AlertTriangle, Plus } from 'lucide-react'
import { useEventStore } from '@/store/eventStore'
import StatusBadge from '@/components/StatusBadge'
import SeverityBadge from '@/components/SeverityBadge'
import DesensitizedInfo from '@/components/DesensitizedInfo'
import ArchiveWarningModal from '@/components/ArchiveWarningModal'
import type { RectificationStatus } from '../../shared/types'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useEventStore()
  const [showAddRect, setShowAddRect] = useState(false)
  const [rectForm, setRectForm] = useState({ measure: '', responsible_person: '', deadline: '' })

  useEffect(() => {
    if (id) store.fetchEventDetail(id)
  }, [id])

  const event = store.currentEvent
  if (!event) return <div className="p-12 text-center text-slate-400">加载中...</div>

  const canApprove = event.status === '已上报'
  const canReject = event.status === '已上报'
  const canSubmit = event.status === '已登记'
  const canAssign = event.status === '审核通过' || event.status === '整改中'
  const canArchive = event.status === '整改中'

  const handleStatusChange = async (status: string, remark: string) => {
    if (!id) return
    await store.updateEventStatus(id, status, '管理员', remark)
    store.fetchEventDetail(id)
  }

  const handleArchive = async () => {
    if (!id) return
    const success = await store.archiveEvent(id, '管理员')
    if (success) {
      store.fetchEventDetail(id)
    }
  }

  const handleAddRectification = async () => {
    if (!id || !rectForm.measure || !rectForm.responsible_person || !rectForm.deadline) return
    await store.createRectification({
      event_id: id,
      ...rectForm,
    })
    setShowAddRect(false)
    setRectForm({ measure: '', responsible_person: '', deadline: '' })
  }

  const handleCloseRect = async (rectId: string) => {
    await store.closeRectification(rectId)
  }

  const rectStatusConfig: Record<RectificationStatus, { bg: string; text: string }> = {
    '待执行': { bg: 'bg-slate-100', text: 'text-slate-700' },
    '执行中': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '已关闭': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{event.event_name}</h1>
              <SeverityBadge severity={event.severity} />
              <StatusBadge status={event.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1 font-mono">{event.event_code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSubmit && (
            <button onClick={() => handleStatusChange('已上报', '提交上报')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              提交上报
            </button>
          )}
          {canApprove && (
            <button onClick={() => handleStatusChange('审核通过', '审核通过')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
              <CheckCircle className="w-4 h-4" /> 审核通过
            </button>
          )}
          {canReject && (
            <button onClick={() => handleStatusChange('审核驳回', '审核驳回')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              <XCircle className="w-4 h-4" /> 审核驳回
            </button>
          )}
          {canArchive && (
            <button onClick={handleArchive} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
              <Archive className="w-4 h-4" /> 归档
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full"></span>
              事件信息
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="text-slate-500">事件名称：</span><span className="font-medium text-slate-800">{event.event_name}</span></div>
              <div><span className="text-slate-500">严重等级：</span><SeverityBadge severity={event.severity} /></div>
              <div><span className="text-slate-500">发生时间：</span><span className="text-slate-800">{event.event_time?.replace('T', ' ').slice(0, 16)}</span></div>
              <div><span className="text-slate-500">发现时间：</span><span className="text-slate-800">{event.discover_time?.replace('T', ' ').slice(0, 16)}</span></div>
              <div className="col-span-2"><span className="text-slate-500">事件描述：</span><span className="text-slate-800">{event.description}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              设备信息
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="text-slate-500">设备名称：</span><span className="text-slate-800">{event.device_name}</span></div>
              <div><span className="text-slate-500">设备型号：</span><span className="text-slate-800">{event.device_model}</span></div>
              <div><span className="text-slate-500">生产企业：</span><span className="text-slate-800">{event.manufacturer}</span></div>
              <div><span className="text-slate-500">批号：</span><span className="text-slate-800">{event.batch_no}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              患者信息
              <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <EyeOff className="w-3 h-3" /> 已脱敏
              </span>
            </h2>
            {store.desensitizedNotice && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700">{store.desensitizedNotice}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="text-slate-500">患者姓名：</span><DesensitizedInfo value={event.patient_name} label="患者姓名已脱敏，仅保留首尾字符" /></div>
              <div><span className="text-slate-500">年龄：</span><span className="text-slate-800">{event.patient_age || '-'}</span></div>
              <div><span className="text-slate-500">性别：</span><span className="text-slate-800">{event.patient_gender}</span></div>
              <div><span className="text-slate-500">伤害程度：</span><span className="text-slate-800">{event.injury_level}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              状态流转
            </h2>
            <div className="space-y-3">
              {store.statusLog.map((log, idx) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${idx === store.statusLog.length - 1 ? 'bg-teal-500' : 'bg-slate-300'}`} />
                    {idx < store.statusLog.length - 1 && <div className="w-0.5 h-6 bg-slate-200" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{log.to_status}</p>
                    <p className="text-xs text-slate-500">{log.operated_at?.replace('T', ' ').slice(0, 16)} · {log.operator}</p>
                    {log.remark && <p className="text-xs text-slate-400 mt-0.5">{log.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                整改任务
              </h2>
              {canAssign && (
                <button
                  onClick={() => setShowAddRect(true)}
                  className="text-xs px-3 py-1.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 添加
                </button>
              )}
            </div>

            {store.rectifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无整改任务</p>
            ) : (
              <div className="space-y-3">
                {store.rectifications.map((rect) => {
                  const sc = rectStatusConfig[rect.status]
                  return (
                    <div key={rect.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{rect.status}</span>
                        {rect.status !== '已关闭' && (
                          <button
                            onClick={() => handleCloseRect(rect.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            关闭
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 mb-1">{rect.measure}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{rect.responsible_person}</span>
                        <span>截止：{rect.deadline}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {showAddRect && (
              <div className="mt-4 border border-teal-200 rounded-lg p-4 bg-teal-50/50">
                <h3 className="text-sm font-medium text-slate-800 mb-3">新增整改任务</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">整改措施 *</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                      rows={2}
                      value={rectForm.measure}
                      onChange={(e) => setRectForm({ ...rectForm, measure: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">责任人 *</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={rectForm.responsible_person}
                        onChange={(e) => setRectForm({ ...rectForm, responsible_person: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">截止日期 *</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={rectForm.deadline}
                        onChange={(e) => setRectForm({ ...rectForm, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddRect(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                    <button onClick={handleAddRectification} className="px-3 py-1.5 text-xs bg-teal-700 text-white rounded-lg hover:bg-teal-800">确认添加</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {store.archiveWarningVisible && store.archiveCheck && (
        <ArchiveWarningModal
          check={store.archiveCheck}
          onClose={() => store.setArchiveWarningVisible(false)}
        />
      )}
    </div>
  )
}
