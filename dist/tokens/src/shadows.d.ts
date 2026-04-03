/**
 * Design Tokens - Shadows
 *
 * Box shadows for elevation and focus states.
 */
export declare const shadow: {
    readonly xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    readonly sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
    readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
    readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
    readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
    readonly '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    readonly inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)";
    readonly focus: "0 0 0 2px rgba(166, 226, 46, 0.5)";
    readonly focusError: "0 0 0 2px rgba(249, 38, 114, 0.5)";
    readonly none: "none";
};
export declare const elevation: {
    readonly 0: {
        readonly shadow: "none";
    };
    readonly 1: {
        readonly shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
    };
    readonly 2: {
        readonly shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
    };
    readonly 3: {
        readonly shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
    };
    readonly 4: {
        readonly shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
    };
    readonly 5: {
        readonly shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    };
};
export declare const zIndex: {
    readonly hide: -1;
    readonly base: 0;
    readonly dropdown: 1000;
    readonly sticky: 1100;
    readonly fixed: 1200;
    readonly modalBackdrop: 1300;
    readonly modal: 1400;
    readonly popover: 1500;
    readonly tooltip: 1600;
    readonly toast: 1700;
    readonly top: 9999;
};
export type ShadowToken = keyof typeof shadow;
export type ElevationLevel = keyof typeof elevation;
export type ZIndexToken = keyof typeof zIndex;
//# sourceMappingURL=shadows.d.ts.map