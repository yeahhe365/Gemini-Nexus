(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.Widget = `
        /* Toolbar Styles */
        .toolbar {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #1e1e1e;
            padding: 4px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 999999;
        }
        .toolbar.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }
        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            background: transparent;
            border: none;
            color: #e3e3e3;
            padding: 6px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
            white-space: nowrap;
            width: 32px;
            height: 32px;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
        .btn.hidden {
            display: none;
        }

        .toolbar-logo {
            width: 20px;
            height: 20px;
            display: block;
        }

        .custom-selection-tools {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .btn.custom-selection-tool-btn {
            width: auto;
            min-width: 32px;
            max-width: 64px;
            padding: 6px 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 11px;
            letter-spacing: 0;
        }

        .custom-selection-more {
            position: relative;
            display: flex;
        }

        .custom-selection-more.hidden {
            display: none;
        }

        .custom-selection-more-menu {
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            min-width: 160px;
            max-width: 240px;
            display: none;
            flex-direction: column;
            gap: 2px;
            padding: 4px;
            border-radius: 8px;
            background: #232429;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.35);
        }

        .custom-selection-more:hover .custom-selection-more-menu,
        .custom-selection-more:focus-within .custom-selection-more-menu {
            display: flex;
        }

        .custom-selection-more-item {
            width: 100%;
            min-width: 0;
            padding: 8px 10px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #e0e0e0;
            font: inherit;
            font-size: 13px;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
        }

        .custom-selection-more-item:hover,
        .custom-selection-more-item:focus-visible {
            background: rgba(255,255,255,0.1);
            color: #fff;
            outline: none;
        }

        /* Toolbar Drag Handle */
        .toolbar-drag-handle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 32px;
            color: #666;
            cursor: grab;
            transition: color 0.15s;
            flex-shrink: 0;
            margin-right: 2px;
        }
        .toolbar-drag-handle:hover {
            color: #999;
        }
        .toolbar-drag-handle:active {
            cursor: grabbing;
            color: #fff;
        }
        .toolbar.dragging {
            cursor: grabbing;
            user-select: none;
        }
        .toolbar.dragging .toolbar-drag-handle {
            cursor: grabbing;
            color: #fff;
        }

        /* --- Image AI Tools Menu --- */

        .image-btn {
            position: absolute;
            z-index: 1000000;
            opacity: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            transition: opacity 0.2s;
            width: auto;
            height: auto;
            background: transparent;
            border: none;
            box-shadow: none;
        }

        .image-btn.visible {
            opacity: 1;
            pointer-events: auto;
        }

        /* The trigger button (AI Tools) */
        .ai-tool-trigger {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #232429;
            color: #fff;
            width: 20px;
            height: 20px;
            border-radius: 5px;
            box-sizing: border-box;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.22);
            border: none;
            transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .ai-tool-trigger:hover {
            background: #2f3036;
            box-shadow: 0 3px 10px rgba(0,0,0,0.28);
        }
        .ai-tool-trigger:active {
            transform: scale(0.95);
        }

        /* The dropdown menu */
        .ai-tool-menu {
            margin-top: 6px;
            background: #232429;
            border-radius: 8px;
            padding: 4px;
            width: 200px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            display: none;
            flex-direction: column;
            gap: 2px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Show menu on hover */
        .image-btn:hover .ai-tool-menu,
        .image-btn:focus-within .ai-tool-menu {
            display: flex;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            color: #e0e0e0;
            font-size: 13px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.1s;
            position: relative;
            user-select: none;
        }
        .menu-item:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }

        .menu-item svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            color: #c4c7c5;
        }
        .menu-item:hover svg {
            color: #fff;
        }

        .menu-item span {
            flex: 1;
        }

        .submenu-arrow {
            width: 14px;
            height: 14px;
            opacity: 0.7;
            display: flex;
            align-items: center;
        }

        /* Submenu */
        .submenu {
            position: absolute;
            left: 100%;
            top: var(--submenu-offset-y, 0px);
            margin-left: 8px;
            background: #232429;
            border-radius: 8px;
            padding: 4px;
            width: 180px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            display: none;
            flex-direction: column;
            gap: 2px;
            z-index: 10;
        }

        /* Invisible bridge to prevent submenu closing when hovering gap */
        .submenu::before {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            left: -10px; /* Bridge the 8px margin gap + overlap */
            width: 10px;
            background: transparent;
        }

        .menu-item.has-submenu.submenu-open-left .submenu {
            left: auto;
            right: 100%;
            margin-left: 0;
            margin-right: 8px;
        }

        .menu-item.has-submenu.submenu-open-left .submenu::before {
            left: auto;
            right: -10px;
        }

        .menu-item.has-submenu:hover .submenu {
            display: flex;
        }
    `;
})();
