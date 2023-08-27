import { Component, createContext, useContext } from 'solid-js';
import { createStore, SetStoreFunction, Store } from 'solid-js/store';
import { JSX } from 'solid-js/types/jsx';
import { Point } from './Vector';

export interface VoronoiProps {
    bezierFactor: number;
    borderWidth: number;
    height: number;
    parallelPathStep: number;
    points: Array<Point>;
    showControlPoints: boolean;
    showEdges: boolean;
    showHardCells: boolean;
    showSeeds: boolean;
    showSmoothCells: boolean;
    showVeins: boolean;
    simplifyRadius: number;
    width: number;
}

export interface VoronoiProviderProps {
    children: JSX.Element | Array<JSX.Element>;
}

const VoronoiContext = createContext<[Store<VoronoiProps>, SetStoreFunction<VoronoiProps>]>();

export const VoronoiProvider: Component<VoronoiProviderProps> = props => {
    const [voronoiProps, setVoronoiProps] = createStore<VoronoiProps>({
        bezierFactor: 1.0,
        borderWidth: 3,
        height: 700,
        parallelPathStep: 0.05,
        points: [],
        showControlPoints: false,
        showEdges: false,
        showHardCells: false,
        showSeeds: true,
        showSmoothCells: true,
        showVeins: false,
        simplifyRadius: 4.0,
        width: 1600,
    });

    return (
        <VoronoiContext.Provider value={[voronoiProps, setVoronoiProps]}>
            {props.children}
        </VoronoiContext.Provider>
    );
};

export const useVoronoi = () => useContext(VoronoiContext);
