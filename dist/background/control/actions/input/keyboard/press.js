const MODIFIER_BITS = {
    Alt: 1,
    Control: 2,
    Meta: 4,
    Shift: 8,
};

const MODIFIER_ALIASES = {
    Ctrl: 'Control',
    Cmd: 'Meta',
    Command: 'Meta',
    Option: 'Alt',
};

function getKeyDefinition(key, modifiers = 0) {
    const keyMap = {
        Control: {
            windowsVirtualKeyCode: 17,
            nativeVirtualKeyCode: 17,
            key: 'Control',
            code: 'ControlLeft',
        },
        Shift: {
            windowsVirtualKeyCode: 16,
            nativeVirtualKeyCode: 16,
            key: 'Shift',
            code: 'ShiftLeft',
        },
        Alt: {
            windowsVirtualKeyCode: 18,
            nativeVirtualKeyCode: 18,
            key: 'Alt',
            code: 'AltLeft',
        },
        Meta: {
            windowsVirtualKeyCode: 91,
            nativeVirtualKeyCode: 91,
            key: 'Meta',
            code: 'MetaLeft',
        },
        Enter: {
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13,
            key: 'Enter',
            code: 'Enter',
            text: '\r',
        },
        Backspace: {
            windowsVirtualKeyCode: 8,
            nativeVirtualKeyCode: 8,
            key: 'Backspace',
            code: 'Backspace',
        },
        Tab: { windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab' },
        Escape: {
            windowsVirtualKeyCode: 27,
            nativeVirtualKeyCode: 27,
            key: 'Escape',
            code: 'Escape',
        },
        Delete: {
            windowsVirtualKeyCode: 46,
            nativeVirtualKeyCode: 46,
            key: 'Delete',
            code: 'Delete',
        },
        ArrowDown: {
            windowsVirtualKeyCode: 40,
            nativeVirtualKeyCode: 40,
            key: 'ArrowDown',
            code: 'ArrowDown',
        },
        ArrowUp: {
            windowsVirtualKeyCode: 38,
            nativeVirtualKeyCode: 38,
            key: 'ArrowUp',
            code: 'ArrowUp',
        },
        ArrowLeft: {
            windowsVirtualKeyCode: 37,
            nativeVirtualKeyCode: 37,
            key: 'ArrowLeft',
            code: 'ArrowLeft',
        },
        ArrowRight: {
            windowsVirtualKeyCode: 39,
            nativeVirtualKeyCode: 39,
            key: 'ArrowRight',
            code: 'ArrowRight',
        },
        PageUp: {
            windowsVirtualKeyCode: 33,
            nativeVirtualKeyCode: 33,
            key: 'PageUp',
            code: 'PageUp',
        },
        PageDown: {
            windowsVirtualKeyCode: 34,
            nativeVirtualKeyCode: 34,
            key: 'PageDown',
            code: 'PageDown',
        },
        End: { windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35, key: 'End', code: 'End' },
        Home: { windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, key: 'Home', code: 'Home' },
        Space: {
            windowsVirtualKeyCode: 32,
            nativeVirtualKeyCode: 32,
            key: ' ',
            code: 'Space',
            text: ' ',
        },
    };

    if (keyMap[key]) {
        return { ...keyMap[key], modifiers };
    }

    const normalizedKey = key.length === 1 ? key : null;
    if (!normalizedKey) return null;

    const upper = normalizedKey.toUpperCase();
    const code = /^[A-Z]$/.test(upper)
        ? `Key${upper}`
        : /^[0-9]$/.test(upper)
          ? `Digit${upper}`
          : key === '+'
            ? 'Equal'
            : undefined;
    const windowsVirtualKeyCode = key === '+' ? 187 : upper.charCodeAt(0);
    const shouldEmitText =
        (modifiers & (MODIFIER_BITS.Control | MODIFIER_BITS.Meta | MODIFIER_BITS.Alt)) === 0;

    return {
        windowsVirtualKeyCode,
        nativeVirtualKeyCode: windowsVirtualKeyCode,
        key: normalizedKey,
        code,
        modifiers,
        ...(shouldEmitText ? { text: normalizedKey } : {}),
    };
}

function parseKeyTokens(key) {
    const rawTokens = String(key || '').split('+');
    const tokens = [];

    for (let index = 0; index < rawTokens.length; index++) {
        const token = rawTokens[index];
        if (token) {
            tokens.push(MODIFIER_ALIASES[token] || token);
        } else if (index === rawTokens.length - 1 || rawTokens[index + 1] === '') {
            tokens.push('+');
            break;
        }
    }

    return tokens;
}

export async function handlePressKey(handler, { key }) {
    const displayKey = typeof key === 'string' ? key : '';
    try {
        if (typeof key !== 'string' || !key.trim()) {
            throw new Error("'key' must be a non-empty string.");
        }

        await handler.waitHelper.execute(async () => {
            const tokens = parseKeyTokens(key);
            const mainKey = tokens[tokens.length - 1];
            const modifiers = tokens.slice(0, -1);
            let modifierBits = 0;

            for (const modifier of modifiers) {
                if (!(modifier in MODIFIER_BITS)) {
                    throw new Error(`Modifier '${modifier}' not supported.`);
                }
                modifierBits |= MODIFIER_BITS[modifier];
                const definition = getKeyDefinition(modifier, modifierBits);
                await handler.cmd('Input.dispatchKeyEvent', { type: 'keyDown', ...definition });
            }

            const mainDef = getKeyDefinition(mainKey, modifierBits);
            if (!mainDef) {
                throw new Error(`Key '${key}' not supported.`);
            }

            await handler.cmd('Input.dispatchKeyEvent', { type: 'keyDown', ...mainDef });
            await handler.cmd('Input.dispatchKeyEvent', { type: 'keyUp', ...mainDef });

            for (const modifier of [...modifiers].reverse()) {
                modifierBits &= ~MODIFIER_BITS[modifier];
                const definition = getKeyDefinition(modifier, modifierBits);
                await handler.cmd('Input.dispatchKeyEvent', { type: 'keyUp', ...definition });
            }
        });

        return `Pressed key: ${key}`;
    } catch (error) {
        return `Error pressing key ${displayKey}: ${error.message}`;
    }
}
