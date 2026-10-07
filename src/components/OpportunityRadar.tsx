'use client';
import { useState } from 'react';
import type { Opportunity } from '@/types';
import { money, percent } from '@/lib/format';
export function OpportunityRadar({
  opportunities,
  selectedId,
  onSelect,
}: {
  opportunities: Opportunity[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const ceiling = Math.max(
    20000,
    ...opportunities.map((o) => Math.ceil(o.expectedMargin / 5000) * 5000),
  );
  const x = (p: number) => 54 + ((p - 0.35) / 0.65) * 460;
  const y = (margin: number) => 176 - (margin / ceiling) * 140;
  const active = opportunities.find((o) => o.id === hover);
  return (
    <div className="radar">
      <svg
        viewBox="0 0 550 228"
        role="img"
        aria-label="Opportunity Radar แกนนอนคือ Purchase Probability แกนตั้งคือ Expected Gross Margin ขนาดวงกลมแสดง Expected Revenue"
      >
        <rect x="335" y="26" width="185" height="80" fill="var(--accent-wash)" rx="3" />
        <text x="507" y="42" textAnchor="end" className="chart-zone-label">
          โอกาสมูลค่าสูง
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1="54" x2="520" y1={y(t * ceiling)} y2={y(t * ceiling)} className="grid-line" />
            <text x="43" y={y(t * ceiling) + 4} textAnchor="end">
              {(t * ceiling) / 1000}K
            </text>
          </g>
        ))}
        {[0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((p) => (
          <text key={p} x={x(p)} y="195" textAnchor="middle">
            {percent(p)}
          </text>
        ))}
        <text x="285" y="222" textAnchor="middle" className="axis-title">
          Purchase probability
        </text>
        <text
          x="9"
          y="110"
          transform="rotate(-90 9 110)"
          textAnchor="middle"
          className="axis-title"
        >
          Expected gross margin (฿)
        </text>
        {opportunities.map((o) => (
          <g
            key={o.id}
            role="button"
            tabIndex={0}
            aria-label={`${o.customer.companyName}: ${percent(o.customer.purchaseProbability)} probability, ${money(o.expectedMargin)} margin`}
            onClick={() => onSelect(o.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(o.id);
              }
            }}
            onMouseEnter={() => setHover(o.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(o.id)}
            onBlur={() => setHover(null)}
            className="radar-point"
          >
            <circle
              cx={x(o.customer.purchaseProbability)}
              cy={y(o.expectedMargin)}
              r={Math.max(4, Math.sqrt(o.expectedRevenue / 650))}
              fill={
                o.customer.churnRisk >= 0.6
                  ? 'var(--amber)'
                  : o.score >= 70
                    ? 'var(--accent)'
                    : 'var(--chart-muted)'
              }
              opacity={o.id === selectedId ? 1 : 0.72}
              stroke={o.id === selectedId ? 'var(--accent)' : 'var(--surface)'}
              strokeWidth={o.id === selectedId ? 3 : 1.5}
            />
            {o.customer.id === 'c1' && (
              <text
                x={x(o.customer.purchaseProbability) - 13}
                y={y(o.expectedMargin) - 16}
                className="point-label"
              >
                ABC Foods
              </text>
            )}
            <title>{`${o.customer.companyName}: ${money(o.expectedRevenue)} expected revenue`}</title>
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i className="high" /> มูลค่าสูง
        </span>
        <span>
          <i /> Opportunity
        </span>
        <span>
          <i className="risk" /> Churn risk
        </span>
        <span className="push-right">ขนาด = Expected Revenue</span>
      </div>
      {active && (
        <div className="radar-tooltip">
          {active.customer.companyName} · {money(active.expectedMargin)} margin ·{' '}
          {percent(active.customer.purchaseProbability)} probability
        </div>
      )}
    </div>
  );
}
