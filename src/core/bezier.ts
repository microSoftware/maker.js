namespace MakerJs.bezier {

    /**
     * BezierJs library
     */
    var Bezier: typeof BezierJs.Bezier = require('bezier-js');

    var curveIntersectionThreshold = .001;

    function toLibBezier(bez: IPathBezier): BezierJs.Bezier {
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

    function toLibLine(line: IPathLine): BezierJs.Line {
        return { p1: point.toXY(line.origin), p2: point.toXY(line.end) };
    }

    function fromLibBezier(bez: BezierJs.Bezier): IPathBezier {
        return new paths.Bezier(bez.points.map(point.fromXY));
    }

    function fromLibArc(a: BezierJs.Arc): IPathArc {
        return new paths.Arc([a.x, a.y], a.r, a.s, a.e);
    }

    function fromLibShape(originalBez: IPathBezier, forward: IPathBezier, back: IPathBezier, expansion: number, isStartCap: boolean, isEndcap: boolean): IModel {
        var model: IModel = { paths: {} };
        var caps: IModel;

        model.paths['back'] = back;
        model.paths['forward'] = forward;

        function ensureCaps() {
            if (!caps) {
                caps = { paths: {} };
                model.models = { "Caps": caps };
            }
        }

        var startLine = new paths.Line(forward.origin, back.end);
        var endLine = new paths.Line(back.origin, forward.end);

        if (point.fromSlopeIntersection(startLine, endLine)) {
            startLine.end = back.origin;
            endLine.origin = back.end;
        }

        function arcFromBezEnds(origin: IPoint, line: IPathLine) {
            var startAngle = angle.ofPointInDegrees(origin, line.origin);
            var endAngle = angle.ofPointInDegrees(origin, line.end);
            return new paths.Arc(origin, expansion, startAngle, endAngle);
        }

        if (isStartCap) {
            ensureCaps();
            caps.paths["startcap"] = arcFromBezEnds(originalBez.origin, startLine);
        } else {
            model.paths['startline'] = startLine;
        }

        if (isEndcap) {
            ensureCaps();
            caps.paths["endcap"] = arcFromBezEnds(originalBez.end, endLine);
        } else {
            model.paths['endline'] = endLine;
        }

        return model;
    }

    function bezierToBezier(b1: BezierJs.Bezier, b2: BezierJs.Bezier): number[][] {
        var result: number[][] = [];
        var x = b1.intersects(b2, curveIntersectionThreshold) as string[];
        x.map(function (ff: string) {
            var ss = ff.split('/');
            var row: number[] = [];
            var valid = true;
            ss.map(function (sf: string) {
                var value = parseFloat(sf);
                row.push(value);
            });

            //check for dupes
            for (var i = 0; i < result.length; i++) {
                if (result[i][0] === row[0] && result[i][1] === row[1]) {
                    return;
                }
            }

            result.push(row);
        });
        return result;
    }

    function controlYForCircularCubic(arcSpanInRadians: number): number {

        //from http://pomax.github.io/bezierinfo/#circles_cubic
        return 4 * (Math.tan(arcSpanInRadians / 4) / 3);

    }

    function controlPointsForCircularCubic(arc: IPathArc): IPoint[] {

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

    export function breakAt(bez: IPathBezier, t: number) {
        if (t < 0 || t > 1) return null;

        var b = toLibBezier(bez);
        var split = b.split(t);
        var update = fromLibBezier(split.left);

        //assume all points from the left side
        extendObject(bez, update);

        return fromLibBezier(split.right);
    }

    export function expand(bez: IPathBezier, expansion: number, isolateCaps: boolean): IModel {
        if (expansion <= 0) return null;

        var result: IModel = {
            models: {
                expansions: { models: {} },
                caps: { models: {} }
            }
        };

        var b = toLibBezier(bez);

        var reduced = b.reduce() as BezierJs.Bezier[];

        //form curve outlines
        var shapes = reduced.map(function (segment, index) {
            try {
                var back = segment.scale(-expansion);
                var forward = segment.scale(expansion);

                return fromLibShape(bez, fromLibBezier(forward), fromLibBezier(back), expansion, index === 0, index === reduced.length - 1);
            } catch (e) {
                return new models.Slot(point.fromXY(segment.points[0]), point.fromXY(segment.points[segment.points.length - 1]), expansion, isolateCaps);
            }
        });

        //now combine all the shapes
        var combineOptions: ICombineOptions = {};
        var first = true;

        for (var i = 0; i < shapes.length; i++) {
            var newId = 'shape_' + i;
            var shape = shapes[i];

            if (!shape) continue;

            if (!first) {
                //            model.combine(result, shape, false, true, false, true, combineOptions);
                //          combineOptions.measureA.modelsMeasured = false;
                //        delete combineOptions.measureB;
            }

            result.models['expansions'].models[newId] = shape;

            if (shape.models) {
                var caps = shape.models['Caps'];

                if (caps) {
                    delete shape.models['Caps'];

                    result.models['caps'].models[newId] = caps;
                }
            }
            first = false;
        }
        return result;
    }

    export function extents(bez: IPathBezier): IMeasure {
        var b = toLibBezier(bez);
        var bbox = b.bbox();
        return {
            low: [bbox.x.min, bbox.y.min],
            high: [bbox.x.max, bbox.y.max]
        };
    }

    export function fromArc(arc: IPathArc): IPathBezier {
        var span = angle.ofArcSpan(arc);
        if (span <= 90) {
            var endPoints = point.fromPathEnds(arc);
            return new paths.Bezier(endPoints[0], controlPointsForCircularCubic(arc), endPoints[1]);
        }
        return null;
    }

    export function intersectBezier(bez1: IPathBezier, bez2: IPathBezier): number[][] {
        var b1 = toLibBezier(bez1);
        var b2 = toLibBezier(bez2);
        return bezierToBezier(b1, b2);
    }

    export function intersectLine(bez: IPathBezier, line: IPathLine) {
        var b = toLibBezier(bez);
        return b.intersects(toLibLine(line)) as number[];
    }

    export function length(bez: IPathBezier) {
        var b = toLibBezier(bez);
        return b.length();
    }

    export function tValuesToPoints(bez: IPathBezier, values: number[]) {
        var b = toLibBezier(bez);

        function pointOnCurve(t: number): IPoint {
            return point.fromXY(b.compute(t));
        }

        return values.map(pointOnCurve);
    }

    export function tValueToPoint(bez: IPathBezier, value: number) {
        var b = toLibBezier(bez);
        var p = b.compute(value);
        return point.fromXY(p);
    }

    export function toArcs(bez: IPathBezier, errorThreshold: number = .001) {
        var b = toLibBezier(bez);
        var arcs = b.arcs(errorThreshold).map(fromLibArc);
        return arcs;
    }

}
