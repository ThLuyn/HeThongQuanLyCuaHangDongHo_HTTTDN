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
	-- ADD CONSTRAINT FK_MCV_NHANVIEN FOREIGN KEY (MCV) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION;
    
ALTER TABLE `TAIKHOAN`
	ADD CONSTRAINT FK_MNV_TAIKHOAN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNQ_TAIKHOAN FOREIGN KEY (MNQ) REFERENCES `NHOMQUYEN`(MNQ) ON DELETE NO ACTION ON UPDATE NO ACTION;
    
ALTER TABLE `LICHSUCHUCVU`
	ADD CONSTRAINT FK_MNV_LSCV FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_CU_LSCV FOREIGN KEY (MCV_CU) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_MOI_LSCV FOREIGN KEY (MCV_MOI) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_LSCV FOREIGN KEY (MNV_DUYET) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PHANCALAM`
	ADD CONSTRAINT FK_MNV_PCL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCA_PCL FOREIGN KEY (MCA) REFERENCES `CALAM`(MCA) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `DONXINNGH`
	ADD CONSTRAINT FK_MNV_DXN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_DXN FOREIGN KEY (NGUOIDUYET) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `BANGCHAMCONG`
	ADD CONSTRAINT FK_MNV_BCC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `BANGLUONG`
	ADD CONSTRAINT FK_MNV_BL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `SANPHAM`
	ADD CONSTRAINT FK_MNCC_SANPHAM FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MVT_SANPHAM FOREIGN KEY (MVT) REFERENCES `VITRITRUNGBAY`(MVT) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PHIEUNHAP`
	ADD CONSTRAINT FK_MNV_PN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNCC_PN FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `CTPHIEUNHAP`
	ADD CONSTRAINT FK_MPN_CTPN FOREIGN KEY (MPN) REFERENCES `PHIEUNHAP`(MPN) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPN FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `CTMAKHUYENMAI`
	ADD CONSTRAINT FK_MKM_CTMKM FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTMKM FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PHIEUXUAT`
	ADD CONSTRAINT FK_MNV_PX FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PX FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `CTPHIEUXUAT`
	ADD CONSTRAINT FK_MPX_CTPX FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPX FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKM_CTPX FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PHIEUBAOHANH`
	ADD CONSTRAINT FK_MPX_PBH FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_PBH FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PBH FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PHIEUSUACHUA`
	ADD CONSTRAINT FK_MPB_PSC FOREIGN KEY (MPB) REFERENCES `PHIEUBAOHANH`(MPB) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNV_PSC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ============================================================
--  PHẦN 3: TRIGGER & PROCEDURE 
-- ============================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_ChotLuongHangThang $$
CREATE PROCEDURE sp_ChotLuongHangThang(IN p_Thang INT, IN p_Nam INT)
BEGIN
    DECLARE v_NgayCongChuan INT DEFAULT 26;

    -- 1. Xóa dữ liệu cũ
    DELETE FROM BANGLUONG
    WHERE THANG = p_Thang
      AND NAM   = p_Nam;

    -- 2. Tính toán và chèn dữ liệu
    INSERT INTO BANGLUONG (
        MNV, THANG, NAM, LUONGCOBAN, NGAYCONG, DOANH_SO,
        TY_LE_HOA_HONG, HOA_HONG, BHXH, BHYT, BHTN,
        LUONGTHUCLANH, TT
    )
    SELECT 
        nv.MNV,
        p_Thang,
        p_Nam,
        cv.LUONGCOBAN,

        IFNULL(
            SUM(
                CASE
                    WHEN nl.NGAY IS NOT NULL THEN nl.HESO_LUONG
                    WHEN DAYOFWEEK(pcl.NGAY) BETWEEN 2 AND 7 THEN 1
                    ELSE 0
                END
            ), 0
        ) AS TongCong,

        IFNULL(DS.TongTien, 0),
        cv.TY_LE_HOA_HONG,

        (IFNULL(DS.TongTien, 0) * cv.TY_LE_HOA_HONG / 100),

        (cv.LUONGCOBAN * 0.080),
        (cv.LUONGCOBAN * 0.015),
        (cv.LUONGCOBAN * 0.010),

        (
            ((cv.LUONGCOBAN / v_NgayCongChuan) *
                IFNULL(
                    SUM(
                        CASE
                            WHEN nl.NGAY IS NOT NULL THEN nl.HESO_LUONG
                            WHEN DAYOFWEEK(pcl.NGAY) BETWEEN 2 AND 7 THEN 1
                            ELSE 0
                        END
                    ), 0
                )
            )
            + (IFNULL(DS.TongTien, 0) * cv.TY_LE_HOA_HONG / 100)
            - (cv.LUONGCOBAN * 0.105)
        ) AS v_ThucLanh,

        1

    FROM NHANVIEN nv
    JOIN CHUCVU cv 
        ON nv.MCV = cv.MCV

    LEFT JOIN PHANCALAM pcl 
        ON nv.MNV = pcl.MNV
       AND MONTH(pcl.NGAY) = p_Thang
       AND YEAR(pcl.NGAY)  = p_Nam
       AND pcl.TT = 2

    LEFT JOIN NGAYLE nl 
        ON pcl.NGAY = nl.NGAY

    LEFT JOIN (
        SELECT MNV, SUM(TIEN) AS TongTien
        FROM PHIEUXUAT
        WHERE MONTH(TG) = p_Thang
          AND YEAR(TG)  = p_Nam
          AND TT = 1
        GROUP BY MNV
    ) AS DS 
        ON nv.MNV = DS.MNV

    GROUP BY 
        nv.MNV, cv.LUONGCOBAN, cv.TY_LE_HOA_HONG, DS.TongTien;

END $$


DELIMITER $$

-- 1. Trigger: Tự động cộng tồn kho khi nhập hàng
DROP TRIGGER IF EXISTS tg_CapNhatTonKhiNhap $$
CREATE TRIGGER tg_CapNhatTonKhiNhap
AFTER INSERT ON CTPHIEUNHAP
FOR EACH ROW
BEGIN
    UPDATE SANPHAM SET SOLUONG = SOLUONG + NEW.SL WHERE MSP = NEW.MSP;
END $$

-- 2. Trigger: Tự động trừ tồn kho khi bán & Chặn nếu không đủ hàng
DROP TRIGGER IF EXISTS tg_CapNhatTonKhiXuat $$
CREATE TRIGGER tg_CapNhatTonKhiXuat
BEFORE INSERT ON CTPHIEUXUAT
FOR EACH ROW
BEGIN
    DECLARE v_ton_kho INT;
    SELECT SOLUONG INTO v_ton_kho FROM SANPHAM WHERE MSP = NEW.MSP;
    IF v_ton_kho < NEW.SL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi nghiệp vụ: Số lượng hàng trong kho không đủ để thực hiện xuất phiếu!';
    ELSE
        UPDATE SANPHAM SET SOLUONG = SOLUONG - NEW.SL WHERE MSP = NEW.MSP;
    END IF;
END $$

-- 3. Trigger: Khóa tài khoản khi nhân viên nghỉ việc
DROP TRIGGER IF EXISTS tg_KhoaTaiKhoanKhiNghiviec $$
CREATE TRIGGER tg_KhoaTaiKhoanKhiNghiviec
AFTER UPDATE ON NHANVIEN
FOR EACH ROW
BEGIN
    IF NEW.TT = 0 AND OLD.TT = 1 THEN
        UPDATE TAIKHOAN SET TRANGTHAI = 0 WHERE MNV = NEW.MNV;
    END IF;
END $$

-- 4. Trigger: Chặn phân ca ngày Chủ Nhật
DROP TRIGGER IF EXISTS tg_KiemTraPhanCa $$
CREATE TRIGGER tg_KiemTraPhanCa
BEFORE INSERT ON PHANCALAM
FOR EACH ROW
BEGIN
    IF DAYOFWEEK(NEW.NGAY) = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cửa hàng nghỉ Chủ Nhật!';
    END IF;
END $$

DELIMITER ;

--  PHẦN 4: DỮ LIỆU MẪU
-- ------------------------------------------------------------
--  4.1 Danh mục chức năng
-- ------------------------------------------------------------
INSERT INTO `DANHMUCCHUCNANG` (`MCN`, `TEN`, `TT`) VALUES 
	( 'sanpham', 'Quản lý sản phẩm', 1),
    ( 'khachhang', 'Quản lý khách hàng', 1),
    ( 'nhacungcap', 'Quản lý nhà cung cấp', 1),
    ( 'nhanvien', 'Quản lý nhân viên', 1),
    ( 'chucvu', 'Quản lý chức vụ', 1),
    ( 'calam', 'Quản lý ca làm', 1),
    ( 'phancalam', 'Phân ca làm việc', 1),
    ( 'donxinngh', 'Duyệt đơn xin nghỉ', 1),
    ( 'chamcong', 'Quản lý chấm công', 1),
    ( 'bangluong','Quản lý bảng lương', 1),
    ( 'phieunhap', 'Quản lý nhập hàng', 1),
    ( 'phieuxuat', 'Quản lý phiếu xuất / bán hàng', 1),
    ( 'baohanh', 'Quản lý phiếu bảo hành', 1),
    ( 'suachua', 'Quản lý phiếu sửa chữa', 1),
    ( 'vitritrungbay', 'Quản lý vị trí trưng bày', 1),
    ( 'nhomquyen', 'Quản lý nhóm quyền', 1),
    ( 'taikhoan', 'Quản lý tài khoản', 1),
    ( 'makhuyenmai', 'Quản lý mã khuyến mãi', 1),
    ( 'thongke', 'Thống kê & báo cáo', 1);
    
-- ------------------------------------------------------------
--  4.2 Nhóm quyền
-- ------------------------------------------------------------
INSERT INTO `NHOMQUYEN` (`TEN`, `TT`) VALUES 
	('Quản lý cửa hàng', 1),
    ('Nhân viên bán hàng', 1),
    ('Nhân viên kho', 1),
    ('Nhân viên kỹ thuật', 1);
    
-- ------------------------------------------------------------
--  4.3 Chi tiết quyền
-- ------------------------------------------------------------
-- Quản lý cửa hàng (MNQ = 1): toàn quyền
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES 
	(1, 'sanpham', 'create'), (1, 'sanpham', 'view'), (1, 'sanpham', 'update'), (1, 'sanpham', 'delete'),
    (1, 'khachhang', 'create'), (1, 'khachhang', 'view'), (1, 'khachhang', 'update'), (1, 'khachhang', 'delete'),
    (1, 'nhacungcap', 'create'), (1, 'nhacungcap', 'view'), (1, 'nhacungcap', 'update'), (1, 'nhacungcap', 'delete'),
    (1, 'nhanvien', 'create'), (1, 'nhanvien', 'view'), (1, 'nhanvien', 'update'), (1, 'nhanvien', 'delete'),
	(1, 'chucvu', 'create'), (1, 'chucvu', 'view'), (1, 'chucvu', 'update'), (1, 'chucvu', 'delete'),
    (1, 'calam', 'create'), (1, 'calam', 'view'), (1, 'calam', 'update'), (1, 'calam', 'delete'),
    (1, 'phancalam', 'create'), (1, 'phancalam', 'view'), (1, 'phancalam', 'update'), (1, 'phancalam', 'delete'),
    (1, 'donxinngh', 'view'), (1, 'donxinngh', 'approve'), 
    (1, 'chamcong', 'create'), (1, 'chamcong', 'view'), (1, 'chamcong', 'update'), (1, 'chamcong', 'export'),
    (1, 'bangluong', 'create'), (1, 'bangluong', 'view'), (1, 'bangluong', 'update'), (1, 'bangluong', 'export'),
    (1, 'phieunhap', 'create'), (1, 'phieunhap', 'view'), (1, 'phieunhap', 'cancel'), (1, 'phieunhap', 'export'),
    (1, 'phieuxuat', 'create'), (1, 'phieuxuat', 'view'), (1, 'phieuxuat', 'cancel'), (1, 'phieuxuat', 'export'),
    (1, 'baohanh', 'view'), (1, 'baohanh', 'update'), (1, 'baohanh', 'export'), 
    (1, 'suachua', 'create'), (1, 'suachua', 'view'), (1, 'suachua', 'update'), (1, 'suachua', 'delete'), (1, 'suachua', 'export'),
    (1, 'vitritrungbay', 'create'), (1, 'vitritrungbay', 'view'), (1, 'vitritrungbay', 'update'), (1, 'vitritrungbay', 'delete'),
    (1, 'nhomquyen', 'create'), (1, 'nhomquyen', 'view'), (1, 'nhomquyen', 'update'), (1, 'nhomquyen', 'delete'),
    (1, 'taikhoan', 'create'), (1, 'taikhoan', 'view'), (1, 'taikhoan', 'update'), (1, 'taikhoan', 'delete'),
    (1, 'makhuyenmai', 'create'), (1, 'makhuyenmai', 'view'), (1, 'makhuyenmai', 'update'), (1, 'makhuyenmai', 'delete'),
    (1, 'thongke', 'view'), (1, 'thongke', 'export');
    
-- Nhân viên bán hàng (MNQ = 2): hạn chế
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES 
	(2, 'sanpham', 'view'), 
    (2, 'khachhang', 'create'), (2, 'khachhang', 'view'), (2, 'khachhang', 'update'), 
    (2, 'phieuxuat', 'create'), (2, 'phieuxuat', 'view'), (2, 'phieuxuat', 'cancel'), (2, 'phieuxuat', 'export'),
    (2, 'baohanh', 'view'), (2, 'baohanh', 'export'), (2, 'suachua', 'create'), (2, 'suachua', 'view'), (2, 'suachua', 'update'),
    (2, 'vitritrungbay', 'view'), 
    (2, 'makhuyenmai', 'view'),
    (2, 'donxinngh', 'create'), (2, 'donxinngh', 'view'),
    (2, 'phancalam', 'view'),
    (2, 'bangluong', 'view'),
    (2, 'chamcong', 'view');
    
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES 
	(3, 'nhanvien', 'view'),
    (3, 'donxinngh', 'create'),
    (3, 'bangluong', 'view'),
	(3, 'sanpham', 'view'), (3, 'sanpham', 'create'), (3, 'sanpham', 'update'),
    (3, 'nhacungcap', 'view'), (3, 'nhacungcap', 'create'), (3, 'nhacungcap', 'update'),
    (3, 'phieunhap', 'view'), (3, 'phieunhap', 'create'), 
    (3, 'vitritrungbay', 'view'), 
    (3, 'thongke', 'view');
    
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES 
    (4, 'nhanvien', 'view'),
    (4, 'donxinngh', 'create'),
    (4, 'bangluong', 'view'),
	(4, 'baohanh', 'view'),
    (4, 'suachua', 'view'), (4, 'suachua', 'create'), (4, 'suachua', 'update'),
    (4, 'sanpham', 'view');
    
-- ------------------------------------------------------------
--  4.4 Chức vụ
-- ------------------------------------------------------------
INSERT INTO `CHUCVU` (`TEN`, `LUONGCOBAN`, `TY_LE_HOA_HONG`, `TT`) VALUES 
	('Quản lý cửa hàng', 15000000.00, 1.00, 1), -- Lương 15tr, hoa hồng 1% (tổng doanh thu)
    ('Nhân viên bán hàng', 7000000.00, 2.00, 1), -- Lương 7tr, hoa hồng 3% (doanh số cá nhân)
    ('Nhân viên kho', 8000000.00, 0.00, 1),
    ('Nhân viên kỹ thuật', 10000000.00, 0.00, 1);
    
-- ------------------------------------------------------------
--  4.5 Ca làm
-- ------------------------------------------------------------
INSERT INTO `CALAM` (`TENCA`, `GIO_BATDAU`, `GIO_KETTHUC`, `TT`) VALUES 
	('Ca 1', '08:00:00', '16:00:00', 1),
    ('Ca 2', '14:00:00', '22:00:00', 1);
    
-- ------------------------------------------------------------
--  4.6 Nhân viên
-- ------------------------------------------------------------
INSERT INTO `NHANVIEN` (`HOTEN`, `GIOITINH`, `NGAYSINH`, `SDT`, `EMAIL`, `MCV`, `TT`, `QUEQUAN`, `NGAYVAOLAM`, `CCCD`, `BOPHAN`) VALUES 
	( 'Võ Thị Thu Luyện', 0, '2005-05-01', '0865172517', 'thuluyen234@gmail.com', 1, 1, 'Quảng Ngãi', '2024-01-10', '079205001234', 'Quản lý'),
    ( 'Nguyễn Thị Ngọc Tú', 0, '2005-01-28', '0396532145', 'ngoctu@gmail.com', 2, 1,'Thái Bình', '2024-02-15', '080205005678', 'Bán hàng'),
    ( 'Trần Thị Xuân Thanh', 0, '2005-01-22', '0387913347', 'xuanthanh@gmail.com', 3, 1, 'Gia Lai', '2024-02-15', '082205009101', 'Kho'),
    ( 'Đỗ Hữu Lộc', 1, '2005-01-26', '0355374322', 'huuloc@gmail.com', 4, 0, 'Gia Lai', '2024-03-01', '075205001122', 'Kỹ thuật'),
    ( 'Đỗ Nam Anh', 1, '2003-04-11', '0123456781', 'chinchin@gmail.com', 2, 1, 'Bình Dương', '2024-03-01', '074203003344', 'Bán hàng'),
    ( 'Đinh Ngọc Ánh', 1, '2003-04-03', '0123456782', 'ngocan@gmail.com', 2, 0, 'Cần Thơ', '2024-04-10', '092203005566', 'Bán hàng'),
    ( 'Phạm Minh Khang', 1, '2004-12-10', '0912345678', 'minhkhang@gmail.com', 3, 1, 'Vũng Tàu', '2025-04-10', '077204007788', 'Kho'),
    ( 'Lê Thảo Nhi', 0, '2005-03-15', '0945123789', 'thaonhi@gmail.com', 2, 1, 'Tây Ninh', '2025-05-20', '070205009900', 'Bán hàng'),
    ( 'Nguyễn Hoàng Phúc', 1, '2003-09-21', '0987654321', 'hoangphuc@gmail.com', 4, 0, 'An Giang', '2026-05-20', '089203001133', 'Kỹ thuật'),
    ( 'Trần Mỹ Hạnh', 0, '2004-07-19', '0938475621', 'myhanh@gmail.com', 2, 1, 'Kiên Giang', '2026-06-05', '091204002244','Bán hàng');
    
-- ------------------------------------------------------------
--  4.7 Lịch sử chức vụ
-- ------------------------------------------------------------
INSERT INTO `LICHSUCHUCVU` ( `MNV`, `MCV_CU`, `MCV_MOI`, `NGAY_HIEULUC`, `GHICHU`, `MNV_DUYET`) VALUES 
	(1, NULL, 1, '2024-01-01', 'Ký hợp đồng quản lý', 1),
    (2, NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (3, NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (4, NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (5, NULL, 2, '2024-02-01', 'Ký hợp đồng nhân viên', 1),
    (6, NULL, 2, '2024-02-01', 'Ký hợp đồng nhân viên', 1),
    (7, NULL, 2, '2024-03-01', 'Ký hợp đồng nhân viên', 1),
    (8, NULL, 2, '2024-03-01', 'Ký hợp đồng nhân viên', 1),
    (9, NULL, 2, '2024-04-01', 'Ký hợp đồng nhân viên', 1),
    (10, NULL, 2, '2024-04-01', 'Ký hợp đồng nhân viên', 1);
    
-- ------------------------------------------------------------
--  3.8 Tài khoản
-- ------------------------------------------------------------
INSERT INTO `TAIKHOAN` (`MNV`, `TDN`, `MK`, `MNQ`, `TRANGTHAI`, `OTP`) VALUES 
	(1, 'admin', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 1, 1, NULL),
    (2, 'nhanvien02', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 2, 1, NULL),
    (3, 'nhanvien03', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 3, 1, NULL),
    (4, 'nhanvien04', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 4, 0, NULL);
    
-- ------------------------------------------------------------
--  3.9 Phân ca mẫu
-- ------------------------------------------------------------
INSERT INTO `PHANCALAM` ( `MNV`, `MCA`, `NGAY`, `GIO_CHECKIN`, `GIO_CHECKOUT`, `TT`)  VALUES 
	(2, 1, '2025-03-03', '2025-03-03 08:02:00', '2025-03-03 12:05:00', 2),
    (2, 2, '2025-03-03', '2025-03-03 13:01:00', '2025-03-03 17:00:00', 2),
    (3, 1, '2025-03-03', '2025-03-03 08:10:00', '2025-03-03 12:00:00', 2),
    (4, 2, '2025-03-03', '2025-03-03 13:05:00', '2025-03-03 17:10:00', 2),
    (2, 1, '2025-03-04', '2025-03-04 08:00:00', '2025-03-04 12:00:00', 2),
    (3, 2, '2025-03-04', '2025-03-04 17:00:00', '2025-03-04 21:00:00', 2),
    (5, 1, '2025-03-04', '2025-03-04 08:05:00', '2025-03-04 17:05:00', 2);

-- ------------------------------------------------------------
--  3.10 Đơn xin nghỉ mẫu
-- ------------------------------------------------------------
INSERT INTO `DONXINNGH` (`MNV`,`LOAI`,`NGAYNGHI`,`SONGAY`,`LYDO`,`TRANGTHAI`,`NGUOIDUYET`,`NGAYTAO`) VALUES
	(2, 1, '2025-03-10', 1, 'Việc gia đình đột xuất', 1, 1, '2025-03-08'),
	(3, 2, '2025-03-12', 2, 'Ốm, có giấy xác nhận bác sĩ', 1, 1, '2025-03-11'),
	(4, 1, '2025-03-20', 1, 'Tham dự đám cưới', 0, NULL, '2025-03-18'),
	(5, 3, '2025-04-01', 0, 'Xin nghỉ việc do chuyển vùng', 0, NULL, '2025-03-25');
    
-- ------------------------------------------------------------
--  3.11 Bảng chấm công mẫu 
-- ------------------------------------------------------------
INSERT INTO `BANGCHAMCONG` (`MNV`, `THANG`, `NAM`, `NGAYCONG`, `NGAYNGHI_PHEP`, `NGAYNGHI_KP`, `TT`) VALUES 
	(2, 3, 2025, 24.0, 1, 0, 2),
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
INSERT INTO `BANGLUONG` (`MNV`, `THANG`, `NAM`, `LUONGCOBAN`, `NGAYCONG`, `DOANH_SO`, `TY_LE_HOA_HONG`, `HOA_HONG`, `BHXH`, `BHYT`, `BHTN`, `KHAUTRU_KHAC`, `LUONGTHUCLANH`, `TT`) VALUES
	( 2,  3, 2026, 7000000, 24.0, 85000000, 3.0, 2550000, 560000, 105000, 70000,      0, 8276538, 2 ),
	( 3,  3, 2026, 7000000, 22.5, 62000000, 3.0, 1860000, 560000, 105000, 70000,      0, 7183077, 2 ),
	( 4,  3, 2026, 7000000, 23.0, 71000000, 3.0, 2130000, 560000, 105000, 70000, 150000, 7436538, 2 ),
	( 5,  3, 2026, 7000000, 25.0, 95000000, 3.0, 2850000, 560000, 105000, 70000,      0, 8846538, 2 ),
	( 6,  3, 2026, 7000000, 20.0, 54000000, 3.0, 1620000, 560000, 105000, 70000, 300000, 5969615, 2 ),
	( 7,  3, 2026, 7000000, 24.5, 78000000, 3.0, 2340000, 560000, 105000, 70000,      0, 8201538, 2 ),
	( 8,  3, 2026, 7000000, 23.0, 67000000, 3.0, 2010000, 560000, 105000, 70000,      0, 7466538, 2 ),
	( 9,  3, 2026, 7000000, 22.0, 59000000, 3.0, 1770000, 560000, 105000, 70000,      0, 6958846, 2 ),
	(10,  3, 2026, 7000000, 24.0, 72000000, 3.0, 2160000, 560000, 105000, 70000, 100000, 7786538, 2 );

-- ------------------------------------------------------------
--  3.13 Khách hàng
-- ------------------------------------------------------------
INSERT INTO `KHACHHANG` (`HOTEN`, `DIACHI`, `SDT`, `TT`, `NGAYTHAMGIA`) VALUES
	( 'Mặc định',               '',                                                     '',           1, '2025-04-15' ),
	( 'Nguyễn Văn Anh',         '45 An Dương Vương, P. Chợ Quán, TP. Hồ Chí Minh',      '0387913347', 1, '2025-04-15' ),
	( 'Trần Nhất Nhất',         '270 Hưng Phú, P. Chánh Hưng, TP. Hồ Chí Minh',         '0123456789', 1, '2025-04-15' ),
	( 'Hoàng Gia Bảo',          '45 Trương Đình Hội, P. Phú Định, TP. Hồ Chí Minh',     '0987654321', 1, '2025-04-15' ),
	( 'Hồ Minh Hưng',           '5 Võ Thị Sáu, P. Xuân Hòa, TP. Hồ Chí Minh',           '0867987456', 1, '2025-04-15' ),
	( 'Nguyễn Thị Minh Anh',    '50 Phạm Văn Chí, P. Bình Tiên, TP. Hồ Chí Minh',       '0935123456', 1, '2025-04-16' ),
	( 'Trần Đức Minh',          '789 Lê Hồng Phong, TP. Đà Nẵng',                       '0983456789', 1, '2025-04-16' ),
	( 'Lê Hải Yến',             '180 Hoàng Ngân, X. Trung Hòa, Hà Nội',                 '0977234567', 1, '2025-04-16' ),
	( 'Phạm Thanh Hằng',        '325 Nguyễn Văn Tăng, P. Long Bình, TP. Hồ Chí Minh',   '0965876543', 1, '2025-04-16' ),
	( 'Hoàng Đức Anh',          '321 Lý Thường Kiệt, TP. Cần Thơ',                      '0946789012', 1, '2025-04-16' ),
	( 'Ngô Thanh Tùng',         '393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',        '0912345678', 1, '2025-04-16' ),
	( 'Võ Thị Kim Ngân',        '123 Đường Lê Lợi, P. Hồng Bàng, TP. Hải Phòng',        '0916789123', 1, '2025-04-16' ),
	( 'Đỗ Văn Tú',              '777 Hùng Vương, TP. Huế',                              '0982345678', 1, '2025-04-30' ),
	( 'Lý Thanh Trúc',          '81 Hoàng Cầm, P. Linh Xuân, TP. Hồ Chí Minh',          '0982123456', 1, '2025-04-16' ),
	( 'Bùi Văn Hoàng',          '222 Đường 2/4, TP. Nha Trang',                         '0933789012', 1, '2025-04-16' ),
	( 'Lê Văn Thành',           '23 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',     '0933456789', 1, '2025-04-16' ),
	( 'Nguyễn Thị Lan Anh',     '45 Hàng Bạc, P. Hoàn Kiếm, Hà Nội',                    '0965123456', 1, '2025-04-16' ),
	( 'Phạm Thị Mai',           '234 Nguyễn Trãi, P. Chợ Quán, TP. Hồ Chí Minh',        '0946789013', 1, '2025-04-17' ),
	( 'Hoàng Văn Nam',          '567 Phố Huế, P. Hai Bà Trưng, Hà Nội',                 '0912345679', 1, '2025-04-17' );
    
-- ------------------------------------------------------------
--  3.14 Nhà cung cấp
-- ------------------------------------------------------------
INSERT INTO `NHACUNGCAP` (`TEN`, `DIACHI`, `SDT`, `EMAIL`, `TT`) VALUES
	( 'Công Ty CP Anh Khuê Watch',        'Số 20 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',  '1900866858', 'online@anhkhuewatch.com.vn',        1 ),
	( 'Công Ty TNHH Citizen Việt Nam',    '160 đường số 30, P. An Lạc, TP. Hồ Chí Minh',          '0903996733', 'contact@citizen.com.vn',            1 ),
	( 'Công Ty CP Orient Việt Nam',       '157 Cách Mạng Tháng Tám, P. Bàn Cờ, TP. Hồ Chí Minh',  '02822539787','info@lpd.com.vn',                  1 ),
	( 'Công Ty TNHH Seiko Việt Nam',      'KCN Đại An, P. Việt Hòa, Hải Dương',                    '02438621520','support@seiko.com.vn',             1 ),
	( 'Công Ty TNHH Rolex Việt Nam',      'Tầng Trệt, 88 Đồng Khởi, P. Sài Gòn, TP. Hồ Chí Minh', '02462821922','service@rolex.com',                1 ),
	( 'Công Ty TNHH Frederique Constant VN','393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',      '18006785',   'info@frederiqueconstant.com.vn',  1 ),
	( 'Công Ty TNHH Fossil Việt Nam',     'Tầng 7, 215 Nguyễn Văn Thủ, P. Tân Định, TP. Hồ Chí Minh','0932523679','ecom@dragonflyapac.vn',        1 ),
	( 'Công Ty TNHH Dragonfly Select Brands VN','222 Điện Biên Phủ, P. Xuân Hòa, TP. Hồ Chí Minh','0932029606','danielwellingtonvn@dragonflyapac.com',1 ),
	( 'SKMEI Official',                   '41 Dawang Road, Zhaoqing, Guangdong, China',           '07583988367','alex@skmei.com',                  1 ),
	( 'Timex Vietnam Distributor',        'Sarimi, Sala, P. An Lợi Đông, TP. Thủ Đức',            '0839555959', 'kdonline@nvl.com.vn',             1 );

-- ------------------------------------------------------------
--  3.15 Vị trí trưng bày 
-- ------------------------------------------------------------
INSERT INTO `VITRITRUNGBAY` (`TEN`, `GHICHU`) VALUES
	( 'Khu A1 - Đồng hồ cơ',       'Automatic, Hand-wound' ),
	( 'Khu A2 - Đồng hồ Quartz',   'Nhiều mẫu phổ thông' ),
	( 'Khu A3 - Đồng hồ điện tử',  'Casio G-Shock, Baby-G' ),
	( 'Khu A4 - Smartwatch',       'Đồng hồ thông minh' ),
	( 'Khu B1 - Casio Corner',     'Kệ riêng thương hiệu Casio' ),
	( 'Khu B2 - Seiko Corner',     'Vị trí thương hiệu Seiko' ),
	( 'Khu B3 - Orient Corner',    'Kệ dành cho Orient' );

-- ------------------------------------------------------------
--  3.16 Sản phẩm 
-- ------------------------------------------------------------
INSERT INTO `SANPHAM` (`MSP`, `TEN`, `HINHANH`, `MNCC`, `MVT`, `THUONGHIEU`, `NAMSANXUAT`, `GIANHAP`, `GIABAN`, `SOLUONG`, `THOIGIANBAOHANH`, `TT`) VALUES
(1, 'Citizen Eco-Drive BM7108', 'c1.jpg', 2, 2, 'Citizen', 2024, 3500000, 4500000, 0, 24, 1),
(2, 'Citizen Promaster NY0040', 'c2.jpg', 2, 1, 'Citizen', 2024, 8500000, 11500000, 0, 24, 1),
(3, 'Citizen NH8390-20E', 'c3.jpg', 2, 1, 'Citizen', 2024, 4200000, 5800000, 0, 24, 1),
(4, 'Orient Bambino RA-AC0E', 'o4.jpg', 3, 7, 'Orient', 2024, 3800000, 5200000, 0, 12, 1),
(5, 'Orient Mako III RA-AA00', 'o5.jpg', 3, 7, 'Orient', 2024, 5500000, 7500000, 0, 12, 1),
(6, 'Orient Sun and Moon', 'o6.jpg', 3, 7, 'Orient', 2024, 7200000, 9800000, 0, 12, 1),
(7, 'Seiko 5 Sports SRPD55', 's7.jpg', 4, 6, 'Seiko', 2024, 4800000, 6500000, 0, 12, 1),
(8, 'Seiko Presage SPB041', 's8.jpg', 4, 6, 'Seiko', 2024, 12000000, 16500000, 0, 24, 1), -- Tồn thấp (1)
(9, 'Seiko Prospex SRPE99', 's9.jpg', 4, 6, 'Seiko', 2024, 8500000, 11200000, 0, 12, 1),
(10, 'Seiko 5 SNK809', 's10.jpg', 4, 6, 'Seiko', 2024, 2200000, 3200000, 0, 12, 1),
(11, 'Rolex Submariner Date', 'r11.jpg', 5, 1, 'Rolex', 2024, 185000000, 245000000, 0, 48, 1), -- Tồn thấp (2)
(12, 'Rolex Datejust 41', 'r12.jpg', 5, 1, 'Rolex', 2024, 165000000, 215000000, 0, 48, 1), -- Tồn thấp (3)
(13, 'Rolex Air-King', 'r13.jpg', 5, 1, 'Rolex', 2024, 145000000, 195000000, 0, 48, 1), -- Tồn thấp (4)
(14, 'Frederique Constant FC-303', 'f14.jpg', 6, 1, 'Frederique Constant', 2024, 8500000, 12500000, 0, 24, 1),
(15, 'Frederique Constant FC-200', 'f15.jpg', 6, 2, 'Frederique Constant', 2024, 9200000, 13800000, 0, 24, 1), -- Tồn thấp (5)
(16, 'Fossil Grant FS4736', 'f16.jpg', 7, 2, 'Fossil', 2024, 2500000, 3800000, 0, 12, 1),
(17, 'Fossil Neutra FS5380', 'f17.jpg', 7, 2, 'Fossil', 2024, 2200000, 3200000, 0, 12, 1),
(18, 'Fossil Hybrid Smartwatch', 'f18.jpg', 7, 4, 'Fossil', 2024, 3800000, 5500000, 0, 12, 1),
(19, 'Daniel Wellington Sheffield', 'd19.jpg', 8, 2, 'Daniel Wellington', 2024, 2800000, 4200000, 0, 24, 1),
(20, 'Daniel Wellington Petite', 'd20.jpg', 8, 2, 'Daniel Wellington', 2024, 3200000, 4800000, 0, 24, 1),
(21, 'Daniel Wellington Black', 'd21.jpg', 8, 2, 'Daniel Wellington', 2024, 2500000, 3800000, 0, 24, 1),
(22, 'Casio G-Shock GA-2100', 'c22.jpg', 1, 5, 'Casio', 2024, 2800000, 3900000, 0, 12, 1),
(23, 'Casio Edifice EFR-556', 'c23.jpg', 1, 5, 'Casio', 2024, 3200000, 4500000, 0, 12, 1),
(24, 'Tissot PRX T137', 't24.jpg', 1, 2, 'Tissot', 2024, 9500000, 13500000, 0, 24, 1),
(25, 'Hamilton Khaki Field', 'h25.jpg', 1, 1, 'Hamilton', 2024, 11500000, 16500000, 0, 24, 1), -- Tồn thấp (6)
(26, 'Casio G-Shock DW-5600', 'c26.jpg', 1, 3, 'Casio', 2024, 1800000, 2600000, 0, 12, 1),
(27, 'Casio AE-1200WH', 'c27.jpg', 1, 3, 'Casio', 2024, 550000, 890000, 0, 12, 1),
(28, 'Casio F-91W', 'c28.jpg', 1, 3, 'Casio', 2024, 200000, 350000, 0, 12, 1),
(29, 'Casio A168WG', 'c29.jpg', 1, 3, 'Casio', 2024, 650000, 950000, 0, 12, 1),
(30, 'Casio Baby-G BGD-565', 'c30.jpg', 1, 3, 'Casio', 2024, 1600000, 2100000, 0, 12, 1),
(31, 'Casio Baby-G BA-110', 'babyg_ba110.png', 1, 3, 'Casio', 2024, 2150000, 2900000, 0, 12, 1),
(32, 'Casio ProTrek PRG-270', 'protrek_prg270.png', 1, 3, 'Casio', 2024, 3800000, 5200000, 0, 12, 1),
(33, 'SKMEI 1251 Digital', 'skmei_1251.jpg', 9, 3, 'SKMEI', 2024, 150000, 250000, 0, 6, 1),
(34, 'SKMEI 1456 Digital', 'skmei_1456.jpg', 9, 3, 'SKMEI', 2024, 180000, 300000, 0, 6, 1),
(35, 'Timex Ironman Classic', 'timex_ironman30.jpg', 10, 3, 'Timex', 2024, 850000, 1350000, 0, 12, 1);

-- ------------------------------------------------------------
--  3.17 Phiếu nhập 
-- ------------------------------------------------------------
-- ============================================================
-- DỮ LIỆU PHIẾU NHẬP & PHIẾU XUẤT (2024-01 -> 2026-04-13)
-- Xóa data cũ trước khi chạy lại
-- ============================================================


-- ============================================================
-- PHIẾU NHẬP
-- ============================================================
-- INSERT INTO `PHIEUNHAP` (`MPN`, `MNV`, `MNCC`, `TIEN`, `TG`, `TT`) VALUES
-- (1, 3, 1, 33400000, '2024-01-05 08:00:00', 1),
-- (2, 3, 2, 37800000, '2024-01-18 10:00:00', 1),
-- (3, 3, 3, 74000000, '2024-02-05 08:00:00', 1),
-- (4, 3, 4, 60400000, '2024-02-16 10:00:00', 1),
-- (5, 3, 7, 52800000, '2024-03-08 08:00:00', 1),
-- (6, 3, 8, 45300000, '2024-03-20 10:00:00', 1),
-- (7, 3, 5, 990000000, '2024-04-10 08:00:00', 1),
-- (8, 3, 6, 61600000, '2024-04-22 10:00:00', 1),
-- (9, 3, 9, 3960000, '2024-05-08 08:00:00', 1),
-- (10, 3, 10, 6800000, '2024-05-20 10:00:00', 1),
-- (11, 3, 2, 59800000, '2024-06-10 08:00:00', 1),
-- (12, 3, 4, 41000000, '2024-06-22 10:00:00', 1),
-- (13, 3, 1, 52300000, '2024-07-12 08:00:00', 1),
-- (14, 3, 7, 26000000, '2024-07-24 10:00:00', 1),
-- (15, 3, 3, 44800000, '2024-08-08 08:00:00', 1),
-- (16, 3, 8, 34000000, '2024-08-20 10:00:00', 1),
-- (17, 3, 1, 28000000, '2024-09-10 08:00:00', 1),
-- (18, 3, 6, 43900000, '2024-09-22 10:00:00', 1),
-- (19, 3, 4, 46400000, '2024-10-08 08:00:00', 1),
-- (20, 3, 10, 6800000, '2024-10-20 10:00:00', 1),
-- (21, 3, 2, 47100000, '2024-11-10 08:00:00', 1),
-- (22, 3, 5, 330000000, '2024-11-22 10:00:00', 1),
-- (23, 3, 1, 30700000, '2024-12-08 08:00:00', 1),
-- (24, 3, 9, 3300000, '2024-12-20 10:00:00', 1),
-- (25, 3, 3, 53700000, '2025-01-05 08:00:00', 1),
-- (26, 3, 7, 35200000, '2025-01-18 10:00:00', 1),
-- (27, 3, 4, 63400000, '2025-02-05 08:00:00', 1),
-- (28, 3, 6, 43900000, '2025-02-16 10:00:00', 1),
-- (29, 3, 5, 310000000, '2025-03-08 08:00:00', 1),
-- (30, 3, 8, 45300000, '2025-03-20 10:00:00', 1),
-- (31, 3, 2, 42000000, '2025-04-10 08:00:00', 1),
-- (32, 3, 1, 38600000, '2025-04-22 10:00:00', 1),
-- (33, 3, 1, 50500000, '2025-05-08 08:00:00', 1),
-- (34, 3, 10, 6800000, '2025-05-20 10:00:00', 1),
-- (35, 3, 7, 37100000, '2025-06-10 08:00:00', 1),
-- (36, 3, 9, 3300000, '2025-06-22 10:00:00', 1),
-- (37, 3, 3, 49900000, '2025-07-12 08:00:00', 1),
-- (38, 3, 4, 42000000, '2025-07-24 10:00:00', 1),
-- (39, 3, 2, 51300000, '2025-08-08 08:00:00', 1),
-- (40, 3, 8, 36800000, '2025-08-20 10:00:00', 1),
-- (41, 3, 6, 43900000, '2025-09-10 08:00:00', 1),
-- (42, 3, 1, 34800000, '2025-09-22 10:00:00', 1),
-- (43, 3, 5, 350000000, '2025-10-08 08:00:00', 1),
-- (44, 3, 4, 53000000, '2025-10-20 10:00:00', 1),
-- (45, 3, 2, 54800000, '2025-11-10 08:00:00', 1),
-- (46, 3, 7, 37400000, '2025-11-22 10:00:00', 1),
-- (47, 3, 1, 43100000, '2025-12-08 08:00:00', 1),
-- (48, 3, 3, 35500000, '2025-12-20 10:00:00', 1),
-- (49, 3, 5, 495000000, '2026-01-05 08:00:00', 1),
-- (50, 3, 8, 36800000, '2026-01-18 10:00:00', 1),
-- (51, 3, 4, 59000000, '2026-02-05 08:00:00', 1),
-- (52, 3, 6, 43900000, '2026-02-16 10:00:00', 1),
-- (53, 3, 2, 34300000, '2026-03-08 08:00:00', 1),
-- (54, 3, 1, 37200000, '2026-03-20 10:00:00', 1),
-- (55, 3, 9, 2940000, '2026-04-10 08:00:00', 1),
-- (56, 3, 7, 21300000, '2026-04-13 10:00:00', 1);

-- -- ============================================================
-- -- CHI TIẾT PHIẾU NHẬP
-- -- ============================================================
-- INSERT INTO `CTPHIEUNHAP` (`MPN`, `MSP`, `SL`, `TIENNHAP`, `HINHTHUC`) VALUES
-- (1, 22, 8, 2800000, 1),
-- (1, 26, 5, 1800000, 1),
-- (1, 28, 10, 200000, 0),
-- (2, 1, 6, 3500000, 1),
-- (2, 3, 4, 4200000, 1),
-- (3, 4, 8, 3800000, 1),
-- (3, 5, 4, 5500000, 1),
-- (3, 6, 3, 7200000, 1),
-- (4, 7, 8, 4800000, 1),
-- (4, 10, 10, 2200000, 1),
-- (5, 16, 8, 2500000, 1),
-- (5, 17, 8, 2200000, 1),
-- (5, 18, 4, 3800000, 1),
-- (6, 19, 6, 2800000, 1),
-- (6, 20, 5, 3200000, 1),
-- (6, 21, 5, 2500000, 1),
-- (7, 11, 2, 185000000, 1),
-- (7, 12, 2, 165000000, 1),
-- (7, 13, 2, 145000000, 1),
-- (8, 14, 4, 8500000, 1),
-- (8, 15, 3, 9200000, 1),
-- (9, 33, 12, 150000, 0),
-- (9, 34, 12, 180000, 0),
-- (10, 35, 8, 850000, 1),
-- (11, 2, 3, 8500000, 1),
-- (11, 1, 5, 3500000, 1),
-- (11, 3, 4, 4200000, 1),
-- (12, 8, 2, 12000000, 1),
-- (12, 9, 2, 8500000, 1),
-- (13, 23, 6, 3200000, 1),
-- (13, 24, 2, 9500000, 1),
-- (13, 25, 1, 11500000, 1),
-- (13, 29, 4, 650000, 1),
-- (14, 16, 6, 2500000, 1),
-- (14, 17, 5, 2200000, 1),
-- (15, 4, 6, 3800000, 1),
-- (15, 5, 4, 5500000, 1),
-- (16, 19, 4, 2800000, 1),
-- (16, 20, 4, 3200000, 1),
-- (16, 21, 4, 2500000, 1),
-- (17, 30, 5, 1600000, 1),
-- (17, 31, 4, 2150000, 1),
-- (17, 32, 3, 3800000, 1),
-- (18, 14, 3, 8500000, 1),
-- (18, 15, 2, 9200000, 1),
-- (19, 7, 6, 4800000, 1),
-- (19, 10, 8, 2200000, 1),
-- (20, 35, 8, 850000, 1),
-- (21, 1, 5, 3500000, 1),
-- (21, 2, 2, 8500000, 1),
-- (21, 3, 3, 4200000, 1),
-- (22, 11, 1, 185000000, 1),
-- (22, 13, 1, 145000000, 1),
-- (23, 22, 6, 2800000, 1),
-- (23, 26, 5, 1800000, 1),
-- (23, 27, 6, 550000, 1),
-- (23, 28, 8, 200000, 0),
-- (24, 33, 10, 150000, 0),
-- (24, 34, 10, 180000, 0),
-- (25, 4, 6, 3800000, 1),
-- (25, 5, 3, 5500000, 1),
-- (25, 6, 2, 7200000, 1),
-- (26, 16, 8, 2500000, 1),
-- (26, 18, 4, 3800000, 1),
-- (27, 7, 6, 4800000, 1),
-- (27, 9, 2, 8500000, 1),
-- (27, 10, 8, 2200000, 1),
-- (28, 14, 3, 8500000, 1),
-- (28, 15, 2, 9200000, 1),
-- (29, 12, 1, 165000000, 1),
-- (29, 13, 1, 145000000, 1),
-- (30, 19, 6, 2800000, 1),
-- (30, 20, 5, 3200000, 1),
-- (30, 21, 5, 2500000, 1),
-- (31, 1, 6, 3500000, 1),
-- (31, 3, 5, 4200000, 1),
-- (32, 22, 6, 2800000, 1),
-- (32, 23, 4, 3200000, 1),
-- (32, 26, 5, 1800000, 1),
-- (33, 24, 2, 9500000, 1),
-- (33, 25, 1, 11500000, 1),
-- (33, 31, 4, 2150000, 1),
-- (33, 32, 3, 3800000, 1),
-- (34, 35, 8, 850000, 1),
-- (35, 17, 6, 2200000, 1),
-- (35, 16, 5, 2500000, 1),
-- (35, 18, 3, 3800000, 1),
-- (36, 33, 10, 150000, 0),
-- (36, 34, 10, 180000, 0),
-- (37, 4, 5, 3800000, 1),
-- (37, 5, 3, 5500000, 1),
-- (37, 6, 2, 7200000, 1),
-- (38, 7, 6, 4800000, 1),
-- (38, 10, 6, 2200000, 1),
-- (39, 1, 5, 3500000, 1),
-- (39, 2, 2, 8500000, 1),
-- (39, 3, 4, 4200000, 1),
-- (40, 19, 5, 2800000, 1),
-- (40, 20, 4, 3200000, 1),
-- (40, 21, 4, 2500000, 1),
-- (41, 14, 3, 8500000, 1),
-- (41, 15, 2, 9200000, 1),
-- (42, 22, 6, 2800000, 1),
-- (42, 26, 5, 1800000, 1),
-- (42, 29, 4, 650000, 1),
-- (42, 30, 4, 1600000, 1),
-- (43, 11, 1, 185000000, 1),
-- (43, 12, 1, 165000000, 1),
-- (44, 8, 1, 12000000, 1),
-- (44, 9, 2, 8500000, 1),
-- (44, 7, 5, 4800000, 1),
-- (45, 1, 6, 3500000, 1),
-- (45, 2, 2, 8500000, 1),
-- (45, 3, 4, 4200000, 1),
-- (46, 16, 6, 2500000, 1),
-- (46, 17, 5, 2200000, 1),
-- (46, 18, 3, 3800000, 1),
-- (47, 22, 6, 2800000, 1),
-- (47, 23, 4, 3200000, 1),
-- (47, 27, 6, 550000, 1),
-- (47, 28, 8, 200000, 0),
-- (47, 31, 4, 2150000, 1),
-- (48, 4, 5, 3800000, 1),
-- (48, 5, 3, 5500000, 1),
-- (49, 11, 1, 185000000, 1),
-- (49, 12, 1, 165000000, 1),
-- (49, 13, 1, 145000000, 1),
-- (50, 19, 5, 2800000, 1),
-- (50, 20, 4, 3200000, 1),
-- (50, 21, 4, 2500000, 1),
-- (51, 7, 6, 4800000, 1),
-- (51, 9, 2, 8500000, 1),
-- (51, 10, 6, 2200000, 1),
-- (52, 14, 3, 8500000, 1),
-- (52, 15, 2, 9200000, 1),
-- (53, 1, 5, 3500000, 1),
-- (53, 3, 4, 4200000, 1),
-- (54, 22, 6, 2800000, 1),
-- (54, 26, 5, 1800000, 1),
-- (54, 32, 3, 3800000, 1),
-- (55, 33, 10, 150000, 0),
-- (55, 34, 8, 180000, 0),
-- (56, 16, 5, 2500000, 1),
-- (56, 17, 4, 2200000, 1);


-- ============================================================
-- PHIẾU NHẬP
-- ============================================================
INSERT INTO `PHIEUNHAP` (`MPN`, `MNV`, `MNCC`, `TIEN`, `TG`, `TT`) VALUES
(1, 3, 2, 37800000, '2024-01-05 08:30:00', 1),
(2, 3, 1, 35200000, '2024-01-18 14:00:00', 1),
(3, 3, 3, 74000000, '2024-02-06 09:00:00', 1),
(4, 3, 4, 60400000, '2024-02-18 15:00:00', 1),
(5, 3, 7, 52800000, '2024-03-08 08:30:00', 1),
(6, 3, 8, 45300000, '2024-03-20 14:00:00', 1),
(7, 3, 5, 990000000, '2024-04-10 09:00:00', 1),
(8, 3, 6, 61600000, '2024-04-22 15:30:00', 1),
(9, 3, 9, 3960000, '2024-05-08 09:00:00', 1),
(10, 3, 10, 8500000, '2024-05-20 14:00:00', 1),
(11, 3, 2, 59800000, '2024-06-10 09:00:00', 1),
(12, 3, 4, 41000000, '2024-06-22 15:00:00', 1),
(13, 3, 1, 52300000, '2024-07-12 09:00:00', 1),
(14, 3, 7, 26000000, '2024-07-24 15:30:00', 1),
(15, 3, 3, 44800000, '2024-08-08 08:30:00', 1),
(16, 3, 8, 34000000, '2024-08-20 14:00:00', 1),
(17, 3, 1, 28000000, '2024-09-10 09:00:00', 1),
(18, 3, 6, 43900000, '2024-09-22 15:00:00', 1),
(19, 3, 4, 46400000, '2024-10-08 09:00:00', 1),
(20, 3, 10, 6800000, '2024-10-20 14:00:00', 1),
(21, 3, 2, 67500000, '2024-11-10 09:00:00', 1),
(22, 3, 1, 30700000, '2024-12-08 09:00:00', 1),
(23, 3, 9, 3300000, '2024-12-20 15:00:00', 1),
(24, 3, 3, 53700000, '2025-01-05 09:00:00', 1),
(25, 3, 7, 35200000, '2025-01-18 15:00:00', 1),
(26, 3, 4, 63400000, '2025-02-05 08:30:00', 1),
(27, 3, 6, 43900000, '2025-02-16 15:30:00', 1),
(28, 3, 8, 45300000, '2025-03-08 09:00:00', 1),
(29, 3, 5, 990000000, '2025-03-20 14:00:00', 1),
(30, 3, 2, 42000000, '2025-04-10 08:30:00', 1),
(31, 3, 1, 38600000, '2025-04-22 14:00:00', 1),
(32, 3, 1, 50500000, '2025-05-08 09:00:00', 1),
(33, 3, 10, 6800000, '2025-05-20 15:00:00', 1),
(34, 3, 7, 37100000, '2025-06-10 09:00:00', 1),
(35, 3, 9, 3300000, '2025-06-22 15:00:00', 1),
(36, 3, 3, 49900000, '2025-07-12 08:30:00', 1),
(37, 3, 4, 42000000, '2025-07-24 14:00:00', 1),
(38, 3, 2, 51300000, '2025-08-08 09:00:00', 1),
(39, 3, 8, 36800000, '2025-08-20 15:30:00', 1),
(40, 3, 6, 43900000, '2025-09-10 09:00:00', 1),
(41, 3, 1, 34800000, '2025-09-22 15:00:00', 1),
(42, 3, 4, 71000000, '2025-10-10 09:00:00', 1),
(43, 3, 2, 54800000, '2025-11-10 09:00:00', 1),
(44, 3, 7, 37400000, '2025-11-22 15:00:00', 1),
(45, 3, 1, 43100000, '2025-12-08 09:00:00', 1),
(46, 3, 3, 35500000, '2025-12-20 15:00:00', 1),
(47, 3, 5, 495000000, '2026-01-10 09:00:00', 1),
(48, 3, 8, 36800000, '2026-01-22 15:00:00', 1),
(49, 3, 4, 59000000, '2026-02-08 09:00:00', 1),
(50, 3, 6, 43900000, '2026-02-20 15:00:00', 1),
(51, 3, 2, 34300000, '2026-03-08 09:00:00', 1),
(52, 3, 1, 37200000, '2026-03-20 15:00:00', 1),
(53, 3, 9, 2940000, '2026-04-05 09:00:00', 1),
(54, 3, 7, 21300000, '2026-04-10 15:00:00', 1);

-- ============================================================
-- CHI TIẾT PHIẾU NHẬP
-- ============================================================
INSERT INTO `CTPHIEUNHAP` (`MPN`, `MSP`, `SL`, `TIENNHAP`, `HINHTHUC`) VALUES
(1, 1, 6, 3500000, 1),
(1, 3, 4, 4200000, 1),
(2, 22, 8, 2800000, 1),
(2, 26, 6, 1800000, 1),
(2, 28, 10, 200000, 0),
(3, 4, 8, 3800000, 1),
(3, 5, 4, 5500000, 1),
(3, 6, 3, 7200000, 1),
(4, 7, 8, 4800000, 1),
(4, 10, 10, 2200000, 1),
(5, 16, 8, 2500000, 1),
(5, 17, 8, 2200000, 1),
(5, 18, 4, 3800000, 1),
(6, 19, 6, 2800000, 1),
(6, 20, 5, 3200000, 1),
(6, 21, 5, 2500000, 1),
(7, 11, 2, 185000000, 1),
(7, 12, 2, 165000000, 1),
(7, 13, 2, 145000000, 1),
(8, 14, 4, 8500000, 1),
(8, 15, 3, 9200000, 1),
(9, 33, 12, 150000, 0),
(9, 34, 12, 180000, 0),
(10, 35, 10, 850000, 1),
(11, 2, 3, 8500000, 1),
(11, 1, 5, 3500000, 1),
(11, 3, 4, 4200000, 1),
(12, 8, 2, 12000000, 1),
(12, 9, 2, 8500000, 1),
(13, 23, 6, 3200000, 1),
(13, 24, 2, 9500000, 1),
(13, 25, 1, 11500000, 1),
(13, 29, 4, 650000, 1),
(14, 16, 6, 2500000, 1),
(14, 17, 5, 2200000, 1),
(15, 4, 6, 3800000, 1),
(15, 5, 4, 5500000, 1),
(16, 19, 4, 2800000, 1),
(16, 20, 4, 3200000, 1),
(16, 21, 4, 2500000, 1),
(17, 30, 5, 1600000, 1),
(17, 31, 4, 2150000, 1),
(17, 32, 3, 3800000, 1),
(18, 14, 3, 8500000, 1),
(18, 15, 2, 9200000, 1),
(19, 7, 6, 4800000, 1),
(19, 10, 8, 2200000, 1),
(20, 35, 8, 850000, 1),
(21, 1, 6, 3500000, 1),
(21, 2, 3, 8500000, 1),
(21, 3, 5, 4200000, 1),
(22, 22, 6, 2800000, 1),
(22, 26, 5, 1800000, 1),
(22, 27, 6, 550000, 1),
(22, 28, 8, 200000, 0),
(23, 33, 10, 150000, 0),
(23, 34, 10, 180000, 0),
(24, 4, 6, 3800000, 1),
(24, 5, 3, 5500000, 1),
(24, 6, 2, 7200000, 1),
(25, 16, 8, 2500000, 1),
(25, 18, 4, 3800000, 1),
(26, 7, 6, 4800000, 1),
(26, 9, 2, 8500000, 1),
(26, 10, 8, 2200000, 1),
(27, 14, 3, 8500000, 1),
(27, 15, 2, 9200000, 1),
(28, 19, 6, 2800000, 1),
(28, 20, 5, 3200000, 1),
(28, 21, 5, 2500000, 1),
(29, 11, 2, 185000000, 1),
(29, 12, 2, 165000000, 1),
(29, 13, 2, 145000000, 1),
(30, 1, 6, 3500000, 1),
(30, 3, 5, 4200000, 1),
(31, 22, 6, 2800000, 1),
(31, 23, 4, 3200000, 1),
(31, 26, 5, 1800000, 1),
(32, 24, 2, 9500000, 1),
(32, 25, 1, 11500000, 1),
(32, 31, 4, 2150000, 1),
(32, 32, 3, 3800000, 1),
(33, 35, 8, 850000, 1),
(34, 16, 5, 2500000, 1),
(34, 17, 6, 2200000, 1),
(34, 18, 3, 3800000, 1),
(35, 33, 10, 150000, 0),
(35, 34, 10, 180000, 0),
(36, 4, 5, 3800000, 1),
(36, 5, 3, 5500000, 1),
(36, 6, 2, 7200000, 1),
(37, 7, 6, 4800000, 1),
(37, 10, 6, 2200000, 1),
(38, 1, 5, 3500000, 1),
(38, 2, 2, 8500000, 1),
(38, 3, 4, 4200000, 1),
(39, 19, 5, 2800000, 1),
(39, 20, 4, 3200000, 1),
(39, 21, 4, 2500000, 1),
(40, 14, 3, 8500000, 1),
(40, 15, 2, 9200000, 1),
(41, 22, 6, 2800000, 1),
(41, 26, 5, 1800000, 1),
(41, 29, 4, 650000, 1),
(41, 30, 4, 1600000, 1),
(42, 7, 6, 4800000, 1),
(42, 8, 1, 12000000, 1),
(42, 9, 2, 8500000, 1),
(42, 10, 6, 2200000, 1),
(43, 1, 6, 3500000, 1),
(43, 2, 2, 8500000, 1),
(43, 3, 4, 4200000, 1),
(44, 16, 6, 2500000, 1),
(44, 17, 5, 2200000, 1),
(44, 18, 3, 3800000, 1),
(45, 22, 6, 2800000, 1),
(45, 23, 4, 3200000, 1),
(45, 27, 6, 550000, 1),
(45, 28, 8, 200000, 0),
(45, 31, 4, 2150000, 1),
(46, 4, 5, 3800000, 1),
(46, 5, 3, 5500000, 1),
(47, 11, 1, 185000000, 1),
(47, 12, 1, 165000000, 1),
(47, 13, 1, 145000000, 1),
(48, 19, 5, 2800000, 1),
(48, 20, 4, 3200000, 1),
(48, 21, 4, 2500000, 1),
(49, 7, 6, 4800000, 1),
(49, 9, 2, 8500000, 1),
(49, 10, 6, 2200000, 1),
(50, 14, 3, 8500000, 1),
(50, 15, 2, 9200000, 1),
(51, 1, 5, 3500000, 1),
(51, 3, 4, 4200000, 1),
(52, 22, 6, 2800000, 1),
(52, 26, 5, 1800000, 1),
(52, 32, 3, 3800000, 1),
(53, 33, 10, 150000, 0),
(53, 34, 8, 180000, 0),
(54, 16, 5, 2500000, 1),
(54, 17, 4, 2200000, 1);

-- ------------------------------------------------------------
--  3.19 Mã khuyến mãi mẫu
-- ------------------------------------------------------------
INSERT INTO `MAKHUYENMAI` (`MKM`, `TGBD`, `TGKT`, `TT`) VALUES 
	('SUMMER2025', '2025-06-01', '2025-06-30', 1),
    ('CASIO10', '2025-05-01', '2025-05-31', 0),
    ('SALE8_3', '2025-03-08', '2025-03-08', 0);

-- ------------------------------------------------------------
--  3.20 Mã khuyến mãi mẫu
-- ------------------------------------------------------------
INSERT INTO `CTMAKHUYENMAI` (`MKM`, `MSP`, `PTG`) VALUES 
	('SUMMER2025', 7, 10),
    ('SUMMER2025', 10, 10),
    ('SUMMER2025', 22, 15),
    ('CASIO10', 26, 10),
    ('CASIO10', 27, 10),
    ('CASIO10', 28, 10),
    ('SALE8_3', 19, 8),
    ('SALE8_3', 20, 8),
    ('SALE8_3', 21, 8);
    
-- ------------------------------------------------------------
--  3.21 Ngày lễ
-- ------------------------------------------------------------
INSERT INTO `NGAYLE` (`TENLE`, `NGAY`, `HESO_LUONG`) VALUES 
	('Tết Dương Lịch', '2026-01-01', 3.0),
    ('Giỗ tổ Hùng Vương', '2026-04-25', 2.0),
    ('Giải phóng miền Nam', '2026-04-30', 3.0),
    ('Quốc tế lao động', '2026-05-01', 3.0);
    
-- ------------------------------------------------------------
--  3.22 PHIEUXUAT (1 - 85)


-- ============================================================
-- PHIẾU XUẤT
-- ============================================================
-- INSERT INTO `PHIEUXUAT` (`MPX`, `MNV`, `MKH`, `TIEN`, `TG`, `TT`) VALUES
-- (1, 2, 1, 8850000, '2024-01-08 09:00:00', 1),
-- (2, 5, 2, 10300000, '2024-01-15 11:00:00', 1),
-- (3, 6, 3, 5200000, '2024-01-22 13:00:00', 1),
-- (4, 2, 4, 23400000, '2024-02-07 09:00:00', 1),
-- (5, 5, 5, 17100000, '2024-02-14 11:00:00', 1),
-- (6, 6, 6, 9800000, '2024-02-20 13:00:00', 1),
-- (7, 2, 7, 19800000, '2024-03-05 09:00:00', 1),
-- (8, 5, 8, 19200000, '2024-03-12 11:00:00', 1),
-- (9, 6, 9, 18600000, '2024-03-20 13:00:00', 1),
-- (10, 7, 10, 10800000, '2024-03-28 15:00:00', 1),
-- (11, 2, 11, 245000000, '2024-04-08 09:00:00', 1),
-- (12, 5, 12, 26300000, '2024-04-15 11:00:00', 1),
-- (13, 6, 13, 215000000, '2024-04-22 13:00:00', 1),
-- (14, 2, 14, 2450000, '2024-05-06 09:00:00', 1),
-- (15, 5, 15, 2700000, '2024-05-14 11:00:00', 1),
-- (16, 6, 16, 3250000, '2024-05-22 13:00:00', 1),
-- (17, 2, 17, 20500000, '2024-06-05 09:00:00', 1),
-- (18, 5, 18, 28100000, '2024-06-12 11:00:00', 1),
-- (19, 6, 19, 11200000, '2024-06-20 13:00:00', 1),
-- (20, 2, 1, 16800000, '2024-07-07 09:00:00', 1),
-- (21, 5, 2, 14000000, '2024-07-15 11:00:00', 1),
-- (22, 6, 3, 30000000, '2024-07-22 13:00:00', 1),
-- (23, 2, 4, 18800000, '2024-08-05 09:00:00', 1),
-- (24, 5, 5, 17100000, '2024-08-14 11:00:00', 1),
-- (25, 6, 6, 7600000, '2024-08-22 13:00:00', 1),
-- (26, 2, 7, 7100000, '2024-09-06 09:00:00', 1),
-- (27, 5, 8, 38800000, '2024-09-15 11:00:00', 1),
-- (28, 6, 9, 5200000, '2024-09-22 13:00:00', 1),
-- (29, 2, 10, 22600000, '2024-10-08 09:00:00', 1),
-- (30, 5, 11, 2700000, '2024-10-16 11:00:00', 1),
-- (31, 6, 12, 12900000, '2024-10-24 13:00:00', 1),
-- (32, 2, 13, 20600000, '2024-11-06 09:00:00', 1),
-- (33, 5, 14, 256500000, '2024-11-14 11:00:00', 1),
-- (34, 6, 15, 195000000, '2024-11-22 13:00:00', 1),
-- (35, 2, 16, 19570000, '2024-12-05 09:00:00', 1),
-- (36, 5, 17, 2400000, '2024-12-12 11:00:00', 1),
-- (37, 6, 18, 2980000, '2024-12-20 13:00:00', 1),
-- (38, 7, 19, 8500000, '2024-12-26 15:00:00', 1),
-- (39, 2, 1, 18000000, '2025-01-08 09:00:00', 1),
-- (40, 5, 2, 13000000, '2025-01-15 11:00:00', 1),
-- (41, 6, 3, 17400000, '2025-01-22 13:00:00', 1),
-- (42, 2, 4, 22600000, '2025-02-07 09:00:00', 1),
-- (43, 5, 5, 23700000, '2025-02-14 11:00:00', 1),
-- (44, 6, 6, 20200000, '2025-02-20 13:00:00', 1),
-- (45, 2, 7, 223400000, '2025-03-05 09:00:00', 1),
-- (46, 5, 8, 17200000, '2025-03-12 11:00:00', 1),
-- (47, 6, 9, 203400000, '2025-03-20 13:00:00', 1),
-- (48, 2, 10, 16800000, '2025-04-08 09:00:00', 1),
-- (49, 5, 11, 20600000, '2025-04-15 11:00:00', 1),
-- (50, 6, 12, 9700000, '2025-04-22 13:00:00', 1),
-- (51, 2, 13, 30000000, '2025-05-06 09:00:00', 1),
-- (52, 5, 14, 8500000, '2025-05-14 11:00:00', 1),
-- (53, 6, 15, 6550000, '2025-05-22 13:00:00', 1),
-- (54, 2, 16, 21000000, '2025-06-05 09:00:00', 1),
-- (55, 5, 17, 6750000, '2025-06-12 11:00:00', 1),
-- (56, 6, 18, 9100000, '2025-06-20 13:00:00', 1),
-- (57, 2, 19, 23400000, '2025-07-07 09:00:00', 1),
-- (58, 5, 1, 13900000, '2025-07-15 11:00:00', 1),
-- (59, 6, 2, 16300000, '2025-07-22 13:00:00', 1),
-- (60, 2, 3, 17400000, '2025-08-05 09:00:00', 1),
-- (61, 5, 4, 21100000, '2025-08-14 11:00:00', 1),
-- (62, 6, 5, 19200000, '2025-08-22 13:00:00', 1),
-- (63, 2, 6, 24200000, '2025-09-06 09:00:00', 1),
-- (64, 5, 7, 19000000, '2025-09-15 11:00:00', 1),
-- (65, 6, 8, 6100000, '2025-09-22 13:00:00', 1),
-- (66, 2, 9, 258000000, '2025-10-08 09:00:00', 1),
-- (67, 5, 10, 27700000, '2025-10-16 11:00:00', 1),
-- (68, 6, 11, 221500000, '2025-10-24 13:00:00', 1),
-- (69, 2, 12, 16600000, '2025-11-06 09:00:00', 1),
-- (70, 5, 13, 17900000, '2025-11-14 11:00:00', 1),
-- (71, 6, 14, 17100000, '2025-11-22 13:00:00', 1),
-- (72, 2, 15, 23370000, '2025-12-05 09:00:00', 1),
-- (73, 5, 16, 11800000, '2025-12-12 11:00:00', 1),
-- (74, 6, 17, 20800000, '2025-12-20 13:00:00', 1),
-- (75, 7, 18, 8500000, '2025-12-26 15:00:00', 1),
-- (76, 2, 19, 253400000, '2026-01-08 09:00:00', 1),
-- (77, 5, 1, 224600000, '2026-01-15 11:00:00', 1),
-- (78, 6, 2, 202600000, '2026-01-22 13:00:00', 1),
-- (79, 2, 3, 25500000, '2026-02-07 09:00:00', 1),
-- (80, 5, 4, 25000000, '2026-02-14 11:00:00', 1),
-- (81, 6, 5, 16100000, '2026-02-20 13:00:00', 1),
-- (82, 2, 6, 16800000, '2026-03-05 09:00:00', 1),
-- (83, 5, 7, 16800000, '2026-03-12 11:00:00', 1),
-- (84, 6, 8, 9700000, '2026-03-20 13:00:00', 1),
-- (85, 2, 9, 2450000, '2026-04-08 09:00:00', 1),
-- (86, 5, 10, 14000000, '2026-04-12 11:00:00', 1);

-- -- ============================================================
-- -- CHI TIẾT PHIẾU XUẤT
-- -- ============================================================
-- INSERT INTO `CTPHIEUXUAT` (`MPX`, `MSP`, `MKM`, `SL`, `TIENXUAT`) VALUES
-- (1, 22, NULL, 2, 3900000),
-- (1, 28, NULL, 3, 350000),
-- (2, 1, NULL, 1, 4500000),
-- (2, 3, NULL, 1, 5800000),
-- (3, 26, NULL, 2, 2600000),
-- (4, 4, NULL, 2, 5200000),
-- (4, 7, NULL, 2, 6500000),
-- (5, 5, NULL, 1, 7500000),
-- (5, 10, NULL, 3, 3200000),
-- (6, 6, NULL, 1, 9800000),
-- (7, 16, NULL, 3, 3800000),
-- (7, 19, NULL, 2, 4200000),
-- (8, 17, NULL, 3, 3200000),
-- (8, 20, NULL, 2, 4800000),
-- (9, 18, NULL, 2, 5500000),
-- (9, 21, NULL, 2, 3800000),
-- (10, 16, NULL, 2, 3800000),
-- (10, 17, NULL, 1, 3200000),
-- (11, 11, NULL, 1, 245000000),
-- (12, 14, NULL, 1, 12500000),
-- (12, 15, NULL, 1, 13800000),
-- (13, 12, NULL, 1, 215000000),
-- (14, 33, NULL, 5, 250000),
-- (14, 34, NULL, 4, 300000),
-- (15, 35, NULL, 2, 1350000),
-- (16, 33, NULL, 4, 250000),
-- (16, 34, NULL, 3, 300000),
-- (16, 35, NULL, 1, 1350000),
-- (17, 1, NULL, 2, 4500000),
-- (17, 2, NULL, 1, 11500000),
-- (18, 3, NULL, 2, 5800000),
-- (18, 8, NULL, 1, 16500000),
-- (19, 9, NULL, 1, 11200000),
-- (20, 22, NULL, 2, 3900000),
-- (20, 23, NULL, 2, 4500000),
-- (21, 16, NULL, 2, 3800000),
-- (21, 17, NULL, 2, 3200000),
-- (22, 24, NULL, 1, 13500000),
-- (22, 25, NULL, 1, 16500000),
-- (23, 4, NULL, 2, 5200000),
-- (23, 19, NULL, 2, 4200000),
-- (24, 5, NULL, 1, 7500000),
-- (24, 20, NULL, 2, 4800000),
-- (25, 21, NULL, 2, 3800000),
-- (26, 30, NULL, 2, 2100000),
-- (26, 31, NULL, 1, 2900000),
-- (27, 14, NULL, 2, 12500000),
-- (27, 15, NULL, 1, 13800000),
-- (28, 32, NULL, 1, 5200000),
-- (29, 7, NULL, 2, 6500000),
-- (29, 10, NULL, 3, 3200000),
-- (30, 35, NULL, 2, 1350000),
-- (31, 7, NULL, 1, 6500000),
-- (31, 10, NULL, 2, 3200000),
-- (32, 1, NULL, 2, 4500000),
-- (32, 3, NULL, 2, 5800000),
-- (33, 2, NULL, 1, 11500000),
-- (33, 11, NULL, 1, 245000000),
-- (34, 13, NULL, 1, 195000000),
-- (35, 22, NULL, 3, 3900000),
-- (35, 26, NULL, 2, 2600000),
-- (35, 27, NULL, 3, 890000),
-- (36, 28, NULL, 4, 350000),
-- (36, 33, NULL, 4, 250000),
-- (37, 34, NULL, 4, 300000),
-- (37, 27, NULL, 2, 890000),
-- (38, 22, NULL, 2, 3900000),
-- (38, 28, NULL, 2, 350000),
-- (39, 4, NULL, 2, 5200000),
-- (39, 16, NULL, 2, 3800000),
-- (40, 5, NULL, 1, 7500000),
-- (40, 18, NULL, 1, 5500000),
-- (41, 6, NULL, 1, 9800000),
-- (41, 16, NULL, 2, 3800000),
-- (42, 7, NULL, 2, 6500000),
-- (42, 10, NULL, 3, 3200000),
-- (43, 9, NULL, 1, 11200000),
-- (43, 14, NULL, 1, 12500000),
-- (44, 15, NULL, 1, 13800000),
-- (44, 10, NULL, 2, 3200000),
-- (45, 12, NULL, 1, 215000000),
-- (45, 19, NULL, 2, 4200000),
-- (46, 20, NULL, 2, 4800000),
-- (46, 21, NULL, 2, 3800000),
-- (47, 19, NULL, 2, 4200000),
-- (47, 13, NULL, 1, 195000000),
-- (48, 1, NULL, 2, 4500000),
-- (48, 22, NULL, 2, 3900000),
-- (49, 3, NULL, 2, 5800000),
-- (49, 23, NULL, 2, 4500000),
-- (50, 26, NULL, 2, 2600000),
-- (50, 1, NULL, 1, 4500000),
-- (51, 24, NULL, 1, 13500000),
-- (51, 25, NULL, 1, 16500000),
-- (52, 31, NULL, 2, 2900000),
-- (52, 35, NULL, 2, 1350000),
-- (53, 32, NULL, 1, 5200000),
-- (53, 35, NULL, 1, 1350000),
-- (54, 16, NULL, 3, 3800000),
-- (54, 17, NULL, 3, 3200000),
-- (55, 18, NULL, 1, 5500000),
-- (55, 33, NULL, 5, 250000),
-- (56, 34, NULL, 5, 300000),
-- (56, 16, NULL, 2, 3800000),
-- (57, 4, NULL, 2, 5200000),
-- (57, 7, NULL, 2, 6500000),
-- (58, 5, NULL, 1, 7500000),
-- (58, 10, NULL, 2, 3200000),
-- (59, 6, NULL, 1, 9800000),
-- (59, 7, NULL, 1, 6500000),
-- (60, 1, NULL, 2, 4500000),
-- (60, 19, NULL, 2, 4200000),
-- (61, 2, NULL, 1, 11500000),
-- (61, 20, NULL, 2, 4800000),
-- (62, 3, NULL, 2, 5800000),
-- (62, 21, NULL, 2, 3800000),
-- (63, 22, NULL, 3, 3900000),
-- (63, 14, NULL, 1, 12500000),
-- (64, 15, NULL, 1, 13800000),
-- (64, 26, NULL, 2, 2600000),
-- (65, 29, NULL, 2, 950000),
-- (65, 30, NULL, 2, 2100000),
-- (66, 11, NULL, 1, 245000000),
-- (66, 7, NULL, 2, 6500000),
-- (67, 8, NULL, 1, 16500000),
-- (67, 9, NULL, 1, 11200000),
-- (68, 12, NULL, 1, 215000000),
-- (68, 7, NULL, 1, 6500000),
-- (69, 1, NULL, 2, 4500000),
-- (69, 16, NULL, 2, 3800000),
-- (70, 2, NULL, 1, 11500000),
-- (70, 17, NULL, 2, 3200000),
-- (71, 3, NULL, 2, 5800000),
-- (71, 18, NULL, 1, 5500000),
-- (72, 22, NULL, 3, 3900000),
-- (72, 23, NULL, 2, 4500000),
-- (72, 27, NULL, 3, 890000),
-- (73, 28, NULL, 4, 350000),
-- (73, 4, NULL, 2, 5200000),
-- (74, 5, NULL, 2, 7500000),
-- (74, 31, NULL, 2, 2900000),
-- (75, 22, NULL, 2, 3900000),
-- (75, 28, NULL, 2, 350000),
-- (76, 11, NULL, 1, 245000000),
-- (76, 19, NULL, 2, 4200000),
-- (77, 12, NULL, 1, 215000000),
-- (77, 20, NULL, 2, 4800000),
-- (78, 13, NULL, 1, 195000000),
-- (78, 21, NULL, 2, 3800000),
-- (79, 7, NULL, 2, 6500000),
-- (79, 14, NULL, 1, 12500000),
-- (80, 9, NULL, 1, 11200000),
-- (80, 15, NULL, 1, 13800000),
-- (81, 10, NULL, 3, 3200000),
-- (81, 7, NULL, 1, 6500000),
-- (82, 1, NULL, 2, 4500000),
-- (82, 22, NULL, 2, 3900000),
-- (83, 3, NULL, 2, 5800000),
-- (83, 26, NULL, 2, 2600000),
-- (84, 32, NULL, 1, 5200000),
-- (84, 1, NULL, 1, 4500000),
-- (85, 33, NULL, 5, 250000),
-- (85, 34, NULL, 4, 300000),
-- (86, 16, NULL, 2, 3800000),
-- (86, 17, NULL, 2, 3200000);

-- -- ============================================================
-- -- TỒN KHO SAU KHI CHẠY DỮ LIỆU (tính từ trigger tự động)
-- -- ============================================================
-- -- MSP  1:  23 cái
-- -- MSP  2:   5 cái
-- -- MSP  3:  15 cái
-- -- MSP  4:  20 cái
-- -- MSP  5:  11 cái
-- -- MSP  6:   4 cái
-- -- MSP  7:  21 cái
-- -- MSP  8:   1 cái
-- -- MSP  9:   4 cái
-- -- MSP 10:  20 cái
-- -- MSP 11:   1 cái
-- -- MSP 12:   1 cái
-- -- MSP 13:   2 cái
-- -- MSP 14:  10 cái
-- -- MSP 15:   6 cái
-- -- MSP 16:  18 cái
-- -- MSP 17:  15 cái
-- -- MSP 18:   9 cái
-- -- MSP 19:  14 cái
-- -- MSP 20:  12 cái
-- -- MSP 21:  12 cái
-- -- MSP 22:  17 cái
-- -- MSP 23:   8 cái
-- -- MSP 24:   2 cái
-- -- MSP 26:  15 cái
-- -- MSP 27:   4 cái
-- -- MSP 28:  11 cái
-- -- MSP 29:   6 cái
-- -- MSP 30:   5 cái
-- -- MSP 31:   7 cái
-- -- MSP 32:   6 cái
-- -- MSP 33:  19 cái
-- -- MSP 34:  20 cái
-- -- MSP 35:  16 cái
-- ============================================================
-- DỮ LIỆU PHIẾU NHẬP & PHIẾU XUẤT (2024-01 → 2026-04-13)
-- Giờ hoạt động: 08:00 – 22:00
-- Doanh thu cân bằng; tháng có Rolex ~220-270tr, còn lại 25-90tr
-- ============================================================


-- ============================================================
-- PHIẾU XUẤT
-- ============================================================
INSERT INTO `PHIEUXUAT` (`MPX`, `MNV`, `MKH`, `TIEN`, `TG`, `TT`) VALUES
(1, 2, 1, 13350000, '2024-01-08 09:30:00', 1),
(2, 5, 2, 15500000, '2024-01-15 14:15:00', 1),
(3, 6, 3, 14900000, '2024-01-22 17:30:00', 1),
(4, 7, 4, 9100000, '2024-01-28 20:00:00', 1),
(5, 2, 5, 29800000, '2024-02-07 10:30:00', 1),
(6, 5, 6, 17300000, '2024-02-14 14:15:00', 1),
(7, 6, 7, 21300000, '2024-02-21 17:00:00', 1),
(8, 7, 8, 12700000, '2024-02-25 20:30:00', 1),
(9, 2, 9, 25600000, '2024-03-05 10:30:00', 1),
(10, 5, 10, 19500000, '2024-03-12 14:15:00', 1),
(11, 6, 11, 16000000, '2024-03-20 17:00:00', 1),
(12, 7, 12, 11800000, '2024-03-28 20:00:00', 1),
(13, 2, 13, 245000000, '2024-04-08 11:00:00', 1),
(14, 5, 14, 38800000, '2024-04-15 14:15:00', 1),
(15, 6, 15, 26300000, '2024-04-22 17:30:00', 1),
(16, 7, 16, 13800000, '2024-04-29 20:00:00', 1),
(17, 2, 17, 5150000, '2024-05-06 10:30:00', 1),
(18, 5, 18, 4900000, '2024-05-14 14:15:00', 1),
(19, 6, 19, 4350000, '2024-05-22 17:30:00', 1),
(20, 2, 1, 215000000, '2024-06-05 10:30:00', 1),
(21, 5, 2, 32200000, '2024-06-12 14:15:00', 1),
(22, 6, 3, 23100000, '2024-06-20 17:00:00', 1),
(23, 7, 4, 20200000, '2024-06-27 20:30:00', 1),
(24, 2, 5, 30000000, '2024-07-07 10:30:00', 1),
(25, 5, 6, 16600000, '2024-07-15 14:15:00', 1),
(26, 6, 7, 8300000, '2024-07-22 17:00:00', 1),
(27, 7, 8, 18000000, '2024-07-29 20:00:00', 1),
(28, 2, 9, 195000000, '2024-08-05 11:00:00', 1),
(29, 5, 10, 25500000, '2024-08-14 14:15:00', 1),
(30, 6, 11, 18000000, '2024-08-22 17:00:00', 1),
(31, 7, 12, 14200000, '2024-08-28 20:30:00', 1),
(32, 2, 13, 30200000, '2024-09-06 10:30:00', 1),
(33, 5, 14, 19600000, '2024-09-15 14:15:00', 1),
(34, 6, 15, 16700000, '2024-09-22 17:30:00', 1),
(35, 7, 16, 10200000, '2024-09-29 20:00:00', 1),
(36, 2, 17, 15700000, '2024-10-08 10:30:00', 1),
(37, 5, 18, 17450000, '2024-10-16 14:15:00', 1),
(38, 6, 19, 22100000, '2024-10-24 17:00:00', 1),
(39, 7, 1, 7750000, '2024-10-30 20:30:00', 1),
(40, 2, 2, 20500000, '2024-11-06 10:30:00', 1),
(41, 5, 3, 16100000, '2024-11-14 14:15:00', 1),
(42, 6, 4, 23100000, '2024-11-22 17:00:00', 1),
(43, 7, 5, 14800000, '2024-11-28 20:00:00', 1),
(44, 2, 6, 18680000, '2024-12-05 10:30:00', 1),
(45, 5, 7, 9950000, '2024-12-12 14:15:00', 1),
(46, 6, 8, 8180000, '2024-12-20 17:30:00', 1),
(47, 7, 9, 9400000, '2024-12-26 20:30:00', 1),
(48, 2, 10, 23500000, '2025-01-08 10:30:00', 1),
(49, 5, 11, 17300000, '2025-01-15 14:15:00', 1),
(50, 6, 12, 12800000, '2025-01-22 17:00:00', 1),
(51, 7, 13, 18200000, '2025-01-28 20:00:00', 1),
(52, 2, 14, 25500000, '2025-02-07 10:30:00', 1),
(53, 5, 15, 34600000, '2025-02-14 14:15:00', 1),
(54, 6, 16, 19000000, '2025-02-21 17:00:00', 1),
(55, 7, 17, 20200000, '2025-02-25 20:30:00', 1),
(56, 2, 18, 245000000, '2025-03-05 11:00:00', 1),
(57, 5, 19, 25600000, '2025-03-12 14:15:00', 1),
(58, 6, 1, 13200000, '2025-03-20 17:30:00', 1),
(59, 7, 2, 8000000, '2025-03-28 20:30:00', 1),
(60, 2, 3, 16800000, '2025-04-08 10:30:00', 1),
(61, 5, 4, 20600000, '2025-04-15 14:15:00', 1),
(62, 6, 5, 15500000, '2025-04-22 17:00:00', 1),
(63, 7, 6, 11000000, '2025-04-29 20:00:00', 1),
(64, 2, 7, 215000000, '2025-05-06 11:00:00', 1),
(65, 5, 8, 30000000, '2025-05-14 14:15:00', 1),
(66, 6, 9, 13700000, '2025-05-22 17:30:00', 1),
(67, 7, 10, 16200000, '2025-05-30 20:00:00', 1),
(68, 2, 11, 14000000, '2025-06-05 09:15:00', 1),
(69, 5, 12, 7400000, '2025-06-12 13:30:00', 1),
(70, 6, 13, 15200000, '2025-06-20 17:00:00', 1),
(71, 7, 14, 7400000, '2025-06-27 20:30:00', 1),
(72, 2, 15, 195000000, '2025-07-07 11:00:00', 1),
(73, 5, 16, 23400000, '2025-07-15 14:15:00', 1),
(74, 6, 17, 23700000, '2025-07-22 17:00:00', 1),
(75, 7, 18, 18100000, '2025-07-29 20:00:00', 1),
(76, 2, 19, 17400000, '2025-08-05 09:15:00', 1),
(77, 5, 1, 21100000, '2025-08-14 14:15:00', 1),
(78, 6, 2, 19200000, '2025-08-22 17:00:00', 1),
(79, 7, 3, 13500000, '2025-08-28 20:30:00', 1),
(80, 2, 4, 32800000, '2025-09-06 10:30:00', 1),
(81, 5, 5, 19000000, '2025-09-15 14:15:00', 1),
(82, 6, 6, 10000000, '2025-09-22 17:00:00', 1),
(83, 7, 7, 20300000, '2025-09-29 20:30:00', 1),
(84, 2, 8, 27700000, '2025-10-08 10:30:00', 1),
(85, 5, 9, 22600000, '2025-10-16 14:15:00', 1),
(86, 6, 10, 17700000, '2025-10-24 17:00:00', 1),
(87, 7, 11, 12900000, '2025-10-30 20:30:00', 1),
(88, 2, 12, 245000000, '2025-11-06 11:00:00', 1),
(89, 5, 13, 16600000, '2025-11-14 14:15:00', 1),
(90, 6, 14, 17900000, '2025-11-22 17:00:00', 1),
(91, 7, 15, 20900000, '2025-11-28 20:00:00', 1),
(92, 2, 16, 25900000, '2025-12-05 10:30:00', 1),
(93, 5, 17, 19070000, '2025-12-12 14:15:00', 1),
(94, 6, 18, 18800000, '2025-12-20 17:30:00', 1),
(95, 7, 19, 7330000, '2025-12-26 21:00:00', 1),
(96, 2, 1, 215000000, '2026-01-08 11:00:00', 1),
(97, 5, 2, 25600000, '2026-01-15 14:15:00', 1),
(98, 6, 3, 17000000, '2026-01-22 17:00:00', 1),
(99, 7, 4, 8600000, '2026-01-28 20:30:00', 1),
(100, 2, 5, 195000000, '2026-02-07 11:00:00', 1),
(101, 5, 6, 25500000, '2026-02-14 14:15:00', 1),
(102, 6, 7, 31400000, '2026-02-21 17:00:00', 1),
(103, 7, 8, 19000000, '2026-02-25 20:30:00', 1),
(104, 2, 9, 16800000, '2026-03-05 10:30:00', 1),
(105, 5, 10, 16800000, '2026-03-12 14:15:00', 1),
(106, 6, 11, 17500000, '2026-03-20 17:00:00', 1),
(107, 7, 12, 14900000, '2026-03-28 20:30:00', 1),
(108, 2, 13, 14750000, '2026-04-06 10:30:00', 1),
(109, 5, 14, 4850000, '2026-04-11 14:15:00', 1);

-- ============================================================
-- CHI TIẾT PHIẾU XUẤT
-- ============================================================
INSERT INTO `CTPHIEUXUAT` (`MPX`, `MSP`, `MKM`, `SL`, `TIENXUAT`) VALUES
(1, 22, NULL, 2, 3900000),
(1, 1, NULL, 1, 4500000),
(1, 28, NULL, 3, 350000),
(2, 1, NULL, 1, 4500000),
(2, 3, NULL, 1, 5800000),
(2, 26, NULL, 2, 2600000),
(3, 22, NULL, 1, 3900000),
(3, 26, NULL, 2, 2600000),
(3, 3, NULL, 1, 5800000),
(4, 28, NULL, 2, 350000),
(4, 1, NULL, 1, 4500000),
(4, 22, NULL, 1, 3900000),
(5, 4, NULL, 2, 5200000),
(5, 7, NULL, 2, 6500000),
(5, 10, NULL, 2, 3200000),
(6, 5, NULL, 1, 7500000),
(6, 6, NULL, 1, 9800000),
(7, 4, NULL, 1, 5200000),
(7, 7, NULL, 1, 6500000),
(7, 10, NULL, 3, 3200000),
(8, 5, NULL, 1, 7500000),
(8, 4, NULL, 1, 5200000),
(9, 19, NULL, 2, 4200000),
(9, 20, NULL, 2, 4800000),
(9, 16, NULL, 2, 3800000),
(10, 17, NULL, 2, 3200000),
(10, 21, NULL, 2, 3800000),
(10, 18, NULL, 1, 5500000),
(11, 19, NULL, 2, 4200000),
(11, 16, NULL, 2, 3800000),
(12, 20, NULL, 1, 4800000),
(12, 21, NULL, 1, 3800000),
(12, 17, NULL, 1, 3200000),
(13, 11, NULL, 1, 245000000),
(14, 14, NULL, 2, 12500000),
(14, 15, NULL, 1, 13800000),
(15, 14, NULL, 1, 12500000),
(15, 15, NULL, 1, 13800000),
(16, 15, NULL, 1, 13800000),
(17, 33, NULL, 5, 250000),
(17, 34, NULL, 4, 300000),
(17, 35, NULL, 2, 1350000),
(18, 33, NULL, 4, 250000),
(18, 34, NULL, 4, 300000),
(18, 35, NULL, 2, 1350000),
(19, 33, NULL, 3, 250000),
(19, 34, NULL, 3, 300000),
(19, 35, NULL, 2, 1350000),
(20, 12, NULL, 1, 215000000),
(21, 8, NULL, 1, 16500000),
(21, 9, NULL, 1, 11200000),
(21, 1, NULL, 1, 4500000),
(22, 2, NULL, 1, 11500000),
(22, 3, NULL, 2, 5800000),
(23, 1, NULL, 2, 4500000),
(23, 9, NULL, 1, 11200000),
(24, 24, NULL, 1, 13500000),
(24, 25, NULL, 1, 16500000),
(25, 23, NULL, 2, 4500000),
(25, 16, NULL, 2, 3800000),
(26, 17, NULL, 2, 3200000),
(26, 29, NULL, 2, 950000),
(27, 23, NULL, 1, 4500000),
(27, 24, NULL, 1, 13500000),
(28, 13, NULL, 1, 195000000),
(29, 5, NULL, 1, 7500000),
(29, 19, NULL, 2, 4200000),
(29, 20, NULL, 2, 4800000),
(30, 4, NULL, 2, 5200000),
(30, 21, NULL, 2, 3800000),
(31, 19, NULL, 1, 4200000),
(31, 20, NULL, 1, 4800000),
(31, 4, NULL, 1, 5200000),
(32, 14, NULL, 2, 12500000),
(32, 32, NULL, 1, 5200000),
(33, 15, NULL, 1, 13800000),
(33, 31, NULL, 2, 2900000),
(34, 30, NULL, 2, 2100000),
(34, 14, NULL, 1, 12500000),
(35, 31, NULL, 1, 2900000),
(35, 30, NULL, 1, 2100000),
(35, 32, NULL, 1, 5200000),
(36, 7, NULL, 2, 6500000),
(36, 35, NULL, 2, 1350000),
(37, 10, NULL, 3, 3200000),
(37, 7, NULL, 1, 6500000),
(37, 35, NULL, 1, 1350000),
(38, 7, NULL, 2, 6500000),
(38, 10, NULL, 2, 3200000),
(38, 35, NULL, 2, 1350000),
(39, 10, NULL, 2, 3200000),
(39, 35, NULL, 1, 1350000),
(40, 2, NULL, 1, 11500000),
(40, 1, NULL, 2, 4500000),
(41, 3, NULL, 2, 5800000),
(41, 1, NULL, 1, 4500000),
(42, 2, NULL, 1, 11500000),
(42, 3, NULL, 2, 5800000),
(43, 1, NULL, 2, 4500000),
(43, 3, NULL, 1, 5800000),
(44, 22, NULL, 3, 3900000),
(44, 26, NULL, 2, 2600000),
(44, 27, NULL, 2, 890000),
(45, 22, NULL, 2, 3900000),
(45, 28, NULL, 4, 350000),
(45, 33, NULL, 3, 250000),
(46, 34, NULL, 4, 300000),
(46, 26, NULL, 2, 2600000),
(46, 27, NULL, 2, 890000),
(47, 22, NULL, 2, 3900000),
(47, 34, NULL, 3, 300000),
(47, 28, NULL, 2, 350000),
(48, 4, NULL, 2, 5200000),
(48, 16, NULL, 2, 3800000),
(48, 18, NULL, 1, 5500000),
(49, 5, NULL, 1, 7500000),
(49, 6, NULL, 1, 9800000),
(50, 4, NULL, 1, 5200000),
(50, 16, NULL, 2, 3800000),
(51, 18, NULL, 1, 5500000),
(51, 5, NULL, 1, 7500000),
(51, 4, NULL, 1, 5200000),
(52, 7, NULL, 2, 6500000),
(52, 14, NULL, 1, 12500000),
(53, 9, NULL, 1, 11200000),
(53, 10, NULL, 3, 3200000),
(53, 15, NULL, 1, 13800000),
(54, 7, NULL, 1, 6500000),
(54, 14, NULL, 1, 12500000),
(55, 10, NULL, 2, 3200000),
(55, 15, NULL, 1, 13800000),
(56, 11, NULL, 1, 245000000),
(57, 19, NULL, 2, 4200000),
(57, 20, NULL, 2, 4800000),
(57, 21, NULL, 2, 3800000),
(58, 19, NULL, 2, 4200000),
(58, 20, NULL, 1, 4800000),
(59, 21, NULL, 1, 3800000),
(59, 19, NULL, 1, 4200000),
(60, 1, NULL, 2, 4500000),
(60, 22, NULL, 2, 3900000),
(61, 3, NULL, 2, 5800000),
(61, 23, NULL, 2, 4500000),
(62, 26, NULL, 2, 2600000),
(62, 1, NULL, 1, 4500000),
(62, 3, NULL, 1, 5800000),
(63, 22, NULL, 1, 3900000),
(63, 23, NULL, 1, 4500000),
(63, 26, NULL, 1, 2600000),
(64, 12, NULL, 1, 215000000),
(65, 24, NULL, 1, 13500000),
(65, 25, NULL, 1, 16500000),
(66, 31, NULL, 2, 2900000),
(66, 32, NULL, 1, 5200000),
(66, 35, NULL, 2, 1350000),
(67, 24, NULL, 1, 13500000),
(67, 35, NULL, 2, 1350000),
(68, 16, NULL, 2, 3800000),
(68, 17, NULL, 2, 3200000),
(69, 18, NULL, 1, 5500000),
(69, 33, NULL, 4, 250000),
(69, 34, NULL, 3, 300000),
(70, 16, NULL, 2, 3800000),
(70, 17, NULL, 2, 3200000),
(70, 34, NULL, 4, 300000),
(71, 18, NULL, 1, 5500000),
(71, 33, NULL, 4, 250000),
(71, 34, NULL, 3, 300000),
(72, 13, NULL, 1, 195000000),
(73, 4, NULL, 2, 5200000),
(73, 7, NULL, 2, 6500000),
(74, 5, NULL, 1, 7500000),
(74, 6, NULL, 1, 9800000),
(74, 10, NULL, 2, 3200000),
(75, 7, NULL, 1, 6500000),
(75, 10, NULL, 2, 3200000),
(75, 4, NULL, 1, 5200000),
(76, 1, NULL, 2, 4500000),
(76, 19, NULL, 2, 4200000),
(77, 2, NULL, 1, 11500000),
(77, 20, NULL, 2, 4800000),
(78, 3, NULL, 2, 5800000),
(78, 21, NULL, 2, 3800000),
(79, 1, NULL, 1, 4500000),
(79, 19, NULL, 1, 4200000),
(79, 20, NULL, 1, 4800000),
(80, 14, NULL, 2, 12500000),
(80, 22, NULL, 2, 3900000),
(81, 15, NULL, 1, 13800000),
(81, 26, NULL, 2, 2600000),
(82, 30, NULL, 2, 2100000),
(82, 29, NULL, 2, 950000),
(82, 22, NULL, 1, 3900000),
(83, 14, NULL, 1, 12500000),
(83, 22, NULL, 2, 3900000),
(84, 8, NULL, 1, 16500000),
(84, 9, NULL, 1, 11200000),
(85, 7, NULL, 2, 6500000),
(85, 10, NULL, 3, 3200000),
(86, 9, NULL, 1, 11200000),
(86, 7, NULL, 1, 6500000),
(87, 10, NULL, 2, 3200000),
(87, 7, NULL, 1, 6500000),
(88, 11, NULL, 1, 245000000),
(89, 1, NULL, 2, 4500000),
(89, 16, NULL, 2, 3800000),
(90, 2, NULL, 1, 11500000),
(90, 17, NULL, 2, 3200000),
(91, 3, NULL, 2, 5800000),
(91, 18, NULL, 1, 5500000),
(91, 16, NULL, 1, 3800000),
(92, 22, NULL, 3, 3900000),
(92, 23, NULL, 2, 4500000),
(92, 4, NULL, 1, 5200000),
(93, 5, NULL, 2, 7500000),
(93, 27, NULL, 3, 890000),
(93, 28, NULL, 4, 350000),
(94, 4, NULL, 1, 5200000),
(94, 22, NULL, 2, 3900000),
(94, 31, NULL, 2, 2900000),
(95, 23, NULL, 1, 4500000),
(95, 28, NULL, 3, 350000),
(95, 27, NULL, 2, 890000),
(96, 12, NULL, 1, 215000000),
(97, 19, NULL, 2, 4200000),
(97, 20, NULL, 2, 4800000),
(97, 21, NULL, 2, 3800000),
(98, 19, NULL, 2, 4200000),
(98, 20, NULL, 1, 4800000),
(98, 21, NULL, 1, 3800000),
(99, 20, NULL, 1, 4800000),
(99, 21, NULL, 1, 3800000),
(100, 13, NULL, 1, 195000000),
(101, 7, NULL, 2, 6500000),
(101, 14, NULL, 1, 12500000),
(102, 9, NULL, 1, 11200000),
(102, 15, NULL, 1, 13800000),
(102, 10, NULL, 2, 3200000),
(103, 7, NULL, 1, 6500000),
(103, 14, NULL, 1, 12500000),
(104, 1, NULL, 2, 4500000),
(104, 22, NULL, 2, 3900000),
(105, 3, NULL, 2, 5800000),
(105, 26, NULL, 2, 2600000),
(106, 32, NULL, 1, 5200000),
(106, 1, NULL, 1, 4500000),
(106, 22, NULL, 2, 3900000),
(107, 3, NULL, 1, 5800000),
(107, 26, NULL, 2, 2600000),
(107, 22, NULL, 1, 3900000),
(108, 16, NULL, 2, 3800000),
(108, 17, NULL, 2, 3200000),
(108, 33, NULL, 3, 250000),
(109, 34, NULL, 3, 300000),
(109, 33, NULL, 3, 250000),
(109, 17, NULL, 1, 3200000);

-- ============================================================
-- TỒN KHO CUỐI KỲ
-- ============================================================
-- MSP  1: 17 cái |     4,500,000 đ/cái
-- MSP  2:  5 cái |    11,500,000 đ/cái
-- MSP  3: 11 cái |     5,800,000 đ/cái
-- MSP  4: 14 cái |     5,200,000 đ/cái
-- MSP  5:  9 cái |     7,500,000 đ/cái
-- MSP  6:  4 cái |     9,800,000 đ/cái
-- MSP  7: 17 cái |     6,500,000 đ/cái
-- MSP  8:  1 cái |    16,500,000 đ/cái
-- MSP  9:  2 cái |    11,200,000 đ/cái
-- MSP 10: 16 cái |     3,200,000 đ/cái
-- MSP 11:  2 cái |   245,000,000 đ/cái
-- MSP 12:  2 cái |   215,000,000 đ/cái
-- MSP 13:  2 cái |   195,000,000 đ/cái
-- MSP 14:  3 cái |    12,500,000 đ/cái
-- MSP 15:  3 cái |    13,800,000 đ/cái
-- MSP 16: 19 cái |     3,800,000 đ/cái
-- MSP 17: 14 cái |     3,200,000 đ/cái
-- MSP 18:  8 cái |     5,500,000 đ/cái
-- MSP 19:  7 cái |     4,200,000 đ/cái
-- MSP 20:  6 cái |     4,800,000 đ/cái
-- MSP 21:  8 cái |     3,800,000 đ/cái
-- MSP 22:  9 cái |     3,900,000 đ/cái
-- MSP 23:  5 cái |     4,500,000 đ/cái
-- MSP 26:  9 cái |     2,600,000 đ/cái
-- MSP 27:  3 cái |       890,000 đ/cái
-- MSP 28:  8 cái |       350,000 đ/cái
-- MSP 29:  4 cái |       950,000 đ/cái
-- MSP 30:  4 cái |     2,100,000 đ/cái
-- MSP 31:  5 cái |     2,900,000 đ/cái
-- MSP 32:  5 cái |     5,200,000 đ/cái
-- MSP 33: 13 cái |       250,000 đ/cái
-- MSP 34:  9 cái |       300,000 đ/cái
-- MSP 35: 10 cái |     1,350,000 đ/cái
COMMIT;