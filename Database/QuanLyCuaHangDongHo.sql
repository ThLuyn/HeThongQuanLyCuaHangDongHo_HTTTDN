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
    `MCN`   VARCHAR(50)  NOT NULL COMMENT 'Mã chức năng',
    `TEN`   VARCHAR(255) NOT NULL COMMENT 'Tên chức năng',
    `TT`    INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hoạt động, 0: ẩn)',
    PRIMARY KEY (MCN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `NHOMQUYEN` (
    `MNQ`   INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã nhóm quyền',
    `TEN`   VARCHAR(255) NOT NULL COMMENT 'Tên nhóm quyền',
    `TT`    INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MNQ)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `CTQUYEN` (
    `MNQ`       INT(11)      NOT NULL COMMENT 'Mã nhóm quyền',
    `MCN`       VARCHAR(50)  NOT NULL COMMENT 'Mã chức năng',
    `HANHDONG`  VARCHAR(255) NOT NULL COMMENT 'Hành động (create/view/update/delete/export/cancel/approve)',
    PRIMARY KEY (MNQ, MCN, HANHDONG)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.2 NHÂN SỰ
-- ------------------------------------------------------------
 
CREATE TABLE `CHUCVU` (
    `MCV`           INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã chức vụ',
    `TEN`           VARCHAR(255)    NOT NULL COMMENT 'Tên chức vụ',
    `LUONGCOBAN`    DECIMAL(15,2)   NOT NULL COMMENT 'Lương cơ bản (VNĐ/tháng)',
    `TY_LE_HOA_HONG` DECIMAL(5,2)  NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ hoa hồng trên doanh số (%)',
    `TT`            INT(11)         NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MCV)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `NHANVIEN` (
    `MNV`       INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã nhân viên',
    `HOTEN`     VARCHAR(255) NOT NULL COMMENT 'Họ và tên',
    `GIOITINH`  INT(11)      NOT NULL COMMENT 'Giới tính (0: Nữ, 1: Nam)',
    `NGAYSINH`  DATE         NOT NULL COMMENT 'Ngày sinh',
    `SDT`       VARCHAR(11)  NOT NULL COMMENT 'Số điện thoại',
    `EMAIL`     VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Email',
    `MCV`       INT(11)      NOT NULL COMMENT 'Mã chức vụ hiện tại',
    `TT`        INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: đang làm, 0: nghỉ việc)',
    PRIMARY KEY (MNV)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `TAIKHOAN` (
    `MNV`       INT(11)      NOT NULL COMMENT 'Mã nhân viên',
    `TDN`       VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên đăng nhập',
    `MK`        VARCHAR(255) NOT NULL COMMENT 'Mật khẩu (BCrypt)',
    `MNQ`       INT(11)      NOT NULL COMMENT 'Mã nhóm quyền',
    `TRANGTHAI` INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hoạt động, 0: khóa)',
    `OTP`       VARCHAR(50)  DEFAULT NULL COMMENT 'Mã OTP đặt lại mật khẩu',
    PRIMARY KEY (MNV, TDN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.3 LỊCH SỬ THAY ĐỔI CHỨC VỤ
--      (Yêu cầu đề tài: "khi thay đổi chức vụ phải có thời điểm cụ thể và lương sẽ thay đổi theo")
-- ------------------------------------------------------------
 
CREATE TABLE `LICHSUCHUCVU` (
    `MLS`           INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã lịch sử',
    `MNV`           INT(11)         NOT NULL COMMENT 'Mã nhân viên',
    `MCV_CU`        INT(11)         DEFAULT NULL COMMENT 'Mã chức vụ cũ (NULL nếu là lần đầu)',
    `MCV_MOI`       INT(11)         NOT NULL COMMENT 'Mã chức vụ mới',
    `NGAY_HIEULUC`  DATE            NOT NULL COMMENT 'Ngày bắt đầu có hiệu lực',
    `GHICHU`        TEXT            COMMENT 'Ghi chú lý do thay đổi',
    `MNV_DUYET`     INT(11)         NOT NULL COMMENT 'Người duyệt (quản lý)',
    PRIMARY KEY (MLS)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.4 CA LÀM & PHÂN CA
-- ------------------------------------------------------------
 
CREATE TABLE `CALAM` (
    `MCA`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã ca làm',
    `TENCA`         VARCHAR(255) NOT NULL COMMENT 'Tên ca (VD: Ca sáng, Ca chiều)',
    `GIO_BATDAU`    TIME         NOT NULL COMMENT 'Giờ bắt đầu',
    `GIO_KETTHUC`   TIME         NOT NULL COMMENT 'Giờ kết thúc',
    `TT`            INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MCA)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `PHANCALAM` (
    `MPCL`          INT(11)     NOT NULL AUTO_INCREMENT COMMENT 'Mã phân ca',
    `MNV`           INT(11)     NOT NULL COMMENT 'Mã nhân viên',
    `MCA`           INT(11)     NOT NULL COMMENT 'Mã ca làm',
    `NGAY`          DATE        NOT NULL COMMENT 'Ngày làm việc',
    `GIO_CHECKIN`   TIMESTAMP   DEFAULT NULL COMMENT 'Giờ check-in thực tế',
    `GIO_CHECKOUT`  TIMESTAMP   DEFAULT NULL COMMENT 'Giờ check-out thực tế',
    `TT`            INT(11)     NOT NULL DEFAULT 0
                    COMMENT 'Trạng thái (0: chưa làm, 1: đang làm, 2: hoàn thành, 3: vắng)',
    PRIMARY KEY (MPCL),
    UNIQUE KEY uq_nv_ngay_ca (MNV, MCA, NGAY)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.5 ĐƠN XIN NGHỈ
--      (Yêu cầu: nghỉ phép, nghỉ ốm/đau/thai sản, nghỉ việc)
-- ------------------------------------------------------------
 
CREATE TABLE `DONXINNGH` (
    `MDN`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã đơn nghỉ',
    `MNV`           INT(11)      NOT NULL COMMENT 'Mã nhân viên nộp đơn',
    `LOAI`          INT(11)      NOT NULL DEFAULT 1
                    COMMENT 'Loại đơn (1: nghỉ phép, 2: nghỉ ốm/đau/thai sản, 3: nghỉ việc)',
    `NGAYNGHI`      DATE         NOT NULL COMMENT 'Ngày bắt đầu nghỉ',
    `SONGAY`        INT(11)      NOT NULL DEFAULT 1 COMMENT 'Số ngày nghỉ',
    `LYDO`          TEXT         COMMENT 'Lý do nghỉ',
    `TRANGTHAI`     INT(11)      NOT NULL DEFAULT 0
                    COMMENT 'Trạng thái (0: chờ duyệt, 1: đã duyệt, 2: từ chối)',
    `NGUOIDUYET`    INT(11)      DEFAULT NULL COMMENT 'Mã NV người duyệt',
    `NGAYTAO`       DATE         NOT NULL DEFAULT (CURRENT_DATE) COMMENT 'Ngày nộp đơn',
    `GHICHU`        TEXT         COMMENT 'Ghi chú của người duyệt',
    PRIMARY KEY (MDN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.6 BẢNG CHẤM CÔNG
-- ------------------------------------------------------------
 
CREATE TABLE `BANGCHAMCONG` (
    `MCC`               INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã chấm công',
    `MNV`               INT(11)         NOT NULL COMMENT 'Mã nhân viên',
    `THANG`             INT(11)         NOT NULL COMMENT 'Tháng (1-12)',
    `NAM`               INT(11)         NOT NULL COMMENT 'Năm',
    `NGAYCONG`          DECIMAL(5,1)    NOT NULL DEFAULT 0 COMMENT 'Số ngày công thực tế',
    `NGAYNGHI_PHEP`     INT(11)         NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ có phép (được tính lương)',
    `NGAYNGHI_KP`       INT(11)         NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ không phép (trừ lương)',
    `TT`                INT(11)         NOT NULL DEFAULT 1
                        COMMENT 'Trạng thái (1: tạm tính, 2: đã chốt)',
    PRIMARY KEY (MCC),
    UNIQUE KEY uq_nv_thang_nam (MNV, THANG, NAM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.7 BẢNG LƯƠNG
--      (Yêu cầu: tính lương = lương cơ bản + hoa hồng doanh số + thưởng + phụ cấp - khấu trừ)
-- ------------------------------------------------------------
 
CREATE TABLE `BANGLUONG` (
    `MBL`               INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã bảng lương',
    `MNV`               INT(11)         NOT NULL COMMENT 'Mã nhân viên',
    `THANG`             INT(11)         NOT NULL COMMENT 'Tháng',
    `NAM`               INT(11)         NOT NULL COMMENT 'Năm',
    `LUONGCOBAN`        DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Lương cơ bản theo chức vụ',
    `NGAYCONG`          DECIMAL(5,1)    NOT NULL DEFAULT 0 COMMENT 'Số ngày công (sao chép từ chấm công)',
    `DOANH_SO`          DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Tổng doanh số phụ trách trong tháng',
    `TY_LE_HOA_HONG`    DECIMAL(5,2)    NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ hoa hồng (%)',
    `HOA_HONG`          DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Tiền hoa hồng = DOANH_SO * TY_LE_HOA_HONG / 100',
    `THUONG`            DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Thưởng (do quản lý nhập)',
    `PHUCAP`            DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Phụ cấp',
    `KHAUTRU`           DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT 'Khấu trừ (nghỉ KP, vi phạm...)',
    `LUONGTHUCLANH`     DECIMAL(15,2)   NOT NULL DEFAULT 0
                        COMMENT 'Lương thực lãnh = LUONGCOBAN * (NGAYCONG/NGAY_LVCHUANTRE) + HOA_HONG + THUONG + PHUCAP - KHAUTRU',
    `TT`                INT(11)         NOT NULL DEFAULT 1
                        COMMENT 'Trạng thái (1: tạm tính, 2: đã thanh toán)',
    PRIMARY KEY (MBL),
    UNIQUE KEY uq_nv_thang_nam (MNV, THANG, NAM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.8 KHÁCH HÀNG & NHÀ CUNG CẤP
-- ------------------------------------------------------------
 
CREATE TABLE `KHACHHANG` (
    `MKH`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã khách hàng',
    `HOTEN`         VARCHAR(255) NOT NULL COMMENT 'Họ và tên',
    `NGAYTHAMGIA`   DATE         NOT NULL COMMENT 'Ngày đăng ký thành viên',
    `DIACHI`        VARCHAR(255) COMMENT 'Địa chỉ',
    `SDT`           VARCHAR(11)  UNIQUE NOT NULL COMMENT 'Số điện thoại',
    `EMAIL`         VARCHAR(50)  UNIQUE COMMENT 'Email',
    `TT`            INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MKH)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `NHACUNGCAP` (
    `MNCC`      INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã nhà cung cấp',
    `TEN`       VARCHAR(255) NOT NULL COMMENT 'Tên nhà cung cấp',
    `DIACHI`    VARCHAR(255) COMMENT 'Địa chỉ',
    `SDT`       VARCHAR(12)  COMMENT 'Số điện thoại',
    `EMAIL`     VARCHAR(50)  COMMENT 'Email',
    `TT`        INT(11)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MNCC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.9 SẢN PHẨM & VỊ TRÍ TRƯNG BÀY
-- ------------------------------------------------------------
 
CREATE TABLE `VITRITRUNGBAY` (
    `MVT`       INT(11)      NOT NULL AUTO_INCREMENT COMMENT 'Mã vị trí trưng bày',
    `TEN`       VARCHAR(255) NOT NULL COMMENT 'Tên khu vực',
    `GHICHU`    TEXT         COMMENT 'Ghi chú (loại đồng hồ trưng bày)',
    PRIMARY KEY (MVT)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `SANPHAM` (
    `MSP`               INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã sản phẩm',
    `TEN`               VARCHAR(255)    NOT NULL COMMENT 'Tên sản phẩm',
    `HINHANH`           VARCHAR(255)    NOT NULL COMMENT 'Đường dẫn hình ảnh',
    `MNCC`              INT(11)         NOT NULL COMMENT 'Mã nhà cung cấp',
    `MVT`               INT(11)         COMMENT 'Mã vị trí trưng bày',
    `THUONGHIEU`        VARCHAR(100)    COMMENT 'Thương hiệu',
    `NAMSANXUAT`        YEAR            COMMENT 'Năm sản xuất',
    `GIANHAP`           DECIMAL(15,2)   NOT NULL COMMENT 'Giá nhập (VNĐ)',
    `GIABAN`            DECIMAL(15,2)   NOT NULL COMMENT 'Giá bán niêm yết (VNĐ)',
    `SOLUONG`           INT(11)         DEFAULT 0 COMMENT 'Số lượng tồn kho',
    `THOIGIANBAOHANH`   INT(11)         DEFAULT 12 COMMENT 'Thời gian bảo hành (tháng)',
    `TT`                INT(11)         NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.10 KHUYẾN MÃI
-- ------------------------------------------------------------
 
CREATE TABLE `MAKHUYENMAI` (
    `MKM`   VARCHAR(255)    NOT NULL COMMENT 'Mã khuyến mãi',
    `TGBD`  DATE            NOT NULL COMMENT 'Thời gian bắt đầu',
    `TGKT`  DATE            NOT NULL COMMENT 'Thời gian kết thúc',
    `TT`    INT(11)         NOT NULL DEFAULT 1 COMMENT 'Trạng thái',
    PRIMARY KEY (MKM)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `CTMAKHUYENMAI` (
    `MKM`   VARCHAR(255)    NOT NULL COMMENT 'Mã khuyến mãi',
    `MSP`   INT(11)         NOT NULL COMMENT 'Mã sản phẩm áp dụng',
    `PTG`   INT(11)         NOT NULL COMMENT 'Phần trăm giảm giá (%)',
    PRIMARY KEY (MKM, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.11 PHIẾU NHẬP
-- ------------------------------------------------------------
 
CREATE TABLE `PHIEUNHAP` (
    `MPN`       INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu nhập',
    `MNV`       INT(11)         NOT NULL COMMENT 'Mã nhân viên lập phiếu',
    `MNCC`      INT(11)         NOT NULL COMMENT 'Mã nhà cung cấp',
    `TIEN`      DECIMAL(15,2)   NOT NULL COMMENT 'Tổng tiền phiếu nhập',
    `TG`        DATETIME        DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian lập phiếu',
    `TT`        INT(11)         NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hợp lệ, 0: đã hủy)',
    `LYDOHUY`   VARCHAR(255)    NULL COMMENT 'Lý do hủy phiếu',
    PRIMARY KEY (MPN)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `CTPHIEUNHAP` (
    `MPN`       INT(11)         NOT NULL COMMENT 'Mã phiếu nhập',
    `MSP`       INT(11)         NOT NULL COMMENT 'Mã sản phẩm',
    `SL`        INT(11)         NOT NULL COMMENT 'Số lượng nhập',
    `TIENNHAP`  DECIMAL(15,2)   NOT NULL COMMENT 'Đơn giá nhập',
    `HINHTHUC`  INT(11)         NOT NULL DEFAULT 0 COMMENT 'Hình thức thanh toán (0: tiền mặt, 1: chuyển khoản)',
    PRIMARY KEY (MPN, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.12 PHIẾU XUẤT (BÁN HÀNG)
-- ------------------------------------------------------------
 
CREATE TABLE `PHIEUXUAT` (
    `MPX`       INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu xuất / hóa đơn bán',
    `MNV`       INT(11)         DEFAULT NULL COMMENT 'Mã nhân viên lập phiếu',
    `MKH`       INT(11)         NOT NULL COMMENT 'Mã khách hàng',
    `TIEN`      DECIMAL(15,2)   NOT NULL COMMENT 'Tổng tiền sau giảm giá',
    `TG`        DATETIME        DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian bán',
    `TT`        INT(11)         NOT NULL DEFAULT 1 COMMENT 'Trạng thái (1: hợp lệ, 0: đã hủy)',
    `LYDOHUY`   VARCHAR(255)    NULL COMMENT 'Lý do hủy phiếu',
    PRIMARY KEY (MPX)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `CTPHIEUXUAT` (
    `MPX`       INT(11)         NOT NULL COMMENT 'Mã phiếu xuất',
    `MSP`       INT(11)         NOT NULL COMMENT 'Mã sản phẩm',
    `MKM`       VARCHAR(255)    DEFAULT NULL COMMENT 'Mã khuyến mãi áp dụng (nếu có)',
    `SL`        INT(11)         NOT NULL COMMENT 'Số lượng bán',
    `TIENXUAT`  DECIMAL(15,2)   NOT NULL COMMENT 'Đơn giá bán thực tế (đã giảm)',
    PRIMARY KEY (MPX, MSP)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
-- ------------------------------------------------------------
--  1.13 BẢO HÀNH & SỬA CHỮA
-- ------------------------------------------------------------
 
CREATE TABLE `PHIEUBAOHANH` (
    `MPB`           INT(11)     NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu bảo hành',
    `MPX`           INT(11)     NOT NULL COMMENT 'Mã hóa đơn bán (phiếu xuất gốc)',
    `MSP`           INT(11)     NOT NULL COMMENT 'Mã sản phẩm',
    `MKH`           INT(11)     NOT NULL COMMENT 'Mã khách hàng',
    `NGAYBATDAU`    DATE        NOT NULL COMMENT 'Ngày bắt đầu bảo hành',
    `NGAYKETTHUC`   DATE        NOT NULL COMMENT 'Ngày hết bảo hành',
    `TRANGTHAI`     INT(11)     NOT NULL DEFAULT 1
                    COMMENT 'Trạng thái (1: còn hạn, 0: hết hạn, 2: đã hủy)',
    PRIMARY KEY (MPB)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
CREATE TABLE `PHIEUSUACHUA` (
    `MSC`           INT(11)         NOT NULL AUTO_INCREMENT COMMENT 'Mã phiếu sửa chữa',
    `MPB`           INT(11)         NOT NULL COMMENT 'Mã phiếu bảo hành liên quan',
    `MNV`           INT(11)         DEFAULT NULL COMMENT 'Mã nhân viên phụ trách sửa chữa',
    `NGAYNHAN`      DATE            NOT NULL COMMENT 'Ngày nhận đồng hồ',
    `NGAYTRA`       DATE            DEFAULT NULL COMMENT 'Ngày trả đồng hồ',
    `NGUYENNHAN`    TEXT            COMMENT 'Mô tả nguyên nhân hỏng',
    `TINHTRANG`     INT(11)         DEFAULT 0
                    COMMENT 'Tình trạng (0: chờ xử lý, 1: đang sửa, 2: hoàn thành, 3: không sửa được)',
    `CHIPHI`        DECIMAL(15,2)   DEFAULT 0 COMMENT 'Chi phí phát sinh (nếu ngoài bảo hành)',
    `GHICHU`        TEXT            COMMENT 'Ghi chú thêm',
    PRIMARY KEY (MSC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
 
 
-- ============================================================
--  PHẦN 2: TẠO QUAN HỆ (FOREIGN KEY)
-- ============================================================
 
-- Phân quyền
ALTER TABLE `CTQUYEN`
    ADD CONSTRAINT FK_MNQ_CTQUYEN FOREIGN KEY (MNQ) REFERENCES `NHOMQUYEN`(MNQ) ON DELETE NO ACTION ON UPDATE CASCADE,
    ADD CONSTRAINT FK_MCN_CTQUYEN FOREIGN KEY (MCN) REFERENCES `DANHMUCCHUCNANG`(MCN) ON DELETE NO ACTION ON UPDATE CASCADE;
 
-- Nhân viên
ALTER TABLE `NHANVIEN`
    ADD CONSTRAINT FK_MCV_NHANVIEN FOREIGN KEY (MCV) REFERENCES `CHUCVU`(MCV) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
ALTER TABLE `TAIKHOAN`
    ADD CONSTRAINT FK_MNV_TAIKHOAN FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNQ_TAIKHOAN FOREIGN KEY (MNQ) REFERENCES `NHOMQUYEN`(MNQ) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
ALTER TABLE `LICHSUCHUCVU`
    ADD CONSTRAINT FK_MNV_LSCV    FOREIGN KEY (MNV)       REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_CU_LSCV  FOREIGN KEY (MCV_CU)   REFERENCES `CHUCVU`(MCV)   ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCV_MOI_LSCV FOREIGN KEY (MCV_MOI)  REFERENCES `CHUCVU`(MCV)   ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_LSCV   FOREIGN KEY (MNV_DUYET) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Ca làm & phân ca
ALTER TABLE `PHANCALAM`
    ADD CONSTRAINT FK_MNV_PCL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MCA_PCL FOREIGN KEY (MCA) REFERENCES `CALAM`(MCA)    ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Đơn xin nghỉ
ALTER TABLE `DONXINNGH`
    ADD CONSTRAINT FK_MNV_DXN      FOREIGN KEY (MNV)        REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_DUYET_DXN    FOREIGN KEY (NGUOIDUYET)  REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Bảng chấm công
ALTER TABLE `BANGCHAMCONG`
    ADD CONSTRAINT FK_MNV_BCC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Bảng lương
ALTER TABLE `BANGLUONG`
    ADD CONSTRAINT FK_MNV_BL FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Sản phẩm
ALTER TABLE `SANPHAM`
    ADD CONSTRAINT FK_MNCC_SANPHAM FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC)    ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MVT_SANPHAM  FOREIGN KEY (MVT)  REFERENCES `VITRITRUNGBAY`(MVT)  ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Phiếu nhập
ALTER TABLE `PHIEUNHAP`
    ADD CONSTRAINT FK_MNV_PN  FOREIGN KEY (MNV)  REFERENCES `NHANVIEN`(MNV)    ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNCC_PN FOREIGN KEY (MNCC) REFERENCES `NHACUNGCAP`(MNCC) ON DELETE NO ACTION ON UPDATE NO ACTION;
 
ALTER TABLE `CTPHIEUNHAP`
    ADD CONSTRAINT FK_MPN_CTPN FOREIGN KEY (MPN) REFERENCES `PHIEUNHAP`(MPN) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPN FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP)   ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Khuyến mãi
ALTER TABLE `CTMAKHUYENMAI`
    ADD CONSTRAINT FK_MKM_CTMKM FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTMKM FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP)     ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Phiếu xuất
ALTER TABLE `PHIEUXUAT`
    ADD CONSTRAINT FK_MNV_PX FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV)   ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PX FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH)  ON DELETE NO ACTION ON UPDATE NO ACTION;
 
ALTER TABLE `CTPHIEUXUAT`
    ADD CONSTRAINT FK_MPX_CTPX FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX)      ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_CTPX FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP)        ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKM_CTPX FOREIGN KEY (MKM) REFERENCES `MAKHUYENMAI`(MKM)    ON DELETE NO ACTION ON UPDATE NO ACTION;
 
-- Bảo hành & sửa chữa
ALTER TABLE `PHIEUBAOHANH`
    ADD CONSTRAINT FK_MPX_PBH FOREIGN KEY (MPX) REFERENCES `PHIEUXUAT`(MPX)   ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MSP_PBH FOREIGN KEY (MSP) REFERENCES `SANPHAM`(MSP)     ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MKH_PBH FOREIGN KEY (MKH) REFERENCES `KHACHHANG`(MKH)  ON DELETE NO ACTION ON UPDATE NO ACTION;
 
ALTER TABLE `PHIEUSUACHUA`
    ADD CONSTRAINT FK_MPB_PSC FOREIGN KEY (MPB) REFERENCES `PHIEUBAOHANH`(MPB) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT FK_MNV_PSC FOREIGN KEY (MNV) REFERENCES `NHANVIEN`(MNV)     ON DELETE NO ACTION ON UPDATE NO ACTION;

--  PHẦN 3: DỮ LIỆU MẪU
-- ============================================================
 
-- ------------------------------------------------------------
--  3.1 Danh mục chức năng (bổ sung chức năng nhân sự mới)
-- ------------------------------------------------------------
 
INSERT INTO `DANHMUCCHUCNANG` (`MCN`, `TEN`, `TT`) VALUES
    ('sanpham',         'Quản lý sản phẩm',             1),
    ('khachhang',       'Quản lý khách hàng',            1),
    ('nhacungcap',      'Quản lý nhà cung cấp',          1),
    ('nhanvien',        'Quản lý nhân viên',             1),
    ('chucvu',          'Quản lý chức vụ',               1),
    ('calam',           'Quản lý ca làm',                1),
    ('phancalam',       'Phân ca làm việc',              1),
    ('donxinngh',       'Duyệt đơn xin nghỉ',            1),
    ('chamcong',        'Quản lý chấm công',             1),
    ('bangluong',       'Quản lý bảng lương',            1),
    ('phieunhap',       'Quản lý nhập hàng',             1),
    ('phieuxuat',       'Quản lý phiếu xuất / bán hàng', 1),
    ('baohanh',         'Quản lý phiếu bảo hành',        1),
    ('suachua',         'Quản lý phiếu sửa chữa',        1),
    ('vitritrungbay',   'Quản lý vị trí trưng bày',      1),
    ('nhomquyen',       'Quản lý nhóm quyền',            1),
    ('taikhoan',        'Quản lý tài khoản',             1),
    ('makhuyenmai',     'Quản lý mã khuyến mãi',         1),
    ('thongke',         'Thống kê & báo cáo',            1);
 
-- ------------------------------------------------------------
--  3.2 Nhóm quyền
-- ------------------------------------------------------------
 
INSERT INTO `NHOMQUYEN` (`TEN`, `TT`) VALUES
    ('Quản lý cửa hàng', 1),
    ('Nhân viên bán hàng', 1);
 
-- ------------------------------------------------------------
--  3.3 Chi tiết quyền
-- ------------------------------------------------------------
 
-- Quản lý cửa hàng (MNQ = 1): toàn quyền
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES
    (1,'sanpham','create'),(1,'sanpham','view'),(1,'sanpham','update'),(1,'sanpham','delete'),
    (1,'khachhang','create'),(1,'khachhang','view'),(1,'khachhang','update'),(1,'khachhang','delete'),
    (1,'nhacungcap','create'),(1,'nhacungcap','view'),(1,'nhacungcap','update'),(1,'nhacungcap','delete'),
    (1,'nhanvien','create'),(1,'nhanvien','view'),(1,'nhanvien','update'),(1,'nhanvien','delete'),
    (1,'chucvu','create'),(1,'chucvu','view'),(1,'chucvu','update'),(1,'chucvu','delete'),
    (1,'calam','create'),(1,'calam','view'),(1,'calam','update'),(1,'calam','delete'),
    (1,'phancalam','create'),(1,'phancalam','view'),(1,'phancalam','update'),(1,'phancalam','delete'),
    (1,'donxinngh','view'),(1,'donxinngh','approve'),
    (1,'chamcong','create'),(1,'chamcong','view'),(1,'chamcong','update'),(1,'chamcong','export'),
    (1,'bangluong','create'),(1,'bangluong','view'),(1,'bangluong','update'),(1,'bangluong','export'),
    (1,'phieunhap','create'),(1,'phieunhap','view'),(1,'phieunhap','cancel'),(1,'phieunhap','export'),
    (1,'phieuxuat','create'),(1,'phieuxuat','view'),(1,'phieuxuat','cancel'),(1,'phieuxuat','export'),
    (1,'baohanh','view'),(1,'baohanh','update'),(1,'baohanh','export'),
    (1,'suachua','create'),(1,'suachua','view'),(1,'suachua','update'),(1,'suachua','delete'),(1,'suachua','export'),
    (1,'vitritrungbay','create'),(1,'vitritrungbay','view'),(1,'vitritrungbay','update'),(1,'vitritrungbay','delete'),
    (1,'nhomquyen','create'),(1,'nhomquyen','view'),(1,'nhomquyen','update'),(1,'nhomquyen','delete'),
    (1,'taikhoan','create'),(1,'taikhoan','view'),(1,'taikhoan','update'),(1,'taikhoan','delete'),
    (1,'makhuyenmai','create'),(1,'makhuyenmai','view'),(1,'makhuyenmai','update'),(1,'makhuyenmai','delete'),
    (1,'thongke','view'),(1,'thongke','export');
 
-- Nhân viên bán hàng (MNQ = 2): hạn chế
INSERT INTO `CTQUYEN` (`MNQ`, `MCN`, `HANHDONG`) VALUES
    (2,'sanpham','view'),
    (2,'khachhang','create'),(2,'khachhang','view'),(2,'khachhang','update'),
    (2,'phieuxuat','create'),(2,'phieuxuat','view'),(2,'phieuxuat','cancel'),(2,'phieuxuat','export'),
    (2,'baohanh','view'),(2,'baohanh','export'),
    (2,'suachua','create'),(2,'suachua','view'),(2,'suachua','update'),
    (2,'vitritrungbay','view'),
    (2,'makhuyenmai','view'),
    (2,'donxinngh','create'),(2,'donxinngh','view'),
    (2,'phancalam','view'),
    (2,'bangluong','view'),
    (2,'chamcong','view');
 
-- ------------------------------------------------------------
--  3.4 Chức vụ (bổ sung LUONGCOBAN & TY_LE_HOA_HONG)
-- ------------------------------------------------------------
 
INSERT INTO `CHUCVU` (`TEN`, `LUONGCOBAN`, `TY_LE_HOA_HONG`, `TT`) VALUES
    ('Quản lý cửa hàng', 12000000, 1.5, 1),
    ('Nhân viên bán hàng', 4500000, 2.0, 1);
 
-- ------------------------------------------------------------
--  3.5 Nhân viên (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
 
INSERT INTO `NHANVIEN` (`HOTEN`, `GIOITINH`, `NGAYSINH`, `SDT`, `EMAIL`, `MCV`, `TT`) VALUES
    ('Võ Thị Thu Luyện',    0, '2005-05-01', '0865172517', 'thuluyen234@gmail.com', 1, 1),
    ('Nguyễn Thị Ngọc Tú',  0, '2005-01-28', '0396532145', 'ngoctu@gmail.com',      2, 1),
    ('Trần Thị Xuân Thanh',  0, '2005-01-22', '0387913347', 'xuanthanh@gmail.com',  2, 1),
    ('Đỗ Hữu Lộc',          1, '2005-01-26', '0355374322', 'huuloc@gmail.com',      2, 1),
    ('Đỗ Nam Anh',          1, '2003-04-11', '0123456781', 'chinchin@gmail.com',    2, 1),
    ('Đinh Ngọc Ánh',       1, '2003-04-03', '0123456782', 'ngocan@gmail.com',      2, 1),
    ('Phạm Minh Khang',     1, '2004-12-10', '0912345678', 'minhkhang@gmail.com',   2, 1),
    ('Lê Thảo Nhi',         0, '2005-03-15', '0945123789', 'thaonhi@gmail.com',     2, 1),
    ('Nguyễn Hoàng Phúc',   1, '2003-09-21', '0987654321', 'hoangphuc@gmail.com',   2, 1),
    ('Trần Mỹ Hạnh',        0, '2004-07-19', '0938475621', 'myhanh@gmail.com',      2, 1);
 
-- ------------------------------------------------------------
--  3.6 Lịch sử chức vụ (bản ghi khởi tạo cho từng NV)
-- ------------------------------------------------------------
 
INSERT INTO `LICHSUCHUCVU` (`MNV`, `MCV_CU`, `MCV_MOI`, `NGAY_HIEULUC`, `GHICHU`, `MNV_DUYET`) VALUES
    (1,  NULL, 1, '2024-01-01', 'Ký hợp đồng quản lý', 1),
    (2,  NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (3,  NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (4,  NULL, 2, '2024-01-01', 'Ký hợp đồng nhân viên', 1),
    (5,  NULL, 2, '2024-02-01', 'Ký hợp đồng nhân viên', 1),
    (6,  NULL, 2, '2024-02-01', 'Ký hợp đồng nhân viên', 1),
    (7,  NULL, 2, '2024-03-01', 'Ký hợp đồng nhân viên', 1),
    (8,  NULL, 2, '2024-03-01', 'Ký hợp đồng nhân viên', 1),
    (9,  NULL, 2, '2024-04-01', 'Ký hợp đồng nhân viên', 1),
    (10, NULL, 2, '2024-04-01', 'Ký hợp đồng nhân viên', 1);
 
-- ------------------------------------------------------------
--  3.7 Tài khoản
-- ------------------------------------------------------------
 
INSERT INTO `TAIKHOAN` (`MNV`, `TDN`, `MK`, `MNQ`, `TRANGTHAI`, `OTP`) VALUES
    (1, 'admin',      '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 1, 1, NULL),
    (2, 'nhanvien02', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 2, 1, NULL),
    (3, 'nhanvien03', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 2, 1, NULL),
    (4, 'nhanvien04', '$2a$12$6GSkiQ05XjTRvCW9MB6MNuf7hOJEbbeQx11Eb8oELil1OrCq6uBXm', 2, 1, NULL);
 
-- ------------------------------------------------------------
--  3.8 Ca làm
-- ------------------------------------------------------------
 
INSERT INTO `CALAM` (`TENCA`, `GIO_BATDAU`, `GIO_KETTHUC`, `TT`) VALUES
    ('Ca sáng',   '08:00:00', '12:00:00', 1),
    ('Ca chiều',  '13:00:00', '17:00:00', 1),
    ('Ca tối',    '17:00:00', '21:00:00', 1),
    ('Ca cả ngày','08:00:00', '17:00:00', 1);
 
-- ------------------------------------------------------------
--  3.9 Phân ca mẫu (tháng 3/2025)
-- ------------------------------------------------------------
 
INSERT INTO `PHANCALAM` (`MNV`, `MCA`, `NGAY`, `GIO_CHECKIN`, `GIO_CHECKOUT`, `TT`) VALUES
    (2, 1, '2025-03-03', '2025-03-03 08:02:00', '2025-03-03 12:05:00', 2),
    (2, 2, '2025-03-03', '2025-03-03 13:01:00', '2025-03-03 17:00:00', 2),
    (3, 1, '2025-03-03', '2025-03-03 08:10:00', '2025-03-03 12:00:00', 2),
    (4, 2, '2025-03-03', '2025-03-03 13:05:00', '2025-03-03 17:10:00', 2),
    (2, 1, '2025-03-04', '2025-03-04 08:00:00', '2025-03-04 12:00:00', 2),
    (3, 3, '2025-03-04', '2025-03-04 17:00:00', '2025-03-04 21:00:00', 2),
    (5, 4, '2025-03-04', '2025-03-04 08:05:00', '2025-03-04 17:05:00', 2);
 
-- ------------------------------------------------------------
--  3.10 Đơn xin nghỉ mẫu
-- ------------------------------------------------------------
 
INSERT INTO `DONXINNGH` (`MNV`, `LOAI`, `NGAYNGHI`, `SONGAY`, `LYDO`, `TRANGTHAI`, `NGUOIDUYET`, `NGAYTAO`) VALUES
    (2, 1, '2025-03-10', 1, 'Việc gia đình đột xuất',       1, 1, '2025-03-08'),
    (3, 2, '2025-03-12', 2, 'Ốm, có giấy xác nhận bác sĩ', 1, 1, '2025-03-11'),
    (4, 1, '2025-03-20', 1, 'Tham dự đám cưới',             0, NULL, '2025-03-18'),
    (5, 3, '2025-04-01', 0, 'Xin nghỉ việc do chuyển vùng', 0, NULL, '2025-03-25');
 
-- ------------------------------------------------------------
--  3.11 Bảng chấm công mẫu (tháng 3/2025)
-- ------------------------------------------------------------
 
INSERT INTO `BANGCHAMCONG` (`MNV`, `THANG`, `NAM`, `NGAYCONG`, `NGAYNGHI_PHEP`, `NGAYNGHI_KP`, `TT`) VALUES
    (2,  3, 2025, 24.0, 1, 0, 2),
    (3,  3, 2025, 22.5, 2, 0, 2),
    (4,  3, 2025, 23.0, 1, 1, 2),
    (5,  3, 2025, 25.0, 0, 0, 2),
    (6,  3, 2025, 20.0, 0, 2, 2),
    (7,  3, 2025, 24.5, 1, 0, 2),
    (8,  3, 2025, 23.0, 0, 0, 2),
    (9,  3, 2025, 22.0, 1, 0, 2),
    (10, 3, 2025, 24.0, 0, 1, 2);
 
-- ------------------------------------------------------------
--  3.12 Bảng lương mẫu (tháng 3/2025 – 26 ngày làm việc chuẩn)
--  Công thức: LUONG_THUCLANH = LUONGCOBAN*(NGAYCONG/26) + HOA_HONG + THUONG + PHUCAP - KHAUTRU
-- ------------------------------------------------------------
 
INSERT INTO `BANGLUONG`
    (`MNV`, `THANG`, `NAM`, `LUONGCOBAN`, `NGAYCONG`, `DOANH_SO`, `TY_LE_HOA_HONG`,
     `HOA_HONG`, `THUONG`, `PHUCAP`, `KHAUTRU`, `LUONGTHUCLANH`, `TT`)
VALUES
    (2, 3, 2025, 4500000, 24.0, 85000000, 2.0, 1700000, 500000, 200000, 0,       5561538, 2),
    (3, 3, 2025, 4500000, 22.5, 62000000, 2.0, 1240000, 0,      200000, 0,       5387692, 2),
    (4, 3, 2025, 4500000, 23.0, 71000000, 2.0, 1420000, 0,      200000, 173077,  5584615, 2),
    (5, 3, 2025, 4500000, 25.0, 95000000, 2.0, 1900000, 1000000,200000, 0,       6946154, 2),
    (6, 3, 2025, 4500000, 20.0, 54000000, 2.0, 1080000, 0,      200000, 346154,  4396154, 2),
    (7, 3, 2025, 4500000, 24.5, 78000000, 2.0, 1560000, 200000, 200000, 0,       5874615, 2),
    (8, 3, 2025, 4500000, 23.0, 67000000, 2.0, 1340000, 0,      200000, 0,       5711538, 2),
    (9, 3, 2025, 4500000, 22.0, 59000000, 2.0, 1180000, 0,      200000, 0,       5188462, 2),
    (10,3, 2025, 4500000, 24.0, 72000000, 2.0, 1440000, 0,      200000, 173077,  5528154, 2);
 
-- ------------------------------------------------------------
--  3.13 Khách hàng (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
 
INSERT INTO `KHACHHANG` (`HOTEN`, `DIACHI`, `SDT`, `TT`, `NGAYTHAMGIA`) VALUES
    ('Mặc định',                '',                                                                     '',           1, '2025-04-15'),
    ('Nguyễn Văn Anh',          '45 An Dương Vương, P. Chợ Quán, TP. Hồ Chí Minh',                  '0387913347', 1, '2025-04-15'),
    ('Trần Nhất Nhất',          '270 Hưng Phú, P. Chánh Hưng, TP. Hồ Chí Minh',                     '0123456789', 1, '2025-04-15'),
    ('Hoàng Gia Bảo',           '45 Trương Đình Hội, P. Phú Định, TP. Hồ Chí Minh',                  '0987654321', 1, '2025-04-15'),
    ('Hồ Minh Hưng',            '5 Võ Thị Sáu, P. Xuân Hòa, TP. Hồ Chí Minh',                       '0867987456', 1, '2025-04-15'),
    ('Nguyễn Thị Minh Anh',     '50 Phạm Văn Chí, P. Bình Tiên, TP. Hồ Chí Minh',                   '0935123456', 1, '2025-04-16'),
    ('Trần Đức Minh',           '789 Lê Hồng Phong, TP. Đà Nẵng',                                    '0983456789', 1, '2025-04-16'),
    ('Lê Hải Yến',              '180 Hoàng Ngân, X. Trung Hòa, Hà Nội',                              '0977234567', 1, '2025-04-16'),
    ('Phạm Thanh Hằng',         '325 Nguyễn Văn Tăng, P. Long Bình, TP. Hồ Chí Minh',               '0965876543', 1, '2025-04-16'),
    ('Hoàng Đức Anh',           '321 Lý Thường Kiệt, TP. Cần Thơ',                                   '0946789012', 1, '2025-04-16'),
    ('Ngô Thanh Tùng',          '393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',                    '0912345678', 1, '2025-04-16'),
    ('Võ Thị Kim Ngân',         '123 Đường Lê Lợi, P. Hồng Bàng, TP. Hải Phòng',                    '0916789123', 1, '2025-04-16'),
    ('Đỗ Văn Tú',               '777 Hùng Vương, TP. Huế',                                            '0982345678', 1, '2025-04-30'),
    ('Lý Thanh Trúc',           '81 Hoàng Cầm, P. Linh Xuân, TP. Hồ Chí Minh',                      '0982123456', 1, '2025-04-16'),
    ('Bùi Văn Hoàng',           '222 Đường 2/4, TP. Nha Trang',                                       '0933789012', 1, '2025-04-16'),
    ('Lê Văn Thành',            '23 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',                 '0933456789', 1, '2025-04-16'),
    ('Nguyễn Thị Lan Anh',      '45 Hàng Bạc, P. Hoàn Kiếm, Hà Nội',                                '0965123456', 1, '2025-04-16'),
    ('Phạm Thị Mai',            '234 Nguyễn Trãi, P. Chợ Quán, TP. Hồ Chí Minh',                    '0946789013', 1, '2025-04-17'),
    ('Hoàng Văn Nam',           '567 Phố Huế, P. Hai Bà Trưng, Hà Nội',                              '0912345679', 1, '2025-04-17');
 
-- ------------------------------------------------------------
--  3.14 Nhà cung cấp (giữ nguyên)
-- ------------------------------------------------------------
 
INSERT INTO `NHACUNGCAP` (`TEN`, `DIACHI`, `SDT`, `EMAIL`, `TT`) VALUES
    ('Công Ty CP Anh Khuê Watch',               'Số 20 Đường 3 Tháng 2, P. Hòa Hưng, TP. Hồ Chí Minh',    '1900866858', 'online@anhkhuewatch.com.vn',           1),
    ('Công Ty TNHH Citizen Việt Nam',           '160 đường số 30, P. An Lạc, TP. Hồ Chí Minh',             '0903996733', 'contact@citizen.com.vn',              1),
    ('Công Ty CP Orient Việt Nam',              '157 Cách Mạng Tháng Tám, P. Bàn Cờ, TP. Hồ Chí Minh',    '02822539787','info@lpd.com.vn',                     1),
    ('Công Ty TNHH Seiko Việt Nam',             'KCN Đại An, P. Việt Hòa, Hải Dương',                       '02438621520','support@seiko.com.vn',                1),
    ('Công Ty TNHH Rolex Việt Nam',             'Tầng Trệt, 88 Đồng Khởi, P. Sài Gòn, TP. Hồ Chí Minh',   '02462821922','service@rolex.com',                  1),
    ('Công Ty TNHH Frederique Constant VN',     '393 Điện Biên Phủ, P. Bàn Cờ, TP. Hồ Chí Minh',          '18006785',   'info@frederiqueconstant.com.vn',      1),
    ('Công Ty TNHH Fossil Việt Nam',            'Tầng 7, 215 Nguyễn Văn Thủ, P. Tân Định, TP. Hồ Chí Minh','0932523679', 'ecom@dragonflyapac.vn',              1),
    ('Công Ty TNHH Dragonfly Select Brands VN', '222 Điện Biên Phủ, P. Xuân Hòa, TP. Hồ Chí Minh',        '0932029606', 'danielwellingtonvn@dragonflyapac.com',1),
    ('SKMEI Official',                          '41 Dawang Road, Zhaoqing, Guangdong, China',                '07583988367','alex@skmei.com',                     1),
    ('Timex Vietnam Distributor',               'Sarimi, Sala, P. An Lợi Đông, TP. Thủ Đức',               '0839555959', 'kdonline@nvl.com.vn',                 1);
 
-- ------------------------------------------------------------
--  3.15 Vị trí trưng bày (giữ nguyên)
-- ------------------------------------------------------------
 
INSERT INTO `VITRITRUNGBAY` (`TEN`, `GHICHU`) VALUES
    ('Khu A1 - Đồng hồ cơ',      'Automatic, Hand-wound'),
    ('Khu A2 - Đồng hồ Quartz',   'Nhiều mẫu phổ thông'),
    ('Khu A3 - Đồng hồ điện tử',  'Casio G-Shock, Baby-G'),
    ('Khu A4 - Smartwatch',        'Đồng hồ thông minh'),
    ('Khu B1 - Casio Corner',      'Kệ riêng thương hiệu Casio'),
    ('Khu B2 - Seiko Corner',      'Vị trí thương hiệu Seiko'),
    ('Khu B3 - Orient Corner',     'Kệ dành cho Orient');
 
-- ------------------------------------------------------------
--  3.16 Sản phẩm (giữ nguyên từ file cũ)
-- ------------------------------------------------------------
 
INSERT INTO `SANPHAM` (`TEN`, `HINHANH`, `MNCC`, `MVT`, `THUONGHIEU`, `NAMSANXUAT`, `GIANHAP`, `GIABAN`, `SOLUONG`, `THOIGIANBAOHANH`, `TT`) VALUES
    ('Citizen Eco-Drive BM7108-14E',            'citizen_bm7108.jpg',   2, 2, 'Citizen',            2024, 3500000,   4500000,   15, 24, 1),
    ('Citizen Promaster NY0040-09E',             'citizen_ny0040.jpg',   2, 1, 'Citizen',            2024, 8500000,  11500000,    8, 24, 1),
    ('Citizen NH8390-20E',                       'citizen_nh8390.png',   2, 1, 'Citizen',            2023, 4200000,   5800000,   12, 24, 1),
    ('Orient Bambino RA-AC0E03S',                'orient_bambino.jpg',   3, 7, 'Orient',             2024, 3800000,   5200000,   10, 12, 1),
    ('Orient Mako III RA-AA0008B',               'orient_mako3.jpg',     3, 7, 'Orient',             2024, 5500000,   7500000,    7, 12, 1),
    ('Orient Sun and Moon RA-AS0103S',           'orient_sunmoon.jpg',   3, 7, 'Orient',             2023, 7200000,   9800000,    5, 12, 1),
    ('Seiko 5 Sports SRPD55K1',                  'seiko_srpd55.jpg',     4, 6, 'Seiko',              2024, 4800000,   6500000,   20, 12, 1),
    ('Seiko Presage SPB041J1',                   'seiko_spb041.jpg',     4, 6, 'Seiko',              2024,12000000,  16500000,    6, 24, 1),
    ('Seiko Prospex SRPE99K1',                   'seiko_srpe99.jpg',     4, 6, 'Seiko',              2023, 8500000,  11200000,    9, 12, 1),
    ('Seiko 5 SNK809K2',                         'seiko_snk809.jpg',     4, 6, 'Seiko',              2024, 2200000,   3200000,   25, 12, 1),
    ('Rolex Submariner Date 126610LN',            'rolex_sub.jpg',        5, 1, 'Rolex',              2024,185000000, 245000000,   2, 48, 1),
    ('Rolex Datejust 41 126300',                 'rolex_dj41.jpg',       5, 1, 'Rolex',              2024,165000000, 215000000,   1, 48, 1),
    ('Rolex Air-King 126900',                    'rolex_airking.jpg',    5, 1, 'Rolex',              2023,145000000, 195000000,   1, 48, 1),
    ('Frederique Constant Classic FC-303',        'fc_classic.png',       6, 1, 'Frederique Constant',2024, 8500000,  12500000,   6, 24, 1),
    ('Frederique Constant Slimline FC-200',       'fc_slimline.png',      6, 2, 'Frederique Constant',2024, 9200000,  13800000,   4, 24, 1),
    ('Fossil Grant FS4736IE',                    'fossil_grant.jpg',     7, 2, 'Fossil',             2024, 2500000,   3800000,   18, 12, 1),
    ('Fossil Neutra FS5380',                     'fossil_neutra.jpg',    7, 2, 'Fossil',             2024, 2200000,   3200000,   22, 12, 1),
    ('Fossil Hybrid Smartwatch FTW1163',          'fossil_hybrid.jpg',    7, 4, 'Fossil',             2024, 3800000,   5500000,   12, 12, 1),
    ('Daniel Wellington Classic Sheffield',       'dw_sheffield.jpg',     8, 2, 'Daniel Wellington',  2024, 2800000,   4200000,   16, 24, 1),
    ('Daniel Wellington Petite Sterling',         'dw_petite.jpg',        8, 2, 'Daniel Wellington',  2024, 3200000,   4800000,   14, 24, 1),
    ('Daniel Wellington Classic Black',           'dw_black.jpg',         8, 2, 'Daniel Wellington',  2024, 2500000,   3800000,   20, 24, 1),
    ('Casio G-Shock GA-2100-1A1',                'gshock_ga2100.jpg',    1, 5, 'Casio',              2024, 2800000,   3900000,   25, 12, 1),
    ('Casio Edifice EFR-556DB-2AV',              'edifice_efr556.jpg',   1, 5, 'Casio',              2024, 3200000,   4500000,   15, 12, 1),
    ('Tissot PRX T137.410.11.041.00',            'tissot_prx.jpg',       1, 2, 'Tissot',             2024, 9500000,  13500000,    8, 24, 1),
    ('Hamilton Khaki Field H70455533',           'hamilton_khaki.jpg',   1, 1, 'Hamilton',           2023,11500000,  16500000,    5, 24, 1),
    ('Casio G-Shock DW-5600E-1V',               'gshock_dw5600.jpg',    1, 3, 'Casio',              2024, 1800000,   2600000,   20, 12, 1),
    ('Casio G-Shock AE-1200WH-1A',              'gshock_ae1200.png',    1, 3, 'Casio',              2024,  550000,    890000,   30, 12, 1),
    ('Casio F-91W',                              'casio_f91w.png',       1, 3, 'Casio',              2023,  200000,    350000,   40, 12, 1),
    ('Casio A168WG-9WDF',                        'casio_a168w.png',      1, 3, 'Casio',              2024,  650000,    950000,   18, 12, 1),
    ('Casio Baby-G BGD-565-7DR',                 'babyg_bgd565.jpg',     1, 3, 'Casio',              2024, 1600000,   2100000,   12, 12, 1),
    ('Casio Baby-G BA-110-1ADR',                 'babyg_ba110.png',      1, 3, 'Casio',              2024, 2150000,   2900000,   10, 12, 1),
    ('Casio ProTrek PRG-270-1A',                 'protrek_prg270.png',   1, 3, 'Casio',              2024, 3800000,   5200000,    5, 12, 1),
    ('SKMEI 1251 Digital',                       'skmei_1251.jpg',       9, 3, 'SKMEI',              2024,  150000,    250000,   25,  6, 1),
    ('SKMEI 1456 Digital Military',              'skmei_1456.jpg',       9, 3, 'SKMEI',              2024,  180000,    300000,   22,  6, 1),
    ('Timex Ironman Classic 30',                 'timex_ironman30.jpg', 10, 3, 'Timex',              2024,  850000,   1350000,   14, 12, 1);
 
-- ------------------------------------------------------------
--  3.17 Phiếu nhập (giữ nguyên)
-- ------------------------------------------------------------
 
INSERT INTO `PHIEUNHAP` (`MNV`, `MNCC`, `TIEN`) VALUES
    (1, 1, 383400000), (1, 2, 170900000), (1, 3, 112500000),
    (1, 4, 299500000), (1, 5, 680000000), (1, 6,  87800000),
    (1, 7, 139000000), (1, 8, 139600000), (1, 9,   7710000),
    (1,10,  11900000);
 
INSERT INTO `CTPHIEUNHAP` (`MPN`, `MSP`, `SL`, `TIENNHAP`) VALUES
    (2,  1, 15, 52500000), (2,  2,  8, 68000000), (2,  3, 12, 50400000),
    (3,  4, 10, 38000000), (3,  5,  7, 38500000), (3,  6,  5, 36000000),
    (4,  7, 20, 96000000), (4,  8,  6, 72000000), (4,  9,  9, 76500000),
    (4, 10, 25, 55000000),
    (5, 11,  2,370000000), (5, 12,  1,165000000), (5, 13,  1,145000000),
    (6, 14,  6, 51000000), (6, 15,  4, 36800000),
    (7, 16, 18, 45000000), (7, 17, 22, 48400000), (7, 18, 12, 45600000),
    (8, 19, 16, 44800000), (8, 20, 14, 44800000), (8, 21, 20, 50000000),
    (1, 22, 25, 70000000), (1, 23, 15, 48000000), (1, 24,  8, 76000000),
    (1, 25,  5, 57500000), (1, 26, 20, 36000000), (1, 27, 30, 16500000),
    (1, 28, 40,  8000000), (1, 29, 18, 11700000), (1, 30, 12, 19200000),
    (1, 31, 10, 21500000), (1, 32,  5, 19000000),
    (9, 33, 25,  3750000), (9, 34, 22,  3960000),
    (10,35, 14, 11900000);
 
-- ------------------------------------------------------------
--  3.18 Mã khuyến mãi mẫu
-- ------------------------------------------------------------
 
INSERT INTO `MAKHUYENMAI` (`MKM`, `TGBD`, `TGKT`, `TT`) VALUES
    ('SUMMER2025', '2025-06-01', '2025-06-30', 1),
    ('CASIO10',    '2025-05-01', '2025-05-31', 0),
    ('SALE8_3',    '2025-03-08', '2025-03-08', 0);
 
INSERT INTO `CTMAKHUYENMAI` (`MKM`, `MSP`, `PTG`) VALUES
    ('SUMMER2025', 7,  10), ('SUMMER2025', 10, 10), ('SUMMER2025', 22, 15),
    ('CASIO10',   26,  10), ('CASIO10',   27,  10), ('CASIO10',   28,  10),
    ('SALE8_3',   19,   8), ('SALE8_3',   20,   8), ('SALE8_3',   21,   8);

INSERT INTO `NGAYLE` (`TEN`, `NGAY`, `TT`) VALUES
 
-- ── 2024 ────────────────────────────────────────────────────
('Tết Dương Lịch',                      '2024-01-01', 1),
('Tết Nguyên Đán - Giao thừa',          '2024-02-08', 1),
('Tết Nguyên Đán - Mùng 1',             '2024-02-10', 1),
('Tết Nguyên Đán - Mùng 2',             '2024-02-11', 1),
('Tết Nguyên Đán - Mùng 3',             '2024-02-12', 1),
('Tết Nguyên Đán - Mùng 4',             '2024-02-13', 1),
('Tết Nguyên Đán - Mùng 5',             '2024-02-14', 1),
('Giỗ Tổ Hùng Vương (10/3 ÂL)',        '2024-04-18', 1),
('Ngày Giải phóng miền Nam',            '2024-04-30', 1),
('Ngày Quốc tế Lao động',               '2024-05-01', 1),
('Ngày Quốc khánh',                     '2024-09-02', 1),
('Ngày Quốc khánh - Nghỉ bù',          '2024-09-03', 1),
 
-- ── 2025 ────────────────────────────────────────────────────
('Tết Dương Lịch',                      '2025-01-01', 1),
('Tết Nguyên Đán - Nghỉ bù trước Tết', '2025-01-25', 1),
('Tết Nguyên Đán - Nghỉ bù trước Tết', '2025-01-26', 1),
('Tết Nguyên Đán - Giao thừa',          '2025-01-28', 1),
('Tết Nguyên Đán - Mùng 1',             '2025-01-29', 1),
('Tết Nguyên Đán - Mùng 2',             '2025-01-30', 1),
('Tết Nguyên Đán - Mùng 3',             '2025-01-31', 1),
('Tết Nguyên Đán - Mùng 4',             '2025-02-01', 1),
('Tết Nguyên Đán - Mùng 5',             '2025-02-02', 1),
('Giỗ Tổ Hùng Vương (10/3 ÂL)',        '2025-04-07', 1),
('Ngày Giải phóng miền Nam',            '2025-04-30', 1),
('Ngày Quốc tế Lao động',               '2025-05-01', 1),
('Ngày Quốc tế Lao động - Nghỉ bù',    '2025-05-02', 1),
('Ngày Quốc khánh',                     '2025-09-02', 1),
 
-- ── 2026 ────────────────────────────────────────────────────
('Tết Dương Lịch',                      '2026-01-01', 1),
('Tết Nguyên Đán - Nghỉ bù trước Tết', '2026-02-14', 1),
('Tết Nguyên Đán - Nghỉ bù trước Tết', '2026-02-15', 1),
('Tết Nguyên Đán - Giao thừa',          '2026-02-16', 1),
('Tết Nguyên Đán - Mùng 1',             '2026-02-17', 1),
('Tết Nguyên Đán - Mùng 2',             '2026-02-18', 1),
('Tết Nguyên Đán - Mùng 3',             '2026-02-19', 1),
('Tết Nguyên Đán - Mùng 4',             '2026-02-20', 1),
('Tết Nguyên Đán - Mùng 5',             '2026-02-21', 1),
('Giỗ Tổ Hùng Vương (10/3 ÂL)',        '2026-04-27', 1),
('Ngày Giải phóng miền Nam',            '2026-04-30', 1),
('Ngày Quốc tế Lao động',               '2026-05-01', 1),
('Ngày Quốc khánh',                     '2026-09-02', 1);
 
 
COMMIT;