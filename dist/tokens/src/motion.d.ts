/**
 * Design Tokens - Motion
 *
 * Animation durations, easings, and spring configurations.
 */
export declare const duration: {
    readonly instant: 0;
    readonly fast: "100ms";
    readonly normal: "200ms";
    readonly slow: "300ms";
    readonly slower: "500ms";
    readonly slowest: "700ms";
};
export declare const easing: {
    readonly linear: "linear";
    readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
    readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
    readonly easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly decelerate: "cubic-bezier(0, 0, 0.2, 1)";
    readonly accelerate: "cubic-bezier(0.4, 0, 1, 1)";
    readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
    readonly bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    readonly gentle: "cubic-bezier(0.25, 0.1, 0.25, 1)";
};
export declare const motion: {
    readonly fade: {
        readonly enter: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
        };
        readonly exit: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
        };
    };
    readonly slide: {
        readonly enter: {
            readonly duration: "200ms";
            readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
        };
        readonly exit: {
            readonly duration: "200ms";
            readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
        };
    };
    readonly scale: {
        readonly enter: {
            readonly duration: "200ms";
            readonly easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        };
        readonly exit: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
        };
    };
    readonly expand: {
        readonly duration: "200ms";
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly focus: {
        readonly duration: 0;
        readonly easing: "linear";
    };
    readonly press: {
        readonly duration: "100ms";
        readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
    };
    readonly tooltip: {
        readonly enter: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
        };
        readonly exit: {
            readonly duration: 0;
            readonly easing: "linear";
        };
    };
};
export declare const transitions: {
    readonly all: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly colors: "color, background-color, border-color 100ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly opacity: "opacity 100ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly shadow: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)";
};
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
//# sourceMappingURL=motion.d.ts.map