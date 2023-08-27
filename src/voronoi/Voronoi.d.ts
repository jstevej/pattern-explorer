export interface BoundingBox {
    xl: number;
    xr: number;
    yb: number;
    yt: number;
}

export interface Cell {
    closeMe: boolean;
    site: Site;
    halfedges: Array<Halfedge>; // empty if no cell could be computed
}

export interface Diagram {
    cells: Array<Cell>;
    edges: Array<Edge>;
    execTime: number; // in milliseconds
    vertices: Array<NullablePoint>;
}

export interface Edge {
    lSite: Site;
    rSite?: Site | null | undefined; // can be null for edges near the border
    va: NullablePoint;
    vb: NullablePoint;
}

export interface Halfedge {
    angle: number;
    edge: Edge;
    getStartpoint(): NullablePoint;
    getEndpoint(): NullablePoint;
    site: Site;
}

export interface NullablePoint {
    x: number | null;
    y: number | null;
}

export interface Point {
    x: number;
    y: number;
}

export interface Site extends Point {
    voronoiId: number;
}

export declare class Voronoi {
    constructor();
    public compute(sites: Array<Point>, bbox: BoundingBox): Diagram;
    public recycle(diagram: Diagram): void;
}
