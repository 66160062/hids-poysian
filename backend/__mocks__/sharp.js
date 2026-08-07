// sharp() returns a chainable builder; every method that returns "this" in the
// real API returns the same mock object here so call chains like
// sharp(buffer).rotate().resize({...}).jpeg({...}).toBuffer() keep working.
function createSharpMock() {
  const instance = {
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100, format: 'jpeg' }),
    rotate: jest.fn(() => instance),
    resize: jest.fn(() => instance),
    jpeg: jest.fn(() => instance),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
  };
  return instance;
}

module.exports = jest.fn(createSharpMock);
