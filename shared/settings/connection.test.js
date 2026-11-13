import { describe, expect, it } from 'vitest';
import {
    CONNECTION_STORAGE_KEYS,
    createConnectionSettingsPayload,
    createConnectionStorageUpdate,
    createDefaultMcpServer,
    getConnectionProvider,
    getDefaultMcpUrlForTransport,
    getSelectedModelForProvider,
} from './connection.js';

describe('connection settings helpers', () => {
    it('builds the default connection payload used by sidepanel restore messages', () => {
        expect(createConnectionSettingsPayload({})).toEqual({
            provider: 'web',
            useOfficialApi: false,
            selectedModel: '56fdd199312815e2',
            webThinkingLevel: 'minimal',
            webTemporaryChat: false,
            openaiSelectedModel: '',
            officialBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKey: '',
            officialModel:
                'gemini-4-hydrogen, gemini-4-argon, gemini-4-carbon, gemini-3.5-flash-lite',
            thinkingLevel: 'low',
            officialWebSearch: false,
            openaiBaseUrl: '',
            openaiApiKey: '',
            openaiModel: '',
            openaiThinkingLevel: 'low',
            openaiUseResponsesApi: false,
            openaiWebSearch: false,
            dedicatedApiProviders: {
                openai_official: {
                    provider: 'openai_official',
                    baseUrl: 'https://api.openai.com/v1',
                    apiKey: '',
                    model: 'gpt-5.6-terra, gpt-5.6-sol, gpt-5.6-luna, gpt-6-astra',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                deepseek: {
                    provider: 'deepseek',
                    baseUrl: 'https://api.deepseek.com',
                    apiKey: '',
                    model: 'deepseek-v4-pro, deepseek-v4-flash, deepseek-reasoner, deepseek-chat',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                openrouter: {
                    provider: 'openrouter',
                    baseUrl: 'https://openrouter.ai/api/v1',
                    apiKey: '',
                    model: 'openai/gpt-5.6-terra, anthropic/claude-sonnet-5, deepseek/deepseek-v4-flash',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                dashscope: {
                    provider: 'dashscope',
                    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    apiKey: '',
                    model: 'qwen3.8-max, qwen3.8-flash-next, qwen3.7-max, qwen3-vl-plus, qwq-plus',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                anthropic: {
                    provider: 'anthropic',
                    baseUrl: 'https://api.anthropic.com/v1',
                    apiKey: '',
                    model: 'claude-sonnet-5, claude-opus-5, claude-fable-5-1, claude-haiku-4-5',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                zhipu: {
                    provider: 'zhipu',
                    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                    apiKey: '',
                    model: 'glm-5.3, glm-5.2, glm-5.1, glm-5',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
            },
            mcpEnabled: false,
            mcpTransport: 'streamable-http',
            mcpServerUrl: 'http://127.0.0.1:3006/mcp',
            mcpServers: null,
            mcpActiveServerId: null,
        });
    });

    it('preserves OpenAI-specific selected model and legacy web-search fallback behavior', () => {
        const payload = createConnectionSettingsPayload(
            {
                geminiProvider: 'openai',
                geminiModel: 'gemini-3-flash',
                geminiOpenaiSelectedModel: 'gpt-5',
                geminiOpenaiModel: 'gpt-4.1, gpt-5',
                openaiWebSearchMode: 'chat',
            },
            { includeLegacyFallbacks: true }
        );

        expect(payload.provider).toBe('openai');
        expect(payload.selectedModel).toBe('gpt-5');
        expect(payload.openaiModel).toBe('gpt-4.1, gpt-5');
        expect(payload.openaiUseResponsesApi).toBe(false);
        expect(payload.openaiWebSearch).toBe(true);
    });

    it('normalizes provider and selected model fallback values', () => {
        expect(getConnectionProvider({ geminiUseOfficialApi: true })).toBe('official');
        expect(getConnectionProvider({})).toBe('web');
        expect(getSelectedModelForProvider({}, 'openai')).toBe('openai_custom');
        expect(getSelectedModelForProvider({}, 'deepseek')).toBe('deepseek-v4-pro');
        expect(getSelectedModelForProvider({}, 'web')).toBe('56fdd199312815e2');
    });

    it('declares the storage keys needed for connection restore', () => {
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiProvider');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiModel');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiWebThinkingLevel');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiWebTemporaryChat');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiOpenaiSelectedModel');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiDeepseekApiKey');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiOpenrouterProviderRouting');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiDashscopeSelectedModel');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiAnthropicSelectedModel');
        expect(CONNECTION_STORAGE_KEYS).toContain('geminiMcpServers');
    });

    it('creates a shared storage update for connection saves', () => {
        expect(
            createConnectionStorageUpdate({
                provider: 'openai',
                webThinkingLevel: 'minimal',
                webTemporaryChat: true,
                openaiBaseUrl: 'https://api.example.test/v1',
                openaiApiKey: 'sk-test',
                openaiModel: 'gpt-5',
                openaiUseResponsesApi: true,
                openaiWebSearch: true,
                dedicatedApiProviders: {
                    deepseek: {
                        baseUrl: 'https://api.deepseek.com',
                        apiKey: 'deepseek-key',
                        model: 'deepseek-v4-pro',
                        selectedModel: 'deepseek-v4-pro',
                        thinkingLevel: 'high',
                    },
                },
                mcpEnabled: true,
                mcpServers: [{ id: 'srv', url: 'http://localhost/mcp' }],
                mcpActiveServerId: 'srv',
            })
        ).toEqual(
            expect.objectContaining({
                geminiProvider: 'openai',
                geminiUseOfficialApi: false,
                geminiWebThinkingLevel: 'minimal',
                geminiWebTemporaryChat: true,
                geminiOpenaiBaseUrl: 'https://api.example.test/v1',
                geminiOpenaiApiKey: 'sk-test',
                geminiOpenaiModel: 'gpt-5',
                geminiOpenaiUseResponsesApi: true,
                geminiOpenaiWebSearch: true,
                geminiDeepseekApiKey: 'deepseek-key',
                geminiDeepseekSelectedModel: 'deepseek-v4-pro',
                geminiDeepseekThinkingLevel: 'high',
                geminiMcpEnabled: true,
                geminiMcpTransport: 'streamable-http',
                geminiMcpServerUrl: '',
                geminiMcpServers: [{ id: 'srv', url: 'http://localhost/mcp' }],
                geminiMcpActiveServerId: 'srv',
            })
        );
    });

    it('creates default MCP server data and transport-specific URLs', () => {
        expect(createDefaultMcpServer('srv_test')).toEqual({
            id: 'srv_test',
            name: 'Local Proxy',
            transport: 'streamable-http',
            url: 'http://127.0.0.1:3006/mcp',
            headers: {},
            enabled: true,
            toolMode: 'all',
            enabledTools: [],
        });
        expect(getDefaultMcpUrlForTransport('ws')).toBe('ws://127.0.0.1:3006/mcp');
        expect(getDefaultMcpUrlForTransport('streamable-http')).toBe('http://127.0.0.1:3006/mcp');
        expect(getDefaultMcpUrlForTransport('sse')).toBe('http://127.0.0.1:3006/sse');
    });

    it('uses the shared readable ID factory for default MCP server IDs', () => {
        const server = createDefaultMcpServer();

        expect(server.id).toMatch(/^srv_[A-Z0-9-]+$/);
        expect(server.id).not.toMatch(/^srv_\d+$/);
    });
});
