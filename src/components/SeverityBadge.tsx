import type { Severity } from '../../shared/types'

const severityConfig: Record<Severity, { bg: string; text: string; icon: string }> = {
  '一般': { bg: 'bg-sky-50', text: 'text-sky-700', icon: '●' },
  '严重': { bg: 'bg-amber-50', text: 'text-amber-700', icon: '◆' },
  '特别严重': { bg: 'bg-red-50', text: 'text-red-700', icon: '▲' },
}

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const config = severityConfig[severity]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {severity}
    </span>
  )
}
