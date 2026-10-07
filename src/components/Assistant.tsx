'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, MessageSquare, X } from 'lucide-react';
import type { AllocationResult, Constraints, EnterpriseData } from '@/types';
import { answerQuestion } from '@/lib/aiReasoning';
import { BrandMark } from './ui';
export function Assistant({
  data,
  result,
  constraints,
  onCapacity,
  onRun,
  open,
  setOpen,
}: {
  data: EnterpriseData;
  result: AllocationResult;
  constraints: Constraints;
  onCapacity: (h: number) => void;
  onRun: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const feed = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [messages]);
  function send(text: string) {
    if (!text.trim()) return;
    const answer = answerQuestion(text, data, result, constraints);
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: answer.text }]);
    setInput('');
    if (answer.capacity !== undefined) onCapacity(answer.capacity);
    if (answer.rerun) onRun();
  }
  return (
    <>
      {!open && (
        <button className="assistant-launcher" onClick={() => setOpen(true)}>
          <MessageSquare size={17} />
          <span>Ask Concierge</span>
          <span className="keycap">↗</span>
        </button>
      )}
      {open && (
        <section className="assistant-panel" aria-label="ผู้ช่วย AI สำหรับแผนปัจจุบัน">
          <div className="assistant-header">
            <BrandMark small />
            <div>
              <strong>Ask Concierge</strong>
              <span>ตอบคำถามจากแผนและข้อมูลปัจจุบัน</span>
            </div>
            <button
              className="icon-button push-right"
              onClick={() => setOpen(false)}
              aria-label="ปิดผู้ช่วย"
            >
              <X size={17} />
            </button>
          </div>
          <div className="assistant-feed" ref={feed} aria-live="polite">
            <div className="assistant-intro">
              <span className="eyebrow">ข้อมูลที่พร้อมใช้ตอบคำถาม</span>
              <p>
                พร้อมตอบจากข้อมูลลูกค้า 24 ราย สินค้า 18 รายการ และเวลาทีมขาย {constraints.hours}h
                ในแผนปัจจุบัน
              </p>
              {messages.length === 0 && (
                <div className="suggestion-list">
                  {[
                    'ทำไม ABC Foods ได้อันดับ 1?',
                    'ถ้ามีเวลาแค่ 10 ชั่วโมงล่ะ?',
                    'ลูกค้ารายไหนมีความเสี่ยง Churn?',
                    'หาโอกาส Margin สูงที่มีสต็อก',
                  ].map((s) => (
                    <button key={s} onClick={() => send(s)}>
                      {s}
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`assistant-message ${m.role}`}>
                <span>{m.role === 'user' ? 'คุณ' : 'CONCIERGE'}</span>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
          <form
            className="assistant-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              aria-label="คำถามเกี่ยวกับแผนการจัดสรร"
              placeholder="ถามเกี่ยวกับแผนการจัดสรร…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button aria-label="ส่งคำถาม" disabled={!input.trim()}>
              <ArrowUp size={17} />
            </button>
          </form>
          <div className="assistant-disclaimer">ผู้ช่วยต้นแบบ · ใช้ข้อมูลจำลองและกฎที่กำหนดไว้</div>
        </section>
      )}
    </>
  );
}
