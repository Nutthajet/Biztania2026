'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Database,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { customers, history, products, reps } from '@/data/demo';
import type {
  ActionRecord,
  ActionType,
  AllocationResult,
  Constraints,
  EnterpriseData,
  Opportunity,
  View,
} from '@/types';
import { allocateResources } from '@/lib/resourceAllocation';
import { money } from '@/lib/format';
import { viewLabels } from '@/lib/locale';
import { retrieveEnterpriseData } from '@/services/enterprise';
import { AllocationTable } from './AllocationTable';
import { ReasoningPanel } from './ReasoningPanel';
import { ActionModal } from './ActionModal';
import { Assistant } from './Assistant';
import { OpportunityRadar } from './OpportunityRadar';
import {
  ActionsView,
  CustomersView,
  DataSourcesView,
  ManagerView,
  TeamView,
} from './SecondaryViews';
import { Avatar, BrandMark, CapacityBars, Metrics, Status } from './ui';

const initialData: EnterpriseData = { customers, products, reps, history };
const defaultConstraints: Constraints = {
  hours: 20,
  minimumMargin: 20,
  inventoryMode: 'live',
  repCapacity: {},
};
const navigation: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Opportunities', icon: Target },
  { label: 'Allocation', icon: ChartNoAxesCombined },
  { label: 'Customers', icon: Users },
  { label: 'Sales Team', icon: Users },
  { label: 'Data Sources', icon: Database },
];
const sourceNames = ['CRM', 'ERP', 'Inventory', 'Sales History', 'Pricing', 'Sales Team'];
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function Guide({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="guide-dialog"
      onCancel={onClose}
      aria-label="คู่มือ Demo สำหรับนำเสนอ"
    >
      <div className="modal-header">
        <span className="eyebrow">นำเสนอ Demo ภายใน 3 นาที</span>
        <button className="icon-button" aria-label="ปิดคู่มือ Demo" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <h2>จากข้อมูลที่กระจัดกระจาย สู่การทำงานที่สอดประสาน</h2>
      <p className="secondary">ลำดับการนำเสนอแนวคิดหลักของระบบแบบกระชับ</p>
      <div className="guide-steps">
        {[
          [
            'เชื่อมโยงข้อมูล',
            'เริ่มจากเวลา 20 sales-hours แล้วกด Run AI Allocation เพื่อดึงข้อมูลจาก 6 ระบบ',
          ],
          [
            'อธิบายเหตุผลที่เลือก',
            'เลือก ABC Foods แล้วแสดงโอกาสซื้อ Margin สต็อก ความเร่งด่วน และความพร้อมของ Sales Rep',
          ],
          [
            'เปลี่ยนข้อจำกัด',
            'ลดเวลาเหลือ 10h ดูแผนเข้าพบและผลลัพธ์ที่เปลี่ยนไป แล้วประมวลผลอีกครั้ง',
          ],
          [
            'เปลี่ยนการตัดสินใจเป็นงาน',
            'สร้างและแก้ไขร่างข้อความ ทดลองส่ง แล้วสร้าง Task สำหรับเข้าพบลูกค้า',
          ],
          [
            'แสดงผลลัพธ์ทางธุรกิจ',
            'เปิด Manager View เพื่อดูการเข้าถึงลูกค้า การใช้เวลา และ Expected Gross Margin',
          ],
        ].map(([title, detail], i) => (
          <div key={title}>
            <span>0{i + 1}</span>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="modal-footnote">
        วันที่อ้างอิง Demo: 7 ต.ค. 2026 · แผนพรุ่งนี้: 8 ต.ค. 2026
      </div>
      <button className="button primary full" onClick={onClose}>
        เริ่มใช้งาน <ArrowRight size={15} />
      </button>
    </dialog>
  );
}
function CustomerDrawer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="customer-drawer"
      aria-label="รายละเอียดการตัดสินใจสำหรับลูกค้า"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div>{children}</div>
    </dialog>
  );
}
export function SalesApp() {
  const [view, setView] = useState<View>('Overview');
  const [data, setData] = useState(initialData);
  const [constraints, setConstraints] = useState<Constraints>(defaultConstraints);
  const result = useMemo(() => allocateResources(data, constraints), [data, constraints]);
  const [selectedId, setSelectedId] = useState('c1-p1');
  const [runStage, setRunStage] = useState(-1);
  const [status, setStatus] = useState('แผนตัวอย่างพร้อมแล้ว');
  const [error, setError] = useState('');
  const [failInventory, setFailInventory] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<{ type: ActionType; opportunity: Opportunity } | null>(null);
  const [toast, setToast] = useState('');
  const [guide, setGuide] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profile, setProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Opportunity | null>(null);
  const running = runStage >= 0;
  const runLock = useRef(false);
  const selected =
    result.opportunities.find((o) => o.id === selectedId) ??
    result.candidates.find((o) => o.id === selectedId) ??
    result.opportunities[0];
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('concierge-actions-v1') ?? '[]');
      if (Array.isArray(saved))
        setActions(
          saved.filter(
            (a) =>
              a &&
              typeof a.id === 'string' &&
              ['task', 'message', 'quote', 'crm'].includes(a.type) &&
              typeof a.createdAt === 'string' &&
              typeof a.title === 'string' &&
              typeof a.detail === 'string',
          ),
        );
    } catch {
      /* Corrupt or unavailable browser storage starts with an empty action log. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem('concierge-actions-v1', JSON.stringify(actions));
      } catch {
        setToast('ไม่สามารถบันทึกในเบราว์เซอร์ได้ ข้อมูลการดำเนินการจะอยู่ในเซสชันนี้เท่านั้น');
      }
    }
  }, [actions, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function navigate(next: View) {
    setView(next);
    setMobileNav(false);
    setDetail(null);
  }
  function changeConstraints(patch: Partial<Constraints>) {
    setConstraints((c) => ({ ...c, ...patch }));
    setStatus(patch.hours !== undefined ? 'เปลี่ยนข้อจำกัดด้านเวลาแล้ว' : 'ปรับข้อจำกัดแล้ว');
    setSelectedId('c1-p1');
  }
  async function runAllocation() {
    if (runLock.current) return;
    runLock.current = true;
    setError('');
    setRunStage(0);
    setStatus('กำลังเชื่อมต่อข้อมูลจากแต่ละระบบ…');
    try {
      await pause(350);
      setRunStage(1);
      setStatus('กำลังวิเคราะห์ลูกค้า 24 ราย…');
      const fresh = await retrieveEnterpriseData(failInventory);
      await pause(400);
      setRunStage(2);
      setStatus('กำลังจัดสรรเวลาทีมขาย…');
      await pause(450);
      setData(fresh);
      setStatus('จัดสรรแผนเรียบร้อย');
      const updated = allocateResources(fresh, constraints);
      setSelectedId(updated.opportunities[0]?.id ?? '');
      setToast(
        `จัดสรรแผนเรียบร้อย · เข้าพบ ${updated.opportunities.length} ราย · ใช้เวลา ${updated.totalHours}h`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ไม่สามารถอัปเดตข้อมูลจากระบบได้ กรุณาลองอีกครั้ง');
      setStatus('อัปเดตไม่สำเร็จ · แสดงข้อมูลล่าสุดที่มี');
    } finally {
      setRunStage(-1);
      runLock.current = false;
    }
  }
  function recordAction(type: ActionType, o: Opportunity, detailText: string) {
    const titles: Record<ActionType, string> = {
      task: `เข้าพบ ${o.customer.companyName}`,
      message: `ส่งข้อความถึง ${o.customer.companyName}`,
      quote: `เตรียม Quote สำหรับ ${o.customer.companyName}`,
      crm: `อัปเดต CRM แล้ว · ${o.customer.companyName}`,
    };
    const record: ActionRecord = {
      id: crypto.randomUUID(),
      customerId: o.customer.id,
      productId: o.product.id,
      repId: o.rep.id,
      hours: o.hours,
      type,
      title: titles[type],
      detail: detailText,
      createdAt: new Date().toISOString(),
    };
    setActions((a) => [record, ...a]);
  }
  function takeAction(type: ActionType, o: Opportunity) {
    if (type === 'task') {
      if (
        actions.some(
          (a) =>
            a.type === 'task' && a.customerId === o.customer.id && a.productId === o.product.id,
        )
      )
        return;
      const existingHours = actions
        .filter((a) => a.type === 'task' && a.repId === o.rep.id)
        .reduce((s, a) => s + a.hours, 0);
      if (existingHours + o.hours > o.rep.availableHours) {
        setToast(
          `${o.rep.name} มี Task รวม ${existingHours}h แล้ว กรุณาตรวจสอบ Action Center ก่อนมอบหมายงานเข้าพบเพิ่ม`,
        );
        return;
      }
      const time = `${String(10 + existingHours).padStart(2, '0')}:00`;
      const taskDetail = `เข้าพบ ${o.customer.companyName} — ${o.rep.name} — พรุ่งนี้ ${time} (8 ต.ค. 2026, Asia/Bangkok) · ${o.hours}h · พูดคุยเรื่อง ${o.product.productName} จำนวน ${o.quantity} หน่วย`;
      recordAction(type, o, taskDetail);
      setToast(
        `สร้าง Task แล้ว · ${o.customer.companyName} — ${o.rep.name.split(' ')[0]} — พรุ่งนี้ ${time}`,
      );
    } else setModal({ type, opportunity: o });
  }
  function exportPlan() {
    const columns = [
      'Priority',
      'ลูกค้า',
      'Opportunity',
      'สินค้า',
      'Expected revenue THB',
      'Expected margin THB',
      'Rep',
      'ชั่วโมง',
    ];
    const csv = [
      columns,
      ...result.opportunities.map((o) => [
        o.rank,
        o.customer.companyName,
        o.customer.opportunity,
        o.product.productName,
        Math.round(o.expectedRevenue),
        Math.round(o.expectedMargin),
        o.rep.name,
        o.hours,
      ]),
    ]
      .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'concierge-allocation-2026-10-08.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('ส่งออกแผนเป็นไฟล์ CSV แล้ว');
  }
  function resetDemo() {
    setConstraints(defaultConstraints);
    setSelectedId('c1-p1');
    setFilter('all');
    setStatus('แผนตัวอย่างพร้อมแล้ว');
    setError('');
    setFailInventory(false);
    setProfile(false);
    setView('Overview');
    setToast('คืนค่าแผนตัวอย่างเป็น 20 ชั่วโมงแล้ว ประวัติการดำเนินการยังอยู่ครบ');
  }
  const workspace = ['Overview', 'Opportunities', 'Allocation'].includes(view);
  return (
    <div className="app-shell">
      {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <a
          className="brand"
          href="#"
          aria-label="Concierge — ภาพรวม"
          onClick={(e) => {
            e.preventDefault();
            navigate('Overview');
          }}
        >
          <BrandMark />
          <span>
            concierge<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-avatar">B</span>
          <div>
            <strong>Biztania Distribution</strong>
            <small>พื้นที่ทำงานทีมขาย</small>
          </div>
          <span className="workspace-label">DEMO</span>
        </div>
        <div className="nav-label">พื้นที่ทำงาน</div>
        <nav aria-label="เมนูหลัก">
          {navigation.map((n) => (
            <button
              key={n.label}
              aria-label={viewLabels[n.label]}
              title={viewLabels[n.label]}
              className={`nav-link ${view === n.label ? 'active' : ''}`}
              onClick={() => navigate(n.label)}
            >
              <n.icon size={17} />
              <span>{viewLabels[n.label]}</span>
              {n.label === 'Opportunities' && (
                <span className="nav-count">{result.candidates.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <nav aria-label="การจัดการ">
          <button
            aria-label="Manager View"
            className={`nav-link ${view === 'Manager View' ? 'active' : ''}`}
            onClick={() => navigate('Manager View')}
          >
            <ChartNoAxesCombined size={17} />
            Manager View
            <ArrowUpRight size={13} className="push-right" />
          </button>
          <button
            aria-label="Action Center"
            className={`nav-link ${view === 'Action Center' ? 'active' : ''}`}
            onClick={() => navigate('Action Center')}
          >
            <ClipboardList size={17} />
            Action Center{actions.length > 0 && <span className="nav-count">{actions.length}</span>}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-card">
            <div>
              <span className="status-dot" />
              <strong>Decision engine</strong>
              <span className="engine-version">v1.0</span>
            </div>
            <p>
              ข้อมูลเชื่อมโยงครบ
              <br />
              มองเห็นขั้นตอนถัดไป
            </p>
            <span>Prototype Decision Model</span>
          </div>
          <button className="nav-link" aria-label="คู่มือ Demo" onClick={() => setGuide(true)}>
            <CircleHelp size={17} />
            คู่มือ Demo<span className="keycap push-right">↗</span>
          </button>
          <div className="sidebar-user">
            <Avatar name="Alex Morgan" />
            <div>
              <strong>Alex Morgan</strong>
              <span>ผู้จัดการฝ่ายขาย</span>
            </div>
            <button
              className="icon-button"
              aria-label="ตั้งค่าพื้นที่ทำงาน"
              onClick={() => setProfile(!profile)}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="เปิดเมนู"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={19} />
            </button>
            <span>พื้นที่ทำงาน</span>
            <ChevronRight size={13} />
            <strong>{viewLabels[view]}</strong>
          </div>
          <div className="topbar-title">AI Sales Decision & Action Concierge</div>
          <div className="topbar-actions">
            <Status warning={!!error || failInventory}>
              AI Decision Engine ·{' '}
              {running ? 'กำลังวิเคราะห์' : error ? 'ต้องตรวจสอบ' : 'พร้อมใช้งาน'}
            </Status>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="ค้นหาลูกค้า"
              onClick={() => {
                navigate('Customers');
                setSearch('');
              }}
            >
              <Search size={17} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="ดูการแจ้งเตือนงาน"
              onClick={() => navigate('Action Center')}
            >
              <Bell size={17} />
              {actions.length > 0 && <i />}
            </button>
            <button
              className="avatar-button"
              aria-label="เปิดการตั้งค่าโปรไฟล์"
              onClick={() => setProfile(!profile)}
            >
              <Avatar name="Alex Morgan" small />
            </button>
          </div>
        </header>
        {profile && (
          <div className="profile-menu">
            <strong>Alex Morgan</strong>
            <span>ผู้จัดการฝ่ายขาย · พื้นที่ Demo</span>
            <button
              onClick={() => {
                setGuide(true);
                setProfile(false);
              }}
            >
              <CircleHelp size={15} />
              เปิดคู่มือ Demo
            </button>
            <button onClick={resetDemo}>
              <Settings2 size={15} />
              คืนค่าข้อจำกัดของแผน
            </button>
            <button onClick={() => setProfile(false)}>
              <X size={15} />
              ปิดเมนู
            </button>
          </div>
        )}
        <main className="main-content">
          {workspace ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> จากข้อมูล สู่การตัดสินใจและลงมือทำ
                  </div>
                  <h1>
                    {view === 'Overview'
                      ? 'ศูนย์วางแผนการขาย'
                      : view === 'Allocation'
                        ? 'จัดสรรทุกชั่วโมงให้เกิดคุณค่า'
                        : 'ค้นหาโอกาสการขายที่ควรให้ความสำคัญ'}
                  </h1>
                  <p>
                    {view === 'Overview'
                      ? 'รู้ว่าควรเข้าพบใคร และใช้เวลาของทีมให้คุ้มค่า'
                      : view === 'Allocation'
                        ? 'จัดสรรเวลาที่มีจำกัดให้สอดคล้องกับเป้าหมายธุรกิจและข้อจำกัดจริง'
                        : 'เปรียบเทียบมูลค่าที่คาดหวัง แล้วจัดสรรทรัพยากรให้โอกาสที่เหมาะสม'}
                  </p>
                </div>
                <div className="page-heading-actions">
                  <span className="date-label">
                    <CalendarDays size={14} /> พฤ. 8 ต.ค. 2026
                  </span>
                  <button className="button small" onClick={() => setGuide(true)}>
                    <Play size={13} /> คู่มือ Demo
                  </button>
                </div>
              </div>
              <section className="command-area">
                <div className="command-main">
                  <div className="command-icon">
                    <Workflow size={22} />
                  </div>
                  <div>
                    <div className="command-overline">แผนจัดสรรเวลาทีมขายสำหรับพรุ่งนี้</div>
                    <h2>
                      <strong>{constraints.hours} sales-hours</strong> สำหรับพรุ่งนี้
                      ควรจัดสรรให้ใคร?
                    </h2>
                    <p>จัดลำดับตามผลลัพธ์ทางธุรกิจ ภายใต้ข้อจำกัดที่มี</p>
                  </div>
                  <button
                    className="button primary run-button"
                    onClick={runAllocation}
                    disabled={running}
                  >
                    {running ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                    {running ? 'กำลังจัดสรรแผน…' : 'Run AI Allocation'}
                    {!running && <ArrowRight size={16} />}
                  </button>
                </div>
                <div className="command-controls">
                  <div className="capacity-control">
                    <label htmlFor="sales-capacity">
                      <Clock3 size={14} />
                      เวลาทีมขาย <strong>{constraints.hours}h</strong>
                    </label>
                    <input
                      id="sales-capacity"
                      type="range"
                      min="5"
                      max="40"
                      step="1"
                      disabled={running}
                      value={constraints.hours}
                      onChange={(e) => changeConstraints({ hours: Number(e.target.value) })}
                    />
                    <span>5h</span>
                    <span>40h</span>
                  </div>
                  <div className="control-divider" />
                  <button
                    className={`constraint-button ${showConstraints ? 'active' : ''}`}
                    onClick={() => setShowConstraints(!showConstraints)}
                    aria-expanded={showConstraints}
                  >
                    <SlidersHorizontal size={14} />
                    ข้อจำกัด<span className="constraint-count">3</span>
                    <ChevronDown size={13} />
                  </button>
                  <span className="constraint-summary">
                    ≥ {constraints.minimumMargin}% margin <span>·</span>{' '}
                    {constraints.inventoryMode === 'live' ? 'สต็อกพร้อมขาย' : 'จำลองสต็อกเหลือ 10%'}{' '}
                    <span>·</span> พื้นที่ตรงกับ Sales Rep
                  </span>
                  <span
                    className={`run-status ${status.includes('เปลี่ยนข้อจำกัด') || status.includes('ปรับข้อจำกัด') ? 'changed' : ''}`}
                    role="status"
                  >
                    {running ? (
                      <LoaderCircle size={12} className="spin" />
                    ) : (
                      <span className="status-dot" />
                    )}
                    {status}
                  </span>
                </div>
                {showConstraints && (
                  <div className="constraints-expanded">
                    <label>
                      Gross Margin ขั้นต่ำ<strong>{constraints.minimumMargin}%</strong>
                      <input
                        type="range"
                        aria-label="Gross Margin ขั้นต่ำ"
                        min="0"
                        max="50"
                        step="1"
                        disabled={running}
                        value={constraints.minimumMargin}
                        onChange={(e) =>
                          changeConstraints({ minimumMargin: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      สต็อกที่พร้อมขาย
                      <select
                        aria-label="สต็อกที่พร้อมขาย"
                        disabled={running}
                        value={constraints.inventoryMode}
                        onChange={(e) =>
                          changeConstraints({
                            inventoryMode: e.target.value as Constraints['inventoryMode'],
                          })
                        }
                      >
                        <option value="live">สต็อกปกติ · 100%</option>
                        <option value="limited">จำลองสต็อกลดลง · 10%</option>
                      </select>
                    </label>
                    <div>
                      <span>ความพร้อมของทีมขาย</span>
                      <button className="text-button" onClick={() => navigate('Sales Team')}>
                        ปรับเวลาของ Sales Rep แต่ละคน <ArrowUpRight size={14} />
                      </button>
                    </div>
                    <button
                      className="text-button"
                      disabled={running}
                      onClick={() => changeConstraints(defaultConstraints)}
                    >
                      คืนค่าเริ่มต้น
                    </button>
                  </div>
                )}
                <div className={`source-strip ${running ? 'connecting' : ''}`}>
                  <span>ข้อมูลที่เชื่อมต่อ</span>
                  {sourceNames.map((s, i) => (
                    <span key={s} className={failInventory && i === 2 ? 'source-failed' : ''}>
                      {failInventory && i === 2 ? (
                        <X size={11} />
                      ) : running && runStage === 0 && i > 2 ? (
                        <LoaderCircle size={11} className="spin" />
                      ) : (
                        <Check size={11} />
                      )}{' '}
                      {s}
                    </span>
                  ))}
                  <button
                    onClick={() => navigate('Data Sources')}
                    aria-label="ดูแหล่งข้อมูลที่เชื่อมต่อ"
                  >
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </section>
              {error && (
                <div className="error-banner" role="alert">
                  <ShieldCheck size={17} />
                  <div>
                    <strong>ไม่สามารถอัปเดตข้อมูล Inventory ได้</strong>
                    <span>กำลังแสดงข้อมูล Demo ล่าสุดที่มี เชื่อมต่อ WMS อีกครั้งเพื่ออัปเดต</span>
                  </div>
                  <button
                    className="button small"
                    onClick={() => {
                      setFailInventory(false);
                      setError('');
                      setStatus('เชื่อมต่อแล้ว · พร้อมอัปเดตข้อมูล');
                    }}
                  >
                    เชื่อมต่ออีกครั้ง
                  </button>
                </div>
              )}
              <Metrics result={result} constraints={constraints} />
              <div className="decision-workspace">
                <div className="workspace-main">
                  <AllocationTable
                    showAll={view === 'Opportunities'}
                    result={result}
                    selectedId={selected?.id}
                    onSelect={(o) => setSelectedId(o.id)}
                    filter={filter}
                    setFilter={setFilter}
                    onExport={exportPlan}
                    isRunning={running}
                  />
                  <div className="support-grid">
                    <section className="surface capacity-panel">
                      <div className="section-head">
                        <h2>เวลาของทีมถูกจัดสรรให้ใคร</h2>
                        <span className="tiny-tag">
                          {result.totalHours} / {constraints.hours}h
                        </span>
                      </div>
                      <CapacityBars data={data} result={result} constraints={constraints} compact />
                      <button className="panel-footer-link" onClick={() => navigate('Sales Team')}>
                        ดูทีมขาย <ArrowUpRight size={13} />
                      </button>
                    </section>
                    <section className="surface radar-panel">
                      <div className="section-head">
                        <h2>Opportunity radar</h2>
                        <span className="secondary">
                          ลูกค้าที่เข้าเงื่อนไข {result.candidates.length} ราย
                        </span>
                      </div>
                      <OpportunityRadar
                        opportunities={result.candidates}
                        selectedId={selected?.id}
                        onSelect={setSelectedId}
                      />
                    </section>
                  </div>
                  {view === 'Allocation' && (
                    <section className="surface deferred-panel">
                      <div className="section-head">
                        <h2>ลูกค้าที่เลื่อนการเข้าพบออกไป</h2>
                        <span className="count-badge">{result.excluded.length}</span>
                      </div>
                      {result.excluded.map((e) => (
                        <div key={e.customer.id}>
                          <strong>{e.customer.companyName}</strong>
                          <span>{e.reason}</span>
                        </div>
                      ))}
                      {!result.excluded.length && (
                        <p className="secondary">ลูกค้าที่เข้าเงื่อนไขทั้งหมดอยู่ในแผนแล้ว</p>
                      )}
                    </section>
                  )}
                </div>
                {selected ? (
                  <ReasoningPanel
                    opportunity={selected}
                    constraints={constraints}
                    actions={actions}
                    allocated={result.opportunities.some((o) => o.id === selected.id)}
                    onAction={takeAction}
                  />
                ) : (
                  <aside className="reasoning-panel reasoning-empty">
                    <Target size={26} />
                    <h3>เริ่มวางแผนจากโอกาสที่เป็นไปได้</h3>
                    <p>ลองปรับข้อจำกัดเพื่อหาแผนที่จัดสรรได้</p>
                  </aside>
                )}
              </div>
              <div className="workspace-bottom">
                <span>
                  <ShieldCheck size={12} /> อธิบายเหตุผลได้ และตรวจสอบก่อนดำเนินการ
                </span>
                <span>
                  ข้อมูลจำลองในเครื่อง <span>·</span> Prototype Decision Model
                </span>
              </div>
            </>
          ) : view === 'Manager View' ? (
            <ManagerView data={data} result={result} constraints={constraints} />
          ) : view === 'Customers' ? (
            <CustomersView
              data={data}
              result={result}
              search={search}
              setSearch={setSearch}
              onSelect={setDetail}
            />
          ) : view === 'Sales Team' ? (
            <TeamView
              data={data}
              result={result}
              constraints={constraints}
              onRepCapacity={(id, h) =>
                changeConstraints({ repCapacity: { ...constraints.repCapacity, [id]: h } })
              }
            />
          ) : view === 'Data Sources' ? (
            <DataSourcesView
              data={data}
              failInventory={failInventory}
              onFailure={(v) => {
                setFailInventory(v);
                setToast(
                  v
                    ? 'จำลอง Inventory ขัดข้องแล้ว ลอง Run AI Allocation เพื่อดูขั้นตอนกู้คืน'
                    : 'เชื่อมต่อ WMS แล้ว พร้อมอัปเดตข้อมูล',
                );
              }}
            />
          ) : (
            <ActionsView actions={actions} onReplaceActions={setActions} />
          )}
        </main>
      </div>
      <Assistant
        data={data}
        result={result}
        constraints={constraints}
        onCapacity={(h) => {
          changeConstraints({ hours: h });
          setView('Overview');
        }}
        onRun={runAllocation}
        open={assistantOpen}
        setOpen={setAssistantOpen}
      />
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          <p>{toast}</p>
          <button className="icon-button" onClick={() => setToast('')} aria-label="ปิดการแจ้งเตือน">
            <X size={14} />
          </button>
        </div>
      )}
      {modal && (
        <ActionModal
          key={`${modal.type}-${modal.opportunity.id}`}
          type={modal.type}
          opportunity={modal.opportunity}
          onClose={() => setModal(null)}
          onSave={(type, text) => recordAction(type, modal.opportunity, text)}
        />
      )}
      {guide && <Guide onClose={() => setGuide(false)} />}
      {detail && (
        <CustomerDrawer onClose={() => setDetail(null)}>
          <ReasoningPanel
            opportunity={detail}
            constraints={constraints}
            actions={actions}
            allocated={result.opportunities.some((o) => o.id === detail.id)}
            onAction={takeAction}
            onClose={() => setDetail(null)}
          />
        </CustomerDrawer>
      )}
    </div>
  );
}
