export interface MemberFeeDetails {
  status: 'Paid' | 'Partial' | 'Unpaid';
  fee: number;
  paidAmount: number;
  dueAmount: number;
  isFullyPaid: boolean;
  isPartial: boolean;
  isUnpaid: boolean;
}

export const getMemberFeeDetails = (member: { 
  fee: number; 
  feePaid: boolean; 
  paidAmount?: number; 
  pendingDue?: number; 
}): MemberFeeDetails => {
  const fee = Number(member.fee) || 0;
  
  // If explicitly marked as full feePaid
  if (member.feePaid) {
    const paidAmount = member.paidAmount !== undefined ? Number(member.paidAmount) : fee;
    return {
      status: 'Paid',
      fee,
      paidAmount,
      dueAmount: 0,
      isFullyPaid: true,
      isPartial: false,
      isUnpaid: false,
    };
  }

  // If paidAmount is greater than or equal to fee
  if (member.paidAmount !== undefined && Number(member.paidAmount) >= fee && fee > 0) {
    return {
      status: 'Paid',
      fee,
      paidAmount: Number(member.paidAmount),
      dueAmount: 0,
      isFullyPaid: true,
      isPartial: false,
      isUnpaid: false,
    };
  }

  // Calculate based on paidAmount or pendingDue
  let paidAmount = 0;
  if (member.paidAmount !== undefined) {
    paidAmount = Math.max(0, Number(member.paidAmount));
  } else if (member.pendingDue !== undefined) {
    paidAmount = Math.max(0, fee - Number(member.pendingDue));
  }

  const dueAmount = Math.max(0, fee - paidAmount);

  if (paidAmount > 0 && dueAmount > 0) {
    return {
      status: 'Partial',
      fee,
      paidAmount,
      dueAmount,
      isFullyPaid: false,
      isPartial: true,
      isUnpaid: false,
    };
  }

  return {
    status: 'Unpaid',
    fee,
    paidAmount: 0,
    dueAmount: fee,
    isFullyPaid: false,
    isPartial: false,
    isUnpaid: true,
  };
};
