const { databases, ID, Query } = require("../config/appwrite.config");
const { calcMonthlyPayment, calcTotalRepayable, calcDueDate, calcNextPaymentDate } = require("../utils/interest");

const DB = () => process.env.APPWRITE_DATABASE_ID;
const COL = "loans";

// Lãi suất mặc định theo kỳ hạn (% / năm)
const RATE_BY_TERM = { 3: 18, 6: 15, 12: 12 };

class LoanService {
    async create({ borrowerId, amount, currency, collateralType, collateralAmount, termMonths }) {
        const annualRate = RATE_BY_TERM[termMonths] ?? 15;
        const monthlyPayment = calcMonthlyPayment(amount, annualRate, termMonths);
        const totalRepayable = calcTotalRepayable(monthlyPayment, termMonths);
        const now = new Date().toISOString();
        const dueDate = calcDueDate(now, termMonths);
        const nextPaymentDate = calcNextPaymentDate(now, 0);

        return await databases.createDocument(DB(), COL, ID.unique(), {
            borrowerId: String(borrowerId),
            lenderId: null,
            amount,
            currency: currency || "VNDC",
            collateralType: collateralType || "NONE",
            collateralAmount: collateralAmount || 0,
            interestRate: annualRate,
            termMonths,
            monthlyPayment,
            totalRepayable,
            paidAmount: 0,
            installmentsPaid: 0,
            status: "PENDING",
            txHash: null,
            blockNumber: null,
            explorerUrl: null,
            dueDate,
            nextPaymentDate,
            createdAt: now,
        });
    }

    async activate(loanId, { lenderId, txHash, blockNumber, explorerUrl }) {
        return await databases.updateDocument(DB(), COL, loanId, {
            lenderId: lenderId ? String(lenderId) : null,
            status: "ACTIVE",
            txHash,
            blockNumber,
            explorerUrl,
        });
    }

    async repay(loanId, { amount, txHash, blockNumber, explorerUrl }) {
        const loan = await this.getById(loanId);
        const newPaid = loan.paidAmount + amount;
        const newInstallments = loan.installmentsPaid + 1;
        const isCompleted = newInstallments >= loan.termMonths;

        const updates = {
            paidAmount: newPaid,
            installmentsPaid: newInstallments,
            status: isCompleted ? "COMPLETED" : "ACTIVE",
        };

        if (!isCompleted) {
            updates.nextPaymentDate = calcNextPaymentDate(loan.createdAt, newInstallments);
        }

        return await databases.updateDocument(DB(), COL, loanId, updates);
    }

    async liquidate(loanId, { txHash, blockNumber, explorerUrl }) {
        return await databases.updateDocument(DB(), COL, loanId, {
            status: "LIQUIDATED",
            txHash,
            blockNumber,
            explorerUrl,
        });
    }

    async markDefaulted(loanId) {
        return await databases.updateDocument(DB(), COL, loanId, { status: "DEFAULTED" });
    }

    async getById(loanId) {
        return await databases.getDocument(DB(), COL, loanId);
    }

    async getByBorrower(borrowerId, { status, limit = 20, offset = 0 } = {}) {
        const queries = [
            Query.equal("borrowerId", String(borrowerId)),
            Query.orderDesc("createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ];
        if (status) queries.push(Query.equal("status", status));
        return await databases.listDocuments(DB(), COL, queries);
    }

    async getAll({ status, limit = 20, offset = 0 } = {}) {
        const queries = [
            Query.orderDesc("createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ];
        if (status) queries.push(Query.equal("status", status));
        return await databases.listDocuments(DB(), COL, queries);
    }

    /** Tính % hoàn thành khoản vay */
    calcProgress(loan) {
        if (!loan.totalRepayable || loan.totalRepayable === 0) return 0;
        return parseFloat(((loan.paidAmount / loan.totalRepayable) * 100).toFixed(1));
    }

    formatLoan(loan) {
        return {
            id: loan.$id,
            borrowerId: loan.borrowerId,
            lenderId: loan.lenderId,
            amount: loan.amount,
            currency: loan.currency,
            collateralType: loan.collateralType,
            collateralAmount: loan.collateralAmount,
            interestRate: loan.interestRate,
            termMonths: loan.termMonths,
            monthlyPayment: loan.monthlyPayment,
            totalRepayable: loan.totalRepayable,
            paidAmount: loan.paidAmount,
            installmentsPaid: loan.installmentsPaid,
            installmentsLeft: loan.termMonths - loan.installmentsPaid,
            progressPercent: this.calcProgress(loan),
            status: loan.status,
            txHash: loan.txHash,
            blockNumber: loan.blockNumber,
            explorerUrl: loan.explorerUrl,
            dueDate: loan.dueDate,
            nextPaymentDate: loan.nextPaymentDate,
            createdAt: loan.createdAt,
        };
    }
}

module.exports = { LoanService };
