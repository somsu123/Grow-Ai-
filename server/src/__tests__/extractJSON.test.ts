/**
 * Tests for extractJSONFromText — the robust JSON recovery function
 * used to parse LLM output that may contain markdown fences, extra text, etc.
 */

// We need to access the private function — export it for testing
// This test imports the function from a test export
import { extractJSONFromTextForTest } from '../services/aiExtractor.service';

const VALID_JSON = JSON.stringify({
  records: [{ name: 'John', email: 'john@example.com' }],
  skipped: [],
});

describe('extractJSONFromText', () => {
  it('parses clean JSON directly', () => {
    const result = extractJSONFromTextForTest(VALID_JSON);
    expect(JSON.parse(result)).toHaveProperty('records');
  });

  it('strips ```json ... ``` markdown fences', () => {
    const fenced = `\`\`\`json\n${VALID_JSON}\n\`\`\``;
    const result = extractJSONFromTextForTest(fenced);
    expect(JSON.parse(result)).toHaveProperty('records');
  });

  it('strips ``` ... ``` fences without language tag', () => {
    const fenced = `\`\`\`\n${VALID_JSON}\n\`\`\``;
    const result = extractJSONFromTextForTest(fenced);
    expect(JSON.parse(result)).toHaveProperty('records');
  });

  it('extracts JSON from prose text before and after', () => {
    const withProse = `Here is the extracted data:\n${VALID_JSON}\nThat's all.`;
    const result = extractJSONFromTextForTest(withProse);
    expect(JSON.parse(result)).toHaveProperty('records');
  });

  it('handles JSON with leading/trailing whitespace', () => {
    const withSpaces = `   \n  ${VALID_JSON}  \n  `;
    const result = extractJSONFromTextForTest(withSpaces);
    expect(JSON.parse(result)).toHaveProperty('records');
  });

  it('throws or returns empty for completely invalid input', () => {
    expect(() => {
      const result = extractJSONFromTextForTest('No JSON here at all');
      JSON.parse(result);
    }).toThrow();
  });
});
