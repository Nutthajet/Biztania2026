'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, FileText, Mail, Send, X, Pencil, RefreshCw } from 'lucide-react';
import type { ActionType, Opportunity } from '@/types';
import { draftMessage, explainOpportunity } from '@/lib/aiReasoning';
import { money } from '@/lib/format';
export function ActionModal({
  type,
  opportunity: o,
  onClose,
  onSave,
}: {
  type: ActionType;
  opportunity: Opportunity;
  onClose: () => void;
  onSave: (type: ActionType, detail: string) => void;
}) {
  const [message, setMessage] = useState(draftMessage(o));
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const title =
    type === 'message'
      ? 'ร่างข้อความติดตาม พร้อมให้คุณตรวจสอบ'
      : type === 'quote'
        ? 'เตรียม Quote จากโอกาสการขายนี้'
        : 'อัปเดตข้อมูลลูกค้าให้ตรงกับแผน';
  const save = () => {
    onSave(
      type,
      type === 'message'
        ? message
        : type === 'quote'
          ? `${o.quantity} × ${o.product.productName} · ${money(o.orderValue, false)} ยังไม่รวมภาษีและค่าจัดส่ง`
          : explainOpportunity(o),
    );
    setSaved(true);
  };
  return (
    <dialog
      ref={dialog}
      className="action-dialog"
      aria-label={
        type === 'message'
          ? 'ร่างข้อความขาย'
          : type === 'quote'
            ? 'เตรียม Quote'
            : 'อัปเดต CRM ของลูกค้า'
      }
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <span className="modal-label">
          {type === 'message' ? (
            <Mail size={16} />
          ) : type === 'quote' ? (
            <FileText size={16} />
          ) : (
            <RefreshCw size={16} />
          )}{' '}
          {type === 'message' ? 'DRAFT MESSAGE' : type === 'quote' ? 'PREPARE QUOTE' : 'UPDATE CRM'}
        </span>
        <button className="icon-button" onClick={onClose} aria-label="ปิดหน้าต่าง">
          <X size={18} />
        </button>
      </div>
      {saved ? (
        <div className="modal-success">
          <span>
            <Check size={26} />
          </span>
          <h2>
            {type === 'message'
              ? 'ส่งข้อความจำลองเรียบร้อย'
              : type === 'quote'
                ? 'เตรียม Quote แล้ว'
                : 'อัปเดต CRM แล้ว'}
          </h2>
          <p>{o.customer.companyName} · บันทึกใน Action Center แล้ว</p>
          <p className="secondary">เป็นการจำลองการทำงาน ไม่มีการติดต่อระบบภายนอก</p>
          <button className="button primary" onClick={onClose}>
            กลับไปที่แผน
          </button>
        </div>
      ) : (
        <>
          <h2>{title}</h2>
          <p className="secondary">
            จัดเตรียมจากข้อมูลโอกาสการขายปัจจุบันของ {o.customer.companyName}
          </p>
          <div className="modal-recipient">
            <span>{type === 'message' ? 'ถึง' : 'ลูกค้า'}</span>
            <strong>{o.customer.companyName}</strong>
            <span className="push-right">{o.rep.name}</span>
          </div>
          {type === 'message' ? (
            <>
              <div className="subject-line">
                <span>หัวข้อ</span> วางแผนคำสั่งซื้อ {o.product.productName} รอบถัดไป
              </div>
              <textarea
                ref={input}
                aria-label="ร่างข้อความ"
                className={`message-editor ${editing ? 'editing' : ''}`}
                value={message}
                readOnly={!editing}
                onChange={(e) => setMessage(e.target.value)}
              />
            </>
          ) : type === 'quote' ? (
            <div className="quote-body">
              <div className="quote-title">
                <span>QUOTE · {o.customer.id.toUpperCase()}-1008</span>
                <span>ใช้ได้ภายใน 7 วัน</span>
              </div>
              <table className="quote-table">
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคาต่อหน่วย</th>
                    <th>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{o.product.productName}</td>
                    <td>{o.quantity}</td>
                    <td>{money(o.product.price, false)}</td>
                    <td>{money(o.orderValue, false)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="quote-total">
                ยอดรวมก่อนภาษี <strong>{money(o.orderValue, false)}</strong>
              </div>
              <p className="secondary">
                ยังไม่รวมภาษีและค่าจัดส่ง แสดงสิทธิ์ Promotion โดยไม่สมมติส่วนลดเพิ่มเติม Expected
                Revenue ในแผนถ่วงน้ำหนักตามโอกาสซื้อ ส่วน Quote นี้แสดงยอดสั่งซื้อเต็มจำนวน
              </p>
            </div>
          ) : (
            <div className="crm-body">
              <div>
                <span>Pipeline stage</span>
                <strong>Qualified opportunity</strong>
              </div>
              <div>
                <span>ผู้ดูแลลูกค้า</span>
                <strong>{o.rep.name}</strong>
              </div>
              <div>
                <span>Expected revenue</span>
                <strong>{money(o.expectedRevenue, false)}</strong>
              </div>
              <p>{explainOpportunity(o)}</p>
            </div>
          )}
          <div className="modal-footnote">
            <span className="status-dot" /> Demo mode · จำลองการทำงานและบันทึกไว้บนอุปกรณ์นี้
          </div>
          <div className="modal-footer">
            <button
              className="button"
              onClick={
                type === 'message'
                  ? () => {
                      setEditing(true);
                      input.current?.focus();
                    }
                  : onClose
              }
            >
              {type === 'message' && <Pencil size={14} />}{' '}
              {type === 'message' ? (editing ? 'กำลังแก้ไข' : 'แก้ไขร่าง') : 'ยกเลิก'}
            </button>
            <button
              className="button primary"
              disabled={type === 'message' && !message.trim()}
              onClick={save}
            >
              {type === 'message' ? <Send size={14} /> : <Check size={14} />}{' '}
              {type === 'message'
                ? 'ส่งข้อความ'
                : type === 'quote'
                  ? 'บันทึก Quote'
                  : 'ยืนยันอัปเดต CRM'}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
