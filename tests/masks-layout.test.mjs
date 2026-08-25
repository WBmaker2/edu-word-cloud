import assert from "node:assert/strict";
import test from "node:test";
import { MASK_IDS, getMaskBounds, isInsideMask, traceMaskDetail, traceMaskPath } from "../app/lib/masks.mjs";
import { layoutWords } from "../app/lib/cloud-layout.mjs";

test("all classroom masks include the center and reject far corners", () => {
  assert.deepEqual(MASK_IDS, ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"]);
  for (const mask of MASK_IDS) {
    assert.equal(isInsideMask(mask, 0, 0), true, mask);
    assert.equal(isInsideMask(mask, 0.99, 0.99), false, mask);
  }
});

test("new classroom masks expose recognizable connected interiors", () => {
  const width = 1200;
  const height = 500;
  const insidePoints = {
    butterfly: [[0, 0], [-0.24, -0.18], [0.24, -0.18], [-0.2, 0.22], [0.2, 0.22]],
    leaf: [[0, 0], [-0.45, 0], [0.45, 0]],
    lightbulb: [[0, -0.28], [0, 0], [0, 0.58]],
    cloud: [[0, -0.32], [-0.42, 0], [0.42, 0], [0, 0.3]],
  };

  for (const [maskId, points] of Object.entries(insidePoints)) {
    for (const [x, y] of points) {
      assert.equal(isInsideMask(maskId, x, y, width, height), true, `${maskId}: ${x},${y}`);
    }
    assert.equal(isInsideMask(maskId, 0.9, 0.9, width, height), false, maskId);
  }
});

test("layout is deterministic and remains inside the selected mask", () => {
  const words = [
    { text: "환경", count: 8, weight: 8 },
    { text: "실천", count: 6, weight: 6 },
    { text: "약속", count: 4, weight: 4 },
  ];
  const first = layoutWords({
    words,
    maskId: "heart",
    width: 1200,
    height: 800,
    seed: "환경-수업",
  });
  const second = layoutWords({
    words,
    maskId: "heart",
    width: 1200,
    height: 800,
    seed: "환경-수업",
  });

  assert.deepEqual(first, second);
  assert.equal(first.placed.length, 3);
  for (const word of first.placed) {
    assert.equal(isInsideMask("heart", word.nx, word.ny), true);
  }
});

test("layout places higher-weight words first when the input is unsorted", () => {
  const result = layoutWords({
    words: [
      { text: "작은", count: 1, weight: 1 },
      { text: "큰단어", count: 9, weight: 9 },
      { text: "중간", count: 5, weight: 5 },
    ],
    maskId: "circle",
    width: 1200,
    height: 800,
    seed: "정렬-수업",
  });

  assert.equal(result.placed[0].text, "큰단어");
  const largest = result.placed.find((word) => word.text === "큰단어");
  const smallest = result.placed.find((word) => word.text === "작은");
  assert.ok(Math.hypot(largest.nx, largest.ny) < Math.hypot(smallest.nx, smallest.ny));
});

test("layout shrinks equal-weight words enough to keep the selected count", () => {
  const words = Array.from({ length: 20 }, (_, index) => ({
    text: `단어${String(index + 1).padStart(2, "0")}`,
    count: 2,
    weight: 2,
  }));
  const result = layoutWords({
    words,
    maskId: "circle",
    width: 1200,
    height: 800,
    seed: "동점-교실",
  });

  assert.equal(result.placed.length, words.length);
  assert.ok(result.placed.every((word) => word.fontSize >= 30 && word.fontSize <= 60));
});

test("layout uses the same centered bounds as the canvas for every mask", () => {
  const width = 1200;
  const height = 500;
  const words = Array.from({ length: 12 }, (_, index) => ({
    text: `수업단어${index + 1}`,
    count: 12 - index,
    weight: 12 - index,
  }));

  for (const maskId of MASK_IDS) {
    const bounds = getMaskBounds(maskId, width, height);
    assert.ok(bounds.halfWidth <= width / 2, maskId);
    assert.ok(bounds.halfHeight <= height / 2, maskId);
    const result = layoutWords({ words, maskId, width, height, seed: `마스크-${maskId}` });
    for (const word of result.placed) {
      assert.equal(isInsideMask(maskId, word.nx, word.ny, width, height), true, `${maskId}: ${word.text}`);
    }
  }
});

test("keeps the requested word count identical across every mask", () => {
  const width = 1200;
  const height = 500;
  const words = Array.from({ length: 20 }, (_, index) => ({
    text: `수업단어${String(index + 1).padStart(2, "0")}`,
    count: 20 - index,
    weight: 20 - index,
  }));

  for (const maskId of MASK_IDS) {
    const result = layoutWords({ words, maskId, width, height, seed: `20개-${maskId}` });
    assert.equal(result.placed.length, words.length, maskId);
    assert.equal(result.omitted.length, 0, maskId);
    for (const word of result.placed) {
      assert.equal(isInsideMask(maskId, word.nx, word.ny, width, height), true, `${maskId}: ${word.text}`);
    }
  }
});

test("keeps one hundred requested words inside every mask", () => {
  const width = 1200;
  const height = 500;
  const words = Array.from({ length: 100 }, (_, index) => ({
    text: `수업단어${String(index + 1).padStart(3, "0")}`,
    count: 100 - index,
    weight: 100 - index,
  }));

  for (const maskId of MASK_IDS) {
    const result = layoutWords({ words, maskId, width, height, seed: `100개-${maskId}` });
    assert.equal(result.placed.length, words.length, maskId);
    assert.equal(result.omitted.length, 0, maskId);
    for (const word of result.placed) {
      assert.equal(isInsideMask(maskId, word.nx, word.ny, width, height), true, `${maskId}: ${word.text}`);
    }
  }
});

test("refined masks use smooth paths and a vertically balanced book boundary", () => {
  const commands = [];
  const context = new Proxy({}, {
    get: (_, method) => (...args) => commands.push([method, ...args]),
  });

  traceMaskPath(context, "bubble");
  traceMaskPath(context, "heart");
  traceMaskPath(context, "book");

  assert.ok(commands.filter(([method]) => method === "bezierCurveTo").length >= 10);
  const { halfWidth, halfHeight } = getMaskBounds("book", 1200, 500);
  assert.ok(halfHeight / halfWidth > 0.65);
  assert.equal(isInsideMask("book", 0, 0, 1200, 500), true);
  assert.equal(isInsideMask("book", 0.6, 0, 1200, 500), false);
});

test("mask details report butterfly body and antennae alongside leaf, bulb, and book details", () => {
  const detailCommands = (maskId) => {
    const commands = [];
    const context = new Proxy({}, {
      get: (_, method) => (...args) => commands.push([method, ...args]),
    });
    const result = traceMaskDetail(context, maskId);
    return { commands, result };
  };

  const leaf = detailCommands("leaf");
  assert.equal(leaf.result, true);
  assert.ok(leaf.commands.length > 0);
  const lightbulb = detailCommands("lightbulb");
  assert.equal(lightbulb.result, true);
  assert.ok(lightbulb.commands.length > 0);
  const book = detailCommands("book");
  assert.equal(book.result, true);
  assert.ok(book.commands.length > 0);
  const butterfly = detailCommands("butterfly");
  assert.equal(butterfly.result, true);
  assert.ok(butterfly.commands.filter(([method]) => method === "moveTo").length >= 3);
  assert.ok(butterfly.commands.filter(([method]) => method === "bezierCurveTo").length >= 3);
  for (const maskId of ["circle", "bubble", "heart", "star", "cloud"]) {
    const detail = detailCommands(maskId);
    assert.equal(detail.result, false, maskId);
    assert.deepEqual(detail.commands, [], maskId);
  }
});

test("new mask paths are closed and contain sampled internal boundary points", () => {
  const width = 1200;
  const height = 500;
  const samples = {
    butterfly: [[-0.4, -0.855], [0.4, -0.855], [-0.72, 0.3], [0.72, 0.3]],
    leaf: [[0, -0.67], [0, 0.67], [-0.98, 0], [0.98, 0]],
    lightbulb: [[0, -0.95], [-0.3, 0.87], [0.3, 0.87]],
    cloud: [[0, -0.99], [-0.8, 0.3], [0.8, 0.3], [0, 0.7]],
  };

  for (const [maskId, points] of Object.entries(samples)) {
    const commands = [];
    const context = new Proxy({}, {
      get: (_, method) => (...args) => commands.push([method, ...args]),
    });
    traceMaskPath(context, maskId);
    assert.ok(commands.some(([method]) => method === "bezierCurveTo"), `${maskId}: bezier path`);
    assert.equal(commands.at(-1)?.[0], "closePath", `${maskId}: closed path`);

    const bounds = getMaskBounds(maskId, width, height);
    const polygon = flattenPath(commands);
    for (const [localX, localY] of points) {
      const x = localX * (2 * bounds.halfWidth) / width;
      const y = localY * (2 * bounds.halfHeight) / height;
      assert.equal(isInsideMask(maskId, x, y, width, height), true, `${maskId}: internal sample`);
      assert.equal(isPointInPolygon(localX, localY, polygon), true, `${maskId}: path containment ${localX},${localY}`);
    }

    for (let xIndex = -100; xIndex <= 100; xIndex += 1) {
      for (let yIndex = -100; yIndex <= 100; yIndex += 1) {
        const localX = xIndex / 100;
        const localY = yIndex / 100;
        const x = localX * (2 * bounds.halfWidth) / width;
        const y = localY * (2 * bounds.halfHeight) / height;
        if (isInsideMask(maskId, x, y, width, height)) {
          assert.equal(isPointInPolygon(localX, localY, polygon), true, `${maskId}: dense containment ${localX},${localY}`);
        }
      }
    }
  }
});

test("playful mask paths keep rounded lobes, a tilted leaf, and friendly details", () => {
  const pathCommands = (maskId) => {
    const commands = [];
    const context = new Proxy({}, {
      get: (_, method) => (...args) => commands.push([method, ...args]),
    });
    traceMaskPath(context, maskId);
    return commands;
  };

  const butterfly = flattenPath(pathCommands("butterfly"));
  const centerTop = Math.min(...butterfly.filter(([x]) => Math.abs(x) < 0.12).map(([, y]) => y));
  assert.ok(centerTop > -0.82, "butterfly wing notch stays shallow");
  assert.ok(pathCommands("butterfly").filter(([method]) => method === "bezierCurveTo").length >= 12);

  const leaf = flattenPath(pathCommands("leaf"));
  const topPoint = leaf.reduce((best, point) => (point[1] < best[1] ? point : best));
  const bottomPoint = leaf.reduce((best, point) => (point[1] > best[1] ? point : best));
  assert.ok(topPoint[0] > 0.1, "leaf tilts up toward the right");
  assert.ok(bottomPoint[0] < -0.1, "leaf stem side sits down toward the left");

  const detailCommands = (maskId) => {
    const commands = [];
    const context = new Proxy({}, {
      get: (_, method) => (...args) => commands.push([method, ...args]),
    });
    traceMaskDetail(context, maskId);
    return commands;
  };
  const leafDetails = detailCommands("leaf");
  assert.ok(leafDetails.filter(([method]) => method === "lineTo").length >= 4, "leaf has short branch veins");
  assert.ok(leafDetails.some(([method]) => method === "bezierCurveTo"), "leaf has a curved central vein");

  const bulbDetails = detailCommands("lightbulb");
  assert.ok(bulbDetails.filter(([method]) => method === "bezierCurveTo").length >= 2, "bulb has a rounded heart filament");
  assert.ok(bulbDetails.filter(([method]) => method === "lineTo").length >= 2, "bulb has socket lines");

  assert.ok(pathCommands("cloud").filter(([method]) => method === "bezierCurveTo").length >= 12, "cloud has four rounded peaks");
});

function flattenPath(commands) {
  const points = [];
  let current = null;
  for (const [method, ...args] of commands) {
    if (method === "moveTo" || method === "lineTo") {
      current = [args[0], args[1]];
      points.push(current);
    } else if (method === "bezierCurveTo" && current) {
      const [control1X, control1Y, control2X, control2Y, endX, endY] = args;
      const [startX, startY] = current;
      for (let step = 1; step <= 24; step += 1) {
        const t = step / 24;
        const inverse = 1 - t;
        points.push([
          inverse ** 3 * startX + 3 * inverse ** 2 * t * control1X + 3 * inverse * t ** 2 * control2X + t ** 3 * endX,
          inverse ** 3 * startY + 3 * inverse ** 2 * t * control1Y + 3 * inverse * t ** 2 * control2Y + t ** 3 * endY,
        ]);
      }
      current = [endX, endY];
    }
  }
  return points;
}

function isPointInPolygon(x, y, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [currentX, currentY] = points[index];
    const [previousX, previousY] = points[previous];
    if (isPointOnSegment(x, y, previousX, previousY, currentX, currentY)) return true;
    const crossesRay = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crossesRay) inside = !inside;
  }
  return inside;
}

function isPointOnSegment(x, y, startX, startY, endX, endY) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const lengthSquared = segmentX ** 2 + segmentY ** 2;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - startX) * segmentX + (y - startY) * segmentY) / lengthSquared));
  const closestX = startX + projection * segmentX;
  const closestY = startY + projection * segmentY;
  return Math.hypot(x - closestX, y - closestY) <= 0.0001;
}
