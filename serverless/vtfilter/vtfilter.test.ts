import { test } from "zora";
import { vtfilter } from "./vtfilter";

// @ts-ignore
import fs from "fs";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";

test("1:1", (assertion) => {
  const data = fs.readFileSync("fixtures/sample.pbf");

  let orig = new VectorTile(new Protobuf(data));

  const result = vtfilter(data, {
    water: ["*"],
    buildings: ["*"],
    places: ["*"],
    landuse: ["*"],
    roads: ["*"],
    boundaries: ["*"],
    natural: ["*"],
    earth: ["*"],
  });
  let out = new VectorTile(new Protobuf(result));

  let orig_values = [];
  let out_values = [];
  for (let layername in orig.layers) {
    assertion.equal(
      out.layers[layername].length,
      orig.layers[layername].length
    );
    for (var i = 0; i < orig.layers[layername].length; i++) {
      let orig_feature = orig.layers[layername].feature(i);
      let out_feature = out.layers[layername].feature(i);
      orig_values.push(orig_feature.properties);
      orig_values.push(orig_feature.loadGeometry());
      out_values.push(out_feature.properties);
      out_values.push(out_feature.loadGeometry());
    }
  }
  assertion.equal(orig_values, out_values);
});

test("filter one layer", (assertion) => {
  const data = fs.readFileSync("fixtures/sample.pbf");
  const result = vtfilter(data, { water: ["*"] });
  let out = new VectorTile(new Protobuf(result));
  assertion.equal(Object.keys(out.layers).length, 1);
});

test("include only roads where there is a ref value", (assertion) => {
  const data = fs.readFileSync("fixtures/sample.pbf");
  const result = vtfilter(data, { landuse: ["amenity"] });
  let out = new VectorTile(new Protobuf(result));
  assertion.equal(Object.keys(out.layers).length, 1);
  assertion.equal(out.layers["landuse"].length, 156);

  for (var i = 0; i < out.layers["landuse"].length; i++) {
    let feature = out.layers["landuse"].feature(i);
    assertion.equal(Object.keys(feature.properties).length, 1);
  }
});
