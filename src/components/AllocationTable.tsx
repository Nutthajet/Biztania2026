import { ArrowRight, ArrowUpRight, Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
import type { AllocationResult, Opportunity } from '@/types';
import { firstName, money } from '@/lib/format';
import { Avatar } from './ui';
export function AllocationTable({
  result,
  selectedId,
  onSelect,
  filter,
  setFilter,
  onExport,
  isRunning,
  showAll = false,
}: {
  result: AllocationResult;
  selectedId?: string;
  onSelect: (o: Opportunity) => void;
  filter: string;
  setFilter: (s: string) => void;
  onExport: () => void;
  isRunning: boolean;
  showAll?: boolean;
}) {
  const opportunities = showAll
    ? result.candidates.map((o, index) => ({
        ...(result.opportunities.find((assigned) => assigned.id === o.id) ?? o),
        rank: index + 1,
      }))
    : result.opportunities;
  const rows = opportunities.filter(
    (o) =>
      filter === 'all' || (filter === 'high' ? o.score >= 70 : o.customer.opportunity === filter),
  );
  return (
    <section className={`allocation-table-panel ${isRunning ? 'is-running' : ''}`}>
      <div className="section-head">
        <div className="section-title-group">
          <h2>{showAll ? 'โอกาสการขายทั้งหมด' : 'แผนจัดสรรที่แนะนำ'}</h2>
          <span className="count-badge">{opportunities.length}</span>
        </div>
        <button className="text-button" onClick={onExport} disabled={!result.opportunities.length}>
          ส่งออกแผน <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="table-toolbar">
        <div className="table-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            ทุกโอกาส
          </button>
          <button className={filter === 'high' ? 'active' : ''} onClick={() => setFilter('high')}>
            มูลค่าสูง <span>{opportunities.filter((o) => o.score >= 70).length}</span>
          </button>
        </div>
        <label className="table-filter">
          <SlidersHorizontal size={13} />
          <select
            aria-label="กรองประเภท Opportunity"
            value={['Reorder', 'Cross-sell', 'Retention'].includes(filter) ? filter : 'all'}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">ทุกประเภท</option>
            <option>Reorder</option>
            <option>Cross-sell</option>
            <option>Retention</option>
          </select>
        </label>
      </div>
      <div className="table-scroll allocation-scroll">
        <table className="data-table allocation-table">
          <thead>
            <tr>
              <th className="rank-cell">#</th>
              <th>ลูกค้า / Opportunity</th>
              <th>สินค้าที่แนะนำ</th>
              <th className="number">Revenue</th>
              <th className="number">Gross margin</th>
              <th>Rep</th>
              <th className="number">ชั่วโมง</th>
              <th>
                <span className="sr-only">รายละเอียด</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className={o.id === selectedId ? 'selected' : ''}
                onClick={() => onSelect(o)}
              >
                <td className="rank-cell">
                  <span className={o.rank === 1 ? 'rank-first' : ''}>
                    {String(o.rank).padStart(2, '0')}
                  </span>
                </td>
                <td>
                  <button
                    className="customer-select"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(o);
                    }}
                  >
                    <strong>{o.customer.companyName}</strong>
                    <small>
                      <span
                        className={`opportunity-dot ${o.customer.opportunity === 'Retention' ? 'amber-dot' : ''}`}
                      />
                      {o.customer.opportunity}
                      {showAll ? (
                        <span className="overdue">
                          {' '}
                          ·{' '}
                          {result.opportunities.some((assigned) => assigned.id === o.id)
                            ? 'จัดสรรให้เข้าพบ'
                            : 'เลื่อนเข้าพบ'}
                        </span>
                      ) : (
                        o.overdueDays > 0 && (
                          <span className="overdue"> · เกินรอบ {o.overdueDays} วัน</span>
                        )
                      )}
                    </small>
                  </button>
                </td>
                <td className="product-cell">
                  {o.product.productName}
                  {o.alternative && <small>สินค้าทดแทนที่มีสต็อก</small>}
                </td>
                <td className="number">{money(o.expectedRevenue)}</td>
                <td className="number margin-value">{money(o.expectedMargin)}</td>
                <td>
                  <span className="table-rep">
                    <Avatar name={o.rep.name} small />
                    {firstName(o.rep.name)}
                  </span>
                </td>
                <td className="number hours-cell">{o.hours}h</td>
                <td>
                  <ChevronRight size={13} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty-state">
            <SlidersHorizontal size={25} />
            <h3>
              {result.opportunities.length
                ? 'ไม่พบโอกาสที่ตรงกับตัวกรอง'
                : 'ไม่พบโอกาสที่เหมาะสมภายใต้ข้อจำกัดนี้'}
            </h3>
            <p>
              {result.opportunities.length
                ? 'เลือกทุกโอกาสเพื่อดูแผนทั้งหมด'
                : 'ลองลด Margin ขั้นต่ำ คืนค่าสต็อก หรือเพิ่มเวลาของ Sales Rep'}
            </p>
            {result.opportunities.length > 0 && (
              <button className="button" onClick={() => setFilter('all')}>
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}
      </div>
      <div className="allocation-totals">
        <span>จัดสรรให้เข้าพบ {result.opportunities.length} ราย</span>
        <strong>
          {money(result.expectedRevenue)}
          <small>revenue</small>
        </strong>
        <strong className="teal">
          {money(result.expectedMargin)}
          <small>gross margin</small>
        </strong>
        <strong>
          {result.totalHours}h<small>จัดสรรแล้ว</small>
        </strong>
      </div>
      <div className="allocation-footnote">
        <Check size={13} />
        <span>พิจารณา Margin ความเร่งด่วน สต็อก และเวลาที่มี</span>
        <span className="push-right">
          เลือกแถวเพื่อดูเหตุผล <ArrowRight size={12} />
        </span>
      </div>
    </section>
  );
}
