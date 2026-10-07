import type { AllocationResult, Constraints, EnterpriseData, Opportunity } from '@/types';
import { firstName, money, percent } from './format';
export function explainOpportunity(o: Opportunity) {
  return `${o.customer.companyName} มีโอกาสซื้อ ${percent(o.customer.purchaseProbability)} และ Product Margin ${(o.product.grossMargin * 100).toFixed(1)}% ${o.overdueDays ? `เกินรอบ Reorder มาแล้ว ${o.overdueDays} วัน` : `สั่งซื้อครั้งล่าสุดเมื่อ ${o.daysSincePurchase} วันก่อน`} มีสต็อก ${o.inventoryAvailable.toLocaleString('en-US')} หน่วย รองรับคำสั่งซื้อ ${o.quantity} หน่วย${o.product.promotionActive ? ' และมี Promotion ที่ใช้งานได้' : ''} ${firstName(o.rep.name)} ดูแลพื้นที่ ${o.customer.region}${o.rep.specialization.includes(o.customer.industry) ? ` และเชี่ยวชาญในกลุ่ม ${o.customer.industry}` : ''} การเข้าพบ ${o.hours} ชั่วโมงนี้มี Expected Gross Margin ${money(o.expectedMargin)} หลังถ่วงน้ำหนักตามโอกาสซื้อ${o.customer.churnRisk >= 0.6 ? ` อีกทั้ง Churn Risk ${percent(o.customer.churnRisk)} ทำให้ควรเร่งติดตามเพื่อรักษาลูกค้า` : ''}${o.alternative ? ` จึงเสนอ ${o.product.productName} เป็นสินค้าทดแทนที่เข้าเงื่อนไขแทนสินค้าตัวเลือกแรก` : ''}`;
}
export function draftMessage(o: Opportunity) {
  return `เรียน ทีมงาน ${o.customer.companyName}\n\n${o.overdueDays ? `ขณะนี้เกินรอบการสั่งซื้อปกติ ${o.customer.reorderCycle} วันแล้ว จึงขอติดต่อเพื่อช่วยวางแผนคำสั่งซื้อรอบถัดไป` : 'ขอติดต่อเพื่อช่วยวางแผนคำสั่งซื้อรอบถัดไป'}\n\nขอแนะนำ ${o.product.productName} จำนวน ${o.quantity} หน่วย ราคาหน่วยละ ${money(o.product.price, false)} ปัจจุบันมีสต็อก ${o.inventoryAvailable.toLocaleString('en-US')} หน่วย${o.product.promotionActive ? ' และมี Promotion ที่สามารถแจ้งรายละเอียดเพิ่มเติมได้' : ''} ยอดสั่งซื้อประมาณ ${money(o.orderValue, false)} ยังไม่รวมภาษีและค่าจัดส่ง\n\nไม่ทราบว่าสะดวกพูดคุยรายละเอียดในวันพรุ่งนี้หรือไม่\n\nขอบคุณ\n${o.rep.name}`;
}
export function answerQuestion(
  question: string,
  data: EnterpriseData,
  result: AllocationResult,
  constraints: Constraints,
): { text: string; capacity?: number; rerun?: boolean } {
  const q = question
    .toLowerCase()
    .replace(/[๐-๙]/g, (digit) => String(digit.charCodeAt(0) - 0x0e50));
  const hours = /why|reason|ทำไม|เหตุผล|เพราะอะไร/.test(q)
    ? null
    : q.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*(?:sales[- ]?)?(?:hours?\b|h\b|ชั่วโมง|ชม\.?)/);
  if (hours) {
    const capacity = Number(hours[1]);
    if (!Number.isInteger(capacity) || capacity < 5 || capacity > 40)
      return {
        text: 'Demo นี้รองรับเวลารวมเป็นจำนวนเต็มตั้งแต่ 5–40 ชั่วโมง ลองถามว่า “จัดสรรเวลา 10 ชั่วโมง”',
      };
    return {
      text: `ปรับเวลาเป็น ${capacity} sales-hours และคำนวณแผนใหม่แล้ว โดยใช้ข้อจำกัด Margin สต็อก พื้นที่ และความพร้อมของ Sales Rep ปัจจุบัน ดูแผนและผลลัพธ์ที่เปลี่ยนไปได้ในหน้าภาพรวม`,
      capacity,
    };
  }
  if (/churn|risk|retention|เสี่ยง|เลิกซื้อ|รักษาลูกค้า/.test(q)) {
    const risks = data.customers
      .filter((c) => c.churnRisk >= 0.6)
      .sort((a, b) => b.churnRisk - a.churnRisk);
    return {
      text: `ลูกค้าที่มี Churn Risk ตั้งแต่ 60%: ${risks.map((c) => `${c.companyName} (${percent(c.churnRisk)})`).join('; ')} ในกลุ่มนี้มี ${risks.filter((c) => result.opportunities.some((o) => o.customer.id === c.id)).length} รายที่ได้รับการจัดสรรเวลาเข้าพบแล้ว แนะนำติดตามรายอื่นทางไกลในช่วงที่เวลามีจำกัด`,
    };
  }
  if (/high.margin|inventory|stock|margin\s*สูง|มาร์จิ้น|กำไรสูง|สต็อก|คงคลัง/.test(q)) {
    const high = result.candidates.filter(
      (o) => o.product.grossMargin >= 0.3 && o.inventoryAvailable >= o.quantity,
    );
    return {
      text: high.length
        ? `โอกาสที่มี Product Margin อย่างน้อย 30% และสต็อกเพียงพอ: ${high
            .slice(0, 5)
            .map(
              (o) =>
                `${o.customer.companyName} → ${o.product.productName} (Margin ${percent(o.product.grossMargin)}; Expected Gross Margin ${money(o.expectedMargin)})`,
            )
            .join(
              '; ',
            )} การเลือกเข้าพบยังขึ้นอยู่กับเวลารวม ${constraints.hours}h และความพร้อมของ Sales Rep`
        : 'ไม่พบโอกาสที่มี Product Margin ตั้งแต่ 30% ภายใต้สต็อกและเวลาทีมขายปัจจุบัน ลองคืนค่าสต็อกหรือเพิ่มเวลาว่างของ Sales Rep',
    };
  }
  if (/reallocate|optimize|run again|จัดสรรใหม่|จัดสรร.*อีก|คำนวณใหม่|วางแผนใหม่/.test(q))
    return {
      text: `กำลังจัดสรรแผนใหม่สำหรับเวลา ${constraints.hours} ชั่วโมง โดยเชื่อมต่อแหล่งข้อมูลจำลองทั้ง 6 ระบบและอัปเดตแผนอีกครั้ง`,
      rerun: true,
    };
  const match = data.customers.find(
    (c) =>
      q.includes(c.companyName.toLowerCase()) ||
      q.includes(c.companyName.toLowerCase().split(' ')[0]),
  );
  const opportunity = match
    ? result.opportunities.find((o) => o.customer.id === match.id)
    : result.opportunities[0];
  if (opportunity && (/why|reason|rank|priorit|abc|ทำไม|เหตุผล|อันดับ|เพราะอะไร/.test(q) || match))
    return { text: `Priority #${opportunity.rank} · ${explainOpportunity(opportunity)}` };
  if (match)
    return {
      text: `${match.companyName} ยังไม่ได้รับการจัดสรรเวลาเข้าพบ ${result.excluded.find((e) => e.customer.id === match.id)?.reason ?? 'อยู่นอกแผนปัจจุบัน'}`,
    };
  return {
    text: `แผนปัจจุบันใช้ ${result.totalHours} จาก ${constraints.hours} ชั่วโมง ดูแลลูกค้า ${result.opportunities.length} ราย และมี Expected Gross Margin ${money(result.expectedMargin)} คุณสามารถถามเหตุผลของลูกค้าแต่ละราย ปรับเวลา ตรวจสอบ Churn Risk หาโอกาส Margin สูงที่มีสต็อก หรือให้จัดสรรทีมใหม่ได้ ผู้ช่วยต้นแบบนี้ตอบจากกฎและข้อมูล Demo ปัจจุบัน`,
  };
}
