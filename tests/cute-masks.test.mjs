import assert from "node:assert/strict";
import test from "node:test";
import { getMaskBounds, isInsideMask, LEAF_MASK_GEOMETRY } from "../app/lib/masks.mjs";

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
  for (const [x, y] of [[-0.98, -0.98], [0.98, -0.98], [-0.96, 0], [0.96, 0]]) {
    assert.equal(inside("butterfly", [x, y]), false, `butterfly gap ${x},${y}`);
  }

  // A leaf has a long diagonal blade, a clear tip, and a separate short petiole stroke.
  for (const [x, y] of [[0.6, -0.7], [-0.5, 0], [0.4, -0.4], [-0.65, 0.3], [-0.45, 0.5]]) {
    assert.equal(inside("leaf", [x, y]), true, `leaf landmark ${x},${y}`);
  }
  assert.equal(inside("leaf", LEAF_MASK_GEOMETRY.bladeBase), true, "leaf blade base");
  const [petioleX, petioleY] = apiPoint("leaf", LEAF_MASK_GEOMETRY.petioleTip);
  assert.equal(isInsideMask("leaf", petioleX, petioleY, width, height), false, "petiole stays outside placement");
  for (const [x, y] of [[0.9, 0.7], [-0.9, -0.2]]) {
    assert.equal(inside("leaf", [x, y]), false, `leaf rounded edge ${x},${y}`);
  }

  // A friendly cloud has a low, rounded body and only a few broad peaks.
  for (const [x, y] of [[-0.72, 0.16], [-0.38, -0.36], [0, -0.6], [0.4, -0.32], [0.72, 0.18], [0, 0.3]]) {
    assert.equal(inside("cloud", [x, y]), true, `cloud landmark ${x},${y}`);
  }
  for (const [x, y] of [[-0.96, -0.62], [0.96, -0.62], [-0.92, 0.74], [0.92, 0.74]]) {
    assert.equal(inside("cloud", [x, y]), false, `cloud boundary ${x},${y}`);
  }
});
