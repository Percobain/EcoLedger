const booleanPointInPolygon =
    require("@turf/boolean-point-in-polygon").default ||
    require("@turf/boolean-point-in-polygon");

exports.isPointInPolygon = (lon, lat, polygonGeoJSON) => {
    const point = { type: "Point", coordinates: [lon, lat] };
    return booleanPointInPolygon(point, polygonGeoJSON);
};
