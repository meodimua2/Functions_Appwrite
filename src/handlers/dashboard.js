const { LoanService } = require("../service/loan.service");
const { TransactionService } = require("../service/transaction.service");
const { UserService } = require("../service/user.service");
const { KycService } = require("../service/kyc.service");

const loanSvc = new LoanService();
const txSvc = new TransactionService();
const userSvc = new UserService();
const kycSvc = new KycService();

/**
 * GET action: get_dashboard
 * Tổng hợp mọi thứ cần thiết để render màn hình Dashboard
 */
async function getDashboardHandler({ payload, res, error }) {
    const { userId } = payload;

    try {
        const [user, loansResult, recentTxResult, kyc] = await Promise.all([
            userSvc.getOrCreate(userId),
            loanSvc.getByBorrower(userId, { limit: 10 }),
            txSvc.getByUser(userId, { limit: 5 }),
            kycSvc.getByUser(userId),
        ]);

        const loans = loansResult.documents.map(l => loanSvc.formatLoan(l));
        const recentTx = recentTxResult.documents.map(t => txSvc.formatTx(t));

        // Khoản vay đang active
        const activeLoans = loans.filter(l => l.status === "ACTIVE");
        const activeOne = activeLoans[0] ?? null;

        // Tính toán widget khoản vay chính
        let loanWidget = null;
        if (activeOne) {
            loanWidget = {
                loanId: activeOne.id,
                amount: activeOne.amount,
                currency: activeOne.currency,
                progressPercent: activeOne.progressPercent,
                paidAmount: activeOne.paidAmount,
                remainingAmount: activeOne.totalRepayable - activeOne.paidAmount,
                monthlyPayment: activeOne.monthlyPayment,
                nextPaymentDate: activeOne.nextPaymentDate,
                installmentsLeft: activeOne.installmentsLeft,
                status: activeOne.status,
            };
        }

        return res.json({
            success: true,
            dashboard: {
                user: {
                    userId,
                    kycStatus: user.kycStatus,
                    creditScore: user.creditScore,
                    walletAddress: user.walletAddress,
                    totalBorrowed: user.totalBorrowed,
                    totalRepaid: user.totalRepaid,
                    activeLoansCount: user.activeLoansCount,
                },
                kyc: kycSvc.formatKyc(kyc),
                loanWidget,
                activeLoansCount: activeLoans.length,
                recentTransactions: recentTx,
                allLoans: loans,
                networkStatus: {
                    connected: true,
                    network: "Polygon Mainnet",
                    label: "Blockchain: Connected",
                },
            },
        });
    } catch (err) {
        error("getDashboard error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

module.exports = { getDashboardHandler };
