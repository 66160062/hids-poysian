import thaiAddressData from '../assets/thai_address.json';

export interface ThaiAddress {
  district: string; // ตำบล/แขวง
  amphoe: string;   // อำเภอ/เขต
  province: string; // จังหวัด
  zipcode: number;  // รหัสไปรษณีย์
}

export interface AddressFilterScope {
  province?: string;
  amphoe?: string;
  district?: string;
}

export function useThaiAddress() {
  const addresses = thaiAddressData as ThaiAddress[];

  const filterAddresses = (query: string, scope?: AddressFilterScope) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    
    let filtered = addresses;

    // กรองด้วย scope ก่อน (ถ้ามี)
    if (scope) {
      if (scope.province && scope.province.trim() !== '') {
        filtered = filtered.filter(item => item.province.includes(scope.province!));
      }
      if (scope.amphoe && scope.amphoe.trim() !== '') {
        filtered = filtered.filter(item => item.amphoe.includes(scope.amphoe!));
      }
      if (scope.district && scope.district.trim() !== '') {
        filtered = filtered.filter(item => item.district.includes(scope.district!));
      }
    }

    // ค้นหาโดยให้ความสำคัญกับสิ่งที่ขึ้นต้นด้วยคำค้นหาก่อน
    return filtered.filter(item => {
      const districtMatch = item.district.toLowerCase().includes(q);
      const amphoeMatch = item.amphoe.toLowerCase().includes(q);
      const provinceMatch = item.province.toLowerCase().includes(q);
      const zipcodeMatch = item.zipcode.toString().includes(q);
      
      return districtMatch || amphoeMatch || provinceMatch || zipcodeMatch;
    }).slice(0, 50); // จำกัดผลลัพธ์เพื่อประสิทธิภาพ
  };

  return {
    addresses,
    filterAddresses
  };
}
