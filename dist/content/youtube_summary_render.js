(function () {
    const youtube = globalThis.GeminiNexusYouTube;
    const SECONDS_PER_MINUTE = 60;
    const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
    const TIME_QUERY_PARAMS = Object.freeze(['t', 'start', 'time_continue']);
    const TIME_UNIT_SECONDS = Object.freeze({
        h: SECONDS_PER_HOUR,
        m: SECONDS_PER_MINUTE,
        s: 1,
    });
    const SEEK_SECONDS_DATA_KEY = 'seekSeconds';
    const VIDEO_SELECTOR = 'video';
    const PLAIN_SECONDS_PATTERN = /^\d+$/;
    const TIME_UNIT_TOKEN_PATTERN = /(\d+)\s*([hms])/g;
    const TRAILING_URL_PUNCTUATION_PATTERN = /^(.+?)([.,!?;:]+)?$/;
    const INLINE_MARKDOWN_PATTERN =
        /(`[^`\n]+`)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|\[([^\]\n]{1,160})\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>)]+)|(\b(?:\d{1,2}:)?[0-5]?\d:[0-5]\d\b)/g;
    const HEADING_PATTERN = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
    const UNORDERED_LIST_ITEM_PATTERN = /^\s*[-*+]\s+(.+)$/;
    const ORDERED_LIST_ITEM_PATTERN = /^\s*\d+[.)]\s+(.+)$/;
    const BLOCKQUOTE_MARKER_PATTERN = /^\s*>\s?/;
    const HORIZONTAL_RULE_PATTERN = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
    const LEADING_TABLE_PIPE_PATTERN = /^\|/;
    const TRAILING_TABLE_PIPE_PATTERN = /\|$/;
    const TABLE_SEPARATOR_CELL_PATTERN = /^:?-{3,}:?$/;
    const CODE_FENCE_BOUNDARY_PATTERN = /^```/;
    const CODE_FENCE_START_PATTERN = /^```([\w-]+)?\s*$/;
    const CODE_FENCE_END_PATTERN = /^```\s*$/;

    function parseTimestampToSeconds(timestamp) {
        const parts = String(timestamp || '')
            .split(':')
            .map((part) => Number(part));
        if (parts.some((part) => !Number.isInteger(part) || part < 0)) return null;
        if (parts.length === 2) return parts[0] * SECONDS_PER_MINUTE + parts[1];
        if (parts.length === 3) {
            return parts[0] * SECONDS_PER_HOUR + parts[1] * SECONDS_PER_MINUTE + parts[2];
        }
        return null;
    }

    function parseTimeParamToSeconds(value) {
        const raw = String(value || '')
            .trim()
            .toLowerCase();
        if (!raw) return null;
        if (PLAIN_SECONDS_PATTERN.test(raw)) return Number(raw);

        const timestampSeconds = parseTimestampToSeconds(raw);
        if (timestampSeconds !== null) return timestampSeconds;

        let total = 0;
        let matched = false;
        for (const match of raw.matchAll(TIME_UNIT_TOKEN_PATTERN)) {
            matched = true;
            const amount = Number(match[1]);
            total += amount * TIME_UNIT_SECONDS[match[2]];
        }
        return matched ? total : null;
    }

    function getYouTubeTimeSeconds(urlLike) {
        const url = youtube.parseUrl(urlLike);
        if (!url) return null;

        const value = TIME_QUERY_PARAMS.map((key) => url.searchParams.get(key)).find(Boolean);
        return parseTimeParamToSeconds(value);
    }

    function formatTimeParam(seconds) {
        return `${Math.max(0, Math.floor(seconds))}s`;
    }

    function createTimeUrl(videoUrl, seconds) {
        const url = youtube.parseUrl(videoUrl);
        if (!url || !Number.isFinite(seconds)) return videoUrl;
        url.searchParams.set('t', formatTimeParam(seconds));
        return url.toString();
    }

    function splitTrailingUrlPunctuation(url) {
        const match = String(url || '').match(TRAILING_URL_PUNCTUATION_PATTERN);
        return {
            url: match ? match[1] : url,
            trailing: match ? match[2] || '' : '',
        };
    }

    function seekCurrentVideo(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return false;
        const video = document.querySelector(VIDEO_SELECTOR);
        if (!video) return false;

        video.currentTime = seconds;
        try {
            video.play?.()?.catch?.(() => {});
        } catch {}

        try {
            const url = new URL(window.location.href);
            url.searchParams.set('t', formatTimeParam(seconds));
            window.history.replaceState(window.history.state, '', url);
        } catch {}
        return true;
    }

    function createLink(label, href, currentVideoUrl, explicitSeconds = null) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        link.rel = 'noopener noreferrer';

        const targetVideoId = youtube.getYouTubeVideoId(href);
        const currentVideoId = youtube.getYouTubeVideoId(currentVideoUrl);
        const labelSeconds = parseTimestampToSeconds(label);
        const linkSeconds = explicitSeconds ?? getYouTubeTimeSeconds(href) ?? labelSeconds;

        if (targetVideoId && targetVideoId === currentVideoId && Number.isFinite(linkSeconds)) {
            link.dataset[SEEK_SECONDS_DATA_KEY] = String(Math.max(0, Math.floor(linkSeconds)));
            link.target = '_self';
        } else {
            link.target = targetVideoId ? '_self' : '_blank';
        }

        return link;
    }

    function createInlineMarkdownPattern() {
        return new RegExp(INLINE_MARKDOWN_PATTERN);
    }

    function appendInlineMarkdown(container, text, videoUrl) {
        const pattern = createInlineMarkdownPattern();
        let cursor = 0;
        let match;

        while ((match = pattern.exec(text))) {
            if (match.index > cursor) {
                container.appendChild(document.createTextNode(text.slice(cursor, match.index)));
            }

            if (match[1]) {
                const code = document.createElement('code');
                code.textContent = match[1].slice(1, -1);
                container.appendChild(code);
            } else if (match[2] || match[3]) {
                const strong = document.createElement('strong');
                appendInlineMarkdown(strong, match[2] || match[3], videoUrl);
                container.appendChild(strong);
            } else if (match[4] || match[5]) {
                const emphasis = document.createElement('em');
                appendInlineMarkdown(emphasis, match[4] || match[5], videoUrl);
                container.appendChild(emphasis);
            } else if (match[6] && match[7]) {
                container.appendChild(createLink(match[6], match[7], videoUrl));
            } else if (match[8]) {
                const splitUrl = splitTrailingUrlPunctuation(match[8]);
                container.appendChild(createLink(splitUrl.url, splitUrl.url, videoUrl));
                if (splitUrl.trailing) {
                    container.appendChild(document.createTextNode(splitUrl.trailing));
                }
            } else if (match[9]) {
                const seconds = parseTimestampToSeconds(match[9]);
                const href = createTimeUrl(videoUrl, seconds);
                container.appendChild(createLink(match[9], href, videoUrl, seconds));
            }

            cursor = pattern.lastIndex;
        }

        if (cursor < text.length) {
            container.appendChild(document.createTextNode(text.slice(cursor)));
        }
    }

    function appendInlineLines(container, lines, videoUrl) {
        lines.forEach((line, index) => {
            if (index > 0) container.appendChild(document.createElement('br'));
            appendInlineMarkdown(container, line, videoUrl);
        });
    }

    function isBlankLine(line) {
        return String(line || '').trim() === '';
    }

    function getHeading(line) {
        const match = String(line || '').match(HEADING_PATTERN);
        if (!match) return null;
        return {
            level: match[1].length,
            text: match[2],
        };
    }

    function getListItem(line) {
        const unordered = String(line || '').match(UNORDERED_LIST_ITEM_PATTERN);
        if (unordered) return { type: 'ul', text: unordered[1] };

        const ordered = String(line || '').match(ORDERED_LIST_ITEM_PATTERN);
        if (ordered) return { type: 'ol', text: ordered[1] };

        return null;
    }

    function isBlockquoteLine(line) {
        return BLOCKQUOTE_MARKER_PATTERN.test(String(line || ''));
    }

    function isHorizontalRule(line) {
        return HORIZONTAL_RULE_PATTERN.test(String(line || ''));
    }

    function isCodeFenceBoundary(line) {
        return CODE_FENCE_BOUNDARY_PATTERN.test(String(line || '').trim());
    }

    function getCodeFenceLanguage(line) {
        const match = String(line || '')
            .trim()
            .match(CODE_FENCE_START_PATTERN);
        return match ? match[1] || '' : null;
    }

    function isCodeFenceEnd(line) {
        return CODE_FENCE_END_PATTERN.test(String(line || '').trim());
    }

    function splitTableRow(line) {
        const trimmed = String(line || '').trim();
        if (!trimmed.includes('|')) return null;
        const cells = trimmed
            .replace(LEADING_TABLE_PIPE_PATTERN, '')
            .replace(TRAILING_TABLE_PIPE_PATTERN, '')
            .split('|')
            .map((cell) => cell.trim());
        return cells.length > 1 ? cells : null;
    }

    function isTableSeparator(line) {
        const cells = splitTableRow(line);
        return Boolean(cells?.every((cell) => TABLE_SEPARATOR_CELL_PATTERN.test(cell)));
    }

    function getTableHeaderCells(lines, index) {
        if (index + 1 >= lines.length) return null;
        const headerCells = splitTableRow(lines[index]);
        return headerCells && isTableSeparator(lines[index + 1]) ? headerCells : null;
    }

    function createCodeBlock(codeLines, language = '') {
        const wrapper = document.createElement('pre');
        const code = document.createElement('code');
        if (language) code.dataset.language = language;
        code.textContent = codeLines.join('\n');
        wrapper.appendChild(code);
        return wrapper;
    }

    function createTable(headerCells, bodyRows, videoUrl) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        headerCells.forEach((cell) => {
            const th = document.createElement('th');
            appendInlineMarkdown(th, cell, videoUrl);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        bodyRows.forEach((rowCells) => {
            const row = document.createElement('tr');
            rowCells.forEach((cell) => {
                const td = document.createElement('td');
                appendInlineMarkdown(td, cell, videoUrl);
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    function collectParagraph(lines, startIndex) {
        const paragraphLines = [];
        let index = startIndex;

        while (index < lines.length) {
            const line = lines[index];
            if (
                isBlankLine(line) ||
                getHeading(line) ||
                getListItem(line) ||
                isBlockquoteLine(line) ||
                isHorizontalRule(line) ||
                isCodeFenceBoundary(line)
            ) {
                break;
            }

            if (getTableHeaderCells(lines, index)) {
                break;
            }

            paragraphLines.push(line);
            index += 1;
        }

        return { lines: paragraphLines, nextIndex: index };
    }

    function renderSummaryText(text, videoUrl) {
        const fragment = document.createDocumentFragment();
        const lines = String(text || '').split(/\r?\n/);
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];
            const trimmed = line.trim();

            if (!trimmed) {
                index += 1;
                continue;
            }

            const codeFenceLanguage = getCodeFenceLanguage(trimmed);
            if (codeFenceLanguage !== null) {
                const codeLines = [];
                index += 1;
                while (index < lines.length && !isCodeFenceEnd(lines[index])) {
                    codeLines.push(lines[index]);
                    index += 1;
                }
                if (index < lines.length) index += 1;
                fragment.appendChild(createCodeBlock(codeLines, codeFenceLanguage));
                continue;
            }

            const heading = getHeading(line);
            if (heading) {
                const element = document.createElement(`h${heading.level}`);
                appendInlineMarkdown(element, heading.text, videoUrl);
                fragment.appendChild(element);
                index += 1;
                continue;
            }

            if (isHorizontalRule(line)) {
                fragment.appendChild(document.createElement('hr'));
                index += 1;
                continue;
            }

            if (isBlockquoteLine(line)) {
                const quote = document.createElement('blockquote');
                const quoteLines = [];
                while (index < lines.length && isBlockquoteLine(lines[index])) {
                    quoteLines.push(lines[index].replace(BLOCKQUOTE_MARKER_PATTERN, ''));
                    index += 1;
                }
                quote.appendChild(renderSummaryText(quoteLines.join('\n'), videoUrl));
                fragment.appendChild(quote);
                continue;
            }

            const listItem = getListItem(line);
            if (listItem) {
                const list = document.createElement(listItem.type);
                while (index < lines.length) {
                    const item = getListItem(lines[index]);
                    if (!item || item.type !== listItem.type) break;
                    const li = document.createElement('li');
                    appendInlineMarkdown(li, item.text, videoUrl);
                    list.appendChild(li);
                    index += 1;
                }
                fragment.appendChild(list);
                continue;
            }

            const headerCells = getTableHeaderCells(lines, index);
            if (headerCells) {
                const bodyRows = [];
                index += 2;
                while (index < lines.length) {
                    const rowCells = splitTableRow(lines[index]);
                    if (!rowCells || isTableSeparator(lines[index])) break;
                    bodyRows.push(rowCells);
                    index += 1;
                }
                fragment.appendChild(createTable(headerCells, bodyRows, videoUrl));
                continue;
            }

            const paragraph = collectParagraph(lines, index);
            const element = document.createElement('p');
            appendInlineLines(element, paragraph.lines, videoUrl);
            fragment.appendChild(element);
            index = paragraph.nextIndex;
        }

        return fragment;
    }

    window.GeminiYouTubeSummaryRender = {
        SEEK_SECONDS_DATA_KEY,
        parseTimestampToSeconds,
        renderSummaryText,
        seekCurrentVideo,
    };
})();
