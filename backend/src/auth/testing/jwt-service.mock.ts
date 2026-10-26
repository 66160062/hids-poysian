// mock JwtService สำหรับ spec ของ controller ที่ใช้ AuthGuard/AdminGuard
// token ที่รองรับ: admin-token, inspector-token, link-token (ลิงก์ลูกค้า/ผู้รับเหมา) นอกนั้นถือว่าไม่ถูกต้อง
export const jwtServiceMock = {
  verify: jest.fn((token: string) => {
    if (token === 'admin-token') return { sub: 1, role: 'admin' };
    if (token === 'inspector-token') return { sub: 2, role: 'inspector' };
    if (token === 'link-token') return { project_id: 1, role: 'customer' };
    throw new Error('invalid token');
  }),
};
