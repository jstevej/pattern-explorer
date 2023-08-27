import { Component, createEffect, createSignal, Show } from 'solid-js';
import { createStore, produce, unwrap } from 'solid-js/store';
import { SForm, SFormCheckbox, SFormNumber, SFormSelect } from './SForm';
import { Point } from './Vector';
import { useVoronoi } from './VoronoiProvider';

const pointsSources = ['cairo', 'grid', 'random'] as const;
type PointsSource = (typeof pointsSources)[number];

function isPointsSource(source: string): source is PointsSource {
    return (pointsSources as unknown as Array<string>).includes(source);
}

function withPointsSource(source: string, fn: (pattern: PointsSource) => void): void {
    isPointsSource(source) ? fn(source) : console.error(`invalid points source: ${source}`);
}

interface CairoProps {
    angle: number;
    border: number;
    jitter: number;
    spacing: number;
}

interface GridProps {
    angle: number;
    border: number;
    isStaggered: boolean;
    jitter: number;
    xSpacing: number;
    ySpacing: number;
}

interface RandomProps {
    border: number;
    minSpacing: number;
    numPoints: number;
}

interface ViewProps {
    height: number;
    width: number;
}

export const VoronoiControls: Component = () => {
    const voronoiContext = useVoronoi();

    if (voronoiContext === undefined) {
        throw new Error(`VoronoiControls must be inside a VoronoiProvider context`);
    }

    const [voronoiProps, setVoronoiProps] = voronoiContext;
    const [cairoProps, setCairoProps] = createStore<CairoProps>({
        angle: 0,
        border: 20,
        jitter: 0,
        spacing: 80,
    });
    const [gridProps, setGridProps] = createStore<GridProps>({
        angle: 0,
        border: 1,
        isStaggered: true,
        jitter: 0,
        xSpacing: 50,
        ySpacing: 50,
    });
    const [randomProps, setRandomProps] = createStore<RandomProps>({
        border: 20,
        minSpacing: 40,
        numPoints: 300,
    });
    const [pointsSource, setPointsSource] = createSignal<PointsSource>('cairo');
    const [viewProps, setViewProps] = createStore<ViewProps>({ height: 700, width: 1600 });
    const numLoopsLimit = 1_000_000;

    createEffect(() => setVoronoiProps(produce(p => (p.height = viewProps.height))));
    createEffect(() => setVoronoiProps(produce(p => (p.width = viewProps.width))));

    createEffect(() => {
        if (pointsSource() === 'grid') {
            const points: Array<Point> = [];
            const height = voronoiProps.height;
            const width = voronoiProps.width;
            const maxDimension = Math.max(height, width);
            const xSpacing = gridProps.xSpacing;
            const ySpacing = gridProps.ySpacing;
            const angle = -(gridProps.angle * Math.PI) / 180;
            const border = gridProps.border;
            const isStaggered = gridProps.isStaggered;
            const jitter = gridProps.jitter;

            const nx = Math.floor(maxDimension / xSpacing);
            const ny = Math.floor(maxDimension / ySpacing);
            let x = xSpacing - nx * xSpacing;
            let y = ySpacing - ny * ySpacing;
            let n = 0;

            let isEven = nx % 2 === 0;

            while (y < height + maxDimension) {
                if (n++ > numLoopsLimit) {
                    console.error(`too many loops; aborting`);
                    break;
                }

                const dx = x - xSpacing;
                const dy = y - ySpacing;
                const xj = dx + jitter * (2 * Math.random() - 1);
                const yj = dy + jitter * (2 * Math.random() - 1);
                const xx = xj * Math.cos(angle) - yj * Math.sin(angle) + xSpacing;
                const yy = yj * Math.cos(angle) + xj * Math.sin(angle) + ySpacing;

                if (xx >= border && xx < width - border && yy >= border && yy < height - border) {
                    points.push({ x: xx, y: yy });
                }

                x += xSpacing;

                if (x >= width + maxDimension) {
                    y += ySpacing;
                    isEven = !isEven;
                    x = xSpacing - nx * xSpacing;
                    if (isStaggered && !isEven) x += 0.5 * xSpacing;
                }
            }

            setVoronoiProps(produce(p => (p.points = points)));
        } else if (pointsSource() === 'random') {
            const points: Array<Point> = [];
            const height = voronoiProps.height;
            const width = voronoiProps.width;
            const border = randomProps.border;
            const rSquared = randomProps.minSpacing * randomProps.minSpacing;
            let n = 0;

            while (points.length < randomProps.numPoints) {
                if (n++ > numLoopsLimit) {
                    console.error(`too many loops; aborting`);
                    break;
                }

                const x = Math.random() * (width - 2 * border) + border;
                const y = Math.random() * (height - 2 * border) + border;
                const isClose = points.some(p => {
                    const dx = p.x - x;
                    const dy = p.y - y;
                    const distSquared = dx * dx + dy * dy;
                    return distSquared < rSquared;
                });

                if (!isClose) {
                    points.push({ x, y });
                }
            }

            setVoronoiProps(produce(p => (p.points = points)));
        } else if (pointsSource() === 'cairo') {
            const points: Array<Point> = [];
            const height = voronoiProps.height;
            const width = voronoiProps.width;
            const maxDimension = Math.max(height, width);
            const spacing = cairoProps.spacing;
            const angle = -(cairoProps.angle * Math.PI) / 180;
            const border = cairoProps.border;
            const jitter = cairoProps.jitter;

            const d1 = (spacing * Math.sqrt(3)) / 2;
            const d2 = spacing + d1;
            const k = Math.floor((maxDimension + d2) / d2);
            const i0 = -k * d2;
            let x0 = i0;
            let y0 = i0;
            let x = x0;
            let y = y0;
            let colAlt = false;
            let rowAlt = false;

            let n = 0;

            while (y < height + maxDimension) {
                if (n++ > numLoopsLimit) {
                    console.error(`too many loops; aborting`);
                    break;
                }

                const xj = x + jitter * (2 * Math.random() - 1);
                const yj = y + jitter * (2 * Math.random() - 1);
                const xx = xj * Math.cos(angle) - yj * Math.sin(angle);
                const yy = yj * Math.cos(angle) + xj * Math.sin(angle);

                if (xx >= border && xx < width - border && yy >= border && yy < height - border) {
                    points.push({ x: xx, y: yy });
                }

                if (x >= width + maxDimension) {
                    if (rowAlt) {
                        x0 -= 0.5 * spacing;
                        y0 += d1;
                        colAlt = false;
                    } else {
                        y0 += spacing;
                        colAlt = false;
                    }

                    x = x0;
                    y = y0;

                    rowAlt = !rowAlt;
                } else {
                    x += colAlt ? spacing : d1;
                    y += colAlt ? 0 : 0.5 * spacing;
                    colAlt = !colAlt;
                }
            }

            setVoronoiProps(produce(p => (p.points = points)));
        }
    });

    return (
        <>
            <SForm>
                <legend>View</legend>
                <SFormNumber
                    default={unwrap(viewProps.width)}
                    id="width"
                    label="Width"
                    max={10000}
                    min={1}
                    step={10}
                    update={v => setViewProps(produce(p => (p.width = v)))}
                />
                <SFormNumber
                    default={unwrap(viewProps.height)}
                    id="height"
                    label="Height"
                    max={10000}
                    min={1}
                    step={10}
                    update={v => setViewProps(produce(p => (p.height = v)))}
                />
            </SForm>
            <SForm>
                <legend>Points</legend>
                <SFormSelect
                    id="points"
                    label="Points Source"
                    options={[
                        { id: 'cairo', label: 'Cairo' },
                        { id: 'grid', label: 'Grid' },
                        { id: 'random', label: 'Random' },
                    ]}
                    update={v => withPointsSource(v, setPointsSource)}
                />
                <Show when={pointsSource() === 'cairo'}>
                    <SFormNumber
                        default={unwrap(cairoProps.angle)}
                        id="cairoAngle"
                        label="Angle"
                        max={180}
                        min={-180}
                        step={1}
                        update={v => setCairoProps(produce(p => (p.angle = v)))}
                    />
                    <SFormNumber
                        default={unwrap(cairoProps.border)}
                        id="cairoBorder"
                        label="Border"
                        max={1000}
                        min={0}
                        step={1}
                        update={v => setCairoProps(produce(p => (p.border = v)))}
                    />
                    <SFormNumber
                        default={unwrap(cairoProps.jitter)}
                        id="cairoJitter"
                        label="Jitter"
                        max={1000}
                        min={0}
                        step={1}
                        update={v => setCairoProps(produce(p => (p.jitter = v)))}
                    />
                    <SFormNumber
                        default={unwrap(cairoProps.spacing)}
                        id="cairoSpacing"
                        label="Spacing"
                        max={1000}
                        min={1}
                        step={1}
                        update={v => setCairoProps(produce(p => (p.spacing = v)))}
                    />
                </Show>
                <Show when={pointsSource() === 'grid'}>
                    <SFormNumber
                        default={unwrap(gridProps.angle)}
                        id="gridAngle"
                        label="Angle"
                        max={180}
                        min={-180}
                        step={1}
                        update={v => setGridProps(produce(p => (p.angle = v)))}
                    />
                    <SFormNumber
                        default={unwrap(gridProps.border)}
                        id="gridBorder"
                        label="Border"
                        max={1000}
                        min={0}
                        step={1}
                        update={v => setGridProps(produce(p => (p.border = v)))}
                    />
                    <SFormCheckbox
                        default={unwrap(gridProps.isStaggered)}
                        id="gridIsStaggered"
                        label="Stagger"
                        update={v => setGridProps(produce(p => (p.isStaggered = v)))}
                    />
                    <SFormNumber
                        default={unwrap(gridProps.xSpacing)}
                        id="gridXSpacing"
                        label="X Spacing"
                        max={1000}
                        min={1}
                        step={1}
                        update={v => setGridProps(produce(p => (p.xSpacing = v)))}
                    />
                    <SFormNumber
                        default={unwrap(gridProps.ySpacing)}
                        id="gridYSpacing"
                        label="Y Spacing"
                        max={1000}
                        min={1}
                        step={1}
                        update={v => setGridProps(produce(p => (p.ySpacing = v)))}
                    />
                    <SFormNumber
                        default={unwrap(gridProps.jitter)}
                        id="gridJitter"
                        label="Jitter"
                        max={1000}
                        min={0}
                        step={1}
                        update={v => setGridProps(produce(p => (p.jitter = v)))}
                    />
                </Show>
                <Show when={pointsSource() === 'random'}>
                    <SFormNumber
                        default={unwrap(randomProps.border)}
                        id="randomBorder"
                        label="Border"
                        max={1000}
                        min={0}
                        step={1}
                        update={v => setRandomProps(produce(p => (p.border = v)))}
                    />
                    <SFormNumber
                        default={unwrap(randomProps.minSpacing)}
                        id="randomMinSpacing"
                        label="Minimum Spacing"
                        max={1000}
                        min={1}
                        step={1}
                        update={v => setRandomProps(produce(p => (p.minSpacing = v)))}
                    />
                    <SFormNumber
                        default={unwrap(randomProps.numPoints)}
                        id="randomNumPoints"
                        label="Number of Points"
                        max={1000}
                        min={1}
                        step={10}
                        update={v => setRandomProps(produce(p => (p.numPoints = v)))}
                    />
                </Show>
            </SForm>
            <SForm>
                <legend>Cells</legend>
                <SFormNumber
                    default={unwrap(voronoiProps.borderWidth)}
                    id="cellsBorderWidth"
                    label="Border Width"
                    max={1000}
                    min={1}
                    step={1}
                    update={v => setVoronoiProps(produce(p => (p.borderWidth = v)))}
                />
                <SFormNumber
                    default={unwrap(voronoiProps.bezierFactor)}
                    id="cellsBezierFactor"
                    label="Bezier Factor"
                    max={10}
                    min={0}
                    step={0.1}
                    update={v => setVoronoiProps(produce(p => (p.bezierFactor = v)))}
                />
                <SFormNumber
                    default={unwrap(voronoiProps.parallelPathStep)}
                    id="cellsParallelPathStep"
                    label="Path Step"
                    max={10}
                    min={0.001}
                    step={0.1}
                    update={v => setVoronoiProps(produce(p => (p.parallelPathStep = v)))}
                />
                <SFormNumber
                    default={unwrap(voronoiProps.simplifyRadius)}
                    id="cellsSimplifyRadius"
                    label="Simplify Radius"
                    max={1000}
                    min={0}
                    step={0.1}
                    update={v => setVoronoiProps(produce(p => (p.simplifyRadius = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showControlPoints)}
                    id="cellsShowControlPoints"
                    label="Show Control Points"
                    update={v => setVoronoiProps(produce(p => (p.showControlPoints = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showEdges)}
                    id="cellsShowEdges"
                    label="Show Edges"
                    update={v => setVoronoiProps(produce(p => (p.showEdges = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showHardCells)}
                    id="cellsShowHardCells"
                    label="Show Hard Cells"
                    update={v => setVoronoiProps(produce(p => (p.showHardCells = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showSeeds)}
                    id="cellsShowSeeds"
                    label="Show Seeds"
                    update={v => setVoronoiProps(produce(p => (p.showSeeds = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showSmoothCells)}
                    id="cellsShowSmoothCells"
                    label="Show Smooth Cells"
                    update={v => setVoronoiProps(produce(p => (p.showSmoothCells = v)))}
                />
                <SFormCheckbox
                    default={unwrap(voronoiProps.showVeins)}
                    id="cellsShowVeins"
                    label="Show Veins"
                    update={v => setVoronoiProps(produce(p => (p.showVeins = v)))}
                />
            </SForm>
        </>
    );
};
