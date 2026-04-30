const crypto = require("crypto");

// Giả lập Polygon mainnet block number (thực tế ~60M+ block)
const BASE_BLOCK = 60_000_000;

/**
 * Blockchain simulation layer.
 * Trong production: thay bằng lời gọi thực tế đến Polygon RPC
 * và Smart Contract qua ethers.js.
 */
class BlockchainService {
    /**
     * Tạo tx hash giống Ethereum: 0x + 64 ký tự hex
     */
    generateTxHash(seed = "") {
        const rand = crypto.randomBytes(32);
        const input = Buffer.concat([rand, Buffer.from(seed + Date.now())]);
        return "0x" + crypto.createHash("sha256").update(input).digest("hex");
    }

    /**
     * Block number ngẫu nhiên trong khoảng thực tế của Polygon
     */
    generateBlockNumber() {
        return BASE_BLOCK + Math.floor(Math.random() * 5_000_000);
    }

    /**
     * URL xem giao dịch trên PolygonScan
     */
    getExplorerUrl(txHash) {
        return `https://polygonscan.com/tx/${txHash}`;
    }

    /**
     * Giả lập gọi Smart Contract createLoan()
     * Production: contract.createLoan(borrower, amount, termMonths, collateral)
     */
    async createLoan({ borrowerId, amount, termMonths, collateralType }) {
        await this._simulateDelay();
        const txHash = this.generateTxHash(`createLoan-${borrowerId}-${amount}`);
        return {
            txHash,
            blockNumber: this.generateBlockNumber(),
            explorerUrl: this.getExplorerUrl(txHash),
            contractEvent: "LoanCreated",
        };
    }

    /**
     * Giả lập fundLoan() - người cho vay nạp tiền
     */
    async fundLoan({ loanId, lenderId, amount }) {
        await this._simulateDelay();
        const txHash = this.generateTxHash(`fundLoan-${loanId}-${lenderId}`);
        return {
            txHash,
            blockNumber: this.generateBlockNumber(),
            explorerUrl: this.getExplorerUrl(txHash),
            contractEvent: "LoanFunded",
        };
    }

    /**
     * Giả lập repay() - người vay trả tiền
     */
    async repay({ loanId, userId, amount }) {
        await this._simulateDelay();
        const txHash = this.generateTxHash(`repay-${loanId}-${userId}-${amount}`);
        return {
            txHash,
            blockNumber: this.generateBlockNumber(),
            explorerUrl: this.getExplorerUrl(txHash),
            contractEvent: "LoanRepaid",
        };
    }

    /**
     * Giả lập liquidate() - thanh lý tài sản thế chấp
     */
    async liquidate({ loanId, collateralAmount }) {
        await this._simulateDelay();
        const txHash = this.generateTxHash(`liquidate-${loanId}`);
        return {
            txHash,
            blockNumber: this.generateBlockNumber(),
            explorerUrl: this.getExplorerUrl(txHash),
            contractEvent: "LoanLiquidated",
        };
    }

    /** Delay nhỏ để giả lập độ trễ mạng blockchain */
    _simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }
}

module.exports = { BlockchainService };
