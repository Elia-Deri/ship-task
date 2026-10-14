import { createSseDataReader } from './sse';

describe('createSseDataReader', () => {
  it('returns each frame once, even when the text keeps growing', () => {
    const readSseData = createSseDataReader();

    expect(readSseData('data: {"a":1}\n\ndata: {"b"')).toEqual(['{"a":1}']);
    expect(readSseData('data: {"a":1}\n\ndata: {"b":2}\n\n')).toEqual(['{"b":2}']);
    expect(readSseData('data: {"a":1}\n\ndata: {"b":2}\n\n')).toEqual([]);
  });

  it('joins multi-line data and ignores other fields', () => {
    const readSseData = createSseDataReader();

    expect(readSseData(': keep-alive\nevent: message\ndata: line1\ndata: line2\n\n')).toEqual([
      'line1\nline2',
    ]);
  });

  it('accepts CRLF line endings', () => {
    const readSseData = createSseDataReader();

    expect(readSseData('data: {"a":1}\r\n\r\n')).toEqual(['{"a":1}']);
  });
});
