import { Point } from './Vector';

export function circularArc(r: number, end: Point, largeArc = false, sweep = false): string {
    return ` A ${r} ${r} 0 ${largeArc ? '1' : '0'} ${sweep ? '1' : '0'} ${end.x} ${end.y}`;
}

export function createCircularArc(
    r: number,
    start: Point,
    end: Point,
    largeArc = false,
    sweep = false
): Element {
    let d = `M ${start.x} ${start.y}`;
    d += circularArc(r, end, largeArc, sweep);

    const el = createSvgElement('path');
    el.setAttribute('d', d);

    return el;
}

export function createRootElement(width: number, height: number): Element {
    const svg = createSvgElement('svg');
    svg.setAttribute('version', '1.1');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    return svg;
}

export function createSvgElement(name: string, attr?: Record<string, string>): Element {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attr) setAttributes(el, attr);
    return el;
}

export function createPath(vertices: Array<Point>, close = true): Element {
    let d = '';

    vertices.forEach((v, i) => {
        if (i === 0) {
            d += `M ${v.x} ${v.y}`;
        } else {
            d += ` L ${v.x} ${v.y}`;
            if (close && i === vertices.length - 1) d += ' Z';
        }
    });

    const path = createSvgElement('path');
    path.setAttribute('d', d);
    return path;
}

export function setAttributes(el: Element, attr: Record<string, string>): void {
    for (const [key, value] of Object.entries(attr)) {
        el.setAttribute(key, value);
    }
}
