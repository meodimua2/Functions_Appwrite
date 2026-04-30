const SUPPORTED_CURRENCIES = ["VNDC", "USDT"];
const SUPPORTED_COLLATERALS = ["ETH", "BTC", "NONE"];
const SUPPORTED_TERMS = [3, 6, 12];
const MIN_LOAN_AMOUNT = 1_000_000;      // 1 triệu VNDC
const MAX_LOAN_AMOUNT = 500_000_000;    // 500 triệu VNDC

function validateCreateLoan({ amount, currency, collateralType, termMonths }) {
    const errors = [];

    if (!amount || typeof amount !== "number" || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
        errors.push(`Số tiền vay phải từ ${MIN_LOAN_AMOUNT.toLocaleString()} đến ${MAX_LOAN_AMOUNT.toLocaleString()} VNDC`);
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        errors.push(`Đơn vị tiền tệ phải là: ${SUPPORTED_CURRENCIES.join(", ")}`);
    }

    if (!SUPPORTED_COLLATERALS.includes(collateralType)) {
        errors.push(`Tài sản thế chấp phải là: ${SUPPORTED_COLLATERALS.join(", ")}`);
    }

    if (!SUPPORTED_TERMS.includes(termMonths)) {
        errors.push(`Kỳ hạn phải là: ${SUPPORTED_TERMS.join(", ")} tháng`);
    }

    return errors;
}

function validateRepay({ loanId, amount }) {
    const errors = [];

    if (!loanId || typeof loanId !== "string") {
        errors.push("loanId không hợp lệ");
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
        errors.push("Số tiền trả phải lớn hơn 0");
    }

    return errors;
}

function validateKYC({ fullName, cccdNumber, cccdFrontUrl, cccdBackUrl, selfieUrl }) {
    const errors = [];

    if (!fullName || fullName.trim().length < 2) {
        errors.push("Họ tên không hợp lệ");
    }

    if (!cccdNumber || !/^\d{9,12}$/.test(cccdNumber)) {
        errors.push("Số CCCD/CMND phải gồm 9-12 chữ số");
    }

    if (!cccdFrontUrl) errors.push("Thiếu ảnh mặt trước CCCD");
    if (!cccdBackUrl) errors.push("Thiếu ảnh mặt sau CCCD");
    if (!selfieUrl) errors.push("Thiếu ảnh selfie");

    return errors;
}

module.exports = { validateCreateLoan, validateRepay, validateKYC };
