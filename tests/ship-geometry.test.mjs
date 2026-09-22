import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));

// Load the independent TS maths without introducing a test-framework dependency.
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name);
  const file = path.join(directory, '../lib/ship', `${name}.ts`);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, dependency => load(dependency.replace('./', '')));
  modules.set(name, loaded.exports);
  return loaded.exports;
}
const { DEFAULT_DOME, spherePoint, project, domePoint, lens, curvePath, radians } = load('domeGeometry');
const { ROOM, floorPortDiameter, platformY, pilotPosition, deckOutline, polygonPath, pilotDeck } = load('roomGeometry');
const desktop = { width: 1440, height: 900 };
const portrait = { width: 390, height: 844 };
const close = (a, b, tolerance = .00001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('latitude samples remain on the hemisphere and one horizontal plane', () => {
  for (const radius of [8, 10, 14]) for (const phi of [.075, .66, 1.1]) {
    const config = { ...DEFAULT_DOME, radius, centre: { x: 1, y: 2, z: 3 } };
    for (let i = 0; i < 100; i++) {
      const p = spherePoint(i * .07, phi, config);
      close(Math.hypot(p.x - 1, p.y - 2, p.z - 3), radius);
      close(p.y, 2 + radius * Math.sin(phi));
    }
  }
});

test('tuned baseline projects correctly; nearer ring heads are larger', () => {
  const p = domePoint(0, DEFAULT_DOME.lowerLatitude, DEFAULT_DOME, desktop);
  close(p.x, 720);
  close(p.y, 574.840857);
  const far = domePoint(0, .01, DEFAULT_DOME, desktop);
  const near = domePoint(1, .01, DEFAULT_DOME, desktop);
  assert.ok(near.depth < far.depth && near.scale > far.scale);
});

test('look direction hits the lens centre at every pitch and height', () => {
  for (const view of [desktop, portrait]) for (const pitch of [-15, 0, 12, 25]) for (const height of [.4, 2.4, 4]) {
    const config = { ...DEFAULT_DOME, pitch, camera: { ...DEFAULT_DOME.camera, y: height } };
    const point = { x: 0, y: height + Math.sin(radians(pitch)) * 5, z: config.camera.z + Math.cos(radians(pitch)) * 5 };
    const p = project(point, config, view);
    close(p.x, view.width / 2); close(p.y, lens(config, view).horizon); close(p.depth, 5);
  }
});

test('side-profile FOV rays land on the actual viewport boundaries', () => {
  for (const view of [desktop, portrait]) for (const pitch of [-15, 25]) {
    const config = { ...DEFAULT_DOME, pitch };
    const optics = lens(config, view);
    for (const [offset, expectedY] of [[optics.upperAngle, 0], [-optics.lowerAngle, view.height]]) {
      const angle = radians(pitch) + offset;
      const p = project({ x: 0, y: config.camera.y + 5 * Math.sin(angle), z: config.camera.z + 5 * Math.cos(angle) }, config, view);
      close(p.y, expectedY);
    }
  }
});

test('height and pitch independently change projection without moving latitude planes', () => {
  const point = spherePoint(.4, .66, DEFAULT_DOME);
  const base = project(point, DEFAULT_DOME, desktop);
  const raised = project(point, { ...DEFAULT_DOME, camera: { ...DEFAULT_DOME.camera, y: 3.4 } }, desktop);
  const tilted = project(point, { ...DEFAULT_DOME, pitch: 10 }, desktop);
  assert.notEqual(base.y, raised.y); assert.notEqual(base.y, tilted.y);
  close(base.depth, raised.depth); assert.notEqual(base.depth, tilted.depth);
});

test('platform and three shallow steps share the forward centreline', () => {
  close(platformY - ROOM.floorY, .24);
  assert.equal(ROOM.stepCount, 3);
  assert.equal(pilotPosition.x, DEFAULT_DOME.centre.x);
  close(pilotPosition.z - DEFAULT_DOME.camera.z, 14.2);
  for (const pitch of [-15, 0, 25]) {
    const c = { ...DEFAULT_DOME, pitch };
    for (let step = 0; step < 3; step++) {
      const y = ROOM.floorY + ROOM.stepRise * (step + 1);
      const a = project({ x: -3, y, z: ROOM.pilotZ }, c, desktop);
      const b = project({ x: 3, y, z: ROOM.pilotZ }, c, desktop);
      close(a.x + b.x, desktop.width); close(a.y, b.y);
    }
  }
  // One-body hatch is centred and comfortably clear of the steps.
  assert.equal(ROOM.port.x, pilotPosition.x);
  close(floorPortDiameter, ROOM.alienBodyWidth * 1.25);
  assert.ok(ROOM.stepStartZ - (ROOM.port.z + floorPortDiameter / 2) > ROOM.alienBodyWidth);
});

test('near-plane clipping and extreme calibration values produce finite paths', () => {
  for (const view of [desktop, portrait]) for (const pitch of [-15, 25]) for (const depth of [-7, -1]) {
    const c = { ...DEFAULT_DOME, pitch, camera: { ...DEFAULT_DOME.camera, z: depth } };
    for (const phi of [.065, .66, 1.1]) assert.doesNotMatch(curvePath(c, view, phi), /NaN|Infinity/);
    assert.doesNotMatch(polygonPath(deckOutline(20, 20, ROOM.floorY, 0), c, view), /NaN|Infinity/);
    const behind = { x: 0, y: c.camera.y - 5 * Math.sin(radians(pitch)), z: depth - 5 * Math.cos(radians(pitch)) };
    assert.equal(project(behind, c, view).visible, false);
  }
});


test('compact trapezium is centred, tapered and clears the console', () => {
  for (let i = 0; i < 3; i++) {
    const points = pilotDeck(i, platformY);
    close(points[0].x, -points[1].x);
    close(points[2].x, -points[3].x);
    assert.ok(points[2].x > points[1].x);
    assert.ok(points[2].z > ROOM.pilotZ);
    assert.ok(points[1].z < ROOM.pilotZ);
    assert.ok(points[2].x < DEFAULT_DOME.radius / 2);
  }
  assert.ok(ROOM.platformBackWidth > ROOM.consoleWidth);
});

test('fixture fronts face inward and long axes follow independent hull tangents', () => {
  const { FIXTURES, orientedFixtures } = load('fixtureLayout');
  const oriented = orientedFixtures(DEFAULT_DOME.centre);
  for (const key of ['sofa', 'musicStation', 'clothesRail']) {
    const fixture = oriented[key];
    const dx = fixture.x - DEFAULT_DOME.centre.x, dz = fixture.z - DEFAULT_DOME.centre.z;
    const radius = Math.hypot(dx,dz);
    close(Math.cos(fixture.yaw)*dx - Math.sin(fixture.yaw)*dz, 0);
    close(-Math.sin(fixture.yaw)*dx - Math.cos(fixture.yaw)*dz, -radius);
  }
  for (const key of Object.keys(FIXTURES)) for (const field of ['x','y','z','scale']) close(oriented[key][field],FIXTURES[key][field]);
  assert.equal(oriented.radio, FIXTURES.radio);
  close(oriented.coffeeTable.yaw, oriented.sofa.yaw);
  assert.ok(oriented.sofa.yaw < 0 && oriented.musicStation.yaw > 0);
  assert.ok(oriented.clothesRail.yaw > oriented.musicStation.yaw);
});


test('perimeter fixtures fit the circle and the lounge table remains reachable', () => {
  const { FIXTURES } = load('fixtureLayout');
  const radius = DEFAULT_DOME.radius;
  for (const key of ['sofa','musicStation','clothesRail']) {
    const f = FIXTURES[key];
    assert.ok(Math.hypot(f.x,f.z) < radius);
    assert.ok(Math.hypot(f.x,f.z) > radius - 1.5);
  }
  close(Math.hypot(FIXTURES.sofa.x-FIXTURES.coffeeTable.x,FIXTURES.sofa.z-FIXTURES.coffeeTable.z),1.79);
  assert.ok(FIXTURES.coffeeTable.z < FIXTURES.sofa.z);
  assert.ok(FIXTURES.clothesRail.z < FIXTURES.musicStation.z);
  assert.ok(FIXTURES.clothesRail.x > FIXTURES.musicStation.x);
  close(FIXTURES.musicStation.scale * FIXTURES.musicStation.widthScale,.72*.77);
});

test('domepage reserves glass above the fixed lower latitude and gaps only the upper rule', () => {
  const { domePageLayout, upperRulePath } = load('domePageLayout');
  const layout = domePageLayout(DEFAULT_DOME);
  close(DEFAULT_DOME.lowerLatitude,.085);
  close(layout.brand,DEFAULT_DOME.topLatitude);
  assert.ok(layout.socials > layout.brand);
  assert.ok(layout['merch'] > layout.posterTop);
  assert.ok(layout.posterTop > layout.posterBottom);
  assert.ok(layout.posterBottom > DEFAULT_DOME.lowerLatitude);
  assert.ok((upperRulePath(DEFAULT_DOME,desktop).match(/M/g) ?? []).length >= 2);
});


test('exterior upper hull joins the dome and descends smoothly outside its footprint', () => {
  const { DEFAULT_HULL: hull, hullHeight, hullMesh } = load('hullGeometry');
  close(hullHeight(DEFAULT_DOME.radius,DEFAULT_DOME,hull),DEFAULT_DOME.centre.y);
  close(hullHeight(hull.outerRadius,DEFAULT_DOME,hull),DEFAULT_DOME.centre.y-hull.drop);
  let previous=Infinity;
  for(let i=0;i<=100;i++) {
    const r=DEFAULT_DOME.radius+(hull.outerRadius-DEFAULT_DOME.radius)*i/100;
    const height=hullHeight(r,DEFAULT_DOME,hull);
    assert.ok(height<=previous); previous=height;
  }
  for(const patch of hullMesh(DEFAULT_DOME,hull)) {
    for(const point of patch.points) {
      const radius=Math.hypot(point.x,point.z);
      assert.ok(radius>=DEFAULT_DOME.radius-1e-9 && radius<=hull.outerRadius+1e-9);
      close(point.y,hullHeight(radius,DEFAULT_DOME,hull));
    }
    for(const view of [desktop,portrait]) assert.doesNotMatch(polygonPath(patch.points,DEFAULT_DOME,view),/NaN|Infinity/);
  }
  assert.ok(Math.hypot(...Object.values(DEFAULT_DOME.camera))<DEFAULT_DOME.radius);
});


test('locked furniture has floor clearance and stays within the glass envelope', () => {
 const { FIXTURES } = load('fixtureLayout');
 for(const [key,halfWidth,backDepth,height] of [
  ['sofa',1.45*1.15,.515*1.15,1.17*1.15],
  ['musicStation',1.5*.72*.77,.45*1.05,2.8],
  ['clothesRail',1.05*1.05,.38*1.05,2.1*1.05],
 ]) {
  const f=FIXTURES[key];
  const outerRadius=Math.hypot(Math.hypot(f.x,f.z)+backDepth,halfWidth);
  assert.ok(DEFAULT_DOME.radius-outerRadius>.5);
  assert.ok(Math.hypot(outerRadius,Math.max(0,f.y+height))<DEFAULT_DOME.radius);
 }
 const table=FIXTURES.coffeeTable;
 assert.ok(Math.hypot(table.x,table.z)+1.05*table.scale<DEFAULT_DOME.radius-.5);
 close(ROOM.consoleAnchorY,-.45);
 close(ROOM.pilotSeatLift,.18);
 close(FIXTURES.radio.y-ROOM.consoleAnchorY,1.05);
});

test('camera reveal ends exactly at locked calibration and starts at raised pilot eye',()=>{
 const {transitionCamera}=load('cameraTransition');
 assert.deepEqual(transitionCamera(DEFAULT_DOME,1),DEFAULT_DOME);
 const start=transitionCamera(DEFAULT_DOME,0);
 assert.ok(start.camera.z>ROOM.pilotZ && start.camera.y>platformY+1);
 assert.equal(start.radius,DEFAULT_DOME.radius);
 assert.equal(start.fov,DEFAULT_DOME.fov);
 for(const t of [0,.1,.5,.9,1]) {
  const config=transitionCamera(DEFAULT_DOME,t);
  assert.ok(Math.hypot(config.camera.x,config.camera.y,config.camera.z)<config.radius);
  assert.doesNotMatch(polygonPath(pilotDeck(2,platformY),config,desktop),/NaN|Infinity/);
 }
});

test('reduced-motion and hidden-tab transitions resolve immediately without changing the target camera',()=>{
 const {cameraDuration,transitionCamera}=load('cameraTransition');
 for(const [reduced,hidden] of [[true,false],[false,true],[true,true]]) {
  assert.equal(cameraDuration(reduced,hidden),0);
  assert.deepEqual(transitionCamera(DEFAULT_DOME,1),DEFAULT_DOME);
 }
 assert.ok(cameraDuration(false,false)>0);
});
