import type { ReactNode } from 'react';
import { ArrowUpRight, Check, CircleHelp } from 'lucide-react';
import type { AllocationResult, Constraints, EnterpriseData } from '@/types';
import { firstName, money } from '@/lib/format';
export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? 'small' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`avatar ${small ? 'avatar-small' : ''}`}>
      {name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function Status({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <span className={`status ${warning ? 'warning' : ''}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
export function Metrics({
  result,
  constraints,
}: {
  result: AllocationResult;
  constraints: Constraints;
}) {
  const metrics = [
    {
      label: 'Expected revenue',
      value: money(result.expectedRevenue),
      note: 'ถ่วงน้ำหนักตามโอกาสซื้อ',
    },
    {
      label: 'Expected gross margin',
      value: money(result.expectedMargin),
      note: `${result.totalHours ? money(result.expectedMargin / result.totalHours) : '฿0'} ต่อชั่วโมงที่จัดสรร`,
      accent: true,
    },
    {
      label: 'โอกาสที่ได้รับการจัดสรร',
      value: String(result.opportunities.length).padStart(2, '0'),
      note: `จากลูกค้าทั้งหมด 24 ราย`,
    },
    {
      label: 'สัดส่วนเวลาที่ใช้',
      value: `${Math.round((result.totalHours / constraints.hours) * 100)}%`,
      note: `จัดสรรแล้ว ${result.totalHours} จาก ${constraints.hours} ชั่วโมง`,
    },
  ];
  return (
    <div className="metrics-strip">
      {metrics.map((m) => (
        <div className="metric" key={m.label}>
          <div className="metric-label">
            {m.label}
            <CircleHelp size={12} />
          </div>
          <div className={`metric-value ${m.accent ? 'teal' : ''}`}>
            {m.value}
            {m.accent && <ArrowUpRight size={21} />}
          </div>
          <div className="metric-note">{m.note}</div>
        </div>
      ))}
    </div>
  );
}
export function CapacityBars({
  data,
  result,
  constraints,
  compact = false,
}: {
  data: EnterpriseData;
  result: AllocationResult;
  constraints: Constraints;
  compact?: boolean;
}) {
  return (
    <div className={`capacity-bars ${compact ? 'compact' : ''}`}>
      {data.reps.map((rep) => {
        const used = result.repHours[rep.id] ?? 0;
        const capacity = constraints.repCapacity[rep.id] ?? rep.availableHours;
        return (
          <div className="rep-bar-row" key={rep.id}>
            <Avatar name={rep.name} small />
            <span className="rep-bar-name">{firstName(rep.name)}</span>
            <div className="capacity-track" title={`ใช้แล้ว ${used} จาก ${capacity} ชั่วโมง`}>
              <div style={{ width: `${capacity ? (used / capacity) * 100 : 0}%` }} />
            </div>
            <span className="rep-bar-value">
              {used}
              <span> / {capacity}h</span>
            </span>
          </div>
        );
      })}
      <div className="bar-legend">
        <span>
          <i /> จัดสรรแล้ว
        </span>
        <span>
          <i /> ยังว่าง
        </span>
        <span className="push-right">ใช้แล้ว {result.totalHours}h</span>
      </div>
    </div>
  );
}
export function Evidence({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="evidence-item">
      <span className="evidence-check">
        <Check size={12} />
      </span>
      <div>
        <span>{title}</span>
        <small>{detail}</small>
      </div>
    </div>
  );
}
