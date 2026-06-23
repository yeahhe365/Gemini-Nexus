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
            officialModel: 'gemini-3-flash-preview, gemini-3.1-pro-preview',
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
                    model: 'gpt-5.1, gpt-5, gpt-4.1',
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
                    model: 'openai/gpt-5.2, anthropic/claude-sonnet-4.5, google/gemini-3-pro-preview, deepseek/deepseek-v3.2',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                dashscope: {
                    provider: 'dashscope',
                    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    apiKey: '',
                    model: 'qwen3.7-max, qwen3.6-plus, qwen-plus, qwen3-vl-plus, qwen-vl-max, qwq-plus',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                anthropic: {
                    provider: 'anthropic',
                    baseUrl: 'https://api.anthropic.com/v1',
                    apiKey: '',
                    model: 'claude-sonnet-4-5, claude-opus-4-1, claude-haiku-4-5',
                    selectedModel: '',
                    thinkingLevel: 'low',
                    webSearch: false,
                    providerRouting: '',
                },
                zhipu: {
                    provider: 'zhipu',
                    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                    apiKey: '',
                    model: 'glm-4.6, glm-4.5, glm-4-plus',
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
