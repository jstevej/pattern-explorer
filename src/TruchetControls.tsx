import { Component, Show } from 'solid-js';
import { produce, unwrap } from 'solid-js/store';
import { SForm, SFormCheckbox, SFormNumber, SFormSelect } from './SForm';
import {
    useTruchet,
    withEacEdgeBehavior,
    withEacSeed,
    withGridPattern,
    withTilePattern,
} from './TruchetProvider';
//import { Point } from './Vector';

export const TruchetControls: Component = () => {
    const truchetContext = useTruchet();

    if (truchetContext === undefined) {
        throw new Error(`TruchetControls must be inside a TruchetProvider context`);
    }

    const [truchetProps, setTruchetProps] = truchetContext;

    return (
        <>
            <SForm>
                <legend>Grid</legend>
                <SFormNumber
                    default={unwrap(truchetProps.grid.width)}
                    id="gridWidth"
                    label="Width"
                    max={10000}
                    min={1}
                    step={10}
                    update={v => setTruchetProps(produce(p => (p.grid.width = v)))}
                />
                <SFormNumber
                    default={unwrap(truchetProps.grid.height)}
                    id="gridHeight"
                    label="Height"
                    max={10000}
                    min={1}
                    step={10}
                    update={v => setTruchetProps(produce(p => (p.grid.height = v)))}
                />
                <SFormNumber
                    default={unwrap(truchetProps.grid.spacing)}
                    id="gridSpacing"
                    label="Spacing"
                    max={1000}
                    min={1}
                    step={10}
                    update={v => setTruchetProps(produce(p => (p.grid.spacing = v)))}
                />
                <SFormSelect
                    default={unwrap(truchetProps.grid.pattern)}
                    id="gridPattern"
                    label="Pattern"
                    options={[
                        { id: 'checkerboard', label: 'Checkerboard' },
                        { id: 'eac', label: 'Cellular Automata' },
                        { id: 'random', label: 'Random' },
                    ]}
                    update={v => {
                        withGridPattern(v, g =>
                            setTruchetProps(produce(p => (p.grid.pattern = g)))
                        );
                    }}
                />
                <Show when={truchetProps.grid.pattern === 'checkerboard'}>
                    <SFormNumber
                        default={unwrap(truchetProps.grid.checkerboard.size)}
                        id="gridCheckerboardSize"
                        label="Checkerboard Size"
                        max={1000}
                        min={1}
                        step={1}
                        update={v => setTruchetProps(produce(p => (p.grid.checkerboard.size = v)))}
                    />
                </Show>
                <Show when={truchetProps.grid.pattern === 'eac'}>
                    <SFormSelect
                        default={unwrap(truchetProps.grid.eac.edgeBehavior)}
                        id="gridEacEdgeBehavior"
                        label="Edges"
                        options={[
                            { id: 'infinite', label: 'Infinite' },
                            { id: 'wrap', label: 'Wrap' },
                        ]}
                        update={v =>
                            withEacEdgeBehavior(v, e =>
                                setTruchetProps(produce(p => (p.grid.eac.edgeBehavior = e)))
                            )
                        }
                    />
                    <SFormNumber
                        default={unwrap(truchetProps.grid.eac.rule)}
                        id="gridEacRule"
                        label="Rule"
                        max={255}
                        min={0}
                        step={1}
                        update={v => setTruchetProps(produce(p => (p.grid.eac.rule = v)))}
                    />
                    <SFormSelect
                        default={unwrap(truchetProps.grid.eac.seed)}
                        id="gridEacSeed"
                        label="Seed"
                        options={[
                            { id: 'allClear', label: 'All Clear' },
                            { id: 'allSet', label: 'All Set' },
                            { id: 'alternating', label: 'Alternating' },
                            { id: 'center', label: 'Center' },
                            { id: 'first', label: 'First' },
                            { id: 'random', label: 'Random' },
                        ]}
                        update={v =>
                            withEacSeed(v, s =>
                                setTruchetProps(produce(p => (p.grid.eac.seed = s)))
                            )
                        }
                    />
                    <Show
                        when={
                            truchetProps.grid.eac.seed === 'alternating' ||
                            truchetProps.grid.eac.seed === 'center'
                        }
                    >
                        <SFormNumber
                            default={unwrap(truchetProps.grid.eac.size)}
                            id="gridEacSize"
                            label="Size"
                            max={1000}
                            min={1}
                            step={1}
                            update={v => setTruchetProps(produce(p => (p.grid.eac.size = v)))}
                        />
                    </Show>
                    <SFormNumber
                        default={unwrap(truchetProps.grid.eac.offset)}
                        id="gridEacOffset"
                        label="Offset"
                        max={1000000}
                        min={0}
                        step={1}
                        update={v => setTruchetProps(produce(p => (p.grid.eac.offset = v)))}
                    />
                    <SFormCheckbox
                        default={unwrap(truchetProps.grid.eac.invert)}
                        id="gridEacInvert"
                        label="Invert"
                        update={v => setTruchetProps(produce(p => (p.grid.eac.invert = v)))}
                    />
                </Show>
            </SForm>
            <SForm>
                <legend>Tiles</legend>
                <SFormSelect
                    default={unwrap(truchetProps.tile.pattern)}
                    id="tileStyle"
                    label="Style"
                    options={[
                        { id: 'concentricSmith', label: 'Concentric Smith' },
                        { id: 'diagonal', label: 'Diagonal' },
                        { id: 'smith', label: 'Smith' },
                        { id: 'solid', label: 'Solid' },
                        { id: 'triangle', label: 'Triangle' },
                    ]}
                    update={v => {
                        withTilePattern(v, t =>
                            setTruchetProps(produce(p => (p.tile.pattern = t)))
                        );
                    }}
                />
                <Show when={truchetProps.tile.pattern === 'concentricSmith'}>
                    <SFormNumber
                        default={unwrap(truchetProps.tile.concentricSmith.numCircles)}
                        id="tileNumCircles"
                        label="Number of Circles"
                        max={10}
                        min={1}
                        step={1}
                        update={v =>
                            setTruchetProps(produce(p => (p.tile.concentricSmith.numCircles = v)))
                        }
                    />
                    <SFormNumber
                        default={unwrap(truchetProps.tile.concentricSmith.gap)}
                        id="tileGap"
                        label="Gap"
                        max={1}
                        min={0}
                        step={0.01}
                        update={v =>
                            setTruchetProps(produce(p => (p.tile.concentricSmith.gap = v)))
                        }
                    />
                    <SFormNumber
                        default={unwrap(truchetProps.tile.concentricSmith.strokeWidth)}
                        id="tileStrokeWidth"
                        label="Stroke Width"
                        max={100}
                        min={0}
                        step={0.1}
                        update={v =>
                            setTruchetProps(produce(p => (p.tile.concentricSmith.strokeWidth = v)))
                        }
                    />
                </Show>
            </SForm>
        </>
    );
};
