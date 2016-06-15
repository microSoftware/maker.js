namespace MakerJs.bezier {

    export function toLib(bez: IPathBezier): BezierJs.Bezier {
        var coords: number[] = [];

        coords.push.apply(coords, bez.origin);

        if (bez.control) {
            coords.push.apply(coords, bez.control);
        } else {
            coords.push.apply(coords, bez.controls[0]);
            coords.push.apply(coords, bez.controls[1]);
        }

        coords.push.apply(coords, bez.end);

        return new Bezier(coords);
    }

    export function fromArc(arc: IPathArc): IPathBezier {
        var span = angle.ofArcSpan(arc);
        if (span <= 90) {
            var endPoints = point.fromPathEnds(arc);
            return new paths.Bezier(endPoints[0], bezier.controlPointsForCircularCubic(arc), endPoints[1]);
        }
        return null;
    }

    export function fromLib(bez: BezierJs.Bezier): IPathBezier {
        return new paths.Bezier(bez.points.map(point.fromXY));
    }

    export function toLibArc(a: BezierJs.Arc): IPathArc {
        return new paths.Arc([a.x, a.y], a.r, a.s, a.e);
    }

    var cache: { [arcSpan: number]: number } = {};

    export function controlYForCircularCubic(arcSpanInRadians: number): number {
        var cached = cache[arcSpanInRadians];
        if (cached !== void 0) return cached;

        //from http://pomax.github.io/bezierinfo/#circles_cubic
        var c = 4 * (Math.tan(arcSpanInRadians / 4) / 3);

        //from http://spencermortensen.com/articles/bezier-circle/
        var y = c;//.5 + Math.sqrt(12 - 20 * c - (3 * (c * c))) / (4 - 6 * c);

        //save the result so we don't compute again
        cache[arcSpanInRadians] = y;
        return y;
    }

    export function controlPointsForCircularCubic(arc: IPathArc): IPoint[] {

        var arcSpan = angle.ofArcSpan(arc);

        //compute y for radius of 1
        var y = controlYForCircularCubic(angle.toRadians(arcSpan));

        //multiply by radius
        var c1: IPoint = [arc.radius, arc.radius * y];

        //get second control point by mirroring, then rotating
        var c2 = point.rotate(point.mirror(c1, false, true), arcSpan, [0, 0]);

        //rotate again to start angle, then offset by arc's origin
        return [c1, c2].map(function (p: IPoint) { return point.add(arc.origin, point.rotate(p, arc.startAngle, [0, 0])); });
    }

}
