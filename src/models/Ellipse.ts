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

            //construct a bezier approximation for a 90 degree arc with radius of 1.
            //use 2 45 degree arcs for greater accuracy.
            var arcs = [new paths.Arc([0, 0], 1, 0, 45), new paths.Arc([0, 0], 1, 45, 90)];
            var bezs = arcs.map(bezier.fromArc);

            var scaleDim = (bez: IPathBezier, i: number, s: number) => {
                bez.origin[i] *= s;
                bez.end[i] *= s;
                bez.controls[0][i] *= s;
                bez.controls[1][i] *= s;
            }

            var scaleXY = (x: number, y: number = x) => {
                for (var i = 0; i < 2; i++) {
                    scaleDim(bezs[i], 0, x);
                    scaleDim(bezs[i], 1, y);
                }
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

            this.paths['Curve1'] = bezs[0];
            this.paths['Curve2'] = bezs[1];
            this.paths['Curve3'] = path.mirror(bezs[0], true, false);
            this.paths['Curve4'] = path.mirror(bezs[1], true, false);
            this.paths['Curve5'] = path.mirror(bezs[0], true, true);
            this.paths['Curve6'] = path.mirror(bezs[1], true, true);
            this.paths['Curve7'] = path.mirror(bezs[0], false, true);
            this.paths['Curve8'] = path.mirror(bezs[1], false, true);
        }
    }

    (<IKit>Ellipse).metaParameters = [
        { title: "radiusX", type: "range", min: 1, max: 50, value: 25 },
        { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
    ];
}
