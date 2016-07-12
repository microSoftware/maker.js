namespace MakerJs.measure {

    /**
     * Find out if two angles are equal.
     * 
     * @param angleA First angle.
     * @param angleB Second angle.
     * @returns true if angles are the same, false if they are not
     */
    export function isAngleEqual(angleA: number, angleB: number, accuracy: number = .0001) {
        var a = angle.noRevolutions(angleA);
        var b = angle.noRevolutions(angleB);
        var d = angle.noRevolutions(round(b - a, accuracy));
        return d == 0;
    }

    /**
     * @private
     */
    interface IPathAreEqualMap {
        [type: string]: (pathA: IPath, pathB: IPath, withinPointDistance?: number) => boolean;
    }

    /**
     * @private
     */
    var pathAreEqualMap: IPathAreEqualMap = {};

    pathAreEqualMap[pathType.Line] = function (lineA: IPathLine, lineB: IPathLine, withinPointDistance?: number): boolean {
        var points = [lineA.origin, lineA.end];
        return (isPointArrayEqual(points, [lineB.origin, lineB.end], withinPointDistance))
            || (isPointArrayEqual(points, [lineB.end, lineB.origin], withinPointDistance));
    };

    pathAreEqualMap[pathType.Circle] = function (circleA: IPathCircle, circleB: IPathCircle, withinPointDistance): boolean {
        return isPointEqual(circleA.origin, circleB.origin, withinPointDistance) && circleA.radius == circleB.radius;
    };

    pathAreEqualMap[pathType.Bezier] = function (bez1: IPathBezier, bez2: IPathBezier, withinPointDistance): boolean {

        //single control point (quadratic)
        if (bez1.control && bez2.control) {
            var q1points = [bez1.origin, bez1.end, bez1.control];
            return (isPointArrayEqual(q1points, [bez2.origin, bez2.end, bez2.control], withinPointDistance))
                || (isPointArrayEqual(q1points, [bez2.end, bez2.origin, bez2.control], withinPointDistance));
        }

        //two control points (cubic)
        if (bez1.controls && bez2.controls) {
            var c1points = [bez1.origin, bez1.end, bez1.controls[0], bez1.controls[1]];
            return (isPointArrayEqual(c1points, [bez2.origin, bez2.end, bez2.controls[0], bez2.controls[1]], withinPointDistance))
                || (isPointArrayEqual(c1points, [bez2.end, bez2.origin, bez2.controls[1], bez2.controls[0]], withinPointDistance));
        }

        return false;
    };

    pathAreEqualMap[pathType.Arc] = function (arcA: IPathArc, arcB: IPathArc, withinPointDistance): boolean {
        return pathAreEqualMap[pathType.Circle](arcA, arcB, withinPointDistance) && isAngleEqual(arcA.startAngle, arcB.startAngle) && isAngleEqual(arcA.endAngle, arcB.endAngle);
    };

    /**
     * Find out if two paths are equal.
     * 
     * @param pathA First path.
     * @param pathB Second path.
     * @returns true if paths are the same, false if they are not
     */
    export function isPathEqual(pathA: IPath, pathB: IPath, withinPointDistance?: number, pathAOffset?: IPoint, pathBOffset?: IPoint): boolean {

        var result = false;

        if (pathA.type == pathB.type) {
            var fn = pathAreEqualMap[pathA.type];
            if (fn) {

                function getResult() {
                    result = fn(pathA, pathB, withinPointDistance);
                }

                if (pathAOffset || pathBOffset) {
                    path.moveTemporary([pathA, pathB], [pathAOffset, pathBOffset], getResult);
                } else {
                    getResult();
                }
            }
        }

        return result;
    }

    /**
     * Find out if two points are equal.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns true if points are the same, false if they are not
     */
    export function isPointEqual(a: IPoint, b: IPoint, withinDistance?: number): boolean {
        if (!withinDistance) {
            return a[0] == b[0] && a[1] == b[1];
        } else {
            if (!a || !b) return false;
            var distance = measure.pointDistance(a, b);
            return distance <= withinDistance;
        }
    }

    /**
     * Find out if two arrays or points are equal.
     * 
     * @param a First array of points.
     * @param b Second array of points.
     * @returns true if array of points are the same, false if they are not
     */
    export function isPointArrayEqual(a: IPoint[], b: IPoint[], withinDistance?: number): boolean {
        if (a.length !== b.length) {
            return false;
        }

        for (var i = 0; i < a.length; i++) {
            if (!isPointEqual(a[i], b[i], withinDistance)) return false;
        }

        return true;
    }

    /**
     * Check for slope equality.
     * 
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for equality.
     * @returns Boolean true if slopes are equal.
     */
    export function isSlopeEqual(slopeA: ISlope, slopeB: ISlope): boolean {

        if (!slopeA.hasSlope && !slopeB.hasSlope) {

            //lines are both vertical, see if x are the same
            return round(slopeA.line.origin[0] - slopeB.line.origin[0]) == 0;
        }

        if (slopeA.hasSlope && slopeB.hasSlope && (round(slopeA.slope - slopeB.slope, .00001) == 0)) {

            //lines are parallel, but not vertical, see if y-intercept is the same
            return round(slopeA.yIntercept - slopeB.yIntercept, .00001) == 0;
        }

        return false;
    }

}