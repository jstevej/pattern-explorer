export const epsilon = 1e-9;

export interface Point {
    x: number;
    y: number;
}

export class Line {
    public static fromPointAndAngle(p: Point, angle: number): Line {
        return new Line(
            Vector.fromPoint({ ...p }),
            Vector.fromPoint({ x: p.x + Math.cos(angle), y: p.y + Math.sin(angle) })
        );
    }

    public static fromPoints(p1: Point, p2: Point): Line {
        return new Line(Vector.fromPoint({ ...p1 }), Vector.fromPoint({ ...p2 }));
    }

    public static fromVector(v: Vector): Line {
        return new Line(Vector.fromPoint({ x: 0, y: 0 }), v);
    }

    public static fromVectors(v1: Vector, v2: Vector): Line {
        return new Line(v1.clone(), v2.clone());
    }

    public constructor(
        public p1: Vector,
        public p2: Vector
    ) {}

    public distanceTo(p: Point): number {
        const x0 = p.x;
        const y0 = p.y;
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const dx = x2 - x1;
        const dy = y2 - y1;

        return Math.abs(dx * (y1 - y0) - dy * (x1 - x0)) / Math.sqrt(dx * dx + dy * dy);
    }

    public distanceToSegment(p: Point | Vector): number {
        const v = p instanceof Vector ? p : Vector.fromPoint(p);
        const l2 = this.p1.distanceSquaredTo(this.p2);
        if (l2 === 0) return v.distanceTo(this.p1);
        const delta = this.parallelVector();
        const start = v.clone().subtract(this.p1);
        const t = Math.max(0, Math.min(1, start.dot(delta) / l2));
        return v.distanceTo({
            x: this.p1.x + t * delta.x,
            y: this.p1.y + t * delta.y,
        });
    }

    public length(): number {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public intersection(line: Line): Vector | undefined {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const x3 = line.p1.x;
        const y3 = line.p1.y;
        const x4 = line.p2.x;
        const y4 = line.p2.y;

        const dx12 = x1 - x2;
        const dy12 = y1 - y2;
        const dx34 = x3 - x4;
        const dy34 = y3 - y4;

        const denom = dx12 * dy34 - dy12 * dx34;

        if (denom === 0) return undefined;

        const invDenom = 1 / denom;
        const c12 = x1 * y2 - y1 * x2;
        const c34 = x3 * y4 - y3 * x4;

        return Vector.fromPoint({
            x: (c12 * dx34 - dx12 * c34) * invDenom,
            y: (c12 * dy34 - dy12 * c34) * invDenom,
        });
    }

    public midpoint(): Vector {
        return Vector.fromPoint({
            x: 0.5 * (this.p2.x + this.p1.x),
            y: 0.5 * (this.p2.y + this.p1.y),
        });
    }

    public normalLeft(): Vector {
        return Vector.fromPoint({
            x: this.p1.y - this.p2.y,
            y: this.p2.x - this.p1.x,
        });
    }

    public normalRight(): Vector {
        return Vector.fromPoint({
            x: this.p2.y - this.p1.y,
            y: this.p1.x - this.p2.x,
        });
    }

    public parallelVector(): Vector {
        return Vector.fromPoint({
            x: this.p2.x - this.p1.x,
            y: this.p2.y - this.p1.y,
        });
    }

    public segmentIntersection(line: Line): Vector | undefined {
        const i = this.intersection(line);

        if (i === undefined) return undefined;

        const xMin = this.p1.x;
        const xMax = this.p2.x;
        const intersects = xMin < xMax ? i.x >= xMin && i.x <= xMax : i.x >= xMax && i.x <= xMin;
        return intersects ? i : undefined;
    }

    public translate(v: Point | Vector): Line {
        this.p1.x += v.x;
        this.p1.y += v.y;
        this.p2.x += v.x;
        this.p2.y += v.y;
        return this;
    }
}

export class Vector implements Point {
    public static fromCoords(x: number, y: number): Vector {
        return new Vector(x, y);
    }

    public static fromPoint(p: Point): Vector {
        return new Vector(p.x, p.y);
    }

    public static random(): Vector {
        return new Vector(Math.random(), Math.random());
    }

    public static zero(): Vector {
        return new Vector(0, 0);
    }

    constructor(
        public x: number,
        public y: number
    ) {}

    public add(vector: Point | Vector): Vector {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public angleTo(vector: Point | Vector): number {
        const thisAngle = Math.atan2(this.y, this.x);
        const otherAngle = Math.atan2(vector.y, vector.x);
        let angle = otherAngle - thisAngle;

        if (angle > Math.PI) angle -= 2 * Math.PI;
        if (angle < -Math.PI) angle += 2 * Math.PI;

        return angle;
    }

    public clone(): Vector {
        return new Vector(this.x, this.y);
    }

    public distanceSquaredTo(vector: Point | Vector): number {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return dx * dx + dy * dy;
    }

    public distanceTo(vector: Point | Vector): number {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public dot(vector: Point | Vector): number {
        return this.x * vector.x + this.y * vector.y;
    }

    public isClose(vector: Point | Vector, eps = epsilon): boolean {
        return Math.abs(this.x - vector.x) < eps && Math.abs(this.y - vector.y) < eps;
    }

    public isEqual(vector: Point | Vector): boolean {
        return this.x === vector.x && this.y === vector.y;
    }

    public isParallel(vector: Vector, eps = epsilon): boolean {
        const modA = this.modulus();
        const modB = vector.modulus();
        return modA * modB - Math.abs(this.dot(vector)) < eps;
    }

    public isPerpendicular(vector: Point | Vector, eps = epsilon): boolean {
        return Math.abs(this.dot(vector)) < eps;
    }

    public modulus(): number {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }

    public modulusSquared(): number {
        const x = this.x;
        const y = this.y;
        return x * x + y * y;
    }

    public multiply(k: number): Vector {
        this.x *= k;
        this.y *= k;
        return this;
    }

    public normalize(): Vector {
        const x = this.x;
        const y = this.y;
        const invMod = 1 / Math.sqrt(x * x + y * y);
        this.x = x * invMod;
        this.y = y * invMod;
        return this;
    }

    public projectOnto(vector: Vector): Vector {
        const u = vector.clone().normalize();
        return u.multiply(this.dot(u));
    }

    public rotate(angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x;
        const y = this.y;

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }

    public subtract(vector: Point | Vector): Vector {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
}
