namespace MakerJs.models {

    function scaleDim(b: IPathBezier, i: number, s: number) {
        b.origin[i] *= s;
        b.end[i] *= s;
        b.controls[0][i] *= s;
        b.controls[1][i] *= s;
    }

    function scaleXY(b: IPathBezier, x: number, y: number = x) {
        scaleDim(b, 0, x);
        scaleDim(b, 1, y);
    }

    export class Ellipse implements IModel {

        public paths: IPathMap = {};
        public origin: IPoint;

        constructor(radius: number);
        constructor(radiusX: number, radiusY: number);
        constructor(origin: IPoint, radius: number);
        constructor(origin: IPoint, radiusX: number, radiusY: number);
        constructor(cx: number, cy: number, rx: number, ry: number);
        constructor(...args: any[]) {

            var n = 8;

            var isPointArgs0 = isPoint(args[0]);

            switch (args.length) {
                case 2:
                    if (isPointArgs0) {
                        //origin, radius
                        this.origin = <IPoint>args[0];
                    }
                    break;

                case 3:
                    //origin, rx, ry
                    this.origin = <IPoint>args[0];
                    break;

                case 4:
                    //cx, cy, rx, ry
                    this.origin = [args[0] as number, args[1] as number];
                    break;
            }

            //construct a bezier approximation for an arc with radius of 1.
            var a = 360 / n;
            var arc = new paths.Arc([0, 0], 1, 0, a);

            //clone and rotate to complete a circle
            for (var i = 0; i < n; i++) {

                var bez = bezier.fromArc(arc);

                switch (args.length) {
                    case 1:
                        //radius
                        scaleXY(bez, args[0] as number);
                        break;

                    case 2:
                        if (isPointArgs0) {
                            //origin, radius
                            scaleXY(bez, args[1] as number);

                        } else {
                            //rx, ry
                            scaleXY(bez, args[0] as number, args[1] as number);
                        }
                        break;

                    case 3:
                        //origin, rx, ry
                        scaleXY(bez, args[1] as number, args[2] as number);
                        break;

                    case 4:
                        //cx, cy, rx, ry
                        scaleXY(bez, args[2] as number, args[3] as number);
                        break;
                }

                this.paths['Curve' + (1 + i)] = bez;

                arc.startAngle += a;
                arc.endAngle += a;
            }

        }
    }

    (<IKit>Ellipse).metaParameters = [
        { title: "radiusX", type: "range", min: 1, max: 50, value: 25 },
        { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
    ];
}
