namespace MakerJs.models {
    export class Ellipse implements IModel {

        public paths: IPathMap = {};
        public origin: IPoint;

        constructor(radius: number);
        constructor(radiusX: number, radiusY: number);
        constructor(origin: IPoint, radius: number);
        constructor(origin: IPoint, radiusX: number, radiusY: number);
        constructor(cx: number, cy: number, rx: number, ry: number);
        constructor(...args: any[]) {
            //TODO-BEZIER

            //construct a bezier approximation for a 90 degree arc with radius of 1
            var arc = new paths.Arc([0, 0], 1, 0, 90);
            var bez: IPathBezier = bezier.fromArc(arc);// new paths.Bezier([1, 0], bezier.controlPointsForCircularCubic(arc), [0, 1]);

            var scaleDim = (i: number, s: number) => {
                bez.origin[i] *= s;
                bez.end[i] *= s;
                bez.controls[0][i] *= s;
                bez.controls[1][i] *= s;
            }

            var scaleXY = (x: number, y: number = x) => {
                scaleDim(0, x);
                scaleDim(1, y);
            }

            switch (args.length) {
                case 1:
                    //radius
                    scaleXY(args[0] as number);
                    break;

                case 2:
                    if (isPoint(args[0])) {
                        //origin, radius
                        scaleXY(args[1] as number);
                        this.origin = <IPoint>args[0];

                    } else {
                        //rx, ry
                        scaleXY(args[0] as number, args[1] as number);
                    }
                    break;

                case 3:
                    //origin, rx, ry
                    scaleXY(args[1] as number, args[2] as number);
                    this.origin = <IPoint>args[0];
                    break;

                case 4:
                    //cx, cy, rx, ry
                    scaleXY(args[2] as number, args[3] as number);
                    this.origin = [args[0] as number, args[1] as number];
                    break;
            }

            this.paths['Curve1'] = bez;
            this.paths['Curve2'] = path.mirror(bez, true, false);
            this.paths['Curve3'] = path.mirror(bez, true, true);
            this.paths['Curve4'] = path.mirror(bez, false, true);
        }
    }

    (<IKit>Ellipse).metaParameters = [
        { title: "radiusX", type: "range", min: 1, max: 50, value: 25 },
        { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
    ];
}
