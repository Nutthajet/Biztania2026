import {
  ArrowUpRight,
  Check,
  ClipboardList,
  FileText,
  Mail,
  RefreshCw,
  X,
  ArrowRight,
  Workflow,
} from 'lucide-react';
import type { ActionRecord, ActionType, Constraints, Opportunity } from '@/types';
import { firstName, money, percent } from '@/lib/format';
import { Evidence, Avatar } from './ui';
import { explainOpportunity } from '@/lib/aiReasoning';
export function ReasoningPanel({
  opportunity: o,
  constraints,
  actions,
  allocated,
  onAction,
  onClose,
}: {
  opportunity: Opportunity;
  constraints: Constraints;
  actions: ActionRecord[];
  allocated: boolean;
  onAction: (type: ActionType, o: Opportunity) => void;
  onClose?: () => void;
}) {
  const task = actions.some(
    (a) => a.type === 'task' && a.customerId === o.customer.id && a.productId === o.product.id,
  );
  return (
    <aside className="reasoning-panel">
      <div className="reasoning-header">
        <span>
          <Workflow size={14} /> เหตุผลประกอบการตัดสินใจ
        </span>
        {onClose ? (
          <button className="icon-button" onClick={onClose} aria-label="ปิดรายละเอียดลูกค้า">
            <X size={16} />
          </button>
        ) : (
          <span className="tiny-tag">
            {allocated ? `Priority #${o.rank}` : 'อยู่ระหว่างพิจารณา'}
          </span>
        )}
      </div>
      <div className="reasoning-body">
        <div className="eyebrow">ทำไมจึงเลือกลูกค้ารายนี้?</div>
        <h2>
          {o.customer.companyName}
          <ArrowUpRight size={18} />
        </h2>
        <p className="secondary">
          {o.customer.industry} <span className="middle-dot">·</span> {o.customer.region}
        </p>
        <div className="reasoning-numbers">
          <div>
            <strong>{percent(o.customer.purchaseProbability)}</strong>
            <span>Purchase probability</span>
          </div>
          <div>
            <strong className="teal">{money(o.expectedMargin)}</strong>
            <span>Expected gross margin</span>
          </div>
        </div>
        <div className="panel-section-label">
          ปัจจัยที่ใช้พิจารณา <span>พิจารณา 6 ปัจจัย</span>
        </div>
        <Evidence
          title={`${percent(o.customer.purchaseProbability)} purchase probability`}
          detail="แนวโน้มการซื้อ · ข้อมูลจำลอง CRM"
        />
        <Evidence
          title={
            o.overdueDays
              ? `เกินรอบ Reorder ${o.overdueDays} วัน`
              : `สั่งซื้อล่าสุด ${o.daysSincePurchase} วันก่อน`
          }
          detail={`รอบปกติ ${o.customer.reorderCycle} วัน · Sales History`}
        />
        <Evidence
          title={`${(o.product.grossMargin * 100).toFixed(1)}% product margin`}
          detail={`ผ่านเกณฑ์ขั้นต่ำ ${constraints.minimumMargin}% · ERP`}
        />
        <Evidence
          title={`มีสต็อก ${o.inventoryAvailable.toLocaleString('en-US')} หน่วย`}
          detail={`ต้องการ ${o.quantity} หน่วย · Inventory / WMS`}
        />
        <Evidence
          title={o.product.promotionActive ? 'มี Promotion ที่ใช้งานได้' : 'ใช้ราคาปกติ'}
          detail={
            o.product.promotionActive
              ? 'เข้าเงื่อนไข Promotion · Pricing'
              : 'ไม่สมมติส่วนลดเพิ่ม · Pricing'
          }
        />
        <Evidence
          title={`${firstName(o.rep.name)} · ${allocated ? 'จัดสรรแล้ว' : 'ต้องการเวลา'} ${o.hours}h`}
          detail={`พื้นที่ ${o.rep.region} · พร้อมทำงาน ${constraints.repCapacity[o.rep.id] ?? o.rep.availableHours}h`}
        />
        <details className="full-reasoning">
          <summary>อ่านเหตุผลทั้งหมด</summary>
          <p>{explainOpportunity(o)}</p>
        </details>
        <div className="recommendation">
          <span className="eyebrow">ขั้นตอนถัดไปที่แนะนำ</span>
          <strong>{allocated ? 'ให้ความสำคัญกับการเข้าพบ' : 'พิจารณาโอกาสนี้'}</strong>
          <span>
            {o.alternative ? 'เสนอสินค้าทดแทน: ' : 'แนะนำ '}
            {o.product.productName}
          </span>
          <div>
            <Avatar name={o.rep.name} small />
            <span>
              {firstName(o.rep.name)} <span className="middle-dot">·</span> {o.hours} ชั่วโมง{' '}
              <span className="middle-dot">·</span> พรุ่งนี้
            </span>
          </div>
        </div>
        {!allocated && (
          <p className="constraint-note">
            ยังไม่อยู่ในแผนปัจจุบัน เวลาและสต็อกถูกสำรองให้ลูกค้าที่ได้รับการจัดสรรแล้ว
          </p>
        )}
        <button
          className="button primary full"
          disabled={!allocated || task}
          onClick={() => onAction('task', o)}
        >
          {task ? <Check size={15} /> : <ClipboardList size={15} />}{' '}
          {task ? 'สร้าง Task แล้ว' : 'Create Task'}
          {!task && <ArrowRight size={15} className="push-right" />}
        </button>
        <div className="secondary-actions">
          <button onClick={() => onAction('message', o)}>
            <Mail size={14} />
            Draft Message
          </button>
          <button onClick={() => onAction('quote', o)}>
            <FileText size={14} />
            Prepare Quote
          </button>
          <button onClick={() => onAction('crm', o)}>
            <RefreshCw size={14} />
            Update CRM
          </button>
        </div>
        <p className="model-disclaimer">
          Prototype Decision Model <span>·</span> อ้างอิงจากข้อมูลจริงใน Demo
        </p>
      </div>
    </aside>
  );
}
