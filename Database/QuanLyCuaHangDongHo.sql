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