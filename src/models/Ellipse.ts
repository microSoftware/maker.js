module MakerJs.models {

    export class Ellipse implements IModel {

        public paths: IPathMap = {};

        constructor(radiusX: number, radiusY: number) {
            //TODO-BEZIER
        }
    }

    (<IKit>Ellipse).metaParameters = [
        { title: "radiusX", type: "range", min: 1, max: 50, value: 25 },
        { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
    ];
}
