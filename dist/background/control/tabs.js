const RESTRICTED_URL_PREFIXES = [
    'chrome://',
    'edge://',
    'about:',
    'chrome-extension://',
    'view-source:',
];

const RESTRICTED_URLS = ['https://chromewebstore.google.com', 'https://chrome.google.com/webstore'];

export function getTabUrl(tab) {
    return tab?.url || tab?.pendingUrl || '';
}

export function getTabControlAvailability(tab) {
    const urlRaw = getTabUrl(tab);
    if (!urlRaw) {
        return { controllable: false, reason: 'no_url' };
    }

    const url = urlRaw.toLowerCase();
    const isRestricted =
        RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)) ||
        RESTRICTED_URLS.some((prefix) => url.startsWith(prefix));

    return {
        controllable: !isRestricted,
        reason: isRestricted ? 'restricted' : null,
    };
}

export function toControlTabSummary(tab) {
    if (!tab) return null;

    const availability = getTabControlAvailability(tab);
    return {
        id: tab.id,
        title: tab.title,
        url: getTabUrl(tab),
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        controllable: availability.controllable,
        reason: availability.reason,
    };
}
