<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';

    // Props (runes): use $props()
    // - allowedKeyToAction: keys MUST be KeyboardEvent.code strings.
    //   For combos, use "+" joined, sorted alphabetically by code (e.g., "KeyA+KeyS", "Digit1+Digit4").
    //   Values are action identifiers (e.g., "left", "down", "left+down", "light kick", "throw").
    // - imageByAction: maps action identifiers to image URLs.
    const props = $props<{
        allowedKeyToAction?: Record<string, string>;
        imageByAction?: Record<string, string>;
        comboTimeoutMs?: number;
    }>();

    // Editor element and instance
    let element = $state<HTMLDivElement>();
    let editor = $state<Editor | null>(null);

    // Derived sets for quick lookup
    let allowedSystemCodes = new Set([
        'Delete',
        'Backspace',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
    ]);

    let allowedAnyCodes = new Set<string>(); // any code that appears in singles or combos
    let allowedSingleCodes = new Set<string>(); // keys without '+'

    function rebuildAllowedSets() {
        const keyMap = props.allowedKeyToAction ?? {};
        allowedAnyCodes = new Set();
        allowedSingleCodes = new Set();

        for (const key of Object.keys(keyMap)) {
            if (key.includes('+')) {
                key.split('+').forEach((code) => allowedAnyCodes.add(code));
            } else {
                allowedAnyCodes.add(key);
                allowedSingleCodes.add(key);
            }
        }
    }

    $effect(() => {
        rebuildAllowedSets();
    });

    // Pressed key tracking and combo resolution
    let pressedCodes = new Set<string>(); // currently held down keys
    let windowCodes = new Set<string>(); // keys pressed within the debounce window
    let comboTimer: number | null = null;

    function normalizeComboKey(codes: string[]): string {
        // Sort lexicographically to form stable key for lookup
        return [...codes].sort().join('+');
    }

    function stopComboTimer() {
        if (comboTimer !== null) {
            clearTimeout(comboTimer);
            comboTimer = null;
        }
    }

    function startComboTimerIfNeeded() {
        if (comboTimer !== null) return;
        const timeout = Math.max(10, props.comboTimeoutMs ?? 70);
        comboTimer = window.setTimeout(resolveCombo, timeout);
    }

    function insertImageForAction(action: string): boolean {
        const src = (props.imageByAction ?? {})[action];
        if (!src || !editor) return false;
        editor
            .chain()
            .focus()
            .setImage({src:src})
            .run();
        return true;
    }

    function insertGroupForActions(actions: string[]): boolean {
        if (!editor) return false;
        const imgs = actions
            .map((a) => {
                const src = (props.imageByAction ?? {})[a];
                return src;
            })
            .filter(Boolean);
        if (!imgs) return false;
        imgs.forEach(img => {
            editor.chain()
            .focus()
            .setImage({src:img})
            .run();
        });
        
        return true;
    }

    function resolveCombo() {
        stopComboTimer();
        if (windowCodes.size === 0) return;

        const codes = Array.from(windowCodes);
        const comboKey = normalizeComboKey(codes);
        const allowedMap = props.allowedKeyToAction ?? {};
        const comboAction = allowedMap[comboKey];

        if (comboAction) {
            // Prefer a defined combo image
            insertImageForAction(comboAction);
        } else {
            // Fall back to grouping single-key images (in deterministic order)
            const singleActions: string[] = [];
            for (const code of codes.sort()) {
                if (!allowedSingleCodes.has(code)) continue;
                const action = allowedMap[code];
                if (action) singleActions.push(action);
            }
            if (singleActions.length === 1) {
                insertImageForAction(singleActions[0]);
            } else if (singleActions.length > 1) {
                insertGroupForActions(singleActions);
            }
        }

        // Clear current pressed set after handling to avoid duplicate insertions
        pressedCodes.clear();
        windowCodes.clear();
    }

    function isEditorFocused(): boolean {
        if (!element) return false;
        const active = document.activeElement as Element | null;
        return !!active && element.contains(active);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!editor) return;
        if (!isEditorFocused()) return; // only handle when editor is focused

        const code = event.code;

        // Allow navigation/editing system keys
        if (allowedSystemCodes.has(code)) {
            return; // let the editor handle it normally
        }

        // Block everything except keys participating in allowed combos/singles
        if (!allowedAnyCodes.has(code)) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // For allowed keys, prevent default text input and accumulate for combo detection
        event.preventDefault();
        event.stopPropagation();

        if (event.repeat) {
            // Ignore key auto-repeat to avoid multiple insertions
            return;
        }

        // Track currently pressed keys, but do not start/modify combo window here
        pressedCodes.add(code);
    }

    function handleKeyUp(event: KeyboardEvent) {
        if (!isEditorFocused()) return;
        const code = event.code;

        // Ignore system/navigation keys
        if (allowedSystemCodes.has(code)) {
            return;
        }

        // Only consider keys that participate in combos/singles
        if (!allowedAnyCodes.has(code)) {
            return;
        }

        // Record release in the current window and start timer only if not already running
        windowCodes.add(code);
        if (pressedCodes.has(code)) {
            pressedCodes.delete(code);
        }
        startComboTimerIfNeeded();
    }

    onMount(() => {
        editor = new Editor({
            element:element,
            extensions: [StarterKit, 
                        Image.configure({
                            inline:true
                        })],
            content: '<p></p>',
            autofocus:true,
            // onTransaction: () => {
            //     // force re-render so `editor.isActive` works as expected
            //     editor = editor;
            // },
        });

        // Attach global listeners to avoid a11y violations on non-interactive elements
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
    });

    onDestroy(() => {
        stopComboTimer();
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
        if (editor) {
            editor.destroy();
            editor = null;
        }
    });
</script>

<div bind:this={element} class="combo-editor" role="application"></div>

<style>
    .combo-editor {
        min-height: 160px;
        min-width: 160px;
        width: 100%;
        height: 100%;
        border: 1px solid var(--border-color, #ccc);
        border-radius: 8px;
        padding: 8px 10px;
    }

    :global(img) {
        display: inline-block;
        height: 1.6rem;
        width: auto;
        vertical-align: text-bottom;
        margin: 0 2px;
        user-select: none;
        -webkit-user-drag: none;
    }

    :global(.combo-group) {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 1px 3px;
        border-radius: 4px;
        background: var(--combo-bg, rgba(0, 0, 0, 0.06));
        margin: 0 2px;
    }
    :global(.ProseMirror-selectednode){
        background-color: red;
    }
    :global(.ProseMirror){
        caret-color: red;
    }
</style>