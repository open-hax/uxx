/**
 * Design Tokens - Keybindings
 *
 * Spacemacs-inspired modal keybinding system.
 *
 * Every action has a button. Every button has a chord.
 * The chord overlay shows available bindings contextually.
 *
 * Modes:
 *   - normal: navigation and selection (like vim normal mode)
 *   - insert: text input (like vim insert mode)
 *   - command: spacemacs-style leader chords
 *   - visual: selection mode
 *
 * Chords:
 *   - leader + key (like spacemacs SPC)
 *   - Ctrl+key (standard shortcuts)
 *   - / for search, : for command palette
 */
export declare const leaderKey: " ";
export type ModalMode = 'normal' | 'insert' | 'command' | 'visual';
export interface ChordBinding {
    keys: string[];
    action: string;
    description: string;
    mode: ModalMode | ModalMode[];
    icon?: string;
}
export declare const defaultChords: ChordBinding[];
export declare const modeColors: Record<ModalMode, string>;
export type ChordToken = typeof defaultChords;
//# sourceMappingURL=keybindings.d.ts.map