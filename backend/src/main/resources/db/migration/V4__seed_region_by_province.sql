-- V4: Reassign each university's `region` based on the province mentioned in its address.
-- Previously every row defaulted to NORTH (entity default) because V3 never touched the column.
-- Reference: 3-vùng mapping (Bắc / Trung / Nam) per user's table (sourced from
-- https://github.com/tam1ttam/cook_with_me_app_be).
--
-- Strategy: match the LAST occurrence of the canonical province name inside `address`
-- using ILIKE '%<province>%'. Vietnamese address lines typically end with "...,
-- <Quận/Huyện>, <Tỉnh/Thành phố>" so substring match is reliable. We order the WHEN
-- branches so longer / more specific patterns (e.g. 'TP. Hồ Chí Minh') win over their
-- substrings (e.g. 'Hồ Chí Minh').

UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%TP. Hồ Chí Minh%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Tp. Hồ Chí Minh%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%TP.HCM%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Tp.HCM%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Hồ Chí Minh%' AND address NOT ILIKE '%TP. Hồ Chí Minh%' AND address NOT ILIKE '%Tp. Hồ Chí Minh%' AND address NOT ILIKE '%TP.HCM%' AND address NOT ILIKE '%Tp.HCM%';

-- Remaining SOUTH provinces
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Bắc Giang%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Bắc Kạn%' OR address ILIKE '%Bắc Cạn%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Bắc Ninh%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Cao Bằng%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Điện Biên%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hà Giang%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hà Nam%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hà Nội%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hải Dương%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hải Phòng%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hòa Bình%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Hưng Yên%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Lai Châu%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Lạng Sơn%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Lào Cai%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Nam Định%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Ninh Bình%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Phú Thọ%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Quảng Ninh%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Sơn La%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Thái Bình%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Thái Nguyên%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Tuyên Quang%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Vĩnh Phúc%';
UPDATE universities SET region = 'NORTH' WHERE address ILIKE '%Yên Bái%';

-- CENTRAL
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Bình Định%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Bình Thuận%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Đà Nẵng%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Đắk Lắk%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Đắk Nông%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Gia Lai%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Hà Tĩnh%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Khánh Hòa%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Kon Tum%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Lâm Đồng%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Nghệ An%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Ninh Thuận%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Phú Yên%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Quảng Bình%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Quảng Nam%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Quảng Ngãi%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Quảng Trị%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Thanh Hóa%';
UPDATE universities SET region = 'CENTRAL' WHERE address ILIKE '%Thừa Thiên Huế%' OR address ILIKE '%Thua Thien Hue%' OR address ILIKE '%Huế%';

-- SOUTH (excluding HCM already matched)
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%An Giang%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Bà Rịa%' OR address ILIKE '%Vũng Tàu%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Bạc Liêu%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Bến Tre%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Bình Dương%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Bình Phước%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Cà Mau%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Cần Thơ%' OR address ILIKE '%Can Tho%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Đồng Nai%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Đồng Tháp%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Hậu Giang%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Kiên Giang%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Long An%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Sóc Trăng%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Tây Ninh%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Tiền Giang%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Trà Vinh%';
UPDATE universities SET region = 'SOUTH' WHERE address ILIKE '%Vĩnh Long%';
