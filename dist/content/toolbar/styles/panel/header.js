(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelHeader = `
        /* --- Standard Header Styles --- */

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px 4px 16px;
            cursor: move;
            user-select: none;
            background: #fff;
            flex-shrink: 0;
        }

        @media (max-width: 600px) {
            .ask-header {
                cursor: default;
            }
        }

        .window-title {
            font-weight: 600;
            font-size: 15px;
            color: #1f1f1f;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .header-title-group {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 1 1 auto;
        }

        .ask-header .translation-targets {
            display: flex;
            align-items: center;
            gap: 0;
            margin: 0;
            font-size: 12px;
            color: #3c4043;
            flex: 0 1 132px;
            min-width: 76px;
            max-width: 132px;
        }
        .ask-header .translation-targets.hidden { display: none; }
        .ask-header .translation-targets-label {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        .ask-header .translation-target-dropdown {
            position: relative;
            width: 100%;
            min-width: 0;
            max-width: 132px;
        }
        .ask-header .translation-target-trigger {
            width: 100%;
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 4px 10px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            background: #fff;
            color: #202124;
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            text-align: left;
            box-sizing: border-box;
        }
        .ask-header .translation-target-trigger:focus {
            outline: none;
            border-color: #0b57d0;
            box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.1);
        }
        .ask-header .translation-target-summary {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ask-header .translation-target-caret {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            color: #5f6368;
            transform: rotate(90deg);
            width: 14px;
            height: 14px;
        }
        .ask-header .translation-target-trigger[aria-expanded="true"] .translation-target-caret {
            transform: rotate(-90deg);
        }
        .ask-header .translation-target-menu {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            z-index: 3;
            width: max-content;
            min-width: 100%;
            max-width: min(260px, calc(100vw - 48px));
            max-height: 220px;
            overflow-x: hidden;
            overflow-y: auto;
            padding: 4px;
            border: 1px solid #dadce0;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 8px 24px rgba(60, 64, 67, 0.18);
            box-sizing: border-box;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar {
            width: 4px;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-track {
            background: transparent;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-thumb:hover {
            background-color: rgba(0, 0, 0, 0.2);
        }
        .ask-header .translation-target-menu.hidden { display: none; }
        .ask-header .translation-target-options {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .ask-header .translation-target-option {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border: none;
            border-radius: 8px;
            background: #fff;
            color: #3c4043;
            cursor: pointer;
            line-height: 1.2;
            user-select: none;
            transition: background 0.15s, color 0.15s;
        }
        .ask-header .translation-target-option:hover {
            background: #f1f3f4;
            color: #202124;
        }
        .ask-header .translation-target-option input {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        .ask-header .selection-check {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
            opacity: 0;
            transform: scale(0.5);
            color: #0b57d0;
        }
        .ask-header .selection-check svg {
            width: 16px;
            height: 16px;
            stroke: currentColor !important;
        }
        .ask-header .translation-target-option:has(input:checked) {
            background: #f1f3f4;
            color: #1f1f1f;
            font-weight: 500;
        }
        .ask-header .translation-target-option:has(input:checked) .selection-check {
            opacity: 1;
            transform: scale(1);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        /* Provider and model selectors in header */
        .ask-provider-select,
        .ask-model-select {
            appearance: none;
            -webkit-appearance: none;
            background: #f0f4f9;
            border: 1px solid transparent;
            border-radius: 18px; /* Pill shape */
            padding: 0 12px;
            font-size: 13px;
            font-weight: 500;
            color: #444746;
            outline: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            height: 32px;
            line-height: 30px; /* Ensure vertical centering */
            box-sizing: border-box;
            text-align: center;
            max-width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ask-provider-select {
            max-width: 88px;
        }
        .ask-model-select:hover {
            background: #e9eef6;
            color: #1f1f1f;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .ask-provider-select:hover {
            background: #e9eef6;
            color: #1f1f1f;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .ask-provider-select option,
        .ask-model-select option {
            background: #ffffff;
            color: #1f1f1f;
        }

        .ask-thinking-toggle {
            width: 32px;
            height: 32px;
            flex: 0 0 32px;
            border: 1px solid transparent;
            border-radius: 10px;
            background: transparent;
            color: #5f6368;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .ask-thinking-toggle[hidden] {
            display: none !important;
        }
        .ask-thinking-toggle svg {
            width: 18px;
            height: 18px;
            transition: fill 0.2s;
        }
        .ask-thinking-toggle:hover {
            background: #f0f1f1;
            border-color: #dadce0;
            color: #1f1f1f;
        }
        .ask-thinking-toggle:focus-visible {
            box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.14);
        }
        .ask-thinking-toggle.is-fast {
            color: #eab308;
        }
        .ask-thinking-toggle.is-fast svg {
            fill: currentColor;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: #5e5e5e;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .icon-btn:hover {
            background: #f0f1f1;
            color: #1f1f1f;
        }
    `;
})();
