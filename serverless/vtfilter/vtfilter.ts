import Protobuf from "pbf";
import {
	VectorTile,
	VectorTileFeature,
	VectorTileLayer,
} from "@mapbox/vector-tile";

function writeValue(value: number | boolean | string, pbf?: Protobuf) {
	if (typeof value === "string") {
		pbf!.writeStringField(1, value);
	} else if (typeof value === "boolean") {
		pbf!.writeBooleanField(7, value);
	} else if (typeof value === "number") {
		if (value % 1 !== 0) {
			pbf!.writeDoubleField(3, value);
		} else if (value < 0) {
			pbf!.writeSVarintField(6, value);
		} else {
			pbf!.writeVarintField(5, value);
		}
	}
}

function includeKey(key: string, attrs: string[]) {
	if (attrs.length === 1 && attrs[0] == "*") {
		return true;
	}
	return attrs.indexOf(key) >= 0;
}

function writeProperties(context: LayerWriteContext, pbf?: Protobuf) {
	var feature = context.feature;
	var attrs = context.attrs;

	var keys = context.keys;
	var values = context.values;
	var keycache = context.keycache;
	var valuecache = context.valuecache;

	for (var key in feature!.properties) {
		// include named keys only
		if (includeKey(key, attrs)) {
			var value = feature!.properties[key];

			var keyIndex = keycache[key];
			if (value === null) continue; // don't encode null value properties

			if (typeof keyIndex === "undefined") {
				keys.push(key);
				keyIndex = keys.length - 1;
				keycache[key] = keyIndex;
			}
			pbf!.writeVarint(keyIndex);

			var type = typeof value;
			if (type !== "string" && type !== "boolean" && type !== "number") {
				value = JSON.stringify(value);
			}
			var valueKey = type + ":" + value;
			var valueIndex = valuecache[valueKey];
			if (typeof valueIndex === "undefined") {
				values.push(value);
				valueIndex = values.length - 1;
				valuecache[valueKey] = valueIndex;
			}
			pbf!.writeVarint(valueIndex);
		}
	}
}

function command(cmd: number, length: number) {
	return (length << 3) + (cmd & 0x7);
}

function zigzag(num: number) {
	return (num << 1) ^ (num >> 31);
}

function writeGeometry(feature: VectorTileFeature, pbf?: Protobuf) {
	var geometry = feature.loadGeometry();
	var type = feature.type;
	var x = 0;
	var y = 0;
	var rings = geometry.length;
	for (var r = 0; r < rings; r++) {
		var ring = geometry[r];
		var count = 1;
		if (type === 1) {
			count = ring.length;
		}
		pbf!.writeVarint(command(1, count)); // moveto
		// do not write polygon closing path as lineto
		var lineCount = type === 3 ? ring.length - 1 : ring.length;
		for (var i = 0; i < lineCount; i++) {
			if (i === 1 && type !== 1) {
				pbf!.writeVarint(command(2, lineCount - 1)); // lineto
			}
			var dx = ring[i].x - x;
			var dy = ring[i].y - y;
			pbf!.writeVarint(zigzag(dx));
			pbf!.writeVarint(zigzag(dy));
			x += dx;
			y += dy;
		}
		if (type === 3) {
			pbf!.writeVarint(command(7, 1)); // closepath
		}
	}
}

function writeFeature(context: LayerWriteContext, pbf?: Protobuf) {
	var feature = context.feature!;

	if (feature.id !== undefined) {
		pbf!.writeVarintField(1, feature.id);
	}

	pbf!.writeMessage(2, writeProperties, context);
	pbf!.writeVarintField(3, feature.type);
	pbf!.writeMessage(4, writeGeometry, feature);
}

function passFilter(
	properties: { [_: string]: string | number | boolean },
	attrs: string[]
) {
	if (attrs.length === 1 && attrs[0] === "*") {
		return true;
	}
	for (let attr of attrs) {
		if (attr in properties) {
			return true;
		}
	}
	return false;
}

function writeLayer(l: [VectorTileLayer, string[]], sink?: Protobuf) {
	sink = sink!;
	let layer = l[0];

	sink.writeVarintField(15, layer.version || 1);
	sink.writeStringField(1, layer.name || "");
	sink.writeVarintField(5, layer.extent || 4096);

	var i;
	var context: LayerWriteContext = {
		keys: [],
		values: [],
		keycache: {},
		valuecache: {},
		feature: undefined,
		attrs: [],
	};

	let attrs = l[1];

	for (i = 0; i < layer.length; i++) {
		let feature = layer.feature(i);

		if (passFilter(feature.properties, attrs)) {
			context.feature = feature;
			context.attrs = attrs;
			sink.writeMessage(2, writeFeature, context);
		}
	}

	// finalize the layer by writing key/values

	var keys = context.keys;
	for (i = 0; i < keys.length; i++) {
		sink.writeStringField(3, keys[i]);
	}

	var values = context.values;
	for (i = 0; i < values.length; i++) {
		sink.writeMessage(4, writeValue, values[i]);
	}
}

interface LayerWriteContext {
	keys: string[];
	values: (string | boolean | number)[];
	keycache: { [_: string]: number };
	valuecache: { [_: string]: number };
	feature?: VectorTileFeature;
	attrs: string[];
}

// the resulting blob is a vector tile
// includes only the layers specified by key;
// includes only the named attributes
// and only the features where at least one named attribute is non-null
export const vtfilter = (
	data: Uint8Array,
	expr: { [_: string]: string[] }
): Uint8Array => {
	let source = new VectorTile(new Protobuf(data));
	let sink = new Protobuf();

	// WARNING: might change the layer order
	for (const layername in source.layers) {
		let layer = source.layers[layername];

		// check if layer included
		if (layername in expr) {
			sink.writeMessage(3, writeLayer, [layer, expr[layername]]);
		}
	}
	return sink.finish();
};
