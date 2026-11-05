function getMessageCount(session) {
    return Array.isArray(session?.messages) ? session.messages.length : 0;
}

export function normalizeSessionSavePayload(payload) {
    if (Array.isArray(payload)) {
        return { sessions: payload, mutation: null };
    }
    if (payload && typeof payload === 'object' && Array.isArray(payload.sessions)) {
        return {
            sessions: payload.sessions,
            mutation: payload.mutation || null,
        };
    }
    return { sessions: payload, mutation: null };
}

export function normalizeDeletedSessionIds(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function isDeletedSessionId(sessionId, deletedSessionIds) {
    return Boolean(sessionId && deletedSessionIds?.[sessionId]);
}

function removeDeletedSessionIds(sessions, deletedSessionIds) {
    if (!Array.isArray(sessions)) return sessions;
    return sessions.filter((session) => !isDeletedSessionId(session?.id, deletedSessionIds));
}

function findIncomingSession(incomingSessions, sessionId) {
    return incomingSessions.find((session) => session?.id === sessionId) || null;
}

function getMetadataFields(mutation) {
    if (!Array.isArray(mutation?.fields) || mutation.fields.length === 0) {
        return null;
    }

    const fields = new Set(
        mutation.fields.filter(
            (field) => field === 'title' || field === 'isPinned' || field === 'model'
        )
    );
    return fields.size > 0 ? fields : null;
}

export function mergeSessionSaveWithCurrent(
    incomingSessions,
    currentSessions,
    mutation,
    deletedSessionIds
) {
    if (!Array.isArray(incomingSessions)) return incomingSessions;
    if (!Array.isArray(currentSessions))
        return removeDeletedSessionIds(incomingSessions, deletedSessionIds);

    const cleanIncoming = removeDeletedSessionIds(incomingSessions, deletedSessionIds);

    const currentById = new Map(
        currentSessions
            .filter((session) => session && typeof session.id === 'string')
            .map((session) => [session.id, session])
    );

    if (mutation?.type === 'deleteSession' && mutation.sessionId) {
        return currentSessions.filter((session) => session?.id !== mutation.sessionId);
    }

    if (
        (mutation?.type === 'upsertSession' || mutation?.type === 'replaceSession') &&
        mutation.sessionId
    ) {
        const incoming = findIncomingSession(cleanIncoming, mutation.sessionId);
        if (!incoming) return currentSessions;
        if (
            isDeletedSessionId(mutation.sessionId, deletedSessionIds) &&
            !currentById.has(mutation.sessionId)
        ) {
            return currentSessions;
        }

        const current = currentById.get(mutation.sessionId);
        const selected =
            mutation.type === 'upsertSession' &&
            current &&
            getMessageCount(current) > getMessageCount(incoming)
                ? current
                : incoming;
        return [
            selected,
            ...currentSessions.filter((session) => session?.id !== mutation.sessionId),
        ];
    }

    if (mutation?.type === 'pruneSessions') {
        return cleanIncoming;
    }

    if (mutation?.type === 'updateSessionGroups') {
        if (currentSessions.length === 0) return cleanIncoming;

        const incomingById = new Map(
            cleanIncoming
                .filter((session) => session && typeof session.id === 'string')
                .map((session) => [session.id, session])
        );

        return currentSessions.map((current) => {
            const incoming = incomingById.get(current?.id);
            if (!incoming || !Object.prototype.hasOwnProperty.call(incoming, 'groupId')) {
                return current;
            }
            return { ...current, groupId: incoming.groupId || null };
        });
    }

    if (mutation?.type === 'updateSessionMetadata' && mutation.sessionId) {
        const incoming = findIncomingSession(cleanIncoming, mutation.sessionId);
        if (!incoming) return currentSessions;
        const metadataFields = getMetadataFields(mutation);

        if (currentById.has(mutation.sessionId)) {
            return currentSessions.map((current) => {
                if (current?.id !== mutation.sessionId) return current;
                const next = { ...current };
                if (!metadataFields || metadataFields.has('title')) {
                    next.title = incoming.title || current.title;
                }
                if (!metadataFields || metadataFields.has('isPinned')) {
                    next.isPinned = incoming.isPinned === true;
                }
                if (!metadataFields || metadataFields.has('model')) {
                    next.model = incoming.model || current.model;
                }
                return next;
            });
        }

        return [incoming, ...currentSessions];
    }

    if (currentSessions.length === 0) return cleanIncoming;

    const incomingById = new Map(
        cleanIncoming
            .filter((session) => session && typeof session.id === 'string')
            .map((session) => [session.id, session])
    );

    return currentSessions.map((current) => {
        const incoming = incomingById.get(current?.id);
        if (!incoming) return current;
        return getMessageCount(current) > getMessageCount(incoming) ? current : incoming;
    });
}
