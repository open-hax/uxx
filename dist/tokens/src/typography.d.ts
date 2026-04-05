/**
 * Design Tokens - Typography
 *
 * Font families, sizes, weights, and line heights.
 */
export declare const fontFamily: {
    readonly sans: string;
    readonly mono: string;
};
export declare const fontSize: {
    readonly xs: "0.75rem";
    readonly sm: "0.875rem";
    readonly base: "1rem";
    readonly lg: "1.125rem";
    readonly xl: "1.25rem";
    readonly '2xl': "1.5rem";
    readonly '3xl': "1.875rem";
    readonly '4xl': "2.25rem";
    readonly '5xl': "3rem";
    readonly inlineCode: "0.875em";
};
export declare const fontWeight: {
    readonly normal: 400;
    readonly medium: 500;
    readonly semibold: 600;
    readonly bold: 700;
};
export declare const lineHeight: {
    readonly none: 1;
    readonly tight: 1.25;
    readonly snug: 1.375;
    readonly normal: 1.5;
    readonly relaxed: 1.625;
    readonly loose: 2;
};
export declare const typography: {
    readonly h1: {
        readonly fontSize: "2.25rem";
        readonly fontWeight: 700;
        readonly lineHeight: 1.25;
    };
    readonly h2: {
        readonly fontSize: "1.875rem";
        readonly fontWeight: 700;
        readonly lineHeight: 1.25;
    };
    readonly h3: {
        readonly fontSize: "1.5rem";
        readonly fontWeight: 600;
        readonly lineHeight: 1.375;
    };
    readonly h4: {
        readonly fontSize: "1.25rem";
        readonly fontWeight: 600;
        readonly lineHeight: 1.375;
    };
    readonly h5: {
        readonly fontSize: "1.125rem";
        readonly fontWeight: 500;
        readonly lineHeight: 1.5;
    };
    readonly h6: {
        readonly fontSize: "1rem";
        readonly fontWeight: 500;
        readonly lineHeight: 1.5;
    };
    readonly body: {
        readonly fontSize: "1rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.5;
    };
    readonly bodySm: {
        readonly fontSize: "0.875rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.5;
    };
    readonly label: {
        readonly fontSize: "0.875rem";
        readonly fontWeight: 500;
        readonly lineHeight: 1;
    };
    readonly caption: {
        readonly fontSize: "0.75rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.5;
    };
    readonly code: {
        readonly fontFamily: string;
        readonly fontSize: "0.875rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.5;
    };
    readonly codeInline: {
        readonly fontFamily: string;
        readonly fontSize: "0.875em";
        readonly fontWeight: 400;
    };
};
export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type LineHeightToken = keyof typeof lineHeight;
//# sourceMappingURL=typography.d.ts.map