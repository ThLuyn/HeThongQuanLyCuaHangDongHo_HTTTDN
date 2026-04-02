DROP DATABASE IF EXISTS QuanLyCuaHangDongHo;
CREATE DATABASE QuanLyCuaHangDongHo;
USE QuanLyCuaHangDongHo;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
-- ============================================================
--  PHẦN 1: TẠO BẢNG
-- ============================================================
-- ------------------------------------------------------------
--  1.1 PHÂN QUYỀN & TÀI KHOẢN
-- ------------------------------------------------------------
CREATE TABLE `DANHMUCCHUCNANG` (
    `MCN` VARCHAR(50) NOT NULL COMMENT 'Mã chức năng',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên chức năng',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hoạt động, 0: ẩn)',
    PRIMARY KEY (MCN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `NHOMQUYEN` (
    `MNQ` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã nhóm quyền',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên nhóm quyền',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MNQ)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `CTQUYEN` (
    `MNQ` INT(11) NOT NULL COMMENT 'Mã nhóm quyền',
    `MCN` VARCHAR(50) NOT NULL COMMENT 'Mã chức năng',
    `HANHDONG` VARCHAR(255) NOT NULL COMMENT 'Hành động (create/view/update/delete/export/cancel/approve)',
    PRIMARY KEY (MNQ, MCN, HANHDONG)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.2 NHÂN SỰ
-- ------------------------------------------------------------
CREATE TABLE `CHUCVU` (
    `MCV` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã chức vụ',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên chức vụ',
    `LUONGCOBAN` DECIMAL(15, 2) NOT NULL COMMENT 'Lương cơ bản (VNĐ/tháng)',
    `TY_LE_HOA_HONG` DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ hoa hồng trên doanh số (%)',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MCV)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- Tắt kiểm tra để tránh lỗi khi Drop/Create bảng có liên kết
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `NHANVIEN`;
CREATE TABLE `NHANVIEN` (
    `MNV` INT(11) NOT NULL AUTO_INCREMENT,
    `HOTEN` VARCHAR(255) NOT NULL,
    `GIOITINH` INT(11) NOT NULL COMMENT '0: Nữ, 1: Nam',
    `NGAYSINH` DATE NOT NULL,
    `SDT` VARCHAR(11) NOT NULL UNIQUE,
    `EMAIL` VARCHAR(50) NOT NULL UNIQUE,
    `MCV` INT(11) NOT NULL COMMENT 'Mã chức vụ',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT '1: Đang làm, 0: Nghỉ việc',
    `QUEQUAN` VARCHAR(255) NOT NULL,
    `DIACHI` VARCHAR(255) NULL,
    `HINHANH` LONGTEXT NULL,
    `NGAYVAOLAM` DATE NOT NULL,
    `CCCD` VARCHAR(12) NOT NULL UNIQUE COMMENT 'Số CCCD kiêm Mã số thuế',
    `BOPHAN` VARCHAR(255) NULL,
    `SOTAIKHOAN` VARCHAR(50) NULL,
    `TENNGANHANG` VARCHAR(255) NULL,
    PRIMARY KEY (MNV),
    -- Định nghĩa khóa ngoại ngay tại đây, đặt tên rõ ràng để tránh trùng
    CONSTRAINT FK_NHANVIEN_CHUCVU FOREIGN KEY (MCV) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
SET FOREIGN_KEY_CHECKS = 1;
CREATE TABLE `TAIKHOAN` (
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên',
    `TDN` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên đăng nhập',
    `MK` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu (BCrypt)',
    `MNQ` INT(11) NOT NULL COMMENT 'Mã nhóm quyền',
    `TRANGTHAI` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hoạt động, 0: khóa)',
    `OTP` VARCHAR(50) DEFAULT NULL COMMENT 'Mã OTP đặt lại mật khẩu',
    PRIMARY KEY (MNV, TDN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.3 LỊCH SỬ THAY ĐỔI CHỨC VỤ
--      (Yêu cầu đề tài: "khi thay đổi chức vụ phải có thời điểm cụ thể và lương sẽ thay đổi theo")
-- ------------------------------------------------------------
CREATE TABLE `LICHSUCHUCVU` (
    `MLS` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã lịch sử',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên',
    `MCV_CU` INT(11) DEFAULT NULL COMMENT 'Mã chức vụ cũ (NULL nếu là lần đầu)',
    `MCV_MOI` INT(11) NOT NULL COMMENT 'Mã chức vụ mới',
    `NGAY_HIEULUC` DATE NOT NULL COMMENT 'Ngày bắt đầu có hiệu lực',
    `GHICHU` TEXT COMMENT 'Ghi chú lý do thay đổi',
    `MNV_DUYET` INT(11) NOT NULL COMMENT 'Người duyệt (quản lý)',
    PRIMARY KEY (MLS)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.4 CA LÀM & PHÂN CA
-- ------------------------------------------------------------
CREATE TABLE `CALAM` (
    `MCA` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã ca làm',
    `TENCA` VARCHAR(255) NOT NULL COMMENT 'Tên ca (VD: Ca sáng, Ca chiều)',
    `GIO_BATDAU` TIME NOT NULL COMMENT 'Giờ bắt đầu',
    `GIO_KETTHUC` TIME NOT NULL COMMENT 'Giờ kết thúc',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MCA)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `PHANCALAM` (
    `MPCL` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã phân ca',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên',
    `MCA` INT(11) NOT NULL COMMENT 'Mã ca làm',
    `NGAY` DATE NOT NULL COMMENT 'Ngày làm việc',
    `GIO_CHECKIN` TIMESTAMP DEFAULT NULL COMMENT 'Giờ check-in thực tế',
    `GIO_CHECKOUT` TIMESTAMP DEFAULT NULL COMMENT 'Giờ check-out thực tế',
    `TT` INT(11) NOT NULL DEFAULT 0 COMMENT 'Trạng thái (0: chưa làm, 1: đang làm, 2: hoàn thành, 3: vắng)',
    PRIMARY KEY (MPCL),
    UNIQUE KEY uq_nv_ngay_ca (MNV, MCA, NGAY)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.5 ĐƠN XIN NGHỈ
--      (Yêu cầu: nghỉ phép, nghỉ ốm/đau/thai sản, nghỉ việc)
-- ------------------------------------------------------------
CREATE TABLE `DONXINNGH` (
    `MDN` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã đơn nghỉ',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên nộp đơn',
    `LOAI` INT(11) NOT NULL DEFAULT 1 COMMENT 'Loại đơn (1: nghỉ phép, 2: nghỉ ốm/đau/thai sản, 3: nghỉ việc)',
    `NGAYNGHI` DATE NOT NULL COMMENT 'Ngày bắt đầu nghỉ',
    `SONGAY` INT(11) NOT NULL DEFAULT 1 COMMENT 'Số ngày nghỉ',
    `LYDO` TEXT COMMENT 'Lý do nghỉ',
    `TRANGTHAI` INT(11) NOT NULL DEFAULT 0 COMMENT 'Trạng thái (0: chờ duyệt, 1: đã duyệt, 2: từ chối)',
    `NGUOIDUYET` INT(11) DEFAULT NULL COMMENT 'Mã NV người duyệt',
    `NGAYTAO` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT 'Ngày nộp đơn',
    `GHICHU` TEXT COMMENT 'Ghi chú của người duyệt',
    PRIMARY KEY (MDN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.6 BẢNG CHẤM CÔNG
-- ------------------------------------------------------------
CREATE TABLE `BANGCHAMCONG` (
    `MCC` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã chấm công',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên',
    `THANG` INT(11) NOT NULL COMMENT 'Tháng (1-12)',
    `NAM` INT(11) NOT NULL COMMENT 'Năm',
    `NGAYCONG` DECIMAL(5, 1) NOT NULL DEFAULT 0 COMMENT 'Số ngày công thực tế',
    `NGAYNGHI_PHEP` INT(11) NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ có phép (được tính lương)',
    `NGAYNGHI_KP` INT(11) NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ không phép (trừ lương)',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: tạm tính, 2: đã chốt)',
    PRIMARY KEY (MCC),
    UNIQUE KEY uq_nv_thang_nam (MNV, THANG, NAM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.7 BẢNG LƯƠNG
--      (Yêu cầu: tính lương = lương cơ bản + hoa hồng doanh số + thưởng + phụ cấp - khấu trừ)
-- ------------------------------------------------------------
CREATE TABLE `BANGLUONG` (
    `MBL` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã bảng lương',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên',
    `THANG` INT(11) NOT NULL COMMENT 'Tháng',
    `NAM` INT(11) NOT NULL COMMENT 'Năm',
    `LUONGCOBAN` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Lương cơ bản cố định',
    `NGAYCONG` DECIMAL(5, 1) NOT NULL DEFAULT 0 COMMENT 'Số ngày công đã quy đổi hệ số',
    `DOANH_SO` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Doanh số cá nhân/cửa hàng',
    `TY_LE_HOA_HONG` DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ hưởng (%)',
    `HOA_HONG` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Tiền hoa hồng nhận được',
    `BHXH` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Bảo hiểm xã hội (8%)',
    `BHYT` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Bảo hiểm y tế (1.5%)',
    `BHTN` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Bảo hiểm thất nghiệp (1%)',
    `KHAUTRU_KHAC` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Phạt vi phạm, trừ nghỉ không phép...',
    `LUONGTHUCLANH` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Thực nhận sau thuế/phí',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT '1: Tạm tính, 2: Đã thanh toán',
    PRIMARY KEY (MBL),
    UNIQUE KEY uq_nv_thang_nam (MNV, THANG, NAM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.8 KHÁCH HÀNG & NHÀ CUNG CẤP
-- ------------------------------------------------------------
CREATE TABLE `KHACHHANG` (
    `MKH` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã khách hàng',
    `HOTEN` VARCHAR(255) NOT NULL COMMENT 'Họ và tên',
    `NGAYTHAMGIA` DATE NOT NULL COMMENT 'Ngày đăng ký thành viên',
    `DIACHI` VARCHAR(255) COMMENT 'Địa chỉ',
    `SDT` VARCHAR(11) UNIQUE NOT NULL COMMENT 'Số điện thoại',
    `EMAIL` VARCHAR(50) UNIQUE COMMENT 'Email',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MKH)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `NHACUNGCAP` (
    `MNCC` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã nhà cung cấp',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên nhà cung cấp',
    `DIACHI` VARCHAR(255) COMMENT 'Địa chỉ',
    `SDT` VARCHAR(12) COMMENT 'Số điện thoại',
    `EMAIL` VARCHAR(50) COMMENT 'Email',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MNCC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.9 SẢN PHẨM & VỊ TRÍ TRƯNG BÀY
-- ------------------------------------------------------------
CREATE TABLE `VITRITRUNGBAY` (
    `MVT` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã vị trí trưng bày',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên khu vực',
    `GHICHU` TEXT COMMENT 'Ghi chú (loại đồng hồ trưng bày)',
    PRIMARY KEY (MVT)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `SANPHAM` (
    `MSP` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã sản phẩm',
    `TEN` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm',
    `HINHANH` VARCHAR(255) NOT NULL COMMENT 'Đường dẫn hình ảnh',
    `MNCC` INT(11) NOT NULL COMMENT 'Mã nhà cung cấp',
    `MVT` INT(11) COMMENT 'Mã vị trí trưng bày',
    `THUONGHIEU` VARCHAR(100) COMMENT 'Thương hiệu',
    `NAMSANXUAT` YEAR COMMENT 'Năm sản xuất',
    `GIANHAP` DECIMAL(15, 2) NOT NULL COMMENT 'Giá nhập (VNĐ)',
    `GIABAN` DECIMAL(15, 2) NOT NULL COMMENT 'Giá bán niêm yết (VNĐ)',
    `SOLUONG` INT(11) DEFAULT 0 COMMENT 'Số lượng tồn kho',
    `THOIGIANBAOHANH` INT(11) DEFAULT 12 COMMENT 'Thời gian bảo hành (tháng)',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.10 KHUYẾN MÃI
-- ------------------------------------------------------------
CREATE TABLE `MAKHUYENMAI` (
    `MKM` VARCHAR(255) NOT NULL COMMENT 'Mã khuyến mãi',
    `TGBD` DATE NOT NULL COMMENT 'Thời gian bắt đầu',
    `TGKT` DATE NOT NULL COMMENT 'Thời gian kết thúc',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MKM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `CTMAKHUYENMAI` (
    `MKM` VARCHAR(255) NOT NULL COMMENT 'Mã khuyến mãi',
    `MSP` INT(11) NOT NULL COMMENT 'Mã sản phẩm áp dụng',
    `PTG` INT(11) NOT NULL COMMENT 'Phần trăm giảm giá (%)',
    PRIMARY KEY (MKM, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.11 PHIẾU NHẬP
-- ------------------------------------------------------------
CREATE TABLE `PHIEUNHAP` (
    `MPN` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu nhập',
    `MNV` INT(11) NOT NULL COMMENT 'Mã nhân viên lập phiếu',
    `MNCC` INT(11) NOT NULL COMMENT 'Mã nhà cung cấp',
    `TIEN` DECIMAL(15, 2) NOT NULL COMMENT 'Tổng tiền phiếu nhập',
    `TG` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian lập phiếu',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hợp lệ, 0: đã hủy)',
    `LYDOHUY` VARCHAR(255) NULL COMMENT 'Lý do hủy phiếu',
    PRIMARY KEY (MPN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `CTPHIEUNHAP` (
    `MPN` INT(11) NOT NULL COMMENT 'Mã phiếu nhập',
    `MSP` INT(11) NOT NULL COMMENT 'Mã sản phẩm',
    `SL` INT(11) NOT NULL COMMENT 'Số lượng nhập',
    `TIENNHAP` DECIMAL(15, 2) NOT NULL COMMENT 'Đơn giá nhập',
    `HINHTHUC` INT(11) NOT NULL DEFAULT 0 COMMENT 'Hình thức thanh toán (0: tiền mặt, 1: chuyển khoản)',
    PRIMARY KEY (MPN, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.12 PHIẾU XUẤT (BÁN HÀNG)
-- ------------------------------------------------------------
CREATE TABLE `PHIEUXUAT` (
    `MPX` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu xuất / hóa đơn bán',
    `MNV` INT(11) DEFAULT NULL COMMENT 'Mã nhân viên lập phiếu',
    `MKH` INT(11) NOT NULL COMMENT 'Mã khách hàng',
    `TIEN` DECIMAL(15, 2) NOT NULL COMMENT 'Tổng tiền sau giảm giá',
    `TG` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian bán',
    `TT` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hợp lệ, 0: đã hủy)',
    `LYDOHUY` VARCHAR(255) NULL COMMENT 'Lý do hủy phiếu',
    PRIMARY KEY (MPX)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `CTPHIEUXUAT` (
    `MPX` INT(11) NOT NULL COMMENT 'Mã phiếu xuất',
    `MSP` INT(11) NOT NULL COMMENT 'Mã sản phẩm',
    `MKM` VARCHAR(255) DEFAULT NULL COMMENT 'Mã khuyến mãi áp dụng (nếu có)',
    `SL` INT(11) NOT NULL COMMENT 'Số lượng bán',
    `TIENXUAT` DECIMAL(15, 2) NOT NULL COMMENT 'Đơn giá bán thực tế (đã giảm)',
    PRIMARY KEY (MPX, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ------------------------------------------------------------
--  1.13 BẢO HÀNH & SỬA CHỮA
-- ------------------------------------------------------------
CREATE TABLE `PHIEUBAOHANH` (
    `MPB` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu bảo hành',
    `MPX` INT(11) NOT NULL COMMENT 'Mã hóa đơn bán (phiếu xuất gốc)',
    `MSP` INT(11) NOT NULL COMMENT 'Mã sản phẩm',
    `MKH` INT(11) NOT NULL COMMENT 'Mã khách hàng',
    `NGAYBATDAU` DATE NOT NULL COMMENT 'Ngày bắt đầu bảo hành',
    `NGAYKETTHUC` DATE NOT NULL COMMENT 'Ngày hết bảo hành',
    `TRANGTHAI` INT(11) NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: còn hạn, 0: hết hạn, 2: đã hủy)',
    PRIMARY KEY (MPB)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
CREATE TABLE `PHIEUSUACHUA` (
    `MSC` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu sửa chữa',
    `MPB` INT(11) NOT NULL COMMENT 'Mã phiếu bảo hành liên quan',
    `MNV` INT(11) DEFAULT NULL COMMENT 'Mã nhân viên phụ trách sửa chữa',
    `NGAYNHAN` DATE NOT NULL COMMENT 'Ngày nhận đồng hồ',
    `NGAYTRA` DATE DEFAULT NULL COMMENT 'Ngày trả đồng hồ',
    `NGUYENNHAN` TEXT COMMENT 'Mô tả nguyên nhân hỏng',
    `TINHTRANG` INT(11) DEFAULT 0 COMMENT 'Tình trạng (0: chờ xử lý, 1: đang sửa, 2: hoàn thành, 3: không sửa được)',
    `CHIPHI` DECIMAL(15, 2) DEFAULT 0 COMMENT 'Chi phí phát sinh (nếu ngoài bảo hành)',
    `GHICHU` TEXT COMMENT 'Ghi chú thêm',
    PRIMARY KEY (MSC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
--  CREATE TABLE `NGAYLE` (
--     `MNL`    INT(11)      NOT NULL AUTO_INCREMENT,
--     `TEN`    VARCHAR(255) NOT NULL COMMENT 'Tên ngày lễ',
--     `NGAY`   DATE         NOT NULL COMMENT 'Ngày cụ thể',
--     `TT`     INT(11)      NOT NULL DEFAULT 1,
--     PRIMARY KEY (MNL)
-- ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE `NGAYLE` (
    `ID` INT(11) NOT NULL AUTO_INCREMENT,
    `TENLE` VARCHAR(255) NOT NULL COMMENT 'Tên ngày lễ',
    `NGAY` DATE NOT NULL UNIQUE COMMENT 'Ngày dương lịch',
    `HESO_LUONG` DECIMAL(3, 1) DEFAULT 3.0 COMMENT 'Hệ số lương (Admin nhập từ Web)',
    `GHICHU` VARCHAR(255) NULL COMMENT 'Ghi chú thêm',
    PRIMARY KEY (ID)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
-- ============================================================
--  PHẦN 2: TẠO QUAN HỆ (FOREIGN KEY)
-- ============================================================
-- Phân quyền
ALTER TABLE `CTQUYEN`
ADD CONSTRAINT FK_MNQ_CTQUYEN FOREIGN KEY (MNQ) REFERENCES `NHOMQUYEN`(MNQ) ON DELETE NO ACTION ON UPDATE CASCADE,
    ADD CONSTRAINT FK_MCN_CTQUYEN FOREIGN KEY (MCN) REFERENCES `DANHMUCCHUCNANG`(MCN) ON DELETE NO ACTION ON UPDATE CASCADE;
-- Nhân viên
-- ALTER TABLE `NHANVIEN`
--     ADD CONSTRAINT FK_MCV_NHANVIEN FOREIGN KEY (MCV) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `TAIKHOAN`
ADD CONSTRAINT FK_MNV_TAIKHOAN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNQ_TAIKHOAN FOREIGN KEY (MNQ) REFERENCES `NHOMQUYEN`(MNQ) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `LICHSUCHUCVU`
ADD CONSTRAINT FK_MNV_LSCV FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_CU_LSCV FOREIGN KEY (MCV_CU) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_MOI_LSCV FOREIGN KEY (MCV_MOI) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_LSCV FOREIGN KEY (MNV_DUYET) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Ca làm & phân ca
ALTER TABLE `PHANCALAM`
ADD CONSTRAINT FK_MNV_PCL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCA_PCL FOREIGN KEY (MCA) REFERENCES `CALAM`(MCA) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Đơn xin nghỉ
ALTER TABLE `DONXINNGH`
ADD CONSTRAINT FK_MNV_DXN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_DXN FOREIGN KEY (NGUOIDUYET) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Bảng chấm công
ALTER TABLE `BANGCHAMCONG`
ADD CONSTRAINT FK_MNV_BCC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Bảng lương
ALTER TABLE `BANGLUONG`
ADD CONSTRAINT FK_MNV_BL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Sản phẩm
ALTER TABLE `SANPHAM`
ADD CONSTRAINT FK_MNCC_SANPHAM FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MVT_SANPHAM FOREIGN KEY (MVT) REFERENCES `VITRITRUNGBAY`(MVT) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Phiếu nhập
ALTER TABLE `PHIEUNHAP`
ADD CONSTRAINT FK_MNV_PN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNCC_PN FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `CTPHIEUNHAP`
ADD CONSTRAINT FK_MPN_CTPN FOREIGN KEY (MPN) REFERENCES `PHIEUNHAP`(MPN) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPN FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Khuyến mãi
ALTER TABLE `CTMAKHUYENMAI`
ADD CONSTRAINT FK_MKM_CTMKM FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTMKM FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Phiếu xuất
ALTER TABLE `PHIEUXUAT`
ADD CONSTRAINT FK_MNV_PX FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PX FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `CTPHIEUXUAT`
ADD CONSTRAINT FK_MPX_CTPX FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPX FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKM_CTPX FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM) ON DELETE NO ACTION ON UPDATE NO ACTION;
-- Bảo hành & sửa chữa
ALTER TABLE `PHIEUBAOHANH`
ADD CONSTRAINT FK_MPX_PBH FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_PBH FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PBH FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `PHIEUSUACHUA`
ADD CONSTRAINT FK_MPB_PSC FOREIGN KEY (MPB) REFERENCES `PHIEUBAOHANH`(MPB) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNV_PSC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
--  PHẦN 3: DỮ LIỆU MẪU
-- ============================================================
-- ------------------------------------------------------------
--  3.1 Danh mục chức năng (bổ sung chức năng nhân sự mới)
-- ------------------------------------------------------------
INSERT INTO `DANHMUCCHUCNANG` (`MCN`, `TEN`, `TT`)
VALUES (
        'sanpham',
        'Quản lý sản phẩm',
        1
    ),
    (
        'khachhang',
        'Quản lý khách hàng',
        1
    ),
    (
        'nhacungcap',
        'Quản lý nhà cung cấp',
        1
    ),
    (
        'nhanvien',
        'Quản lý nhân viên',
        1
    ),
    (
        'chucvu',
        'Quản lý chức vụ',
        1
    ),
    (
        'calam',
        'Quản lý ca làm',
        1
    ),
    (
        'phancalam',
        'Phân ca làm việc',
        1
    ),
    (
        'donxinngh',
        'Duyệt đơn xin nghỉ',
        1
    ),
    (
        'chamcong',
        'Quản lý chấm công',
        1
    ),
    (
        'bangluong',
        'Quản lý bảng lương',
        1
    ),
    (
        'phieunhap',
        'Quản lý nhập hàng',
        1
    ),
    (
        'phieuxuat',
        'Quản lý phiếu xuất / bán hàng',
        1
    ),
    (
        'baohanh',
        'Quản lý phiếu bảo hành',
        1
    ),
    (
        'suachua',
        'Quản lý phiếu sửa chữa',
        1
    ),
    (
        'vitritrungbay',
        'Quản lý vị trí trưng bày',
        1
    ),
    (
        'nhomquyen',
        'Quản lý nhóm quyền',
        1
    ),
    (
        'taikhoan',
        'Quản lý tài khoản',
        1
    ),
    (
        'makhuyenmai',
        'Quản lý mã khuyến mãi',
        1
    ),
    (
        'thongke',
        'Thống kê & báo cáo',
        1
    );
-- ------------------------------------------------------------
--  3.2 Nhóm quyền
-- ------------------------------------------------------------
INSERT INTO `NHOMQUYEN` (`TEN`, `TT`)
VALUES ('Quản lý cửa hàng', 1),
    ('Nhân viên bán hàng', 1),
    ('Nhân viên kho', 1),
    ('Nhân viên kỹ thuật', 1);
-- ------------------------------------------------------------
--  3.3 Chi tiết quyền
-- ------------------------------------------------------------
-- Quản lý cửa hàng (MNQ = 1): toàn quyền
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`)
VALUES (1, 'sanpham', 'create'),
(1, 'sanpham', 'view'),
(1, 'sanpham', 'update'),
(1, 'sanpham', 'delete'),
    (1, 'khachhang', 'create'),
(1, 'khachhang', 'view'),
(1, 'khachhang', 'update'),
(1, 'khachhang', 'delete'),
    (1, 'nhacungcap', 'create'),
(1, 'nhacungcap', 'view'),
(1, 'nhacungcap', 'update'),
(1, 'nhacungcap', 'delete'),
    (1, 'nhanvien', 'create'),
(1, 'nhanvien', 'view'),
(1, 'nhanvien', 'update'),
(1, 'nhanvien', 'delete'),
    (1, 'chucvu', 'create'),
(1, 'chucvu', 'view'),
(1, 'chucvu', 'update'),
(1, 'chucvu', 'delete'),
    (1, 'calam', 'create'),
(1, 'calam', 'view'),
(1, 'calam', 'update'),
(1, 'calam', 'delete'),
    (1, 'phancalam', 'create'),
(1, 'phancalam', 'view'),
(1, 'phancalam', 'update'),
(1, 'phancalam', 'delete'),
    (1, 'donxinngh', 'view'),
(1, 'donxinngh', 'approve'),
    (1, 'chamcong', 'create'),
(1, 'chamcong', 'view'),
(1, 'chamcong', 'update'),
(1, 'chamcong', 'export'),
    (1, 'bangluong', 'create'),
(1, 'bangluong', 'view'),
(1, 'bangluong', 'update'),
(1, 'bangluong', 'export'),
    (1, 'phieunhap', 'create'),
(1, 'phieunhap', 'view'),
(1, 'phieunhap', 'cancel'),
(1, 'phieunhap', 'export'),
    (1, 'phieuxuat', 'create'),
(1, 'phieuxuat', 'view'),
(1, 'phieuxuat', 'cancel'),
(1, 'phieuxuat', 'export'),
    (1, 'baohanh', 'view'),
(1, 'baohanh', 'update'),
(1, 'baohanh', 'export'),
    (1, 'suachua', 'create'),
(1, 'suachua', 'view'),
(1, 'suachua', 'update'),
(1, 'suachua', 'delete'),
(1, 'suachua', 'export'),
    (1, 'vitritrungbay', 'create'),
(1, 'vitritrungbay', 'view'),
(1, 'vitritrungbay', 'update'),
(1, 'vitritrungbay', 'delete'),
    (1, 'nhomquyen', 'create'),
(1, 'nhomquyen', 'view'),
(1, 'nhomquyen', 'update'),
(1, 'nhomquyen', 'delete'),
    (1, 'taikhoan', 'create'),
(1, 'taikhoan', 'view'),
(1, 'taikhoan', 'update'),
(1, 'taikhoan', 'delete'),
    (1, 'makhuyenmai', 'create'),
(1, 'makhuyenmai', 'view'),
(1, 'makhuyenmai', 'update'),
(1, 'makhuyenmai', 'delete'),
    (1, 'thongke', 'view'),
(1, 'thongke', 'export');
-- Nhân viên bán hàng (MNQ = 2): hạn chế
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`)
VALUES (2, 'sanpham', 'view'),
    (2, 'khachhang', 'create'),
(2, 'khachhang', 'view'),
(2, 'khachhang', 'update'),
    (2, 'phieuxuat', 'create'),
(2, 'phieuxuat', 'view'),
(2, 'phieuxuat', 'cancel'),
(2, 'phieuxuat', 'export'),
    (2, 'baohanh', 'view'),
(2, 'baohanh', 'export'),
    (2, 'suachua', 'create'),
(2, 'suachua', 'view'),
(2, 'suachua', 'update'),
    (2, 'vitritrungbay', 'view'),
    (2, 'makhuyenmai', 'view'),
    (2, 'donxinngh', 'create'),
(2, 'donxinngh', 'view'),
    (2, 'phancalam', 'view'),
    (2, 'bangluong', 'view'),
    (2, 'chamcong', 'view');
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`)
VALUES (3, 'sanpham', 'view'),
    (3, 'sanpham', 'create'),
    (3, 'sanpham', 'update'),
    (3, 'nhacungcap', 'view'),
    (3, 'nhacungcap', 'create'),
    (3, 'nhacungcap', 'update'),
    (3, 'phieunhap', 'view'),
    (3, 'phieunhap', 'create'),
    (3, 'vitritrungbay', 'view'),
    (3, 'thongke', 'view');
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`)
VALUES (4, 'baohanh', 'view'),
    (4, 'suachua', 'view'),
    (4, 'suachua', 'create'),
    (4, 'suachua', 'update'),
    (4, 'sanpham', 'view');
-- Cho Kho (MNQ=3) và Kỹ thuật (MNQ=4)
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`)
VALUES (3, 'nhanvien', 'view'),
    (3, 'donxinngh', 'create'),
    (3, 'bangluong', 'view'),
    (4, 'nhanvien', 'view'),
    (4, 'donxinngh', 'create'),
    (4, 'bangluong', 'view');
-- ------------------------------------------------------------
--  3.4 Chức vụ (bổ sung LUONGCOBAN & TY_LE_HOA_HONG)
-- ------------------------------------------------------------
INSERT INTO `CHUCVU` (`TEN`, `LUONGCOBAN`, `TY_LE_HOA_HONG`, `TT`)
VALUES ('Quản lý cửa hàng', 15000000.00, 1.00, 1),
    -- Lương 15tr, hoa hồng 1% (tổng doanh thu)
    ('Nhân viên bán hàng', 7000000.00, 2.00, 1),
    -- Lương 7tr, hoa hồng 3% (doanh số cá nhân)
    ('Nhân viên kho', 8000000.00, 0.00, 1),
    ('Nhân viên kỹ thuật', 10000000.00, 0.00, 1);
-- ------------------------------------------------------------
--  3.8 Ca làm
-- ------------------------------------------------------------
INSERT INTO `CALAM` (`TENCA`, `GIO_BATDAU`, `GIO_KETTHUC`, `TT`)
VALUES ('Ca 1', '08:00:00', '16:00:00', 1),
    ('Ca 2', '14:00:00', '22:00:00', 1);
-- ------------------------------------------------------------
--  3.5 Nhân viên (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
INSERT INTO `NHANVIEN` (
        `HOTEN`,
        `GIOITINH`,
        `NGAYSINH`,
        `SDT`,
        `EMAIL`,
        `MCV`,
        `TT`,
        `QUEQUAN`,
        `NGAYVAOLAM`,
        `CCCD`,
        `BOPHAN`
    )
VALUES (
        'Võ Thị Thu Luyện',
        0,
        '2005-05-01',
        '0865172517',
        'thuluyen234@gmail.com',
        1,
        1,
        'Quảng Ngãi',
        '2023-01-10',
        '079205001234',
        'Quản lý'
    ),
    (
        'Nguyễn Thị Ngọc Tú',
        0,
        '2005-01-28',
        '0396532145',
        'ngoctu@gmail.com',
        2,
        1,
        'Thái Bình',
        '2023-02-15',
        '080205005678',
        'Bán hàng'
    ),
    (
        'Trần Thị Xuân Thanh',
        0,
        '2005-01-22',
        '0387913347',
        'xuanthanh@gmail.com',
        3,
        1,
        'Gia Lai',
        '2023-02-15',
        '082205009101',
        'Kho'
    ),
    (
        'Đỗ Hữu Lộc',
        1,
        '2005-01-26',
        '0355374322',
        'huuloc@gmail.com',
        4,
        0,
        'Gia Lai',
        '2023-03-01',
        '075205001122',
        'Kỹ thuật'
    ),
    (
        'Đỗ Nam Anh',
        1,
        '2003-04-11',
        '0123456781',
        'chinchin@gmail.com',
        2,
        1,
        'Bình Dương',
        '2023-03-01',
        '074203003344',
        'Bán hàng'
    ),
    (
        'Đinh Ngọc Ánh',
        1,
        '2003-04-03',
        '0123456782',
        'ngocan@gmail.com',
        2,
        0,
        'Cần Thơ',
        '2023-04-10',
        '092203005566',
        'Bán hàng'
    ),
    (
        'Phạm Minh Khang',
        1,
        '2004-12-10',
        '0912345678',
        'minhkhang@gmail.com',
        3,
        1,
        'Vũng Tàu',
        '2023-04-10',
        '077204007788',
        'Kho'
    ),
    (
        'Lê Thảo Nhi',
        0,
        '2005-03-15',
        '0945123789',
        'thaonhi@gmail.com',
        2,
        1,
        'Tây Ninh',
        '2023-05-20',
        '070205009900',
        'Bán hàng'
    ),
    (
        'Nguyễn Hoàng Phúc',
        1,
        '2003-09-21',
        '0987654321',
        'hoangphuc@gmail.com',
        4,
        0,
        'An Giang',
        '2023-05-20',
        '089203001133',
        'Kỹ thuật'
    ),
    (
        'Trần Mỹ Hạnh',
        0,
        '2004-07-19',
        '0938475621',
        'myhanh@gmail.com',
        2,
        1,
        'Kiên Giang',
        '2023-06-05',
        '091204002244',
        'Bán hàng'
    );
-- ------------------------------------------------------------
--  3.6 Lịch sử chức vụ (bản ghi khởi tạo cho từng NV)
-- ------------------------------------------------------------
INSERT INTO `LICHSUCHUCVU` (
        `MNV`,
        `MCV_CU`,
        `MCV_MOI`,
        `NGAY_HIEULUC`,
        `GHICHU`,
        `MNV_DUYET`
    )
VALUES (
        1,
        NULL,
        1,
        '2024-01-01',
        'Ký hợp đồng quản lý',
        1
    ),
    (
        2,
        NULL,
        2,
        '2024-01-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        3,
        NULL,
        2,
        '2024-01-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        4,
        NULL,
        2,
        '2024-01-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        5,
        NULL,
        2,
        '2024-02-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        6,
        NULL,
        2,
        '2024-02-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        7,
        NULL,
        2,
        '2024-03-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        8,
        NULL,
        2,
        '2024-03-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        9,
        NULL,
        2,
        '2024-04-01',
        'Ký hợp đồng nhân viên',
        1
    ),
    (
        10,
        NULL,
        2,
        '2024-04-01',
        'Ký hợp đồng nhân viên',
        1
    );
-- ------------------------------------------------------------
--  3.7 Tài khoản
-- ------------------------------------------------------------
INSERT INTO `TAIKHOAN` (`MNV`, `TDN`, `MK`, `MNQ`, `TRANGTHAI`, `OTP`)
VALUES (
        1,
        'admin',
        '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm',
        1,
        1,
        NULL
    ),
    (
        2,
        'nhanvien02',
        '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm',
        2,
        1,
        NULL
    ),
    (
        3,
        'nhanvien03',
        '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm',
        3,
        1,
        NULL
    ),
    (
        4,
        'nhanvien04',
        '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm',
        4,
        0,
        NULL
    );
-- ------------------------------------------------------------
--  3.9 Phân ca mẫu (tháng 3/2025)
-- ------------------------------------------------------------
INSERT INTO `PHANCALAM` (
        `MNV`,
        `MCA`,
        `NGAY`,
        `GIO_CHECKIN`,
        `GIO_CHECKOUT`,
        `TT`
    )
VALUES (
        2,
        1,
        '2025-03-03',
        '2025-03-03 08:02:00',
        '2025-03-03 12:05:00',
        2
    ),
    (
        2,
        2,
        '2025-03-03',
        '2025-03-03 13:01:00',
        '2025-03-03 17:00:00',
        2
    ),
    (
        3,
        1,
        '2025-03-03',
        '2025-03-03 08:10:00',
        '2025-03-03 12:00:00',
        2
    ),
    (
        4,
        2,
        '2025-03-03',
        '2025-03-03 13:05:00',
        '2025-03-03 17:10:00',
        2
    ),
    (
        2,
        1,
        '2025-03-04',
        '2025-03-04 08:00:00',
        '2025-03-04 12:00:00',
        2
    ),
    (
        3,
        2,
        '2025-03-04',
        '2025-03-04 17:00:00',
        '2025-03-04 21:00:00',
        2
    ),
    (
        5,
        1,
        '2025-03-04',
        '2025-03-04 08:05:00',
        '2025-03-04 17:05:00',
        2
    );
-- ------------------------------------------------------------
--  3.10 Đơn xin nghỉ mẫu
-- ------------------------------------------------------------
INSERT INTO `DONXINNGH` (
        `MNV`,
        `LOAI`,
        `NGAYNGHI`,
        `SONGAY`,
        `LYDO`,
        `TRANGTHAI`,
        `NGUOIDUYET`,
        `NGAYTAO`
    )
VALUES (
        2,
        1,
        '2025-03-10',
        1,
        'Việc gia đình đột xuất',
        1,
        1,
        '2025-03-08'
    ),
    (
        3,
        2,
        '2025-03-12',
        2,
        'Ốm, có giấy xác nhận bác sĩ',
        1,
        1,
        '2025-03-11'
    ),
    (
        4,
        1,
        '2025-03-20',
        1,
        'Tham dự đám cưới',
        0,
        NULL,
        '2025-03-18'
    ),
    (
        5,
        3,
        '2025-04-01',
        0,
        'Xin nghỉ việc do chuyển vùng',
        0,
        NULL,
        '2025-03-25'
    );
-- ------------------------------------------------------------
--  3.11 Bảng chấm công mẫu (tháng 3/2025)
-- ------------------------------------------------------------
INSERT INTO `BANGCHAMCONG` (
        `MNV`,
        `THANG`,
        `NAM`,
        `NGAYCONG`,
        `NGAYNGHI_PHEP`,
        `NGAYNGHI_KP`,
        `TT`
    )
VALUES (2, 3, 2025, 24.0, 1, 0, 2),
    (3, 3, 2025, 22.5, 2, 0, 2),
    (4, 3, 2025, 23.0, 1, 1, 2),
    (5, 3, 2025, 25.0, 0, 0, 2),
    (6, 3, 2025, 20.0, 0, 2, 2),
    (7, 3, 2025, 24.5, 1, 0, 2),
    (8, 3, 2025, 23.0, 0, 0, 2),
    (9, 3, 2025, 22.0, 1, 0, 2),
    (10, 3, 2025, 24.0, 0, 1, 2);
-- ------------------------------------------------------------
--  3.12 Bảng lương mẫu (tháng 3/2025 – 26 ngày làm việc chuẩn)
--  Công thức: LUONG_THUCLANH = LUONGCOBAN*(NGAYCONG/26) + HOA_HONG + THUONG + PHUCAP - KHAUTRU
-- ------------------------------------------------------------
-- Lưu ý: Phải chạy lệnh CREATE TABLE BANGLUONG mới trước khi chạy lệnh này
INSERT INTO `BANGLUONG` (
        `MNV`,
        `THANG`,
        `NAM`,
        `LUONGCOBAN`,
        `NGAYCONG`,
        `DOANH_SO`,
        `TY_LE_HOA_HONG`,
        `HOA_HONG`,
        `BHXH`,
        `BHYT`,
        `BHTN`,
        `KHAUTRU_KHAC`,
        `LUONGTHUCLANH`,
        `TT`
    )
VALUES -- Công thức: Thực lãnh = (Lương CB * Công/26) + Hoa hồng - (Bảo hiểm)
    -- Bảo hiểm = 10.5% * Lương CB = 735,000
    (
        2,
        3,
        2026,
        7000000,
        24.0,
        85000000,
        3.0,
        2550000,
        560000,
        105000,
        70000,
        0,
        8276538,
        2
    ),
    (
        3,
        3,
        2026,
        7000000,
        22.5,
        62000000,
        3.0,
        1860000,
        560000,
        105000,
        70000,
        0,
        7183077,
        2
    ),
    (
        4,
        3,
        2026,
        7000000,
        23.0,
        71000000,
        3.0,
        2130000,
        560000,
        105000,
        70000,
        150000,
        7436538,
        2
    ),
    (
        5,
        3,
        2026,
        7000000,
        25.0,
        95000000,
        3.0,
        2850000,
        560000,
        105000,
        70000,
        0,
        8846538,
        2
    ),
    (
        6,
        3,
        2026,
        7000000,
        20.0,
        54000000,
        3.0,
        1620000,
        560000,
        105000,
        70000,
        300000,
        5969615,
        2
    ),
    (
        7,
        3,
        2026,
        7000000,
        24.5,
        78000000,
        3.0,
        2340000,
        560000,
        105000,
        70000,
        0,
        8201538,
        2
    ),
    (
        8,
        3,
        2026,
        7000000,
        23.0,
        67000000,
        3.0,
        2010000,
        560000,
        105000,
        70000,
        0,
        7466538,
        2
    ),
    (
        9,
        3,
        2026,
        7000000,
        22.0,
        59000000,
        3.0,
        1770000,
        560000,
        105000,
        70000,
        0,
        6958846,
        2
    ),
    (
        10,
        3,
        2026,
        7000000,
        24.0,
        72000000,
        3.0,
        2160000,
        560000,
        105000,
        70000,
        100000,
        7786538,
        2
    );
-- ------------------------------------------------------------
--  3.13 Khách hàng (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
INSERT INTO `KHACHHANG` (`HOTEN`, `DIACHI`, `SDT`, `TT`, `NGAYTHAMGIA`)
VALUES (
        'Mặc định',
        '',
        '',
        1,
        '2025-04-15'
    ),
    (
        'Nguyễn Văn Anh',
        '45 An Dương Vương, P. Chợ Quán, TP. Hồ Chí Minh',
        '0387913347',
        1,
        '2025-04-15'
    ),
    (
        'Trần Nhất Nhất',
        '270 Hưng Phú, P. Chánh Hưng, TP. Hồ Chí Minh',
        '0123456789',
        1,
        '2025-04-15'
    ),
    (
        'Hoàng Gia Bảo',
        '45 Trương Đình Hội, P. Phú Định, TP. Hồ Chí Minh',
        '0987654321',
        1,
        '2025-04-15'
    ),
    (
        'Hồ Minh Hưng',
        '5 Võ Thị Sáu, P. Xuân Hòa, TP. Hồ Chí Minh',
        '0867987456',
        1,
        '2025-04-15'
    ),
    (
        'Nguyễn Thị Minh Anh',
        '50 Phạm Văn Chí, P. Bình Tiên, TP. Hồ Chí Minh',
        '0935123456',
        1,
        '2025-04-16'
    ),
    (
        'Trần Đức Minh',
        '789 Lê Hồng Phong, TP. Đà Nẵng',
        '0983456789',
        1,
        '2025-04-16'
    ),
    (
        'Lê Hải Yến',
        '180 Hoàng Ngân, X. Trung Hòa, Hà Nội',
        '0977234567',
        1,
        '2025-04-16'
    ),
    (
        'Phạm Thanh Hằng',
        '325 Nguyễn Văn Tăng, P. Long Bình, TP. Hồ Chí Minh',
        '0965876543',
        1,
        '2025-04-16'
    ),
    (
        'Hoàng Đức Anh',
        '321 Lý Thường Kiệt, TP. Cần Thơ',
        '0946789012',
        1,
        '2025-04-16'
    ),
    (
        'Ngô Thanh Tùng',
        '393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',
        '0912345678',
        1,
        '2025-04-16'
    ),
    (
        'Võ Thị Kim Ngân',
        '123 Đường Lê Lợi, P. Hồng Bàng, TP. Hải Phòng',
        '0916789123',
        1,
        '2025-04-16'
    ),
    (
        'Đỗ Văn Tú',
        '777 Hùng Vương, TP. Huế',
        '0982345678',
        1,
        '2025-04-30'
    ),
    (
        'Lý Thanh Trúc',
        '81 Hoàng Cầm, P. Linh Xuân, TP. Hồ Chí Minh',
        '0982123456',
        1,
        '2025-04-16'
    ),
    (
        'Bùi Văn Hoàng',
        '222 Đường 2/4, TP. Nha Trang',
        '0933789012',
        1,
        '2025-04-16'
    ),
    (
        'Lê Văn Thành',
        '23 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',
        '0933456789',
        1,
        '2025-04-16'
    ),
    (
        'Nguyễn Thị Lan Anh',
        '45 Hàng Bạc, P. Hoàn Kiếm, Hà Nội',
        '0965123456',
        1,
        '2025-04-16'
    ),
    (
        'Phạm Thị Mai',
        '234 Nguyễn Trãi, P. Chợ Quán, TP. Hồ Chí Minh',
        '0946789013',
        1,
        '2025-04-17'
    ),
    (
        'Hoàng Văn Nam',
        '567 Phố Huế, P. Hai Bà Trưng, Hà Nội',
        '0912345679',
        1,
        '2025-04-17'
    );
-- ------------------------------------------------------------
--  3.14 Nhà cung cấp (giữ nguyên)
-- ------------------------------------------------------------
INSERT INTO `NHACUNGCAP` (`TEN`, `DIACHI`, `SDT`, `EMAIL`, `TT`)
VALUES (
        'Công Ty CP Anh Khuê Watch',
        'Số 20 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',
        '1900866858',
        'online@anhkhuewatch.com.vn',
        1
    ),
    (
        'Công Ty TNHH Citizen Việt Nam',
        '160 đường số 30, P. An Lạc, TP. Hồ Chí Minh',
        '0903996733',
        'contact@citizen.com.vn',
        1
    ),
    (
        'Công Ty CP Orient Việt Nam',
        '157 Cách Mạng Tháng Tám, P. Bàn Cờ, TP. Hồ Chí Minh',
        '02822539787',
        'info@lpd.com.vn',
        1
    ),
    (
        'Công Ty TNHH Seiko Việt Nam',
        'KCN Đại An, P. Việt Hòa, Hải Dương',
        '02438621520',
        'support@seiko.com.vn',
        1
    ),
    (
        'Công Ty TNHH Rolex Việt Nam',
        'Tầng Trệt, 88 Đồng Khởi, P. Sài Gòn, TP. Hồ Chí Minh',
        '02462821922',
        'service@rolex.com',
        1
    ),
    (
        'Công Ty TNHH Frederique Constant VN',
        '393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',
        '18006785',
        'info@frederiqueconstant.com.vn',
        1
    ),
    (
        'Công Ty TNHH Fossil Việt Nam',
        'Tầng 7, 215 Nguyễn Văn Thủ, P. Tân Định, TP. Hồ Chí Minh',
        '0932523679',
        'ecom@dragonflyapac.vn',
        1
    ),
    (
        'Công Ty TNHH Dragonfly Select Brands VN',
        '222 Điện Biên Phủ, P. Xuân Hòa, TP. Hồ Chí Minh',
        '0932029606',
        'danielwellingtonvn@dragonflyapac.com',
        1
    ),
    (
        'SKMEI Official',
        '41 Dawang Road, Zhaoqing, Guangdong, China',
        '07583988367',
        'alex@skmei.com',
        1
    ),
    (
        'Timex Vietnam Distributor',
        'Sarimi, Sala, P. An Lợi Đông, TP. Thủ Đức',
        '0839555959',
        'kdonline@nvl.com.vn',
        1
    );
-- ------------------------------------------------------------
--  3.15 Vị trí trưng bày (giữ nguyên)
-- ------------------------------------------------------------
INSERT INTO `VITRITRUNGBAY` (`TEN`, `GHICHU`)
VALUES (
        'Khu A1 - Đồng hồ cơ',
        'Automatic, Hand-wound'
    ),
    (
        'Khu A2 - Đồng hồ Quartz',
        'Nhiều mẫu phổ thông'
    ),
    (
        'Khu A3 - Đồng hồ điện tử',
        'Casio G-Shock, Baby-G'
    ),
    (
        'Khu A4 - Smartwatch',
        'Đồng hồ thông minh'
    ),
    (
        'Khu B1 - Casio Corner',
        'Kệ riêng thương hiệu Casio'
    ),
    (
        'Khu B2 - Seiko Corner',
        'Vị trí thương hiệu Seiko'
    ),
    (
        'Khu B3 - Orient Corner',
        'Kệ dành cho Orient'
    );
-- ------------------------------------------------------------
--  3.16 Sản phẩm (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
INSERT INTO `SANPHAM` (
        `MSP`,
        `TEN`,
        `HINHANH`,
        `MNCC`,
        `MVT`,
        `THUONGHIEU`,
        `NAMSANXUAT`,
        `GIANHAP`,
        `GIABAN`,
        `SOLUONG`,
        `THOIGIANBAOHANH`,
        `TT`
    )
VALUES (
        1,
        'Citizen Eco-Drive BM7108-14E',
        'citizen_bm7108.jpg',
        2,
        2,
        'Citizen',
        2024,
        3500000,
        4500000,
        14,
        24,
        1
    ),
    -- Nhập 15, Bán 1
    (
        2,
        'Citizen Promaster NY0040-09E',
        'citizen_ny0040.jpg',
        2,
        1,
        'Citizen',
        2024,
        8500000,
        11500000,
        7,
        24,
        1
    ),
    -- Nhập 8, Bán 1
    (
        3,
        'Citizen NH8390-20E',
        'citizen_nh8390.png',
        2,
        1,
        'Citizen',
        2023,
        4200000,
        5800000,
        24,
        24,
        1
    ),
    -- Nhập 24 (Phòng 2+12)
    (
        4,
        'Orient Bambino RA-AC0E03S',
        'orient_bambino.jpg',
        3,
        7,
        'Orient',
        2024,
        3800000,
        5200000,
        9,
        12,
        1
    ),
    -- Nhập 10, Bán 1
    (
        5,
        'Orient Mako III RA-AA0008B',
        'orient_mako3.jpg',
        3,
        7,
        'Orient',
        2024,
        5500000,
        7500000,
        13,
        12,
        1
    ),
    -- Nhập 14 (Phiếu 3+14), Bán 1
    (
        6,
        'Orient Sun and Moon RA-AS0103S',
        'orient_sunmoon.jpg',
        3,
        7,
        'Orient',
        2023,
        7200000,
        9800000,
        5,
        12,
        1
    ),
    -- Nhập 5
    (
        7,
        'Seiko 5 Sports SRPD55K1',
        'seiko_srpd55.jpg',
        4,
        6,
        'Seiko',
        2024,
        4800000,
        6500000,
        20,
        12,
        1
    ),
    -- Nhập 20
    (
        8,
        'Seiko Presage SPB041J1',
        'seiko_spb041.jpg',
        4,
        6,
        'Seiko',
        2024,
        12000000,
        16500000,
        5,
        24,
        1
    ),
    -- Nhập 6, Bán 1
    (
        9,
        'Seiko Prospex SRPE99K1',
        'seiko_srpe99.jpg',
        4,
        6,
        'Seiko',
        2023,
        8500000,
        11200000,
        9,
        12,
        1
    ),
    -- Nhập 9
    (
        10,
        'Seiko 5 SNK809K2',
        'seiko_snk809.jpg',
        4,
        6,
        'Seiko',
        2024,
        2200000,
        3200000,
        54,
        12,
        1
    ),
    -- Nhập 55 (Phiếu 4+13), Bán 1
    (
        11,
        'Rolex Submariner Date 126610LN',
        'rolex_sub.jpg',
        5,
        1,
        'Rolex',
        2024,
        185000000,
        245000000,
        0,
        48,
        1
    ),
    -- Nhập 1, Bán 1 -> Hết hàng
    (
        12,
        'Rolex Datejust 41 126300',
        'rolex_dj41.jpg',
        5,
        1,
        'Rolex',
        2024,
        165000000,
        215000000,
        2,
        48,
        1
    ),
    -- Nhập 2
    (
        13,
        'Rolex Air-King 126900',
        'rolex_airking.jpg',
        5,
        1,
        'Rolex',
        2023,
        145000000,
        195000000,
        1,
        48,
        1
    ),
    -- Nhập 1
    (
        14,
        'Frederique Constant Classic FC-303',
        'fc_classic.png',
        6,
        1,
        'Frederique Constant',
        2024,
        8500000,
        12500000,
        5,
        24,
        1
    ),
    -- Nhập 6, Bán 1
    (
        15,
        'Frederique Constant Slimline FC-200',
        'fc_slimline.png',
        6,
        2,
        'Frederique Constant',
        2024,
        9200000,
        13800000,
        4,
        24,
        1
    ),
    -- Nhập 4
    (
        16,
        'Fossil Grant FS4736IE',
        'fossil_grant.jpg',
        7,
        2,
        'Fossil',
        2024,
        2500000,
        3800000,
        18,
        12,
        1
    ),
    -- Nhập 18
    (
        17,
        'Fossil Neutra FS5380',
        'fossil_neutra.jpg',
        7,
        2,
        'Fossil',
        2024,
        2200000,
        3200000,
        22,
        12,
        1
    ),
    -- Nhập 22
    (
        18,
        'Fossil Hybrid Smartwatch FTW1163',
        'fossil_hybrid.jpg',
        7,
        4,
        'Fossil',
        2024,
        3800000,
        5500000,
        12,
        12,
        1
    ),
    -- Nhập 12
    (
        19,
        'Daniel Wellington Classic Sheffield',
        'dw_sheffield.jpg',
        8,
        2,
        'Daniel Wellington',
        2024,
        2800000,
        4200000,
        15,
        24,
        1
    ),
    -- Nhập 16, Bán 1
    (
        20,
        'Daniel Wellington Petite Sterling',
        'dw_petite.jpg',
        8,
        2,
        'Daniel Wellington',
        2024,
        3200000,
        4800000,
        14,
        24,
        1
    ),
    -- Nhập 14
    (
        21,
        'Daniel Wellington Classic Black',
        'dw_black.jpg',
        8,
        2,
        'Daniel Wellington',
        2024,
        2500000,
        3800000,
        20,
        24,
        1
    ),
    -- Nhập 20
    (
        22,
        'Casio G-Shock GA-2100-1A1',
        'gshock_ga2100.jpg',
        1,
        5,
        'Casio',
        2024,
        2800000,
        3900000,
        54,
        12,
        1
    ),
    -- Nhập 55 (Phiếu 1+11), Bán 1
    (
        23,
        'Casio Edifice EFR-556DB-2AV',
        'edifice_efr556.jpg',
        1,
        5,
        'Casio',
        2024,
        3200000,
        4500000,
        13,
        12,
        1
    ),
    -- Nhập 15, Bán 2
    (
        24,
        'Tissot PRX T137.410.11.041.00',
        'tissot_prx.jpg',
        1,
        2,
        'Tissot',
        2024,
        9500000,
        13500000,
        13,
        24,
        1
    ),
    -- Nhập 14 (Phiếu 1+11), Bán 1
    (
        25,
        'Hamilton Khaki Field H70455533',
        'hamilton_khaki.jpg',
        1,
        1,
        'Hamilton',
        2023,
        11500000,
        16500000,
        2,
        24,
        1
    ),
    -- Nhập 3 (Phiếu 1+11), Bán 1
    (
        26,
        'Casio G-Shock DW-5600E-1V',
        'gshock_dw5600.jpg',
        1,
        3,
        'Casio',
        2024,
        1800000,
        2600000,
        2,
        12,
        1
    ),
    -- Nhập 2
    (
        27,
        'Casio G-Shock AE-1200WH-1A',
        'gshock_ae1200.png',
        1,
        3,
        'Casio',
        2024,
        550000,
        890000,
        11,
        12,
        1
    ),
    -- Nhập 11
    (
        28,
        'Casio F-91W',
        'casio_f91w.png',
        1,
        3,
        'Casio',
        2023,
        200000,
        350000,
        0,
        12,
        1
    ),
    -- Chưa nhập
    (
        29,
        'Casio A168WG-9WDF',
        'casio_a168w.png',
        1,
        3,
        'Casio',
        2024,
        650000,
        950000,
        0,
        12,
        1
    ),
    -- Chưa nhập
    (
        30,
        'Casio Baby-G BGD-565-7DR',
        'babyg_bgd565.jpg',
        1,
        3,
        'Casio',
        2024,
        1600000,
        2100000,
        0,
        12,
        1
    ),
    -- Chưa nhập
    (
        31,
        'Casio Baby-G BA-110-1ADR',
        'babyg_ba110.png',
        1,
        3,
        'Casio',
        2024,
        2150000,
        2900000,
        0,
        12,
        1
    ),
    -- Chưa nhập
    (
        32,
        'Casio ProTrek PRG-270-1A',
        'protrek_prg270.png',
        1,
        3,
        'Casio',
        2024,
        3800000,
        5200000,
        0,
        12,
        1
    ),
    -- Chưa nhập
    (
        33,
        'SKMEI 1251 Digital',
        'skmei_1251.jpg',
        9,
        3,
        'SKMEI',
        2024,
        150000,
        250000,
        25,
        6,
        1
    ),
    -- Nhập 25
    (
        34,
        'SKMEI 1456 Digital Military',
        'skmei_1456.jpg',
        9,
        3,
        'SKMEI',
        2024,
        180000,
        300000,
        22,
        6,
        1
    ),
    -- Nhập 22
    (
        35,
        'Timex Ironman Classic 30',
        'timex_ironman30.jpg',
        10,
        3,
        'Timex',
        2024,
        850000,
        1350000,
        14,
        12,
        1
    );
-- Nhập 14
-- ------------------------------------------------------------
--  3.17 Phiếu nhập (giữ nguyên)
-- ------------------------------------------------------------
INSERT INTO `PHIEUNHAP` (`MPN`, `MNV`, `MNCC`, `TIEN`, `TG`, `TT`)
VALUES (1, 1, 1, 171500000, '2025-10-05 08:30:00', 1),
    -- Nhập Casio
    (2, 3, 2, 170900000, '2025-11-12 10:00:00', 1),
    -- Nhập Citizen
    (3, 7, 3, 112500000, '2025-12-01 14:20:00', 1),
    -- Nhập Orient
    (4, 1, 4, 299500000, '2026-01-10 09:15:00', 1),
    -- Nhập Seiko
    (5, 3, 5, 515000000, '2026-01-20 11:00:00', 1),
    -- Nhập Rolex (Lớn)
    (6, 7, 6, 87800000, '2026-02-05 15:30:00', 1),
    -- Nhập Frederique Constant
    (7, 3, 7, 139000000, '2026-02-15 10:45:00', 1),
    -- Nhập Fossil
    (8, 1, 8, 139600000, '2026-03-01 08:00:00', 1),
    -- Nhập Daniel Wellington
    (9, 7, 9, 7710000, '2026-03-10 16:20:00', 1),
    -- Nhập SKMEI
    (10, 3, 10, 11900000, '2026-03-15 09:30:00', 1),
    -- Nhập Timex
    (11, 1, 1, 211900000, '2026-03-20 13:00:00', 1),
    -- Nhập thêm G-Shock & Tissot
    (12, 3, 2, 50400000, '2026-03-22 10:00:00', 1),
    -- Nhập Citizen NH8390
    (13, 7, 4, 144000000, '2026-03-25 14:45:00', 1),
    -- Nhập Seiko 5 SNK
    (14, 1, 3, 38500000, '2026-03-28 11:20:00', 1),
    -- Nhập Orient Mako
    (15, 3, 5, 145000000, '2026-03-30 15:00:00', 1);
-- Nhập Rolex Air-King
INSERT INTO `CTPHIEUNHAP` (`MPN`, `MSP`, `SL`, `TIENNHAP`)
VALUES -- Phiếu 1: Casio (Tổng: 171,500,000)
    (1, 22, 25, 2800000),
    (1, 23, 15, 3200000),
    (1, 24, 4, 9500000),
    (1, 25, 1, 11500000),
    (1, 26, 2, 1800000),
    -- Phiếu 2: Citizen (Tổng: 170,900,000)
    (2, 1, 15, 3500000),
    (2, 2, 8, 8500000),
    (2, 3, 12, 4200000),
    -- Phiếu 3: Orient (Tổng: 112,500,000)
    (3, 4, 10, 3800000),
    (3, 5, 7, 5500000),
    (3, 6, 5, 7200000),
    -- Phiếu 4: Seiko (Tổng: 299,500,000)
    (4, 7, 20, 4800000),
    (4, 8, 6, 12000000),
    (4, 9, 9, 8500000),
    (4, 10, 25, 2200000),
    -- Phiếu 5: Rolex (Tổng: 515,000,000)
    (5, 11, 1, 185000000),
    (5, 12, 2, 165000000),
    -- Phiếu 6: Frederique (Tổng: 87,800,000)
    (6, 14, 6, 8500000),
    (6, 15, 4, 9200000),
    -- Phiếu 7: Fossil (Tổng: 139,000,000)
    (7, 16, 18, 2500000),
    (7, 17, 22, 2200000),
    (7, 18, 12, 3800000),
    -- Phiếu 8: DW (Tổng: 139,600,000)
    (8, 19, 16, 2800000),
    (8, 20, 14, 3200000),
    (8, 21, 20, 2500000),
    -- Phiếu 9: SKMEI (Tổng: 7,710,000)
    (9, 33, 25, 150000),
    (9, 34, 22, 180000),
    -- Phiếu 10: Timex (Tổng: 11,900,000)
    (10, 35, 14, 850000),
    -- Phiếu 11: Nhập thêm (Tổng: 211,900,000)
    (11, 22, 30, 2800000),
    (11, 24, 10, 9500000),
    (11, 25, 2, 11500000),
    (11, 27, 11, 890000),
    -- Phiếu 12: Citizen lẻ (Tổng: 50,400,000)
    (12, 3, 12, 4200000),
    -- Phiếu 13: Seiko 5 (Tổng: 144,000,000)
    (13, 10, 30, 4800000),
    -- Phiếu 14: Orient lẻ (Tổng: 38,500,000)
    (14, 5, 7, 5500000),
    -- Phiếu 15: Rolex Air (Tổng: 145,000,000)
    (15, 13, 1, 145000000);
SET FOREIGN_KEY_CHECKS = 1;
-- ------------------------------------------------------------
--  3.18 Mã khuyến mãi mẫu
-- ------------------------------------------------------------
INSERT INTO `MAKHUYENMAI` (`MKM`, `TGBD`, `TGKT`, `TT`)
VALUES ('SUMMER2025', '2025-06-01', '2025-06-30', 1),
    ('CASIO10', '2025-05-01', '2025-05-31', 0),
    ('SALE8_3', '2025-03-08', '2025-03-08', 0);
INSERT INTO `CTMAKHUYENMAI` (`MKM`, `MSP`, `PTG`)
VALUES ('SUMMER2025', 7, 10),
    ('SUMMER2025', 10, 10),
    ('SUMMER2025', 22, 15),
    ('CASIO10', 26, 10),
    ('CASIO10', 27, 10),
    ('CASIO10', 28, 10),
    ('SALE8_3', 19, 8),
    ('SALE8_3', 20, 8),
    ('SALE8_3', 21, 8);
-- Dữ liệu mẫu cho năm 2026
INSERT INTO `NGAYLE` (`TENLE`, `NGAY`, `HESO_LUONG`)
VALUES ('Tết Dương Lịch', '2026-01-01', 3.0),
    ('Giỗ tổ Hùng Vương', '2026-04-25', 2.0),
    ('Giải phóng miền Nam', '2026-04-30', 3.0),
    ('Quốc tế lao động', '2026-05-01', 3.0);
INSERT INTO `PHIEUXUAT` (`MPX`, `MNV`, `MKH`, `TIEN`, `TG`, `TT`)
VALUES -- Năm 2020 (Giai đoạn mới mở)
    (1, 2, 2, 4500000, '2020-05-15 10:30:00', 1),
    (2, 3, 3, 11500000, '2020-11-20 15:45:00', 1),
    -- Năm 2021
    (3, 4, 4, 5200000, '2021-03-10 09:15:00', 1),
    (4, 5, 5, 7500000, '2021-08-25 19:20:00', 1),
    -- Năm 2022
    (5, 6, 6, 16500000, '2022-01-05 11:00:00', 1),
    (6, 7, 7, 3200000, '2022-07-14 14:30:00', 1),
    -- Năm 2023
    (7, 8, 8, 245000000, '2023-04-12 10:00:00', 1),
    -- Bán 1 chiếc Rolex
    (8, 9, 9, 12500000, '2023-12-24 20:00:00', 1),
    -- Năm 2024
    (9, 10, 10, 4200000, '2024-02-14 08:30:00', 1),
    (10, 2, 11, 8500000, '2024-06-20 16:00:00', 1),
    -- Năm 2025
    (11, 3, 12, 13500000, '2025-01-01 09:00:00', 1),
    (12, 4, 13, 16500000, '2025-03-08 15:30:00', 1),
    -- Năm 2026 (Năm hiện tại của đồ án)
    (13, 5, 14, 3900000, '2026-01-15 10:00:00', 1),
    (14, 6, 15, 4500000, '2026-03-25 14:00:00', 1);
INSERT INTO `CTPHIEUXUAT` (`MPX`, `MSP`, `SL`, `TIENXUAT`)
VALUES (1, 1, 1, 4500000),
    -- Citizen Eco-Drive
    (2, 2, 1, 11500000),
    -- Citizen Promaster
    (3, 4, 1, 5200000),
    -- Orient Bambino
    (4, 5, 1, 7500000),
    -- Orient Mako III
    (5, 8, 1, 16500000),
    -- Seiko Presage
    (6, 10, 1, 3200000),
    -- Seiko 5
    (7, 11, 1, 245000000),
    -- Rolex Submariner (Đơn hàng lớn)
    (8, 14, 1, 12500000),
    -- Frederique Constant
    (9, 19, 1, 4200000),
    -- Daniel Wellington
    (10, 23, 1, 4500000),
    -- Casio Edifice
    (11, 24, 1, 13500000),
    -- Tissot PRX
    (12, 25, 1, 16500000),
    -- Hamilton Khaki
    (13, 22, 1, 3900000),
    -- G-Shock GA-2100
    (14, 23, 1, 4500000);
-- Casio Edifice
COMMIT;
DELIMITER $$ DROP PROCEDURE IF EXISTS sp_ChotLuongHangThang $$ CREATE PROCEDURE sp_ChotLuongHangThang(IN p_Thang INT, IN p_Nam INT) BEGIN
DECLARE v_NgayCongChuan INT DEFAULT 26;
-- 1. Xóa dữ liệu cũ để tránh trùng lặp UNIQUE KEY (MNV, THANG, NAM)
DELETE FROM BANGLUONG
WHERE THANG = p_Thang
    AND NAM = p_Nam;
-- 2. Tính toán và chèn dữ liệu
INSERT INTO BANGLUONG (
        MNV,
        THANG,
        NAM,
        LUONGCOBAN,
        NGAYCONG,
        DOANH_SO,
        TY_LE_HOA_HONG,
        HOA_HONG,
        BHXH,
        BHYT,
        BHTN,
        LUONGTHUCLANH,
        TT
    )
SELECT nv.MNV,
    p_Thang,
    p_Nam,
    cv.LUONGCOBAN,
    -- Tính tổng công quy đổi (Dùng IFNULL để tránh lỗi NULL)
    IFNULL(
        SUM(
            CASE
                WHEN nl.NGAY IS NOT NULL THEN nl.HESO_LUONG
                WHEN DAYOFWEEK(pcl.NGAY) BETWEEN 2 AND 7 THEN 1
                ELSE 0
            END
        ),
        0
    ) AS TongCong,
    -- Doanh số
    IFNULL(DS.TongTien, 0),
    cv.TY_LE_HOA_HONG,
    -- Hoa hồng
    (IFNULL(DS.TongTien, 0) * cv.TY_LE_HOA_HONG / 100),
    -- Bảo hiểm
    (cv.LUONGCOBAN * 0.080),
    (cv.LUONGCOBAN * 0.015),
    (cv.LUONGCOBAN * 0.010),
    -- Công thức thực lãnh (Đã sửa lỗi đóng ngoặc)
    (
        (
            (cv.LUONGCOBAN / v_NgayCongChuan) * IFNULL(
                SUM(
                    CASE
                        WHEN nl.NGAY IS NOT NULL THEN nl.HESO_LUONG
                        WHEN DAYOFWEEK(pcl.NGAY) BETWEEN 2 AND 7 THEN 1
                        ELSE 0
                    END
                ),
                0
            )
        ) + (IFNULL(DS.TongTien, 0) * cv.TY_LE_HOA_HONG / 100) - (cv.LUONGCOBAN * 0.105)
    ) AS v_ThucLanh,
    1
FROM NHANVIEN nv
    JOIN CHUCVU cv ON nv.MCV = cv.MCV
    LEFT JOIN PHANCALAM pcl ON nv.MNV = pcl.MNV
    AND MONTH(pcl.NGAY) = p_Thang
    AND YEAR(pcl.NGAY) = p_Nam
    AND pcl.TT = 2
    LEFT JOIN NGAYLE nl ON pcl.NGAY = nl.NGAY
    LEFT JOIN (
        SELECT MNV,
            SUM(TIEN) AS TongTien
        FROM PHIEUXUAT
        WHERE MONTH(TG) = p_Thang
            AND YEAR(TG) = p_Nam
            AND TT = 1
        GROUP BY MNV
    ) AS DS ON nv.MNV = DS.MNV
GROUP BY nv.MNV,
    cv.LUONGCOBAN,
    cv.TY_LE_HOA_HONG,
    DS.TongTien;
END $$ DELIMITER;
DELIMITER $$ CREATE TRIGGER tg_KiemTraPhanCa BEFORE
INSERT ON PHANCALAM FOR EACH ROW BEGIN -- Nếu ngày phân ca là Chủ Nhật (DAYOFWEEK = 1)
    IF DAYOFWEEK(NEW.NGAY) = 1 THEN SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Cửa hàng nghỉ Chủ Nhật, không thể phân ca!';
END IF;
END $$ DELIMITER;
DELIMITER $$ CREATE TRIGGER tg_KhoaTaiKhoanKhiNghiviec
AFTER
UPDATE ON `NHANVIEN` FOR EACH ROW BEGIN -- Nếu trạng thái nhân viên chuyển từ 1 (Đang làm) sang 0 (Nghỉ việc)
    IF NEW.TT = 0
    AND OLD.TT = 1 THEN
UPDATE `TAIKHOAN`
SET `TRANGTHAI` = 0
WHERE `MNV` = NEW.MNV;
END IF;
END $$ DELIMITER;
-- 1. Khi NHẬP hàng: Tồn kho tăng lên
DELIMITER $$ CREATE TRIGGER tg_CapNhatTonKhiNhap
AFTER
INSERT ON CTPHIEUNHAP FOR EACH ROW BEGIN IF EXISTS (
        SELECT 1
        FROM PHIEUNHAP pn
        WHERE pn.MPN = NEW.MPN
            AND pn.TT = 1
    ) THEN
UPDATE SANPHAM
SET SOLUONG = SOLUONG + NEW.SL
WHERE MSP = NEW.MSP;
END IF;
END $$ -- 2. Khi BÁN hàng: Tồn kho giảm đi
CREATE TRIGGER tg_CapNhatTonKhiXuat
AFTER
INSERT ON CTPHIEUXUAT FOR EACH ROW BEGIN
UPDATE SANPHAM
SET SOLUONG = SOLUONG - NEW.SL
WHERE MSP = NEW.MSP;
END $$ DELIMITER;