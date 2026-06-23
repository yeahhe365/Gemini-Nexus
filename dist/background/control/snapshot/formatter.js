export class SnapshotFormatter {
    constructor(options = {}) {
        this.verbose = options.verbose || false;
        this.onNode = options.onNode || (() => {});
        this.resolveUid = options.resolveUid || null;
        this.snapshotPrefix = options.snapshotPrefix || '1';
        this.selectedBackendNodeId = options.selectedBackendNodeId || null;
        this.nodeCounter = 0;

        // Mappings for boolean capabilities (property name) -> attribute name.
        // Keep these labels aligned with Chrome DevTools MCP snapshot output.
        this.booleanPropertyMap = {
            disabled: 'disableable',
            expanded: 'expandable',
            focused: 'focusable',
            selected: 'selectable',
            checked: 'checkable',
            pressed: 'pressable',
            editable: 'editable',
            multiselectable: 'multiselectable',
            modal: 'modal',
            required: 'required',
            readonly: 'readonly',
        };

        // Properties to exclude from generic attribute listing (handled explicitly)
        this.excludedProps = new Set([
            'id',
            'role',
            'name',
            'elementHandle',
            'children',
            'backendNodeId',
            'value',
            'parentId',
            'description',
        ]);
    }

    _getVal(prop) {
        return prop && prop.value;
    }

    _escapeStr(str) {
        const s = String(str);
        // Optimization: Only quote if necessary (contains spaces or special chars)
        // Helps save tokens on simple IDs or values
        if (/^[\w-]+$/.test(s)) return s;
        return `"${s.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }

    _hasProp(node, propName) {
        return (
            node.properties &&
            node.properties.some((p) => p.name === propName && p.value.value === true)
        );
    }

    // Filter out noise nodes to keep the tree token-efficient
    _isInteresting(node) {
        if (node.ignored) return false;
        const role = this._getVal(node.role);
        const name = this._getVal(node.name);
        const value = this._getVal(node.value);

        // Interaction nodes are always interesting
        if (
            this._hasProp(node, 'focused') ||
            this._hasProp(node, 'editable') ||
            this._hasProp(node, 'required')
        ) {
            return true;
        }

        // Skip purely structural/generic roles unless they have specific content
        const uninterestingRoles = new Set([
            'generic',
            'presentation',
            'none',
            'div',
            'text',
            'paragraph',
            'section',
            'StructuralContainer',
            'unknown',
            'LayoutTable',
            'LayoutTableRow',
            'LayoutTableCell',
        ]);

        if (uninterestingRoles.has(role)) {
            const hasName = name && String(name).trim().length > 0;
            // Some generic nodes wrap value content
            const hasValue = value !== undefined && String(value).trim().length > 0;

            if (hasName || hasValue) return true;
            return false;
        }
        return true;
    }

    format(nodes) {
        const nodeById = new Map();
        for (const node of nodes) {
            if (node.nodeId) nodeById.set(node.nodeId, node);
        }

        // Identify Root: Node that is not a child of any other node
        const allChildIds = new Set(nodes.flatMap((n) => n.childIds || []));
        const root = nodes.find((n) => !allChildIds.has(n.nodeId));

        if (!root) return 'Error: Could not find root of A11y tree.';

        return this._formatNode(root, nodeById, 0);
    }

    _formatNode(node, nodeById, depth) {
        const interesting = this._isInteresting(node);
        // In verbose mode, show everything. In default mode, prune uninteresting nodes.
        // Even if skipped, we process children (flattening hierarchy).
        const shouldPrint = this.verbose || interesting;

        let line = '';

        if (shouldPrint) {
            this.nodeCounter++;
            const fallbackUid = `${this.snapshotPrefix}_${this.nodeCounter}`;
            const uid =
                (typeof this.resolveUid === 'function'
                    ? this.resolveUid(node, fallbackUid)
                    : null) || fallbackUid;

            this.onNode(node, uid);

            let role = this._getVal(node.role);
            if (node.ignored) role = 'ignored';

            const name = this._getVal(node.name);
            let value = this._getVal(node.value);
            const description = this._getVal(node.description);

            let parts = [`uid=${uid}`];
            if (role) parts.push(role);
            if (name) parts.push(this._escapeStr(name));

            // Optimization: Don't print value if it is identical to name (text)
            // Common in Select options where value often equals text label
            if (value !== undefined && value !== '') {
                if (String(value) !== name) {
                    parts.push(`value=${this._escapeStr(value)}`);
                }
            }

            if (description) parts.push(`desc=${this._escapeStr(description)}`);

            if (node.properties) {
                const propertyValues = {};
                for (const property of node.properties) {
                    propertyValues[property.name] = this._getVal(property.value);
                }

                const sortedKeys = Object.keys(propertyValues).sort();

                for (const key of sortedKeys) {
                    if (this.excludedProps.has(key)) continue;

                    const propertyValue = propertyValues[key];

                    if (typeof propertyValue === 'boolean') {
                        // Capability: If property exists (even false), it might imply a capability
                        // (e.g. 'focused' existing means it is 'focusable')
                        if (key in this.booleanPropertyMap) {
                            parts.push(this.booleanPropertyMap[key]);
                        }

                        if (propertyValue === true) {
                            parts.push(key);
                        }
                    } else if (propertyValue !== undefined && propertyValue !== '') {
                        // Optimization: skip value in properties too if redundant
                        if (key === 'value' && String(propertyValue) === name) continue;
                        parts.push(`${key}=${this._escapeStr(propertyValue)}`);
                    }
                }
            }

            const isSelected =
                this.selectedBackendNodeId && node.backendDOMNodeId === this.selectedBackendNodeId;

            line =
                ' '.repeat(depth * 2) +
                parts.join(' ') +
                (isSelected ? ' [selected in the DevTools Elements panel]' : '') +
                '\n';
        }

        // Flatten hierarchy: if node is skipped, children stay at current depth
        const nextDepth = shouldPrint ? depth + 1 : depth;

        if (node.childIds) {
            for (const childId of node.childIds) {
                const child = nodeById.get(childId);
                if (child) {
                    line += this._formatNode(child, nodeById, nextDepth);
                }
            }
        }
        return line;
    }
}
