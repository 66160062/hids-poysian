function createSupabaseClientMock() {
  const bucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
    // ดีฟอลต์ = ยังไม่มีไฟล์รูปย่อ ให้ ensureThumbnail เดินเส้นทางสร้างใหม่
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
    download: jest.fn().mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(Buffer.from('original')) },
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mock.jpg' } }),
  };
  return {
    storage: {
      from: jest.fn(() => bucket),
    },
  };
}

module.exports = {
  createClient: jest.fn(createSupabaseClientMock),
};
