(function () {
    function normalizeRules(value) {
        const items = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
        return items.map((item) => parseRule(item)).filter(Boolean);
    }

    function parseRule(value) {
        let raw = String(value || '').trim();
        if (!raw || raw.startsWith('#')) return null;

        raw = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
        raw = raw.split(/[?#]/)[0].trim();

        const slashIndex = raw.indexOf('/');
        const hostPart = slashIndex === -1 ? raw : raw.slice(0, slashIndex);
        let path = slashIndex === -1 ? '' : raw.slice(slashIndex);
        let host = hostPart.trim().toLowerCase().replace(/:\d+$/, '');
        let wildcard = false;

        if (host.startsWith('*.')) {
            wildcard = true;
            host = host.slice(2);
        }

        if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;

        path = path.replace(/\/+$/, '');
        return { host, path, wildcard };
    }

    function matchesRule(url, rule) {
        const hostname = url.hostname.toLowerCase();
        const hostMatches = rule.wildcard
            ? hostname === rule.host || hostname.endsWith(`.${rule.host}`)
            : hostname === rule.host;

        if (!hostMatches) return false;
        if (!rule.path) return true;

        const path = url.pathname || '/';
        return path === rule.path || path.startsWith(`${rule.path}/`);
    }

    function getHref(locationLike) {
        if (typeof locationLike === 'string') return locationLike;
        return locationLike && typeof locationLike.href === 'string' ? locationLike.href : '';
    }

    function matchesLocation(locationLike, value) {
        try {
            const url = new URL(getHref(locationLike), window.location.href);
            return normalizeRules(value).some((rule) => matchesRule(url, rule));
        } catch {
            return false;
        }
    }

    window.GeminiSelectionBlacklist = {
        matchesLocation,
        normalizeRules,
    };
})();
