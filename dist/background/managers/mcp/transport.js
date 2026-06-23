// @ts-check

import {
    asHttpUrl,
    asWsUrl,
    hasMcpHeaders,
    inferMcpTransport,
    mergeHttpTransportHeaders,
    mergeMcpHeaders,
    normalizeMcpHeaders,
    stableMcpHeadersKey,
} from '../../../shared/mcp/transport.js';

export { asHttpUrl, asWsUrl, mergeHttpTransportHeaders };
export const inferTransport = inferMcpTransport;
export const normalizeHeaders = normalizeMcpHeaders;
export const hasHeaders = hasMcpHeaders;
export const stableHeadersKey = stableMcpHeadersKey;
export const mergeHeaders = mergeMcpHeaders;
