import { describe, expect, it } from 'vitest';
import { PromptBuilder } from './builder.js';

describe('PromptBuilder', () => {
    it('preserves caller-provided system instructions', async () => {
        const builder = new PromptBuilder(null, null);

        const result = await builder.build({
            text: 'Make this visual',
            systemInstruction: '[Live Artifacts Inline Protocol - zh]\nReturn HTML.',
        });

        expect(result).toEqual({
            userPrompt: 'Make this visual',
            systemInstruction: expect.stringContaining(
                '[Live Artifacts Inline Protocol - zh]\nReturn HTML.'
            ),
        });
    });
});
