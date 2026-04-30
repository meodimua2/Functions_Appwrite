const { LoanService } = require("../service/loan.service");
const { TransactionService, TX_TYPES } = require("../service/transaction.service");
const { BlockchainService } = require("../service/blockchain.service");
const { UserService } = require("../service/user.service");
const { validateCreateLoan, validateRepay } = require("../utils/validators");
const { calcLateFee } = require("../utils/interest");

const loanSvc = new LoanService();
const txSvc = new TransactionService();
const blockchain = new BlockchainService();
const userSvc = new UserService();

/**
 * POST action: create_loan
 * Tạo khoản vay mới, gọi Smart Contract createLoan()
 */
async function createLoanHandler({ payload, res, log, error }) {
    const { userId } = payload;
    const { amount, currency = "VNDC", collateralType = "NONE", collateralAmount = 0, termMonths } = payload;

    const errors = validateCreateLoan({ amount, currency, collateralType, termMonths });
    if (errors.length) {
        return res.json({ success: false, message: errors[0], errors }, 400);
    }

    // Kiểm tra KYC nếu không có tài sản thế chấp
    if (collateralType === "NONE") {
        const user = await userSvc.getOrCreate(userId);
        if (user.kycStatus !== "approved") {
            return res.json({
                success: false,
                message: "Vay tín chấp yêu cầu xác minh danh tính (KYC) trước",
                requireKYC: true,
            }, 403);
        }
    }

    try {
        const loan = await loanSvc.create({ borrowerId: userId, amount, currency, collateralType, collateralAmount, termMonths });

        const bcResult = await blockchain.createLoan({ borrowerId: userId, amount, termMonths, collateralType });
        await loanSvc.activate(loan.$id, {
            lenderId: null,
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
        });

        await txSvc.record({
            loanId: loan.$id,
            userId,
            type: TX_TYPES.DISBURSEMENT,
            amount,
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
            note: `Giải ngân khoản vay ${termMonths} tháng`,
        });

        await userSvc.incrementLoanStats(userId, { borrowed: amount, activeLoans: 1 });

        const updated = await loanSvc.getById(loan.$id);
        log(`Loan created: ${loan.$id} by user ${userId}`);

        return res.json({
            success: true,
            message: "Tạo khoản vay thành công!",
            loan: loanSvc.formatLoan(updated),
            blockchain: {
                txHash: bcResult.txHash,
                blockNumber: bcResult.blockNumber,
                explorerUrl: bcResult.explorerUrl,
                event: "LoanCreated",
            },
        });
    } catch (err) {
        error("createLoan error: " + err.message);
        return res.json({ success: false, message: "Không thể tạo khoản vay" }, 500);
    }
}

/**
 * POST action: repay
 * Trả nợ một kỳ, gọi Smart Contract repay()
 */
async function repayHandler({ payload, res, log, error }) {
    const { userId, loanId, amount } = payload;

    const errors = validateRepay({ loanId, amount });
    if (errors.length) {
        return res.json({ success: false, message: errors[0], errors }, 400);
    }

    try {
        const loan = await loanSvc.getById(loanId);

        if (loan.borrowerId !== String(userId)) {
            return res.json({ success: false, message: "Không có quyền truy cập khoản vay này" }, 403);
        }

        if (!["ACTIVE", "DEFAULTED"].includes(loan.status)) {
            return res.json({ success: false, message: `Khoản vay đang ở trạng thái ${loan.status}, không thể trả` }, 400);
        }

        // Kiểm tra và tính phí phạt nếu quá hạn
        let lateFee = 0;
        const now = new Date();
        const nextDue = new Date(loan.nextPaymentDate);
        if (now > nextDue) {
            const daysLate = Math.floor((now - nextDue) / (1000 * 60 * 60 * 24));
            lateFee = calcLateFee(loan.monthlyPayment, daysLate);
        }

        const totalAmount = amount + lateFee;

        const bcResult = await blockchain.repay({ loanId, userId, amount: totalAmount });

        const updatedLoan = await loanSvc.repay(loanId, {
            amount: totalAmount,
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
        });

        await txSvc.record({
            loanId,
            userId,
            type: TX_TYPES.REPAYMENT,
            amount: totalAmount,
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
            note: lateFee > 0 ? `Trả kỳ ${updatedLoan.installmentsPaid} (bao gồm phí phạt ${lateFee.toLocaleString()} VNDC)` : `Trả kỳ ${updatedLoan.installmentsPaid}`,
        });

        if (lateFee > 0) {
            await txSvc.record({
                loanId,
                userId,
                type: TX_TYPES.PENALTY,
                amount: lateFee,
                txHash: bcResult.txHash,
                blockNumber: bcResult.blockNumber,
                explorerUrl: bcResult.explorerUrl,
                note: "Phí phạt chậm thanh toán",
            });
        }

        await userSvc.incrementLoanStats(userId, { repaid: totalAmount });
        if (updatedLoan.status === "COMPLETED") {
            await userSvc.incrementLoanStats(userId, { activeLoans: -1 });
            await userSvc.updateCreditScore(userId, +50);
        }

        const isCompleted = updatedLoan.status === "COMPLETED";
        log(`Repay loan ${loanId} by user ${userId}: ${totalAmount}`);

        return res.json({
            success: true,
            message: isCompleted ? "Chúc mừng! Bạn đã trả hết nợ!" : `Trả kỳ ${updatedLoan.installmentsPaid} thành công!`,
            loan: loanSvc.formatLoan(updatedLoan),
            payment: { amount, lateFee, total: totalAmount },
            blockchain: {
                txHash: bcResult.txHash,
                blockNumber: bcResult.blockNumber,
                explorerUrl: bcResult.explorerUrl,
            },
        });
    } catch (err) {
        error("repay error: " + err.message);
        return res.json({ success: false, message: "Không thể xử lý thanh toán" }, 500);
    }
}

/**
 * POST action: liquidate
 * Thanh lý tài sản thế chấp (khi LTV > 80% hoặc quá hạn)
 */
async function liquidateHandler({ payload, res, log, error }) {
    const { userId, loanId } = payload;

    try {
        const loan = await loanSvc.getById(loanId);

        if (!["ACTIVE", "DEFAULTED"].includes(loan.status)) {
            return res.json({ success: false, message: "Khoản vay không thể thanh lý" }, 400);
        }

        if (loan.collateralType === "NONE") {
            return res.json({ success: false, message: "Khoản vay này không có tài sản thế chấp" }, 400);
        }

        const bcResult = await blockchain.liquidate({ loanId, collateralAmount: loan.collateralAmount });

        await loanSvc.liquidate(loanId, {
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
        });

        await txSvc.record({
            loanId,
            userId,
            type: TX_TYPES.LIQUIDATION,
            amount: loan.amount - loan.paidAmount,
            txHash: bcResult.txHash,
            blockNumber: bcResult.blockNumber,
            explorerUrl: bcResult.explorerUrl,
            note: `Thanh lý ${loan.collateralAmount} ${loan.collateralType} để thu hồi nợ`,
        });

        await userSvc.updateCreditScore(loan.borrowerId, -150);
        await userSvc.incrementLoanStats(loan.borrowerId, { activeLoans: -1 });

        log(`Liquidated loan ${loanId}`);
        return res.json({
            success: true,
            message: "Tài sản thế chấp đã được thanh lý",
            blockchain: { txHash: bcResult.txHash, explorerUrl: bcResult.explorerUrl },
        });
    } catch (err) {
        error("liquidate error: " + err.message);
        return res.json({ success: false, message: "Không thể thanh lý khoản vay" }, 500);
    }
}

/**
 * GET action: get_loan — chi tiết 1 khoản vay
 */
async function getLoanHandler({ payload, res, error }) {
    const { userId, loanId } = payload;

    try {
        const loan = await loanSvc.getById(loanId);
        if (loan.borrowerId !== String(userId) && loan.lenderId !== String(userId)) {
            return res.json({ success: false, message: "Không có quyền xem khoản vay này" }, 403);
        }
        return res.json({ success: true, loan: loanSvc.formatLoan(loan) });
    } catch (err) {
        if (err.code === 404) return res.json({ success: false, message: "Khoản vay không tồn tại" }, 404);
        error("getLoan error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

/**
 * GET action: get_loans — danh sách khoản vay của user
 */
async function getLoansHandler({ payload, res, error }) {
    const { userId, status, limit = 20, offset = 0 } = payload;

    try {
        const result = await loanSvc.getByBorrower(userId, { status, limit, offset });
        return res.json({
            success: true,
            loans: result.documents.map(l => loanSvc.formatLoan(l)),
            total: result.total,
        });
    } catch (err) {
        error("getLoans error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

module.exports = { createLoanHandler, repayHandler, liquidateHandler, getLoanHandler, getLoansHandler };
