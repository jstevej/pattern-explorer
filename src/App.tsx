import { Container, Stack } from 'solid-bootstrap';
import { Component, createSignal, Match, Switch, untrack } from 'solid-js';
import { SForm, SFormSelect } from './SForm';
import { TruchetControls } from './TruchetControls';
import { TruchetProvider } from './TruchetProvider';
import { TruchetView } from './TruchetView';
import { VoronoiControls } from './VoronoiControls';
import { VoronoiProvider } from './VoronoiProvider';
import { VoronoiView } from './VoronoiView';

const patterns = ['truchet', 'voronoi'] as const;
type Pattern = (typeof patterns)[number];

function isPattern(pattern: string): pattern is Pattern {
    return (patterns as unknown as Array<string>).includes(pattern);
}

function withPattern(pattern: string, fn: (pattern: Pattern) => void): void {
    isPattern(pattern) ? fn(pattern) : console.error(`invalid pattern: ${pattern}`);
}

const App: Component = () => {
    const [pattern, setPattern] = createSignal<Pattern>('truchet');

    return (
        <TruchetProvider>
            <VoronoiProvider>
                <Container fluid>
                    <Stack direction="vertical">
                        <div>Pattern Explorer</div>
                        <Stack class="align-items-start" direction="horizontal" gap={3}>
                            <div class="flex-grow-1">
                                <Switch>
                                    <Match when={pattern() === 'truchet'}>
                                        <TruchetView />
                                    </Match>
                                    <Match when={pattern() === 'voronoi'}>
                                        <VoronoiView />
                                    </Match>
                                </Switch>
                            </div>
                            <div
                                class="gap-3"
                                style={{
                                    display: 'flex',
                                    'flex-direction': 'column',
                                    'min-width': '15vw',
                                }}
                            >
                                <SForm>
                                    <legend>Pattern</legend>
                                    <SFormSelect
                                        default={untrack(pattern)}
                                        id="pattern"
                                        label="Pattern"
                                        options={[
                                            { id: 'truchet', label: 'Truchet' },
                                            { id: 'voronoi', label: 'Voronoi' },
                                        ]}
                                        update={v => withPattern(v, setPattern)}
                                    />
                                </SForm>
                                <Switch>
                                    <Match when={pattern() === 'truchet'}>
                                        <TruchetControls />
                                    </Match>
                                    <Match when={pattern() === 'voronoi'}>
                                        <VoronoiControls />
                                    </Match>
                                </Switch>
                            </div>
                        </Stack>
                    </Stack>
                </Container>
            </VoronoiProvider>
        </TruchetProvider>
    );
};

export default App;
