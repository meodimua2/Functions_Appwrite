const { KycService } = require("../service/kyc.service");
const { UserService } = require("../service/user.service");
const { validateKYC } = require("../utils/validators");

const kycSvc = new KycService();
const userSvc = new UserService();

/**
 * POST action: submit_kyc
 * Người dùng nộp hồ sơ KYC (ảnh CCCD + selfie)
 */
async function submitKycHandler({ payload, res, log, error }) {
    const { userId, fullName, cccdNumber, cccdFrontUrl, cccdBackUrl, selfieUrl } = payload;

    const errors = validateKYC({ fullName, cccdNumber, cccdFrontUrl, cccdBackUrl, selfieUrl });
    if (errors.length) {
        return res.json({ success: false, message: errors[0], errors }, 400);
    }

    try {
        const kyc = await kycSvc.submit({ userId, fullName, cccdNumber, cccdFrontUrl, cccdBackUrl, selfieUrl });
        await userSvc.updateKycStatus(userId, "pending");

        log(`KYC submitted by user ${userId}`);
        return res.json({
            success: true,
            message: "Hồ sơ KYC đã được gửi, vui lòng chờ xét duyệt (1-2 ngày làm việc)",
            kyc: kycSvc.formatKyc(kyc),
        });
    } catch (err) {
        if (err.message.includes("đã được duyệt")) {
            return res.json({ success: false, message: err.message }, 400);
        }
        error("submitKyc error: " + err.message);
        return res.json({ success: false, message: "Không thể gửi hồ sơ KYC" }, 500);
    }
}

/**
 * GET action: get_kyc_status
 * Kiểm tra trạng thái KYC của người dùng
 */
async function getKycStatusHandler({ payload, res, error }) {
    const { userId } = payload;

    try {
        const kyc = await kycSvc.getByUser(userId);

        if (!kyc) {
            return res.json({
                success: true,
                kycStatus: "none",
                message: "Chưa nộp hồ sơ KYC",
                kyc: null,
            });
        }

        const statusMessages = {
            pending: "Hồ sơ đang được xét duyệt",
            approved: "Xác minh danh tính thành công",
            rejected: `Hồ sơ bị từ chối: ${kyc.rejectionReason || "Thông tin không hợp lệ"}`,
        };

        return res.json({
            success: true,
            kycStatus: kyc.status,
            message: statusMessages[kyc.status] || kyc.status,
            kyc: kycSvc.formatKyc(kyc),
        });
    } catch (err) {
        error("getKycStatus error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

/**
 * POST action: review_kyc (Admin only)
 * Duyệt hoặc từ chối KYC
 */
async function reviewKycHandler({ payload, res, log, error }) {
    const { adminKey, targetUserId, approved, rejectionReason } = payload;

    // Kiểm tra admin key (đơn giản hóa - production nên dùng role-based auth)
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.json({ success: false, message: "Không có quyền admin" }, 403);
    }

    try {
        await kycSvc.review(targetUserId, { approved, rejectionReason });
        await userSvc.updateKycStatus(targetUserId, approved ? "approved" : "rejected");

        if (approved) {
            await userSvc.updateCreditScore(targetUserId, +100);
        }

        log(`KYC ${approved ? "approved" : "rejected"} for user ${targetUserId}`);
        return res.json({
            success: true,
            message: approved ? "Đã duyệt KYC thành công" : "Đã từ chối KYC",
        });
    } catch (err) {
        error("reviewKyc error: " + err.message);
        return res.json({ success: false, message: "Lỗi server" }, 500);
    }
}

module.exports = { submitKycHandler, getKycStatusHandler, reviewKycHandler };
