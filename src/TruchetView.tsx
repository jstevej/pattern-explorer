import { Component, createEffect, createSignal } from 'solid-js';
import { JSX } from 'solid-js/types/jsx';
import {
    circularArc,
    createCircularArc,
    createPath,
    createRootElement,
    createSvgElement,
} from './Svg';
import { GridPattern, TruchetGridProps, TruchetTileProps, useTruchet } from './TruchetProvider';
import { Point } from './Vector';

interface Grid {
    pattern: GridPattern;
    height: number;
    spacing: number;
    states: Array<boolean>;
    width: number;
}

function computeCellularAutomata(gridProps: TruchetGridProps, grid: Grid): void {
    const rowMax = Math.ceil(grid.height / grid.spacing);
    const colMax = Math.ceil(grid.width / grid.spacing);
    const implColMax = gridProps.eac.edgeBehavior === 'wrap' ? colMax : colMax + 2 * rowMax + 2;
    const implColOffset = gridProps.eac.edgeBehavior === 'wrap' ? 0 : rowMax + 1;
    let prev = new Array<boolean>(implColMax);
    let curr = new Array<boolean>(implColMax);
    const addRow = (r: number, row: Array<boolean>) => {
        if (r < gridProps.eac.offset) return;

        r = r - gridProps.eac.offset;

        for (let c = 0; c < colMax; c++) {
            let value = row[implColOffset + c];
            if (gridProps.eac.invert) value = !value;
            grid.states[r * colMax + c] = value;
        }
    };

    let ruleNumber = gridProps.eac.rule;
    const rule: Array<boolean> = [];

    if (ruleNumber < 0) {
        console.error(`invalid rule number: ${ruleNumber}`);
        ruleNumber = 0;
    }

    if (ruleNumber > 255) {
        console.error(`invalid rule number: ${ruleNumber}`);
        ruleNumber = 255;
    }

    for (let i = 0; i < 8; i++) {
        rule.push((ruleNumber & 1) > 0);
        ruleNumber >>= 1;
    }

    rule.reverse();

    if (gridProps.eac.seed === 'allClear') {
        for (let c = 0; c < implColMax; c++) {
            prev[c] = false;
        }
    } else if (gridProps.eac.seed === 'allSet') {
        for (let c = 0; c < implColMax; c++) {
            prev[c] = true;
        }
    } else if (gridProps.eac.seed === 'alternating') {
        let state = false;
        let count = 0;

        for (let c = 0; c < implColMax; c++) {
            prev[c] = state;

            if (++count >= gridProps.eac.size) {
                count = 0;
                state = !state;
            }
        }
    } else if (gridProps.eac.seed === 'center') {
        const start = Math.floor(0.5 * implColMax - gridProps.eac.size);
        const end = start + gridProps.eac.size;

        for (let c = 0; c < implColMax; c++) {
            prev[c] = c >= start && c < end;
        }
    } else if (gridProps.eac.seed === 'first') {
        for (let c = 0; c < implColMax; c++) {
            prev[c] = c === implColOffset + 1;
        }
    } else if (gridProps.eac.seed === 'random') {
        for (let c = 0; c < implColMax; c++) {
            prev[c] = Math.random() > 0.5;
        }
    }

    addRow(0, prev);

    for (let r = 1; r < rowMax + gridProps.eac.offset; r++) {
        for (let c = 0; c < implColMax; c++) {
            const left = c === 0 ? prev[implColMax - 1] : prev[c - 1];
            const mid = prev[c];
            const right = c === implColMax - 1 ? prev[0] : prev[c + 1];
            const index = 4 * (left ? 0 : 1) + 2 * (mid ? 0 : 1) + (right ? 0 : 1);
            curr[c] = rule[index] ?? false;
        }

        addRow(r, curr);
        [curr, prev] = [prev, curr];
    }
}

function createGrid(gridProps: TruchetGridProps): Grid {
    const grid: Grid = {
        ...gridProps,
        states: [],
    };

    if (grid.height === 0 || grid.spacing === 0 || grid.width === 0) return grid;

    if (grid.pattern === 'checkerboard') {
        let i = 0;
        let j = 0;
        let startState = false;
        let state = false;

        for (let y = 0; y < grid.height; y += grid.spacing) {
            j = 0;
            state = startState;

            if (++i >= gridProps.checkerboard.size) {
                startState = !startState;
                i = 0;
            }

            for (let x = 0; x < grid.width; x += grid.spacing) {
                grid.states.push(state);

                if (++j >= gridProps.checkerboard.size) {
                    state = !state;
                    j = 0;
                }
            }
        }
    } else if (grid.pattern === 'eac') {
        computeCellularAutomata(gridProps, grid);
    } else if (grid.pattern === 'random') {
        for (let y = 0; y < grid.height; y += grid.spacing) {
            for (let x = 0; x < grid.width; x += grid.spacing) {
                grid.states.push(Math.random() > 0.5);
            }
        }
    }

    return grid;
}

function render(props: TruchetTileProps, grid: Grid): Element {
    const spacing = grid.spacing;
    const svg = createRootElement(grid.width, grid.height);
    const tiles = createSvgElement('g');

    if (props.pattern === 'triangle' || props.pattern === 'solid') {
        tiles.setAttribute('stroke', 'black');
        tiles.setAttribute('stroke-width', '1'); // stroke prevents gaps at seams
        tiles.setAttribute('fill', 'black');
    } else {
        tiles.setAttribute('stroke', 'black');
        tiles.setAttribute('fill', 'none');

        if (props.pattern === 'concentricSmith') {
            tiles.setAttribute('stroke-width', `${props.concentricSmith.strokeWidth}`);
        } else {
            tiles.setAttribute('stroke-width', '2');
        }
    }

    svg.appendChild(tiles);
    let i = 0;

    for (let y = 0; y < grid.height; y += spacing) {
        for (let x = 0; x < grid.width; x += spacing) {
            if (props.pattern === 'concentricSmith') {
                const arcs = renderConcentricSmithTile(
                    x,
                    y,
                    spacing,
                    props.concentricSmith.numCircles,
                    props.concentricSmith.gap,
                    grid.states[i]
                );
                arcs.forEach(arc => tiles.appendChild(arc));
            } else if (props.pattern === 'diagonal') {
                tiles.appendChild(renderDiagonalTile(x, y, spacing, grid.states[i]));
            } else if (props.pattern === 'smith') {
                const arcs = renderSmithTile(x, y, spacing, grid.states[i]);
                arcs.forEach(arc => tiles.appendChild(arc));
            } else if (props.pattern === 'solid') {
                if (grid.states[i]) {
                    tiles.appendChild(renderSolidTile(x, y, spacing));
                }
            } else if (props.pattern === 'triangle') {
                tiles.appendChild(renderTriangleTile(x, y, spacing, grid.states[i]));
            }
            i++;

            if (false) {
                const outline = createPath([
                    { x, y },
                    { x: x + spacing, y },
                    { x: x + spacing, y: y + spacing },
                    { x, y: y + spacing },
                ]);
                outline.setAttribute('stroke', 'blue');
                outline.setAttribute('stroke-width', '1');
                outline.setAttribute('fill', 'none');
                tiles.append(outline);
            }
        }
    }

    return svg;
}

function renderConcentricSmithTile(
    x: number,
    y: number,
    size: number,
    numCircles: number,
    gap: number,
    state: boolean
): Array<Element> {
    gap = gap * size;
    const offset = Math.abs(0.5 * (size - gap * (numCircles - 1)));
    let t = offset;
    const dd: Array<number> = [];

    for (let i = 0; i < numCircles; i++) {
        dd.push(t);
        t += gap;
    }

    const ds = dd[0];
    const de = dd[dd.length - 1];

    const arcs: Array<Element> = [];
    const bgAttr = { stroke: 'none', fill: 'white' };

    if (state) {
        let d = `M ${x} ${y + ds}`;
        d += ' ' + circularArc(ds, { x: x + ds, y });
        d += ` L ${x + de} ${y}`;
        d += ' ' + circularArc(de, { x, y: y + de }, false, true);
        d += ' Z';
        const bg1 = createSvgElement('path', { d, ...bgAttr });

        d = `M ${x + size} ${y + size - ds}`;
        d += ' ' + circularArc(ds, { x: x + size - ds, y: y + size });
        d += ` L ${x + size - de} ${y + size}`;
        d += ' ' + circularArc(de, { x: x + size, y: y + size - de }, false, true);
        d += ' Z';
        const bg2 = createSvgElement('path', { d, ...bgAttr });

        const arcs1: Array<Element> = [];
        const arcs2: Array<Element> = [];

        for (const t of dd) {
            arcs1.push(createCircularArc(t, { x, y: y + t }, { x: x + t, y }));
            arcs2.push(
                createCircularArc(
                    t,
                    { x: x + size, y: y + size - t },
                    { x: x + size - t, y: y + size }
                )
            );
        }

        arcs.push(bg1);
        arcs.push(...arcs1);
        arcs.push(bg2);
        arcs.push(...arcs2);
    } else {
        let d = `M ${x + size - ds} ${y}`;
        d += ' ' + circularArc(ds, { x: x + size, y: y + ds });
        d += ` L ${x + size} ${y + de}`;
        d += ' ' + circularArc(de, { x: x + size - de, y }, false, true);
        d += ' Z';
        const bg1 = createSvgElement('path', { d, ...bgAttr });

        d = `M ${x + ds} ${y + size}`;
        d += ' ' + circularArc(ds, { x, y: y + size - ds });
        d += ` L ${x} ${y + size - de}`;
        d += ' ' + circularArc(de, { x: x + de, y: y + size }, false, true);
        d += ' Z';
        const bg2 = createSvgElement('path', { d, ...bgAttr });

        const arcs1: Array<Element> = [];
        const arcs2: Array<Element> = [];

        for (const t of dd) {
            arcs1.push(createCircularArc(t, { x: x + size - t, y }, { x: x + size, y: y + t }));
            arcs2.push(createCircularArc(t, { x: x + t, y: y + size }, { x, y: y + size - t }));
        }

        arcs.push(bg1);
        arcs.push(...arcs1);
        arcs.push(bg2);
        arcs.push(...arcs2);
    }

    return arcs;
}

function renderDiagonalTile(x: number, y: number, size: number, state: boolean): Element {
    return state
        ? createPath([
              { x, y },
              { x: x + size, y: y + size },
          ])
        : createPath([
              { x, y: y + size },
              { x: x + size, y },
          ]);
}

function renderSmithTile(x: number, y: number, size: number, state: boolean): Array<Element> {
    const elements: Array<Element> = [];
    const r = 0.5 * size;
    const p0: Point = { x: x + 0.5 * size, y };
    const p1: Point = { x: x + size, y: y + 0.5 * size };
    const p2: Point = { x: x + 0.5 * size, y: y + size };
    const p3: Point = { x, y: y + 0.5 * size };

    if (state) {
        elements.push(createCircularArc(r, p3, p0));
        elements.push(createCircularArc(r, p1, p2));
    } else {
        elements.push(createCircularArc(r, p0, p1));
        elements.push(createCircularArc(r, p2, p3));
    }

    return elements;
}

function renderSolidTile(x: number, y: number, size: number): Element {
    return createPath([
        { x, y },
        { x: x + size, y },
        { x: x + size, y: y + size },
        { x, y: y + size },
    ]);
}

function renderTriangleTile(x: number, y: number, size: number, state: boolean): Element {
    return state
        ? createPath([
              { x, y },
              { x: x + size, y },
              { x, y: y + size },
          ])
        : createPath([
              { x: x + size, y },
              { x: x + size, y: y + size },
              { x, y: y + size },
          ]);
}

export const TruchetView: Component = props => {
    const context = useTruchet();

    if (context === undefined) {
        throw new Error(`TruchetView must be used inside a TruchetProvider context`);
    }

    const [truchetProps] = context;
    const [grid, setGrid] = createSignal<Grid>({
        pattern: 'random',
        height: 0,
        spacing: 0,
        states: [],
        width: 0,
    });
    const [svg, setSvg] = createSignal<JSX.Element>(<></>);

    createEffect(() => {
        setGrid(createGrid(truchetProps.grid));
    });

    createEffect(() => {
        setSvg(render(truchetProps.tile, grid()));
    });

    return <>{svg()}</>;
};
