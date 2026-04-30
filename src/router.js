const { authHandler } = require("./handlers/auth");
const { createLoanHandler, repayHandler, liquidateHandler, getLoanHandler, getLoansHandler } = require("./handlers/loan");
const { submitKycHandler, getKycStatusHandler, reviewKycHandler } = require("./handlers/kyc");
const { getTransactionsHandler } = require("./handlers/ledger");
const { getDashboardHandler } = require("./handlers/dashboard");
const { authMiddleware } = require("./middleware/auth.middleware");

// Các action yêu cầu xác thực JWT
const PROTECTED_ACTIONS = new Set([
    "get_dashboard",
    "create_loan",
    "repay",
    "liquidate",
    "get_loan",
    "get_loans",
    "submit_kyc",
    "get_kyc_status",
    "get_transactions",
    "review_kyc",
]);

async function router(context) {
    const { payload, res } = context;
    const action = payload?.action || "auth";

    if (PROTECTED_ACTIONS.has(action)) {
        const authError = await authMiddleware(context);
        if (authError) return authError;
    }

    switch (action) {
        // ─── Auth ───────────────────────────────────────────────
        case "auth":
            return await authHandler(context);

        // ─── Dashboard ──────────────────────────────────────────
        case "get_dashboard":
            return await getDashboardHandler(context);

        // ─── Loan Lifecycle ─────────────────────────────────────
        case "create_loan":
            return await createLoanHandler(context);

        case "repay":
            return await repayHandler(context);

        case "liquidate":
            return await liquidateHandler(context);

        case "get_loan":
            return await getLoanHandler(context);

        case "get_loans":
            return await getLoansHandler(context);

        // ─── KYC ────────────────────────────────────────────────
        case "submit_kyc":
            return await submitKycHandler(context);

        case "get_kyc_status":
            return await getKycStatusHandler(context);

        case "review_kyc":
            return await reviewKycHandler(context);

        // ─── Ledger (Sổ cái minh bạch) ──────────────────────────
        case "get_transactions":
            return await getTransactionsHandler(context);

        default:
            return res.json({ success: false, message: `Action '${action}' không tồn tại` }, 404);
    }
}

module.exports = router;
