function createSupabaseClientMock() {
  const bucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
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
