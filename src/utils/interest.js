/**
 * PMT formula: tính tiền trả hàng tháng (gốc + lãi)
 * P = gốc, r = lãi suất tháng (decimal), n = số tháng
 */
function calcMonthlyPayment(principal, annualRatePercent, termMonths) {
    const r = annualRatePercent / 100 / 12;
    if (r === 0) return Math.ceil(principal / termMonths);
    const pmt = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    return Math.ceil(pmt);
}

function calcTotalRepayable(monthlyPayment, termMonths) {
    return monthlyPayment * termMonths;
}

function calcTotalInterest(totalRepayable, principal) {
    return totalRepayable - principal;
}

/** LTV (Loan-to-Value): tỉ lệ vay / tài sản thế chấp */
function calcLTV(loanAmount, collateralValueUSD) {
    if (!collateralValueUSD || collateralValueUSD === 0) return null;
    return parseFloat(((loanAmount / collateralValueUSD) * 100).toFixed(2));
}

/** Phí phạt chậm trả: 0.1%/ngày */
function calcLateFee(overdueAmount, daysLate) {
    return Math.ceil(overdueAmount * 0.001 * daysLate);
}

/** Ngày đến hạn thanh toán tháng tiếp theo */
function calcNextPaymentDate(fromDate, installmentsPaid) {
    const d = new Date(fromDate);
    d.setMonth(d.getMonth() + installmentsPaid + 1);
    return d.toISOString();
}

/** Ngày đáo hạn cuối cùng */
function calcDueDate(startDate, termMonths) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + termMonths);
    return d.toISOString();
}

/** Kiểm tra khoản vay có bị liquidate chưa (LTV > 80%) */
function shouldLiquidate(loanAmount, currentCollateralValueUSD) {
    const ltv = calcLTV(loanAmount, currentCollateralValueUSD);
    return ltv !== null && ltv > 80;
}

module.exports = {
    calcMonthlyPayment,
    calcTotalRepayable,
    calcTotalInterest,
    calcLTV,
    calcLateFee,
    calcNextPaymentDate,
    calcDueDate,
    shouldLiquidate,
};
