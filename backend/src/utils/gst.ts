// GST rate for jewellery in India = 3%
const JEWELLERY_GST_RATE = 0.03;
const CGST_RATE = 0.015; // 1.5%
const SGST_RATE = 0.015; // 1.5%
const IGST_RATE = 0.03;  // 3% for inter-state

// Jaipur, Rajasthan state code
const SELLER_STATE = 'Rajasthan';

export interface GSTBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  isInterState: boolean;
}

export function calculateGST(taxableAmount: number, buyerState: string): GSTBreakdown {
  const isInterState = buyerState.toLowerCase() !== SELLER_STATE.toLowerCase();

  if (isInterState) {
    const igst = Math.round(taxableAmount * IGST_RATE * 100) / 100;
    return {
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst,
      totalGst: igst,
      isInterState: true,
    };
  }

  const cgst = Math.round(taxableAmount * CGST_RATE * 100) / 100;
  const sgst = Math.round(taxableAmount * SGST_RATE * 100) / 100;

  return {
    taxableAmount,
    cgst,
    sgst,
    igst: 0,
    totalGst: cgst + sgst,
    isInterState: false,
  };
}

export function calculateSimpleGST(amount: number): number {
  return Math.round(amount * JEWELLERY_GST_RATE * 100) / 100;
}
