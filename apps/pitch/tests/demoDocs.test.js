import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const docsRoot = resolve(process.cwd(), '../../docs/team/person-4-pitch-demo');
const sharedRoot = resolve(process.cwd(), '../../shared');

function readDoc(fileName) {
  return readFileSync(resolve(docsRoot, fileName), 'utf8');
}

describe('Person 4 demo documents', () => {
  it('includes a demo script with live and fallback paths', () => {
    const script = readDoc('demo-script.md');

    expect(script).toMatch(/90-second/i);
    expect(script).toMatch(/live path/i);
    expect(script).toMatch(/fallback path/i);
    expect(script).toMatch(/ibuprofen/i);
  });

  it('documents insurance value and Android future plan', () => {
    expect(readDoc('insurance-story.md')).toMatch(/readmissions/i);
    expect(readDoc('insurance-story.md')).toMatch(/adherence/i);
    expect(readDoc('android-future.md')).toMatch(/same backend/i);
    expect(readDoc('android-future.md')).toMatch(/push notifications/i);
  });

  it('has the sample note and golden chat answer ready for rehearsal', () => {
    expect(readFileSync(resolve(sharedRoot, 'sampleDischargeNote.txt'), 'utf8')).toMatch(/pneumonia/i);
    expect(readFileSync(resolve(sharedRoot, 'goldenIbuprofenAnswer.txt'), 'utf8')).toMatch(/doctor or pharmacist/i);
  });
});
