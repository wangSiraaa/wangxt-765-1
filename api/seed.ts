import { initDatabase, closeDatabase, saveDatabase, getDatabase } from './database.js'
import { createEvent, createRectification } from './services/eventService.js'
import type { CreateEventInput, CreateRectificationInput } from '../shared/types.js'

export async function runSeed(): Promise<void> {
  console.log('Initializing database...')
  await initDatabase()

  const now = new Date()
  const events: CreateEventInput[] = [
    {
      event_name: '输液泵流速异常',
      severity: '严重',
      event_time: new Date(now.getTime() - 12 * 3600000).toISOString().slice(0, 16),
      discover_time: new Date(now.getTime() - 10 * 3600000).toISOString().slice(0, 16),
      description: 'ICU病房使用中的输液泵出现流速异常，实际输液速度与设定值偏差超过20%，可能对患者造成输液过量的风险。',
      device_name: '智能输液泵 IP-2000',
      device_model: 'IP-2000A',
      manufacturer: '某医疗设备有限公司',
      batch_no: 'BN20250101',
      patient_name: '张三丰',
      patient_age: 65,
      patient_gender: '男',
      injury_level: '中度',
    },
    {
      event_name: '心电监护仪报警失灵',
      severity: '特别严重',
      event_time: new Date(now.getTime() - 2 * 3600000).toISOString().slice(0, 16),
      discover_time: new Date(now.getTime() - 1 * 3600000).toISOString().slice(0, 16),
      description: '心电监护仪在患者心率异常时未能触发报警，导致医护人员未能及时发现患者病情变化，延误了救治时机。',
      device_name: '多参数心电监护仪 MG-500',
      device_model: 'MG-500B',
      manufacturer: '某医疗器械集团',
      batch_no: 'BN20250215',
      patient_name: '李四光',
      patient_age: 72,
      patient_gender: '女',
      injury_level: '重度',
    },
    {
      event_name: '血压计测量值偏差',
      severity: '一般',
      event_time: new Date(now.getTime() - 72 * 3600000).toISOString().slice(0, 16),
      discover_time: new Date(now.getTime() - 68 * 3600000).toISOString().slice(0, 16),
      description: '电子血压计测量值与水银血压计偏差超过10mmHg，多次测量结果不一致。',
      device_name: '电子血压计 BP-100',
      device_model: 'BP-100C',
      manufacturer: '某健康科技公司',
      batch_no: 'BN20250301',
      patient_name: '王小明',
      patient_age: 45,
      patient_gender: '男',
      injury_level: '无',
    },
    {
      event_name: '手术器械断裂',
      severity: '严重',
      event_time: new Date(now.getTime() - 48 * 3600000).toISOString().slice(0, 16),
      discover_time: new Date(now.getTime() - 47 * 3600000).toISOString().slice(0, 16),
      description: '手术过程中骨科钻头发生断裂，断裂碎片残留在患者体内，需二次手术取出。',
      device_name: '骨科手术钻 SD-300',
      device_model: 'SD-300D',
      manufacturer: '某手术器械公司',
      batch_no: 'BN20241201',
      patient_name: '赵六安',
      patient_age: 38,
      patient_gender: '男',
      injury_level: '中度',
    },
    {
      event_name: '呼吸机管路漏气',
      severity: '一般',
      event_time: new Date(now.getTime() - 120 * 3600000).toISOString().slice(0, 16),
      discover_time: new Date(now.getTime() - 118 * 3600000).toISOString().slice(0, 16),
      description: '呼吸机管路连接处存在漏气现象，导致患者实际吸入氧浓度低于设定值，经更换管路后恢复正常。',
      device_name: '便携式呼吸机 VM-800',
      device_model: 'VM-800E',
      manufacturer: '某呼吸设备公司',
      batch_no: 'BN20250201',
      patient_name: '陈七花',
      patient_age: 58,
      patient_gender: '女',
      injury_level: '轻度',
    },
  ]

  const rectificationInputs: CreateRectificationInput[] = []

  console.log('Creating seed events...')
  for (const input of events) {
    const event = createEvent(input)
    console.log(`  Created event: ${event.event_code} - ${event.event_name}`)

    if (event.event_name === '血压计测量值偏差') {
      rectificationInputs.push({
        event_id: event.id,
        measure: '对该批次血压计进行全面校准检测',
        responsible_person: '设备科王工程师',
        deadline: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
      })
    }
    if (event.event_name === '呼吸机管路漏气') {
      rectificationInputs.push({
        event_id: event.id,
        measure: '更换全部同型号管路，对在用设备进行气密性检测',
        responsible_person: '设备科李工程师',
        deadline: new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10),
      })
      rectificationInputs.push({
        event_id: event.id,
        measure: '修订呼吸机日常巡检操作规程，增加管路检查项目',
        responsible_person: '护理部张主任',
        deadline: new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10),
      })
    }
  }

  console.log('Creating seed rectifications...')
  for (const input of rectificationInputs) {
    const rect = createRectification(input)
    console.log(`  Created rectification for event: ${input.event_id}`)
  }

  saveDatabase()
  console.log('Seed data created successfully!')
}

export function hasSeedData(): boolean {
  try {
    const db = getDatabase()
    const result = db.exec('SELECT COUNT(*) as count FROM adverse_events')
    if (result && result[0] && result[0].values && result[0].values[0]) {
      const count = result[0].values[0][0] as number
      return count > 0
    }
    return false
  } catch {
    return false
  }
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  runSeed()
    .then(() => closeDatabase())
    .catch(console.error)
}
