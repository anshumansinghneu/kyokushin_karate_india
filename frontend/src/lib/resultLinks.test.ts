import { describe, it, expect } from 'vitest';
import { buildResultUrl } from './resultLinks';

describe('buildResultUrl', () => {
  it('joins origin and result id', () => {
    expect(buildResultUrl('https://example.com', 'abc-123')).toBe('https://example.com/results/abc-123');
  });

  it('strips a trailing slash from origin', () => {
    expect(buildResultUrl('https://example.com/', 'abc')).toBe('https://example.com/results/abc');
  });

  it('returns empty string when origin is missing', () => {
    expect(buildResultUrl('', 'abc')).toBe('');
  });
});
