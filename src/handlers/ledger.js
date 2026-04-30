const { TransactionService } = require("../service/transaction.service");

const txSvc = new TransactionService();

/**
 * GET action: get_transactions
 * Sổ cái minh bạch — lịch sử giao dịch
 * Mỗi tx đều có txHash + explorerUrl để verify trực tiếp trên Blockchain
 */
async function getTransactionsHandler({ payload, res, error }) {
    const { userId, loanId, limit = 50, offset = 0 } = payload;

    try {
        let result;

        if (loanId) {
            result = await txSvc.getByLoan(loanId, { limit, offset });
        } else {
            result = await txSvc.getByUser(userId, { limit, offset });
        }

        const transactions = result.documents.map(tx => txSvc.formatTx(tx));

        // Tổng kết sổ cái
        const summary = transactions.reduce((acc, tx) => {
            acc.totalIn += tx.type === "DISBURSEMENT" ? tx.amount : 0;
            acc.totalOut += ["REPAYMENT", "PENALTY"].includes(tx.type) ? tx.amount : 0;
            acc.count += 1;
            return acc;
        }, { totalIn: 0, totalOut: 0, count: 0 });

        return res.json({
            success: true,
            transactions,
            summary,
            total: result.total,
            pagination: { limit, offset },
            blockchainNote: "Mỗi giao dịch được ghi vĩnh viễn trên Polygon Blockchain. Nhấn 'explorerUrl' để xác minh độc lập.",
        });
    } catch (err) {
        error("getTransactions error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

module.exports = { getTransactionsHandler };
