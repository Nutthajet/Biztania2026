'use client';
import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  Mail,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Warehouse,
  Workflow,
} from 'lucide-react';
import type {
  ActionRecord,
  AllocationResult,
  Constraints,
  EnterpriseData,
  Opportunity,
} from '@/types';
import { firstName, money, percent } from '@/lib/format';
import { dateLocale } from '@/lib/locale';
import { Avatar, BrandMark, CapacityBars, Metrics, Status } from './ui';
export function ManagerView({
  data,
  result,
  constraints,
}: {
  data: EnterpriseData;
  result: AllocationResult;
  constraints: Constraints;
}) {
  const totalCapacity = data.reps.reduce(
    (s, r) => s + (constraints.repCapacity[r.id] ?? r.availableHours),
    0,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ภาพรวมสำหรับผู้จัดการ</div>
          <h1>ทุกชั่วโมงของทีมขายมีเป้าหมาย</h1>
          <p>เราจัดสรรเวลาให้โอกาสที่มีมูลค่าสูงที่สุดแล้วหรือยัง?</p>
        </div>
        <span className="outline-tag">Manager View</span>
      </div>
      <Metrics result={result} constraints={constraints} />
      <div className="manager-grid">
        <section className="surface">
          <div className="section-head">
            <h2>เวลาและความครอบคลุมของแผน</h2>
            <Users size={17} />
          </div>
          <div className="manager-stats">
            <div>
              <strong>{totalCapacity}h</strong>
              <span>เวลาว่างรวมของทีม</span>
            </div>
            <div>
              <strong>{constraints.hours}h</strong>
              <span>เวลาที่ใช้วางแผน</span>
            </div>
            <div>
              <strong>
                {Math.round((result.opportunities.length / data.customers.length) * 100)}%
              </strong>
              <span>สัดส่วนลูกค้าที่เข้าพบ</span>
            </div>
          </div>
          <CapacityBars data={data} result={result} constraints={constraints} />
        </section>
        <section className="surface manager-impact">
          <span className="eyebrow">ผลลัพธ์ทางธุรกิจ</span>
          <h2>{money(result.expectedMargin)}</h2>
          <p>Expected Gross Margin จากเวลาทีมขาย {result.totalHours} ชั่วโมง</p>
          <div className="impact-equation">
            <span>
              {result.opportunities.length}
              <small>ลูกค้าที่ได้รับการจัดสรร</small>
            </span>
            <ArrowRight size={20} />
            <span>
              {money(result.totalHours ? result.expectedMargin / result.totalHours : 0)}
              <small>Margin ต่อชั่วโมง</small>
            </span>
          </div>
          <p className="secondary">
            ตัวเลขคาดการณ์ถ่วงน้ำหนักตามโอกาสซื้อ ใช้สำหรับวางแผน
            ไม่ใช่ยอดขายที่เกิดขึ้นแล้วหรือผลลัพธ์ที่รับประกัน
          </p>
        </section>
      </div>
      <section className="surface comparison">
        <div>
          <span className="eyebrow">ก่อนใช้ · จัดสรรด้วยตนเอง</span>
          <h2>เข้าหาลูกค้าคุ้นเคย ข้อมูลยังแยกส่วน</h2>
          {[
            'ให้เวลากับลูกค้าที่คุ้นเคยเป็นหลัก',
            'ตรวจสอบ Margin และสต็อกแยกกัน',
            'จัดสรรเวลาตามความรู้สึกและประสบการณ์',
            'สร้างงานติดตามซ้ำในหลายระบบ',
          ].map((t) => (
            <p key={t}>
              <span className="neutral-dash" />
              {t}
            </p>
          ))}
        </div>
        <div>
          <span className="eyebrow teal">เมื่อใช้ AI CONCIERGE</span>
          <h2>มองมูลค่าธุรกิจ แล้วลงมืออย่างสอดคล้อง</h2>
          {[
            'จัดลำดับเข้าพบตาม Margin และความเร่งด่วน',
            'เคารพข้อจำกัดสต็อก พื้นที่ และ Sales Rep',
            'ทุกการจัดสรรมีข้อมูลรองรับ',
            'เตรียม Task ข้อความ และ Quote จากข้อมูลเดียวกัน',
          ].map((t) => (
            <p key={t}>
              <Check size={15} />
              {t}
            </p>
          ))}
        </div>
      </section>
      <p className="page-note">
        การเปรียบเทียบนี้อธิบายแนวทางของต้นแบบ
        ยังไม่อ้างผลลัพธ์เพิ่มขึ้นจนกว่าจะมีข้อมูลเปรียบเทียบจริง
      </p>
    </>
  );
}
export function CustomersView({
  data,
  result,
  search,
  setSearch,
  onSelect,
}: {
  data: EnterpriseData;
  result: AllocationResult;
  search: string;
  setSearch: (s: string) => void;
  onSelect: (o: Opportunity) => void;
}) {
  const [region, setRegion] = useState('ทุกพื้นที่');
  const rows = data.customers.filter(
    (c) =>
      `${c.companyName} ${c.industry}`.toLowerCase().includes(search.toLowerCase()) &&
      (region === 'ทุกพื้นที่' || c.region === region),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ข้อมูลเพื่อเข้าใจลูกค้า</div>
          <h1>มองลูกค้าพร้อมข้อมูลที่เกี่ยวข้อง</h1>
          <p>ดูพฤติกรรมซื้อ ความเสี่ยง และวิธีใช้เวลาที่เหมาะสมกับลูกค้าแต่ละราย</p>
        </div>
        <span className="outline-tag">เชื่อมต่อข้อมูลลูกค้า 24 ราย</span>
      </div>
      <section className="surface">
        <div className="section-head">
          <div className="search-field">
            <Search size={16} />
            <input
              placeholder="ค้นหาชื่อลูกค้าหรืออุตสาหกรรม…"
              aria-label="ค้นหาลูกค้า"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="กรองพื้นที่ลูกค้า"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {['ทุกพื้นที่', 'Bangkok', 'Central', 'Eastern'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table customer-table">
            <thead>
              <tr>
                <th>ลูกค้า</th>
                <th>พื้นที่ดูแล</th>
                <th>Purchase probability</th>
                <th>Churn risk</th>
                <th>สั่งซื้อล่าสุด</th>
                <th>ผู้ดูแล</th>
                <th>พรุ่งนี้</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const o =
                  result.opportunities.find((o) => o.customer.id === c.id) ??
                  result.candidates.find((o) => o.customer.id === c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="table-customer"
                        disabled={!o}
                        onClick={() => o && onSelect(o)}
                      >
                        <span className="company-monogram">
                          {c.companyName.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <strong>{c.companyName}</strong>
                          <small>{c.industry}</small>
                        </span>
                      </button>
                    </td>
                    <td>{c.region}</td>
                    <td>
                      <span className="probability-cell">
                        {percent(c.purchaseProbability)}
                        <i style={{ width: `${c.purchaseProbability * 55}px` }} />
                      </span>
                    </td>
                    <td>
                      <span className={c.churnRisk >= 0.6 ? 'risk-text' : 'secondary'}>
                        {percent(c.churnRisk)}
                        {c.churnRisk >= 0.6 && ' · ต้องติดตาม'}
                      </span>
                    </td>
                    <td>
                      {new Date(`${c.lastPurchaseDate}T00:00:00Z`).toLocaleDateString(dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                    </td>
                    <td>{firstName(data.reps.find((r) => r.id === c.salesRep)!.name)}</td>
                    <td>
                      {result.opportunities.some((o) => o.customer.id === c.id) ? (
                        <span className="small-pill">
                          <Check size={11} /> จัดสรรให้เข้าพบ
                        </span>
                      ) : (
                        <span className="secondary">ติดตามทางไกล</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <div className="empty-state">
              <Search size={24} />
              <h3>ไม่พบลูกค้าที่ตรงกับการค้นหา</h3>
              <p>ลองใช้ชื่อหรือพื้นที่อื่น</p>
              <button
                className="button"
                onClick={() => {
                  setSearch('');
                  setRegion('ทุกพื้นที่');
                }}
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          ลูกค้า {rows.length} จาก {data.customers.length} ราย{' '}
          <span>แหล่งข้อมูล: CRM + Sales History · ข้อมูลจำลองในเครื่อง</span>
        </div>
      </section>
    </>
  );
}
export function TeamView({
  data,
  result,
  constraints,
  onRepCapacity,
}: {
  data: EnterpriseData;
  result: AllocationResult;
  constraints: Constraints;
  onRepCapacity: (id: string, hours: number) => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ทีมที่ขับเคลื่อนแผน</div>
          <h1>Sales Rep ที่เหมาะกับแต่ละโอกาส</h1>
          <p>ปรับเวลาว่างของพรุ่งนี้ ระบบจะคำนวณแผนใหม่ทันที</p>
        </div>
        <span className="outline-tag">Sales Rep 6 คน · 3 พื้นที่</span>
      </div>
      <section className="surface">
        <div className="section-head">
          <h2>เวลาที่ทีมขายพร้อมทำงาน</h2>
          <span className="secondary">หักเวลาของงานที่มีอยู่แล้ว</span>
        </div>
        <div className="team-list">
          {data.reps.map((rep) => {
            const capacity = constraints.repCapacity[rep.id] ?? rep.availableHours;
            const assigned = result.opportunities.filter((o) => o.rep.id === rep.id);
            return (
              <div className="team-row" key={rep.id}>
                <div className="team-person">
                  <Avatar name={rep.name} />
                  <div>
                    <strong>{rep.name}</strong>
                    <span>
                      {rep.region} · {rep.specialization.join(' / ')}
                    </span>
                  </div>
                </div>
                <div className="team-assignment">
                  <span>
                    ลูกค้า {assigned.length} ราย · จัดสรรแล้ว {result.repHours[rep.id] ?? 0}h
                  </span>
                  <small>
                    {assigned.map((o) => o.customer.companyName).join(', ') || 'พร้อมรับโอกาสถัดไป'}
                  </small>
                </div>
                <div className="team-capacity">
                  <label htmlFor={`rep-${rep.id}`}>
                    เวลาว่างพรุ่งนี้ <strong>{capacity}h</strong>
                  </label>
                  <input
                    id={`rep-${rep.id}`}
                    type="range"
                    min="0"
                    max={rep.availableHours}
                    step="1"
                    value={capacity}
                    onChange={(e) => onRepCapacity(rep.id, Number(e.target.value))}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="table-footer">
          <span>
            พื้นที่เป็นข้อจำกัดที่ต้องตรงกัน
            ความเชี่ยวชาญและความต่อเนื่องในการดูแลลูกค้ามีผลต่อลำดับความสำคัญ
          </span>
          <ShieldCheck size={15} />
        </div>
      </section>
    </>
  );
}
export function DataSourcesView({
  data,
  failInventory,
  onFailure,
}: {
  data: EnterpriseData;
  failInventory: boolean;
  onFailure: (v: boolean) => void;
}) {
  const sources = [
    {
      name: 'CRM',
      description: 'ลูกค้า ความสนใจ และแนวโน้มการซื้อ',
      detail: `ลูกค้า ${data.customers.length} ราย`,
      icon: Users,
    },
    {
      name: 'ERP',
      description: 'สินค้า ต้นทุน และยอดสั่งซื้อ',
      detail: `สินค้า ${data.products.length} รายการ`,
      icon: Database,
    },
    {
      name: 'Inventory / WMS',
      description: 'สต็อกพร้อมขายและการจัดส่ง',
      detail: `${data.products.filter((p) => p.inventory > 0).length} SKU มีสต็อก`,
      icon: Warehouse,
    },
    {
      name: 'Sales History',
      description: 'ประวัติคำสั่งซื้อและรอบ Reorder',
      detail: `${data.history.length} รายการซื้อ`,
      icon: ClipboardList,
    },
    {
      name: 'Pricing',
      description: 'Margin และสิทธิ์ Promotion',
      detail: `Promotion ${data.products.filter((p) => p.promotionActive).length} รายการ`,
      icon: FileText,
    },
    {
      name: 'Sales Team',
      description: 'เวลาว่าง พื้นที่ และความเชี่ยวชาญ',
      detail: `Sales Rep ${data.reps.length} คน`,
      icon: Users,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ข้อมูลที่เชื่อมต่อ</div>
          <h1>6 แหล่งข้อมูล สู่แผนการตัดสินใจเดียวกัน</h1>
          <p>Decision Layer ที่เชื่อมต่อกับระบบองค์กรที่คุณใช้อยู่</p>
        </div>
        <Status warning={failInventory}>
          {failInventory ? 'เชื่อมต่อได้ 5 จาก 6 แหล่งข้อมูล' : 'เชื่อมต่อครบทุกระบบ'}
        </Status>
      </div>
      <div className="architecture">
        <section className="architecture-sources">
          <span className="eyebrow">01 / ข้อมูลองค์กร</span>
          {sources.map((s) => (
            <div className="source-row" key={s.name}>
              <s.icon size={19} />
              <div>
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </div>
              <div className="source-right">
                <Status warning={s.name === 'Inventory / WMS' && failInventory}>
                  {s.name === 'Inventory / WMS' && failInventory
                    ? 'ขาดการเชื่อมต่อ'
                    : 'เชื่อมต่อแล้ว'}
                </Status>
                <small>{s.detail}</small>
              </div>
            </div>
          ))}
        </section>
        <div className="architecture-connector">
          <div />
          <ArrowRight size={22} />
          <div />
        </div>
        <section className="decision-layer">
          <BrandMark />
          <span className="eyebrow">02 / AI DECISION LAYER</span>
          <h2>ข้อมูลครบ ตัดสินใจได้ชัดเจน</h2>
          <p>ประเมินมูลค่าธุรกิจร่วมกับข้อจำกัดในการทำงานจริง</p>
          <div className="layer-steps">
            {[
              ['Predict', 'แนวโน้มซื้อและความเสี่ยง Churn'],
              ['Retrieve', 'ข้อมูลลูกค้าและสินค้าที่เกี่ยวข้อง'],
              ['Reason', 'เหตุผลที่ตรวจสอบกับแหล่งข้อมูลได้'],
              ['Optimize', 'Margin เวลา สต็อก และพื้นที่'],
            ].map(([a, b], i) => (
              <div key={a}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{a}</strong>
                  <small>{b}</small>
                </div>
              </div>
            ))}
          </div>
          <span className="outline-tag">Prototype Decision Model</span>
        </section>
        <div className="architecture-connector">
          <div />
          <ArrowRight size={22} />
          <div />
        </div>
        <section className="action-layer">
          <span className="eyebrow">03 / ACTION</span>
          <h2>เปลี่ยนแผนเป็นงานที่ทำต่อได้</h2>
          {['มอบหมาย Sales Rep', 'Create task', 'Draft message', 'Prepare quote', 'Update CRM'].map(
            (s) => (
              <div key={s}>
                <Check size={15} />
                {s}
              </div>
            ),
          )}
          <p>ตรวจสอบก่อนดำเนินการ · จำลองในเครื่อง</p>
        </section>
      </div>
      <div className="source-footnotes">
        <div>
          <Network size={18} />
          <p>
            <strong>Remember → Understand → Connect → Retrieve → Reason → Act</strong>
            <span>เชื่อมประวัติลูกค้าเข้ากับบริบท เพื่อช่วยตัดสินใจและสร้าง Workflow</span>
          </p>
        </div>
        <button
          className={`button ${failInventory ? 'danger-outline' : ''}`}
          onClick={() => onFailure(!failInventory)}
        >
          <RefreshCw size={14} />
          {failInventory ? 'เชื่อมต่อ WMS อีกครั้ง' : 'จำลอง Inventory ขัดข้อง'}
        </button>
      </div>
      <section className="surface production-path">
        <div className="section-head">
          <h2>แนวทางพัฒนาไปสู่ระบบ Production</h2>
          <span className="outline-tag">Future architecture</span>
        </div>
        <div>
          {[
            'Enterprise APIs / ETL',
            'Customer & Product 360',
            'Feature store',
            'Prediction models',
            'Retrieval + LLM reasoning',
            'Constraint solver',
            'Agent tool calling',
            'CRM / ERP / Messaging',
          ].map((s, i) => (
            <span key={s}>
              {s}
              {i < 7 && <ChevronRight size={14} />}
            </span>
          ))}
        </div>
        <p className="secondary">
          ปัจจุบันใช้ข้อมูลจำลอง ค่าโอกาสซื้อที่กำหนดไว้ การให้คะแนนตามกฎ และ Greedy Allocation ส่วน
          Production จะใช้ Prediction Model ที่ผ่านการตรวจสอบ Constraint Solver ข้อมูลสด
          และประวัติการเรียกใช้เครื่องมือที่ตรวจสอบได้
        </p>
      </section>
      <div className="positioning">
        <div>
          <span>CRM</span>
          <strong>บันทึกสิ่งที่เกิดขึ้น</strong>
        </div>
        <ArrowRight size={17} />
        <div>
          <span>BI</span>
          <strong>แสดงสิ่งที่เกิดขึ้น</strong>
        </div>
        <ArrowRight size={17} />
        <div>
          <span className="teal">AI CONCIERGE</span>
          <strong>ให้เหตุผลว่าควรทำอะไรต่อไป</strong>
        </div>
      </div>
    </>
  );
}
export function ActionsView({
  actions,
  onReplaceActions,
}: {
  actions: ActionRecord[];
  onReplaceActions: (actions: ActionRecord[]) => void;
}) {
  const [type, setType] = useState('all');
  const [clearedActions, setClearedActions] = useState<ActionRecord[]>([]);
  const filtered = actions.filter((a) => type === 'all' || a.type === type);
  const icons = { task: ClipboardList, message: Mail, quote: FileText, crm: RefreshCw };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">จากการตัดสินใจ สู่การลงมือทำ</div>
          <h1>ประวัติการดำเนินการของคุณ</h1>
          <p>รวม Task ข้อความ Quote และการอัปเดตข้อมูลลูกค้าไว้ในที่เดียว</p>
        </div>
        <span className="outline-tag">รายการจำลอง {actions.length} รายการ</span>
      </div>
      <section className="surface">
        <div className="section-head">
          <h2>Action Center</h2>
          <select
            aria-label="กรองประเภทการดำเนินการ"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="task">Task</option>
            <option value="message">ข้อความ</option>
            <option value="quote">Quote</option>
            <option value="crm">การอัปเดต CRM</option>
          </select>
        </div>
        {filtered.length ? (
          <div className="action-log">
            {filtered.map((a) => {
              const Icon = icons[a.type];
              return (
                <details key={a.id}>
                  <summary>
                    <span className="action-log-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong>{a.title}</strong>
                      <span>
                        {new Date(a.createdAt).toLocaleString(dateLocale, {
                          timeZone: 'Asia/Bangkok',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · จำลอง
                      </span>
                    </div>
                    <span className="small-pill push-right">
                      <Check size={12} /> สำเร็จ
                    </span>
                    <ChevronRight size={16} />
                  </summary>
                  <p>{a.detail}</p>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Workflow size={30} />
            <h3>
              {actions.length ? 'ยังไม่มีการดำเนินการประเภทนี้' : 'เริ่มลงมือจากแผนที่เลือกไว้'}
            </h3>
            <p>เลือกลูกค้าในแผนเพื่อสร้าง Task ร่างข้อความ หรือเตรียม Quote</p>
          </div>
        )}
        <div className="table-footer">
          <span>บันทึกในเบราว์เซอร์นี้เท่านั้น ไม่มีการส่งข้อความหรือเขียนข้อมูล CRM ภายนอก</span>
          {actions.length > 0 ? (
            <button
              className="text-button"
              onClick={() => {
                setClearedActions(actions);
                onReplaceActions([]);
              }}
            >
              ล้างประวัติ Demo
            </button>
          ) : clearedActions.length > 0 ? (
            <button
              className="text-button"
              onClick={() => {
                onReplaceActions(clearedActions);
                setClearedActions([]);
              }}
            >
              ยกเลิกการล้าง
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
