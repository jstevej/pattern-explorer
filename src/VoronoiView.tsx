import { Component, createEffect, createSignal } from 'solid-js';
import { unwrap } from 'solid-js/store';
import { JSX } from 'solid-js/types/jsx';
import { createPath, createRootElement, createSvgElement } from './Svg';
import { Line, Vector } from './Vector';
import { Cell, NullablePoint, Point, Voronoi } from './voronoi/Voronoi';
import { useVoronoi, VoronoiProps } from './VoronoiProvider';

const radius = 8;
const smallRadius = 4;

interface BezierParams {
    c1: Point;
    c2: Point;
    end: Point;
    start: Point;
}

export interface VCell {
    edges: Array<Line>;
    vertices: Array<Vector>;
}

function addVertex(vertices: Array<Point>, vertex: Point): void {
    const eps = 1e-9;

    for (const v of vertices) {
        if (Math.abs(v.x - vertex.x) < eps && Math.abs(v.y - vertex.y) < eps) return;
    }

    vertices.push(vertex);
}

function computeBezierPoints(
    vertices: Array<Vector>,
    bezierFactor: number
): Array<BezierParams> | undefined {
    if (vertices.length < 3) return undefined;

    const bezierParams: Array<BezierParams> = [];

    let prev = vertices[vertices.length - 1];
    const prevPrev = vertices[vertices.length - 2];
    let prevMid = Line.fromVectors(prevPrev, prev).midpoint();

    vertices.forEach((v, i) => {
        const mid = Line.fromVectors(prev, v).midpoint();

        const l1 = Line.fromVectors(prevMid, prev);
        const p1 = l1
            .parallelVector()
            .normalize()
            .multiply(l1.length() * bezierFactor);
        const c1 = prevMid.clone().add(p1);

        const l2 = Line.fromVectors(mid, prev);
        const p2 = l2
            .parallelVector()
            .normalize()
            .multiply(l2.length() * bezierFactor);
        const c2 = mid.clone().add(p2);

        bezierParams.push({
            c1,
            c2,
            end: { x: mid.x, y: mid.y },
            start: { x: prevMid.x, y: prevMid.y },
        });

        prev = v;
        prevMid = mid;
    });

    return bezierParams;
}

function distanceToAnyEdge(v: Vector, edges: Array<Line>): number {
    let dist = Number.POSITIVE_INFINITY;

    for (const edge of edges) {
        const d = edge.distanceToSegment(v);
        if (d < dist) dist = d;
    }

    return dist;
}

function getEdgesFromOrderedVertices(cells: Array<Vector>): Array<Line> {
    const edges: Array<Line> = [];
    let prev = cells[cells.length - 1];

    for (const curr of cells) {
        edges.push(Line.fromVectors(prev, curr));
        prev = curr;
    }

    return edges;
}

function getInsetVertices(cell: VCell, borderWidth: number, step: number): Array<Vector> {
    const eps = 0.1;
    const ticks: Array<Vector> = [];
    if (cell.vertices.length < 3) return ticks;
    let prev = cell.vertices[cell.vertices.length - 1];
    const borderLimit = borderWidth - eps;

    for (const curr of cell.vertices) {
        const line = Line.fromVectors(prev, curr);
        const unit = line.parallelVector().normalize().multiply(step);
        let tick = Vector.fromPoint(prev);
        let xMin = curr.x;
        let xMax = prev.x;
        if (xMin > xMax) [xMin, xMax] = [xMax, xMin];
        const normal = line.normalRight().normalize().multiply(borderWidth);
        let start: Vector | undefined;
        let end: Vector | undefined;

        do {
            const p = tick.clone().add(normal);

            if (distanceToAnyEdge(p, cell.edges) >= borderLimit) {
                start = p;
                break;
            }

            tick.add(unit);
        } while (tick.x > xMin && tick.x < xMax);

        if (start !== undefined) {
            tick = Vector.fromPoint(curr);

            do {
                const p = tick.clone().add(normal);

                if (distanceToAnyEdge(p, cell.edges) >= borderLimit) {
                    end = p;
                    break;
                }

                tick.subtract(unit);
            } while (tick.x > xMin && tick.x < xMax);
        }

        if (start) {
            if (!ticks.some(t => start?.isClose(t, step + eps))) {
                ticks.push(start);
            }

            if (end) {
                if (!ticks.some(t => end?.isClose(t, step + eps))) {
                    ticks.push(end);
                }
            }
        }

        prev = curr;
    }

    return ticks;
}

// Returns the cell verticies ordered counter-clockwise.

function getOrderedCellVertices(cell: Cell): Array<Vector> {
    const vertices: Array<Point> = [];

    for (const halfedge of cell.halfedges) {
        const edge = halfedge.edge;
        if (isPoint(edge.va)) addVertex(vertices, edge.va);
        if (isPoint(edge.vb)) addVertex(vertices, edge.vb);
    }

    const site = cell.site;

    return vertices
        .map(v => ({
            v,
            angle: Math.atan2(v.y - site.y, v.x - site.x),
        }))
        .sort((a, b) => b.angle - a.angle)
        .map(o => Vector.fromPoint(o.v));
}

function isPoint(p: NullablePoint): p is Point {
    return p.x !== null && p.y !== null;
}

function render(props: VoronoiProps): JSX.Element {
    const borderWidth = 0.5 * props.borderWidth;

    const svg = createRootElement(props.width, props.height);
    const voronoi = new Voronoi();
    const diagram = voronoi.compute(unwrap(props.points), {
        xl: 0,
        xr: props.width,
        yb: props.height,
        yt: 0,
    });
    const cells = transformCells(diagram.cells);

    const veinsEl = createSvgElement('path');

    if (props.showVeins) {
        veinsEl.setAttribute('stroke', 'none');
        veinsEl.setAttribute('fill', 'black');
        svg.appendChild(veinsEl);
    }

    const hardCellsEl = createSvgElement('g');

    if (props.showHardCells) {
        hardCellsEl.setAttribute('stroke', 'none');
        hardCellsEl.setAttribute('fill', 'chartreuse');
        svg.appendChild(hardCellsEl);
    }

    const smoothCellsEl = createSvgElement('g');

    if (props.showSmoothCells) {
        smoothCellsEl.setAttribute('stroke', 'none');
        smoothCellsEl.setAttribute('fill', 'palevioletred');
        svg.appendChild(smoothCellsEl);
    }

    const controlPointsEl = createSvgElement('g');

    if (props.showControlPoints) {
        svg.appendChild(controlPointsEl);
    }

    let dVeins = `M 0 0 L ${props.width} 0 L ${props.width} ${props.height} L 0 ${props.width} Z`;

    for (const cell of cells) {
        const insetVertices = simplifyPath(
            getInsetVertices(cell, borderWidth, props.parallelPathStep),
            props.simplifyRadius
        );

        if (props.showHardCells) {
            const path = createPath(insetVertices);
            if (path) hardCellsEl.appendChild(path);
        }

        if (props.showSmoothCells || props.showControlPoints || props.showVeins) {
            const bezierParams = computeBezierPoints(insetVertices, props.bezierFactor);

            if (bezierParams) {
                if (props.showSmoothCells) {
                    const path = renderSmoothCell(bezierParams);
                    smoothCellsEl.appendChild(path);
                }

                if (props.showControlPoints) {
                    const elements = renderControlPoints(bezierParams);
                    elements.forEach(el => controlPointsEl.appendChild(el));
                }

                if (props.showVeins) {
                    dVeins += renderVeins(bezierParams);
                }
            }
        }
    }

    if (props.showVeins) {
        veinsEl.setAttribute('d', dVeins);
    }

    if (props.showEdges) {
        const edgesEl = createSvgElement('g');
        edgesEl.setAttribute('stroke', 'black');
        svg.appendChild(edgesEl);

        for (const edge of diagram.edges) {
            const line = createSvgElement('line');

            if (!isPoint(edge.va) || !isPoint(edge.vb)) {
                console.error(`edge not defined`);
                continue;
            }

            line.setAttribute('x1', edge.va.x.toString());
            line.setAttribute('y1', edge.va.y.toString());
            line.setAttribute('x2', edge.vb.x.toString());
            line.setAttribute('y2', edge.vb.y.toString());
            edgesEl.appendChild(line);
        }
    }

    if (props.showSeeds) {
        const seedsEl = createSvgElement('g');
        seedsEl.setAttribute('color', 'none');
        seedsEl.setAttribute('fill', 'blue');
        svg.appendChild(seedsEl);

        for (const seed of props.points) {
            const seedEl = createSvgElement('circle');
            seedEl.setAttribute('cx', seed.x.toString());
            seedEl.setAttribute('cy', seed.y.toString());
            seedEl.setAttribute('r', radius.toString());
            seedsEl.appendChild(seedEl);
        }
    }

    return svg;
}

function renderControlPoints(bezierParams: Array<BezierParams>): Array<Element> {
    const elements: Array<Element> = [];

    for (const b of bezierParams) {
        const start = createSvgElement('circle');
        start.setAttribute('fill', 'black');
        start.setAttribute('cx', b.start.x.toString());
        start.setAttribute('cy', b.start.y.toString());
        start.setAttribute('r', radius.toString());
        elements.push(start);

        const c1 = createSvgElement('circle');
        c1.setAttribute('fill', 'darkred');
        c1.setAttribute('cx', b.c1.x.toString());
        c1.setAttribute('cy', b.c1.y.toString());
        c1.setAttribute('r', smallRadius.toString());
        elements.push(c1);

        const c2 = createSvgElement('circle');
        c2.setAttribute('fill', 'darkred');
        c2.setAttribute('cx', b.c2.x.toString());
        c2.setAttribute('cy', b.c2.y.toString());
        c2.setAttribute('r', smallRadius.toString());
        elements.push(c2);
    }

    return elements;
}

function renderSmoothCell(bezierParams: Array<BezierParams>): Element {
    let d = '';

    bezierParams.forEach((b, i) => {
        if (i === 0) d += `M ${b.start.x} ${b.start.y}`;
        d += ` C ${b.c1.x} ${b.c1.y} ${b.c2.x} ${b.c2.y} ${b.end.x} ${b.end.y}`;
    });

    d += ` Z`;

    const path = createSvgElement('path');
    path.setAttribute('d', d);

    return path;
}

function renderVeins(bezierParams: Array<BezierParams>): string {
    let d = '';

    bezierParams.forEach((b, i) => {
        if (i == 0) d += ` M ${b.start.x} ${b.start.y}`;
        d += ` C ${b.c1.x} ${b.c1.y} ${b.c2.x} ${b.c2.y} ${b.end.x} ${b.end.y}`;
    });

    //d += ` Z`;

    return d;
}

function simplifyPath(vertices: Array<Vector>, dist: number): Array<Vector> {
    const path: Array<Vector> = vertices.map(v => v.clone());
    let modified = true;

    while (modified) {
        modified = false;

        for (const v of path) {
            const neighborIndices: Array<number> = [];

            for (let i = 0; i < path.length; i++) {
                const neighbor = path[i];
                if (neighbor === v) continue;
                if (neighbor.isClose(v, dist)) {
                    neighborIndices.push(i);
                }
            }

            if (neighborIndices.length > 0) {
                modified = true;

                for (const i of neighborIndices) {
                    const neighbor = path[i];
                    v.add(neighbor);
                }

                v.multiply(1 / (neighborIndices.length + 1));

                for (let i = neighborIndices.length - 1; i >= 0; i--) {
                    path.splice(neighborIndices[i], 1);
                }

                break;
            }
        }
    }

    return path;
}

function transformCells(cells: Array<Cell>): Array<VCell> {
    const vcells: Array<VCell> = [];

    for (const cell of cells) {
        const vertices = getOrderedCellVertices(cell);
        const edges = getEdgesFromOrderedVertices(vertices);
        vcells.push({ edges, vertices });
    }

    return vcells;
}

export const VoronoiView: Component = props => {
    const context = useVoronoi();
    if (context === undefined) {
        throw new Error(`VoronoiView must be inside a VoroniProvider context`);
    }
    const [voronoiProps] = context;
    const [svg, setSvg] = createSignal<JSX.Element>(<></>);

    createEffect(() => {
        setSvg(render(voronoiProps));
    });

    return <>{svg()}</>;
};
