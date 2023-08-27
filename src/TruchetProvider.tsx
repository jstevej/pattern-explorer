import { Component, createContext, useContext } from 'solid-js';
import { createStore, SetStoreFunction, Store } from 'solid-js/store';
import { JSX } from 'solid-js/types/jsx';

export const eacEdgeBehaviors = ['infinite', 'wrap'] as const;
export type EacEdgeBehavior = (typeof eacEdgeBehaviors)[number];

export function isEacEdgeBehavior(edge: string): edge is EacEdgeBehavior {
    return (eacEdgeBehaviors as unknown as Array<string>).includes(edge);
}

export function withEacEdgeBehavior(edge: string, fn: (edge: EacEdgeBehavior) => void): void {
    isEacEdgeBehavior(edge) ? fn(edge) : console.error(`invalid EAC edge behavior: ${edge}`);
}

export const eacSeeds = ['allClear', 'allSet', 'alternating', 'center', 'first', 'random'] as const;
export type EacSeed = (typeof eacSeeds)[number];

export function isEacSeed(seed: string): seed is EacSeed {
    return (eacSeeds as unknown as Array<string>).includes(seed);
}

export function withEacSeed(seed: string, fn: (seed: EacSeed) => void): void {
    isEacSeed(seed) ? fn(seed) : console.error(`invalid EAC seed: ${seed}`);
}

export const gridPatterns = ['checkerboard', 'eac', 'random'] as const;
export type GridPattern = (typeof gridPatterns)[number];

export function isGridPattern(pattern: string): pattern is GridPattern {
    return (gridPatterns as unknown as Array<string>).includes(pattern);
}

export function withGridPattern(pattern: string, fn: (pattern: GridPattern) => void): void {
    isGridPattern(pattern) ? fn(pattern) : console.error(`invalid grid pattern: ${pattern}`);
}

export const tilePatterns = ['concentricSmith', 'diagonal', 'smith', 'solid', 'triangle'] as const;
export type TilePattern = (typeof tilePatterns)[number];

export function isTilePattern(pattern: string): pattern is TilePattern {
    return (tilePatterns as unknown as Array<string>).includes(pattern);
}

export function withTilePattern(pattern: string, fn: (pattern: TilePattern) => void): void {
    isTilePattern(pattern) ? fn(pattern) : console.error(`invalid truchet pattern: ${pattern}`);
}

export interface TruchetGridProps {
    checkerboard: {
        size: number;
    };
    eac: {
        edgeBehavior: EacEdgeBehavior;
        invert: boolean;
        offset: number; // number of interations to fast-forward
        rule: number; // 0-255
        seed: EacSeed;
        size: number;
    };
    height: number;
    pattern: GridPattern;
    spacing: number;
    width: number;
}

export interface TruchetProps {
    grid: TruchetGridProps;
    tile: TruchetTileProps;
}

export interface TruchetTileProps {
    concentricSmith: {
        gap: number; // fraction of cell edge length
        numCircles: number; // number of concentric circles
        strokeWidth: number;
    };
    pattern: TilePattern;
}

export interface TruchetProviderProps {
    children: JSX.Element | Array<JSX.Element>;
}

const TruchetContext = createContext<[Store<TruchetProps>, SetStoreFunction<TruchetProps>]>();

export const TruchetProvider: Component<TruchetProviderProps> = props => {
    const [truchetProps, setTruchetProps] = createStore<TruchetProps>({
        grid: {
            checkerboard: {
                size: 1,
            },
            eac: {
                edgeBehavior: 'infinite',
                invert: false,
                offset: 0,
                rule: 30,
                seed: 'center',
                size: 1,
            },
            height: 700,
            pattern: 'random',
            spacing: 100,
            width: 1600,
        },
        tile: {
            concentricSmith: {
                gap: 0.15,
                numCircles: 7,
                strokeWidth: 3,
            },
            pattern: 'concentricSmith',
        },
    });

    return (
        <TruchetContext.Provider value={[truchetProps, setTruchetProps]}>
            {props.children}
        </TruchetContext.Provider>
    );
};

export const useTruchet = () => useContext(TruchetContext);
