import assert from "node:assert/strict";
import test from "node:test";
import { getMaskBounds, isInsideMask } from "../app/lib/masks.mjs";

test("cute silhouettes keep the object-defining landmarks readable", () => {
  const width = 1200;
  const height = 500;
  const apiPoint = (maskId, [localX, localY]) => {
    const bounds = getMaskBounds(maskId, width, height);
    return [localX * (2 * bounds.halfWidth) / width, localY * (2 * bounds.halfHeight) / height];
  };
  const inside = (maskId, point) => {
    const [x, y] = apiPoint(maskId, point);
    return isInsideMask(maskId, x, y, width, height);
  };

  // A butterfly needs four distinct wing lobes around a narrow center axis.
  for (const [x, y] of [[-0.58, -0.44], [0.58, -0.44], [-0.48, 0.34], [0.48, 0.34], [0, 0]]) {
    assert.equal(inside("butterfly", [x, y]), true, `butterfly landmark ${x},${y}`);
  }
  for (const [x, y] of [[-0.98, -0.98], [0.98, -0.98], [-0.32, -0.02], [0.32, -0.02]]) {
    assert.equal(inside("butterfly", [x, y]), false, `butterfly gap ${x},${y}`);
  }

  // A leaf tapers to a high-right tip and continues into a low-left petiole.
  for (const [x, y] of [[0.7, -0.6], [0.2, -0.2], [-0.2, 0.22], [-0.56, 0.58], [-0.25, 0.92]]) {
    assert.equal(inside("leaf", [x, y]), true, `leaf landmark ${x},${y}`);
  }
  assert.equal(inside("leaf", [0.98, 0.72]), false, "leaf tapered edge");

  // A friendly cloud has a low, rounded body and only a few broad peaks.
  for (const [x, y] of [[-0.72, 0.16], [-0.38, -0.36], [0, -0.6], [0.4, -0.32], [0.72, 0.18], [0, 0.54]]) {
    assert.equal(inside("cloud", [x, y]), true, `cloud landmark ${x},${y}`);
  }
  for (const [x, y] of [[-0.96, -0.62], [0.96, -0.62], [-0.92, 0.74], [0.92, 0.74]]) {
    assert.equal(inside("cloud", [x, y]), false, `cloud boundary ${x},${y}`);
  }
});
