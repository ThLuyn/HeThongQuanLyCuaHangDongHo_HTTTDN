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
INSERT INTO `PHIEUNHAP` (`MPN`, `MNV`, `MNCC`, `TIEN`, `TG`, `TT`) VALUES 
-- Năm 2024 (Giờ nhập hàng rải rác trong ngày làm việc)
(1, 3, 1, 15000000, '2024-01-05 08:30:00', 1),  -- Anh Khuê (Casio)
(2, 3, 2, 25000000, '2024-02-10 10:15:00', 1),  -- Citizen VN
(3, 3, 3, 20000000, '2024-03-15 14:45:00', 1),  -- Orient VN
(4, 3, 4, 30000000, '2024-04-20 09:20:00', 1),  -- Seiko VN
(5, 3, 5, 495000000, '2024-05-25 11:00:00', 1), -- Rolex VN
(6, 3, 6, 45000000, '2024-06-30 15:30:00', 1),  -- FC VN
(7, 3, 7, 25000000, '2024-07-05 08:15:00', 1),  -- Fossil VN
(8, 3, 8, 20000000, '2024-08-10 13:40:00', 1),  -- DW VN
(9, 3, 9, 5000000, '2024-09-15 10:05:00', 1),   -- SKMEI
(10, 3, 10, 8000000, '2024-10-20 16:20:00', 1), -- Timex

-- Năm 2025-2026 (Nhập bổ sung)
(11, 3, 1, 10000000, '2025-01-10 09:00:00', 1),
(12, 3, 4, 15000000, '2025-06-15 14:10:00', 1),
(13, 3, 2, 12000000, '2025-11-20 10:50:00', 1),
(14, 3, 5, 330000000, '2026-01-05 11:30:00', 1),
(15, 3, 1, 5000000, '2026-03-10 15:25:00', 1),
(16, 3, 1, 75500000, '2026-04-05 09:30:00', 1);
-- Dữ liệu đã đối soát: Nhà cung cấp nào chỉ nhập sản phẩm của nhà cung cấp đó
INSERT INTO `CTPHIEUNHAP` (`MPN`, `MSP`, `SL`, `TIENNHAP`) VALUES 
-- MPN 1: NCC 1 (Anh Khuê - Casio)
(1, 22, 5, 2800000), (1, 23, 5, 3200000), (1, 28, 15, 200000), 

-- MPN 2: NCC 2 (Citizen VN)
(2, 1, 5, 3500000), (2, 2, 3, 8500000), 

-- MPN 3: NCC 3 (Orient VN)
(3, 4, 5, 3800000), (3, 5, 3, 5500000), (3, 6, 2, 7200000),

-- MPN 4: NCC 4 (Seiko VN)
(4, 7, 5, 4800000), (4, 10, 10, 2200000), 

-- MPN 5: NCC 5 (Rolex VN - Nhập cực ít hàng giá trị cao)
(5, 11, 1, 185000000), (5, 12, 1, 165000000), (5, 13, 1, 145000000),

-- MPN 6: NCC 6 (FC VN)
(6, 14, 3, 8500000), (6, 15, 2, 9200000),

-- MPN 7: NCC 7 (Fossil VN)
(7, 16, 5, 2500000), (7, 17, 5, 2200000), (7, 18, 3, 3800000),

-- MPN 8: NCC 8 (DW VN)
(8, 19, 5, 2800000), (8, 20, 3, 3200000), (8, 21, 3, 2500000),

-- MPN 9: NCC 9 (SKMEI)
(9, 33, 20, 150000), (9, 34, 15, 180000),

-- MPN 10: NCC 10 (Timex)
(10, 35, 10, 850000), 

-- MPN 11: NCC 1 (Anh Khuê - Nhập thêm dòng G-Shock/Tissot)
(11, 26, 5, 1800000), (11, 27, 5, 550000), (11, 29, 5, 650000),

-- MPN 12: NCC 4 (Seiko VN - Nhập thêm dòng cao cấp)
(12, 8, 2, 12000000), (12, 9, 3, 8500000),

-- MPN 13: NCC 2 (Citizen VN - Nhập thêm Citizen cơ)
(13, 3, 5, 4200000),

-- MPN 14: NCC 5 (Rolex VN - Nhập bổ sung 1 cái)
(14, 11, 1, 185000000),

-- MPN 15: NCC 1 (Anh Khuê - Nhập thêm Tissot)
(15, 24, 2, 9500000), (15, 25, 2, 11500000),
(16, 30, 10, 1600000), -- Casio Baby-G BGD-565 (Nhập 10 cái)
(16, 31, 10, 2150000), -- Casio Baby-G BA-110  (Nhập 10 cái)
(16, 32, 10, 3800000); -- Casio ProTrek PRG-270 (Nhập 10 cái)

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
-- ------------------------------------------------------------
INSERT INTO `PHIEUXUAT` (`MPX`, `MNV`, `MKH`, `TIEN`, `TG`, `TT`) VALUES 
-- Năm 2024 (Bán hàng rải rác theo các ca sáng/chiều)
(1, 2, 2, 4500000, '2024-02-15 09:15:00', 1),   -- Ca sáng
(2, 5, 3, 8500000, '2024-03-20 15:30:00', 1),   -- Ca chiều
(3, 2, 4, 3800000, '2024-04-10 10:45:00', 1), 
(4, 5, 5, 4800000, '2024-05-12 19:20:00', 1),   -- Khách mua tối
(5, 1, 6, 245000000, '2024-06-01 11:00:00', 1), -- Quản lý chốt đơn lớn
(6, 2, 7, 12500000, '2024-07-20 14:10:00', 1),
(7, 5, 8, 2200000, '2024-08-15 16:50:00', 1),
(8, 2, 9, 2800000, '2024-09-10 08:45:00', 1),
(9, 5, 10, 150000, '2024-10-05 21:15:00', 1),
(10, 1, 11, 850000, '2024-11-22 13:25:00', 1),
(11, 2, 12, 1800000, '2024-12-15 17:35:00', 1),

-- Năm 2025-2026
(12, 5, 13, 4200000, '2025-01-10 10:00:00', 1),
(13, 2, 14, 7200000, '2025-02-14 20:10:00', 1), -- Bán dịp Valentine
(14, 5, 15, 12000000, '2025-03-08 15:45:00', 1),-- Bán dịp 8/3
(15, 2, 16, 145000000, '2026-02-20 11:20:00', 1);

-- Chi tiết bán hàng (Mỗi phiếu bán 1-2 cái)
INSERT INTO `CTPHIEUXUAT` (`MPX`, `MSP`, `SL`, `TIENXUAT`) VALUES 
(1, 1, 1, 4500000), (2, 2, 1, 8500000), (3, 4, 1, 3800000),
(4, 7, 1, 4800000), (5, 11, 1, 245000000), (6, 14, 1, 12500000),
(7, 10, 1, 2200000), (8, 19, 1, 2800000), (9, 33, 1, 150000),
(10, 35, 1, 850000), (11, 26, 1, 1800000), (12, 3, 1, 4200000),
(13, 6, 1, 7200000), (14, 8, 1, 12000000), (15, 13, 1, 145000000);

COMMIT;