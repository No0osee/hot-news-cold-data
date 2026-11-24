import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { islandZones, ISLAND_LINKS, type IslandZone } from '../data/islandZones';

interface CatanWorldStageProps {
  selectedZoneId: string | null;
  completedCaseIds: string[];
  timeOfDay: number;
  showLinks: boolean;
  activeGroupFilter: string;
  searchQuery: string;
  overviewSignal: number;
  replayIntroSignal: number;
  onSelectZone: (zoneId: string) => void;
  onIntroChange?: (playing: boolean) => void;
}

const R = 1.66; // inner hex terrain radius
const S = 1.95; // hex grid spacing
const TOP = 0.38; // hex plateau height
const WATER_Y = -0.32;

const SQRT3 = Math.sqrt(3);
function cellToWorld(col: number, row: number): [number, number] {
  const x = S * SQRT3 * (col + 0.5 * (row & 1));
  const z = S * 1.5 * row;
  return [x, z];
}

const CX = S * SQRT3; // 2 * W = 3.3775 (fixed hex-grid origin aligned with Taiwan base & seams)
const CZ = S * 3.75; // 7.3125

export function getZoneWorldPos(cell: [number, number]): [number, number] {
  const [x, z] = cellToWorld(cell[0], cell[1]);
  return [x - CX, z - CZ];
}

interface TimeStop {
  m: number;
  top: number;
  horizon: number;
  fog: number;
  sunColor: number;
  sunInt: number;
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
  water: number;
  lamp: number;
  elev: number;
  azim: number;
}

const TIME_STOPS: TimeStop[] = [
  {
    m: 360,
    top: 0x5c768d,
    horizon: 0xead4be,
    fog: 0xe6d6c3,
    sunColor: 0xffc699,
    sunInt: 1.25,
    hemiSky: 0xf5d6b8,
    hemiGround: 0x705d4e,
    hemiInt: 0.84,
    water: 0x5c8ea1,
    lamp: 0.25,
    elev: 22,
    azim: 85,
  },
  {
    m: 720,
    top: 0x7eaac4,
    horizon: 0xf2ece1,
    fog: 0xeee7da,
    sunColor: 0xfff7e8,
    sunInt: 1.65,
    hemiSky: 0xffffff,
    hemiGround: 0x998770,
    hemiInt: 0.98,
    water: 0x669cb0,
    lamp: 0.0,
    elev: 62,
    azim: 155,
  },
  {
    m: 1080,
    top: 0x474a66,
    horizon: 0xdba07e,
    fog: 0xd49c7d,
    sunColor: 0xff8d5c,
    sunInt: 1.22,
    hemiSky: 0xeba886,
    hemiGround: 0x543c34,
    hemiInt: 0.76,
    water: 0x47687a,
    lamp: 0.85,
    elev: 18,
    azim: 252,
  },
  {
    m: 1260,
    top: 0x1c2b42,
    horizon: 0x354663,
    fog: 0x2a3952,
    sunColor: 0xb8d0ff,
    sunInt: 0.82,
    hemiSky: 0x6b88b8,
    hemiGround: 0x423a35,
    hemiInt: 0.88,
    water: 0x2c4c63,
    lamp: 1.0,
    elev: 32,
    azim: 310,
  },
];

function sampleTimeStop(minutes: number) {
  const stop = TIME_STOPS.find(s => s.m === minutes) ?? TIME_STOPS[1];
  return {
    top: new THREE.Color(stop.top),
    horizon: new THREE.Color(stop.horizon),
    fog: new THREE.Color(stop.fog),
    sunColor: new THREE.Color(stop.sunColor),
    sunInt: stop.sunInt,
    hemiSky: new THREE.Color(stop.hemiSky),
    hemiGround: new THREE.Color(stop.hemiGround),
    hemiInt: stop.hemiInt,
    water: new THREE.Color(stop.water),
    lamp: stop.lamp,
    elev: stop.elev,
    azim: stop.azim,
  };
}

const voxMat = (
  color: number,
  roughness = 0.8,
  metalness = 0.05,
  emissive = 0x000000,
  emissiveIntensity = 0
) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: true,
    emissive,
    emissiveIntensity,
  });

function createVoxelTree(crownColor = 0x4e7a49, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.12), voxMat(0x694b35));
  trunk.position.y = 0.12;
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.38), voxMat(crownColor));
  c1.position.y = 0.31;
  c1.castShadow = true;
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.28), voxMat(crownColor));
  c2.position.y = 0.48;
  c2.castShadow = true;
  const c3 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), voxMat(crownColor));
  c3.position.y = 0.62;
  c3.castShadow = true;
  g.add(trunk, c1, c2, c3);
  g.scale.setScalar(scale);
  return g;
}

function createVoxelCloud(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const m = voxMat(0xfaf7f2, 0.9, 0);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.36, 0.75), m);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.58), m);
  b2.position.set(-0.1, 0.28, 0);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.55), m);
  b3.position.set(0.35, -0.04, 0.18);
  g.add(b1, b2, b3);
  g.scale.setScalar(scale);
  return g;
}

function createVoxelSailboat(sailColor = 0xf7f2e8, hullColor = 0x8c422b): THREE.Group {
  const g = new THREE.Group();
  const hull1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.92), voxMat(hullColor));
  hull1.position.y = 0.08;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.72), voxMat(0xd9c3a5));
  deck.position.y = 0.18;
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), voxMat(0x593e2b));
  mast.position.set(0, 0.56, 0);
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.48), voxMat(sailColor));
  s1.position.set(0.04, 0.58, 0.05);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.28), voxMat(sailColor));
  s2.position.set(0.04, 0.76, -0.02);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.22), voxMat(0xd94532));
  flag.position.set(0, 0.98, -0.08);
  g.add(hull1, deck, mast, s1, s2, flag);
  return g;
}

function createPlayerIntroBoat(): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.64), voxMat(0x7d3c26));
  hull.position.y = 0.1;
  const prow1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.46), voxMat(0x7d3c26));
  prow1.position.set(-0.88, 0.12, 0);
  const prow2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.26), voxMat(0x8c462f));
  prow2.position.set(-1.14, 0.15, 0);
  const bowsprit = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.05), voxMat(0x593e2b));
  bowsprit.position.set(-1.32, 0.26, 0);
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.12, 0.1),
    voxMat(0xffe082, 0.2, 0.1, 0xffb300, 0.95)
  );
  lantern.position.set(-1.48, 0.2, 0);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.54), voxMat(0xd9c2a3));
  deck.position.y = 0.22;
  const railL = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.09, 0.06), voxMat(0x5c3624));
  railL.position.set(0, 0.27, 0.27);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.09, 0.06), voxMat(0x5c3624));
  railR.position.set(0, 0.27, -0.27);

  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 0.06), voxMat(0x593e2b));
  mast.position.set(-0.22, 0.82, 0);
  const yard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.72), voxMat(0x593e2b));
  yard.position.set(-0.22, 1.18, 0);
  const topSail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.66), voxMat(0xf7f2e8));
  topSail.position.set(-0.26, 1.02, 0);
  const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), voxMat(0xc43c29));
  pennant.position.set(-0.34, 1.42, 0);

  g.add(hull, prow1, prow2, bowsprit, lantern, deck, railL, railR, mast, yard, topSail, pennant);
  return g;
}

function createVoxelCabin(
  wallColor = 0xf2e9dc,
  roofColor = 0xb84635,
  winMat?: THREE.MeshStandardMaterial
): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.44), voxMat(wallColor));
  wall.position.y = 0.19;
  wall.castShadow = true;
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.52), voxMat(roofColor));
  r1.position.y = 0.44;
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.4), voxMat(roofColor));
  r2.position.y = 0.56;
  const r3 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.28), voxMat(roofColor));
  r3.position.y = 0.66;
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 0.46),
    winMat ?? voxMat(0xffd275, 0.3, 0.1, 0xffb740, 0.75)
  );
  win.position.set(0.1, 0.2, 0);
  g.add(wall, r1, r2, r3, win);
  return g;
}

// Create a 3D Voxel Victory Flag & Pedestal for Completed Islands
function createCompletionFlag(groupColorHex: string): {
  group: THREE.Group;
  bannerSegs: THREE.Mesh[];
  orbMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();

  // Golden-rimmed pedestal base
  const base1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.18),
    voxMat(0x8c734b, 0.6, 0.25)
  );
  base1.position.y = 0.03;
  const base2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.12),
    voxMat(0xd4a64a, 0.35, 0.55)
  );
  base2.position.y = 0.08;

  // Sleek brass flagpole
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.94, 0.042),
    voxMat(0xe6c265, 0.3, 0.6)
  );
  pole.position.y = 0.52;
  pole.castShadow = true;

  // Glowing golden finial orb at the top of the flagpole
  const orbMat = voxMat(0xffe57f, 0.2, 0.2, 0xffb300, 0.95);
  const orb = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.095, 0.095), orbMat);
  orb.position.y = 1.02;

  // 3-segment waving voxel flag banner with gold trim
  const bannerColor = new THREE.Color(groupColorHex).getHex();
  const bannerMat = voxMat(bannerColor, 0.55, 0.1, bannerColor, 0.22);
  const goldTrimMat = voxMat(0xffd54f, 0.3, 0.4, 0xffab00, 0.45);
  const bannerSegs: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const segW = i === 2 ? 0.11 : 0.13;
    const segH = i === 2 ? 0.18 : 0.22;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, segH, 0.032), bannerMat);
    seg.position.set(0.09 + i * 0.12, 0.84 - i * 0.012, 0);
    seg.castShadow = true;

    const trimTop = new THREE.Mesh(
      new THREE.BoxGeometry(segW + 0.005, 0.03, 0.036),
      goldTrimMat
    );
    trimTop.position.y = segH * 0.5;
    seg.add(trimTop);

    group.add(seg);
    bannerSegs.push(seg);
  }

  group.add(base1, base2, pole, orb);
  return { group, bannerSegs, orbMat };
}

// ============================================================================
// 3D VOXEL RAILWAY TRACK, TRAINS & SKY AIRPLANE BUILDERS
// ============================================================================

// Build a continuous, non-overlapping 3D ribbon mesh along a CatmullRomCurve3 (prevents Z-fighting on curves)
function buildCurveStripGeo(
  curve: THREE.CatmullRomCurve3,
  steps: number,
  width: number,
  height: number,
  lateralOffset = 0,
  yOffset = 0,
  closed = false
): THREE.BufferGeometry {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const ringPts: Array<{
    tl: [number, number, number];
    tr: [number, number, number];
    br: [number, number, number];
    bl: [number, number, number];
  }> = [];

  for (let i = 0; i <= steps; i++) {
    const u = closed ? (i % steps) / steps : i / steps;
    const pt = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const rLen = Math.hypot(tan.x, tan.z) || 1;
    const rx = -tan.z / rLen;
    const rz = tan.x / rLen;

    const cx = pt.x + rx * lateralOffset;
    const cy = pt.y + yOffset;
    const cz = pt.z + rz * lateralOffset;

    ringPts.push({
      tl: [cx - rx * hw, cy + hh, cz - rz * hw],
      tr: [cx + rx * hw, cy + hh, cz + rz * hw],
      br: [cx + rx * hw, cy - hh, cz + rz * hw],
      bl: [cx - rx * hw, cy - hh, cz - rz * hw],
    });
  }

  const pos: number[] = [];
  const pushTri = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number]
  ) => {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  };
  const pushQuad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number]
  ) => {
    pushTri(a, b, c);
    pushTri(a, c, d);
  };

  for (let i = 0; i < steps; i++) {
    const c0 = ringPts[i];
    const c1 = ringPts[i + 1];
    // Top face (+Y)
    pushQuad(c0.tl, c0.tr, c1.tr, c1.tl);
    // Bottom face (-Y)
    pushQuad(c0.br, c0.bl, c1.bl, c1.br);
    // Right face (+right)
    pushQuad(c0.tr, c0.br, c1.br, c1.tr);
    // Left face (-right)
    pushQuad(c0.bl, c0.tl, c1.tl, c1.bl);
  }

  if (!closed) {
    const first = ringPts[0];
    const last = ringPts[steps];
    pushQuad(first.bl, first.br, first.tr, first.tl);
    pushQuad(last.tr, last.br, last.bl, last.tl);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// Build a 3D railway track along a closed CatmullRomCurve3 (continuous bridge deck + sleepers + continuous twin steel rails)
function buildRailwayTrack(
  curve: THREE.CatmullRomCurve3,
  sleeperCount: number,
  islandCenters: Array<[number, number]>
): THREE.Group {
  const group = new THREE.Group();

  // Continuous bridge deck (zero overlapping segments on curves!)
  const deckGeo = buildCurveStripGeo(curve, 420, 0.34, 0.036, 0, -0.028, true);
  const deckMat = voxMat(0x6e6459, 0.88);
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.receiveShadow = true;
  group.add(deckMesh);

  // Continuous left & right steel rails cleanly elevated above the sleepers
  const railMat = voxMat(0xc4cad0, 0.4, 0.55);
  const railGeoL = buildCurveStripGeo(curve, 420, 0.035, 0.032, 0.095, 0.026, true);
  const railGeoR = buildCurveStripGeo(curve, 420, 0.035, 0.032, -0.095, 0.026, true);
  group.add(new THREE.Mesh(railGeoL, railMat), new THREE.Mesh(railGeoR, railMat));

  const pierGeo = new THREE.BoxGeometry(0.18, 0.38, 0.18);
  const pierMat = voxMat(0x7d7368, 0.9);
  const sleeperGeo = new THREE.BoxGeometry(0.3, 0.024, 0.065);
  const sleeperMat = voxMat(0x4a3322, 0.88);
  const dummy = new THREE.Object3D();

  const actualSleepers = Math.min(sleeperCount, 240);
  for (let i = 0; i < actualSleepers; i++) {
    const u = i / actualSleepers;
    const pt = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);

    dummy.position.copy(pt);
    dummy.lookAt(pt.clone().add(tan));

    // Only place a vertical support pier when strictly outside all hex island bases
    if (i % 4 === 0) {
      let minHexDist = Infinity;
      for (const [cx, cz] of islandCenters) {
        const d = Math.hypot(pt.x - cx, pt.z - cz);
        if (d < minHexDist) minHexDist = d;
      }
      if (minHexDist > 2.08) {
        const pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(pt.x, pt.y - 0.22, pt.z);
        pier.rotation.copy(dummy.rotation);
        pier.castShadow = true;
        group.add(pier);
      }
    }

    // Sleeper tie sitting cleanly between deck top (pt.y - 0.01) and rail bottom (pt.y + 0.01)
    const sl = new THREE.Mesh(sleeperGeo, sleeperMat);
    sl.position.set(pt.x, pt.y + 0.002, pt.z);
    sl.rotation.copy(dummy.rotation);
    group.add(sl);
  }

  return group;
}

// Create a Voxel Train Car (Locomotive or Passenger Carriage, facing +Z for lookAt)
function createVoxelTrainCar(
  isLocomotive: boolean,
  mainColor: number,
  stripeColor: number,
  trainWinMat: THREE.MeshStandardMaterial,
  locoBeamMat: THREE.MeshBasicMaterial
): THREE.Group {
  const g = new THREE.Group();
  // Chassis & wheels
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.56), voxMat(0x2b2726));
  chassis.position.y = 0.07;
  g.add(chassis);

  if (isLocomotive) {
    // Locomotive cab + boiler nose + chimney + warm headlamp + night searchlight cone
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), voxMat(mainColor));
    cab.position.set(0, 0.22, -0.12);
    cab.castShadow = true;
    const cabWin = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.14), trainWinMat);
    cabWin.position.set(0, 0.25, -0.12);
    const boiler = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.3), voxMat(stripeColor));
    boiler.position.set(0, 0.19, 0.14);
    boiler.castShadow = true;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), voxMat(0x2b2726));
    chimney.position.set(0, 0.33, 0.2);
    const headlamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.04),
      voxMat(0xffe57f, 0.2, 0.1, 0xffca28, 1.2)
    );
    headlamp.position.set(0, 0.2, 0.3);

    // Forward headlamp volumetric cone for dusk/night
    const beamGeo = new THREE.ConeGeometry(0.32, 1.35, 14, 1, true);
    beamGeo.translate(0, -0.675, 0);
    beamGeo.rotateX(-Math.PI / 2);
    const beamMesh = new THREE.Mesh(beamGeo, locoBeamMat);
    beamMesh.position.set(0, 0.2, 0.31);
    beamMesh.rotation.x = 0.08;

    g.add(cab, cabWin, boiler, chimney, headlamp, beamMesh);
  } else {
    // Passenger carriage with warm lit window strip & roof
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.52), voxMat(mainColor));
    body.position.y = 0.2;
    body.castShadow = true;
    const winStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.265, 0.08, 0.42),
      trainWinMat
    );
    winStrip.position.y = 0.22;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.05, 0.48), voxMat(stripeColor));
    roof.position.y = 0.33;
    g.add(body, winStrip, roof);
  }
  return g;
}

// Create a 3D Voxel Airplane (facing +Z for lookAt, with spinning propeller, nav strobes & landing beam)
function createVoxelAirplane(landingBeamMat: THREE.MeshBasicMaterial): {
  plane: THREE.Group;
  propeller: THREE.Mesh;
  strobeMat: THREE.MeshStandardMaterial;
} {
  const plane = new THREE.Group();

  // Fuselage (cream & terracotta-red livery)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.96), voxMat(0xf7f2e8));
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), voxMat(0xc43c29));
  nose.position.set(0, 0, 0.56);
  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.14, 0.32),
    voxMat(0x5288a8, 0.25, 0.3, 0x3b82a6, 0.4)
  );
  cockpit.position.set(0, 0.15, 0.08);

  // Main Wings (Biplane / High-wing voxel style)
  const wingMain = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.05, 0.34), voxMat(0xc43c29));
  wingMain.position.set(0, 0.08, 0.12);
  wingMain.castShadow = true;
  const wingTips = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.03, 0.16), voxMat(0xf7f2e8));
  wingTips.position.set(0, 0.09, 0.12);

  // Wingtip Navigation Lights (Port Red & Starboard Green) + Tail White Strobe
  const navRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.06),
    voxMat(0xff5252, 0.2, 0.1, 0xff1744, 1.4)
  );
  navRed.position.set(0.88, 0.1, 0.12);
  const navGreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.06),
    voxMat(0x69f0ae, 0.2, 0.1, 0x00e676, 1.4)
  );
  navGreen.position.set(-0.88, 0.1, 0.12);

  const strobeMat = voxMat(0xffffff, 0.2, 0.1, 0xfff59d, 1.5);
  const tailStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), strobeMat);
  tailStrobe.position.set(0, 0.36, -0.36);

  // Nose Landing Light Cone for Dusk/Night Takeoff & Approach
  const landConeGeo = new THREE.ConeGeometry(0.36, 1.5, 12, 1, true);
  landConeGeo.translate(0, -0.75, 0);
  landConeGeo.rotateX(-Math.PI / 2);
  const landBeam = new THREE.Mesh(landConeGeo, landingBeamMat);
  landBeam.position.set(0, -0.04, 0.66);
  landBeam.rotation.x = 0.12;

  // Tail Fin & Horizontal Stabilizer
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.24), voxMat(0xc43c29));
  tailFin.position.set(0, 0.2, -0.36);
  const tailStab = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.2), voxMat(0xf7f2e8));
  tailStab.position.set(0, 0.06, -0.36);

  // Front Spinning Propeller
  const propeller = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.03), voxMat(0x3b3532));
  propeller.position.set(0, 0, 0.69);

  plane.add(
    body,
    nose,
    cockpit,
    wingMain,
    wingTips,
    navRed,
    navGreen,
    tailStrobe,
    landBeam,
    tailFin,
    tailStab,
    propeller
  );
  return { plane, propeller, strobeMat };
}

// Create an animated 3D Voxel Citizen (with articulated legs & arms for walking)
function createVoxelCitizen(
  shirtColor: number,
  pantsColor: number,
  hairColor: number
): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
} {
  const group = new THREE.Group();

  const legGeo = new THREE.BoxGeometry(0.045, 0.11, 0.045);
  legGeo.translate(0, -0.055, 0);
  const pantsMat = voxMat(pantsColor);

  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.026, 0.11, 0);
  legL.castShadow = true;

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.026, 0.11, 0);
  legR.castShadow = true;

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.13, 0.065),
    voxMat(shirtColor)
  );
  torso.position.set(0, 0.175, 0);
  torso.castShadow = true;

  const armGeo = new THREE.BoxGeometry(0.036, 0.11, 0.036);
  armGeo.translate(0, -0.045, 0);
  const shirtMat = voxMat(shirtColor);

  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(-0.072, 0.225, 0);
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, shirtMat);
  armR.position.set(0.072, 0.225, 0);
  armR.castShadow = true;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.095, 0.095),
    voxMat(0xf5d6b8)
  );
  head.position.set(0, 0.29, 0);
  head.castShadow = true;

  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.102, 0.038, 0.102),
    voxMat(hairColor)
  );
  hair.position.set(0, 0.34, 0);

  group.add(legL, legR, torso, armL, armR, head, hair);
  return { group, legL, legR, armL, armR };
}

function buildIslandMiniature(
  zone: IslandZone,
  animCallbacks: Array<(t: number) => void>,
  buildingWinMat: THREE.MeshStandardMaterial
): THREE.Group {
  const g = new THREE.Group();

  const cornerAngles = [0.42, 2.45, 3.95];
  cornerAngles.forEach((ang, idx) => {
    const tree = createVoxelTree(idx % 2 === 0 ? 0x4d7849 : 0x628a56, 0.68);
    tree.position.set(Math.cos(ang) * 1.04, 0, Math.sin(ang) * 1.04);
    g.add(tree);
  });

  switch (zone.model) {
    case 'traffic_cross': {
      const roadMatLocal = voxMat(0x3b3738);
      const roadH = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.036, 0.46), roadMatLocal);
      roadH.position.y = 0.022;
      const roadVN = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.036, 0.595), roadMatLocal);
      roadVN.position.set(0, 0.022, -0.5275);
      const roadVS = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.036, 0.595), roadMatLocal);
      roadVS.position.set(0, 0.022, 0.5275);
      g.add(roadH, roadVN, roadVS);

      // White intersection stop lines
      const stopLineMat = voxMat(0xf5f0e8);
      const slW = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.42), stopLineMat);
      slW.position.set(-0.28, 0.042, 0);
      const slS = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.05), stopLineMat);
      slS.position.set(0, 0.042, 0.28);
      g.add(slW, slS);

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.07), voxMat(0xd4cbbd));
      post.position.set(0.34, 0.4, -0.34);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.06), voxMat(0xd4cbbd));
      arm.position.set(0.15, 0.76, -0.34);
      const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.1), voxMat(0x262324));
      lightBox.position.set(0.05, 0.76, -0.34);
      const signalDot = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.07, 0.07),
        voxMat(0xd94e34, 0.3, 0.1, 0xd94e34, 0.85)
      );
      signalDot.position.set(0.05, 0.76, -0.28);
      const signalGreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        voxMat(0x2eb872, 0.3, 0.1, 0x2eb872, 0.75)
      );
      signalGreen.position.set(-0.02, 0.76, -0.28);
      g.add(post, arm, lightBox, signalDot, signalGreen);

      // Yellow diamond traffic warning sign on the opposite corner
      const warnPole = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), voxMat(0x9e9589));
      warnPole.position.set(-0.36, 0.21, -0.34);
      const warnBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.035),
        voxMat(0xf5b82e, 0.35, 0.1, 0xd99616, 0.35)
      );
      warnBoard.position.set(-0.36, 0.44, -0.34);
      warnBoard.rotation.z = Math.PI / 4;
      g.add(warnPole, warnBoard);

      const car1 = new THREE.Group();
      const body1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.22), voxMat(0xc43c29));
      body1.position.y = 0.09;
      const cab1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.18), voxMat(0xf5efe4));
      cab1.position.set(-0.02, 0.2, 0);
      car1.add(body1, cab1);
      car1.position.set(-0.48, 0.03, 0.08);
      g.add(car1);

      const car2 = new THREE.Group();
      const body2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.38), voxMat(0x386e96));
      body2.position.y = 0.09;
      const cab2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.2), voxMat(0xece4d8));
      cab2.position.set(0, 0.2, 0.02);
      car2.add(body2, cab2);
      car2.position.set(0.08, 0.03, 0.5);
      g.add(car2);
      break;
    }

    case 'smokestack': {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.4, 0.56), voxMat(0xd9cfc1));
      hall.position.set(-0.08, 0.2, 0.04);
      hall.castShadow = true;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.07, 0.62), voxMat(0x5b6469));
      roof.position.set(-0.08, 0.43, 0.04);
      const hallWin1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.58), buildingWinMat);
      hallWin1.position.set(-0.26, 0.22, 0.04);
      const hallWin2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.58), buildingWinMat);
      hallWin2.position.set(0.08, 0.22, 0.04);
      g.add(hall, roof, hallWin1, hallWin2);

      const stack1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.88, 0.2), voxMat(0xc7bbb0));
      stack1.position.set(0.28, 0.44, -0.14);
      stack1.castShadow = true;
      const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), voxMat(0x9e2a22));
      band1.position.set(0.28, 0.76, -0.14);

      const stack2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), voxMat(0xc7bbb0));
      stack2.position.set(0.04, 0.35, -0.2);
      stack2.castShadow = true;
      g.add(stack1, band1, stack2);

      // AQI Air Quality Monitoring Totem Sign in the foreground
      const aqiBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.12), voxMat(0x3a4754));
      aqiBase.position.set(0.36, 0.22, 0.28);
      aqiBase.castShadow = true;
      const aqiScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.14),
        voxMat(0xffb74d, 0.25, 0.1, 0xff9800, 0.85)
      );
      aqiScreen.position.set(0.36, 0.31, 0.28);
      const aqiSensor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), voxMat(0xe0dcd3));
      aqiSensor.position.set(0.36, 0.48, 0.28);
      g.add(aqiBase, aqiScreen, aqiSensor);

      const puffMat = voxMat(0xd4dce0, 0.9, 0);
      const puffs: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const s = 0.16 + i * 0.04;
        const p = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), puffMat);
        p.position.set(0.28 - i * 0.08, 0.98 + i * 0.17, -0.14);
        g.add(p);
        puffs.push(p);
      }
      animCallbacks.push(t => {
        puffs.forEach((p, idx) => {
          p.position.y = 0.96 + idx * 0.17 + Math.sin(t * 1.8 + idx) * 0.04;
        });
      });
      break;
    }

    case 'tourism_train': {
      const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.65), voxMat(0x4f7559));
      m1.position.set(-0.16, 0.13, -0.18);
      const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.26, 0.48), voxMat(0x5c8566));
      m2.position.set(-0.16, 0.39, -0.18);
      const m3 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.3), voxMat(0xf5f0e8));
      m3.position.set(-0.16, 0.63, -0.18);
      g.add(m1, m2, m3);

      // Scenic red arch gate / viewing pagoda beside the mountain
      const gateL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), voxMat(0xb83728));
      gateL.position.set(0.32, 0.17, -0.22);
      const gateR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), voxMat(0xb83728));
      gateR.position.set(0.52, 0.17, -0.22);
      const gateRoof = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.14), voxMat(0xd49b35));
      gateRoof.position.set(0.42, 0.36, -0.22);
      g.add(gateL, gateR, gateRoof);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.26), voxMat(0xc7b8a1));
      bridge.position.set(0.05, 0.14, 0.26);
      const trainGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const car = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.16, 0.18),
          voxMat(i === 0 ? 0xc43c29 : 0xf2e8d5)
        );
        car.position.set(-0.3 + i * 0.32, 0.28, 0.26);
        car.castShadow = true;
        trainGroup.add(car);
      }
      g.add(bridge, trainGroup);
      animCallbacks.push(t => {
        trainGroup.position.x = Math.sin(t * 1.2) * 0.1;
      });
      break;
    }

    case 'office_tower': {
      const tower1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.96, 0.48), voxMat(0x526278));
      tower1.position.set(-0.1, 0.48, -0.04);
      tower1.castShadow = true;

      const tower2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.66, 0.4), voxMat(0x6e7e94));
      tower2.position.set(0.3, 0.33, 0.16);
      tower2.castShadow = true;

      for (let r = 0; r < 4; r++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.5), buildingWinMat);
        w.position.set(-0.1, 0.22 + r * 0.19, -0.04);
        g.add(w);
      }
      for (let r = 0; r < 3; r++) {
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.42), buildingWinMat);
        w2.position.set(0.3, 0.2 + r * 0.18, 0.16);
        g.add(w2);
      }

      // Rooftop glowing clock / briefcase billboard on tower1
      const clockFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.08),
        voxMat(0xfff3d1, 0.25, 0.1, 0xffca28, 0.75)
      );
      clockFace.position.set(-0.1, 1.07, -0.04);
      g.add(tower1, tower2, clockFace);
      break;
    }

    case 'chapel_split': {
      const hL = createVoxelCabin(0xede3d5, 0xb84c4c, buildingWinMat);
      hL.scale.setScalar(0.8);
      hL.position.set(-0.34, 0, 0);
      const hR = createVoxelCabin(0xede3d5, 0x4c708c, buildingWinMat);
      hR.scale.setScalar(0.8);
      hR.position.set(0.34, 0, 0);

      // Split heart / parted stone path between the two houses
      const pathL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), voxMat(0xc7b8a1));
      pathL.position.set(-0.16, 0.015, 0.34);
      const pathR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), voxMat(0xc7b8a1));
      pathR.position.set(0.16, 0.015, 0.34);
      const heartL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.08), voxMat(0xd9534f));
      heartL.position.set(-0.07, 0.2, 0.28);
      heartL.rotation.z = 0.22;
      const heartR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.08), voxMat(0x4c708c));
      heartR.position.set(0.07, 0.2, 0.28);
      heartR.rotation.z = -0.22;

      g.add(hL, hR, pathL, pathR, heartL, heartR);
      break;
    }

    case 'fire_house': {
      const apt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.46), voxMat(0xd6c7b5));
      apt.position.set(-0.16, 0.36, -0.06);
      apt.castShadow = true;

      for (let r = 0; r < 3; r++) {
        const fw = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.48), buildingWinMat);
        fw.position.set(-0.16, 0.2 + r * 0.2, -0.06);
        g.add(fw);
      }

      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.5), voxMat(0x7a4234));
      roof.position.set(-0.16, 0.74, -0.06);

      // Animated voxel flame & electrical spark box on the rooftop / side
      const flameOuter = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.18),
        voxMat(0xff5722, 0.2, 0.1, 0xff3d00, 1.1)
      );
      flameOuter.position.set(-0.06, 0.86, 0.02);
      const flameInner = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.16, 0.1),
        voxMat(0xffeb3b, 0.2, 0.1, 0xffea00, 1.3)
      );
      flameInner.position.set(-0.06, 0.94, 0.02);

      const truck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.24), voxMat(0xc43025));
      truck.position.set(0.28, 0.1, 0.22);
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.1), voxMat(0xe6e1da));
      ladder.position.set(0.2, 0.25, 0.22);
      ladder.rotation.z = 0.32;

      g.add(apt, roof, flameOuter, flameInner, truck, ladder);
      animCallbacks.push(t => {
        const pulse = 1 + Math.sin(t * 9) * 0.15;
        flameOuter.scale.set(1, pulse, 1);
        flameInner.scale.set(1, 1 + Math.cos(t * 11) * 0.2, 1);
      });
      break;
    }

    case 'police_siren': {
      const station = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.52, 0.48), voxMat(0x495363));
      station.position.set(-0.06, 0.26, -0.08);
      station.castShadow = true;

      const stWinL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.5), buildingWinMat);
      stWinL.position.set(-0.26, 0.26, -0.08);
      const stWinR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.5), buildingWinMat);
      stWinR.position.set(0.14, 0.26, -0.08);

      const pediment = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.52), voxMat(0xd8cfc2));
      pediment.position.set(-0.06, 0.55, -0.08);

      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.06),
        voxMat(0xd4a64a, 0.35, 0.5, 0xffb300, 0.45)
      );
      badge.position.set(-0.06, 0.34, 0.17);

      // Parked black-and-white police cruiser with flashing red/blue lightbar
      const cruiser = new THREE.Group();
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.2), voxMat(0x1f242d));
      cBody.position.y = 0.06;
      const cCab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.17), voxMat(0xf5f5f5));
      cCab.position.y = 0.15;
      const sirenRedMat = voxMat(0xff1744, 0.2, 0.1, 0xff1744, 1.2);
      const sirenBlueMat = voxMat(0x2979ff, 0.2, 0.1, 0x2979ff, 1.2);
      const sRed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.06), sirenRedMat);
      sRed.position.set(-0.04, 0.21, 0);
      const sBlue = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.06), sirenBlueMat);
      sBlue.position.set(0.04, 0.21, 0);
      cruiser.add(cBody, cCab, sRed, sBlue);
      cruiser.position.set(0.12, 0.02, 0.34);

      g.add(station, stWinL, stWinR, pediment, badge, cruiser);
      animCallbacks.push(t => {
        const flash = Math.sin(t * 8) >= 0;
        sirenRedMat.emissiveIntensity = flash ? 1.5 : 0.25;
        sirenBlueMat.emissiveIntensity = flash ? 0.25 : 1.5;
      });
      break;
    }

    case 'salary_scale': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), voxMat(0x5c4b32));
      base.position.y = 0.06;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.78, 0.12),
        voxMat(0xc99b3b, 0.35, 0.45)
      );
      pillar.position.y = 0.45;

      const beamGroup = new THREE.Group();
      beamGroup.position.set(0, 0.8, 0);
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.98, 0.07, 0.09),
        voxMat(0xdba942, 0.35, 0.45)
      );
      const panL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.32), voxMat(0xb8892d));
      panL.position.set(-0.42, -0.18, 0);
      const panR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.32), voxMat(0xb8892d));
      panR.position.set(0.42, -0.18, 0);

      // Gold coin stack on left pan (Average pulled up by high earners) vs right pan (Median)
      const coinMat = voxMat(0xffd54f, 0.25, 0.55, 0xffab00, 0.35);
      const coinStackL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), coinMat);
      coinStackL.position.set(-0.42, -0.03, 0);
      const coinStackR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.16), coinMat);
      coinStackR.position.set(0.42, -0.09, 0);

      beamGroup.add(beam, panL, panR, coinStackL, coinStackR);

      g.add(base, pillar, beamGroup);
      animCallbacks.push(t => {
        beamGroup.rotation.z = 0.06 + Math.sin(t * 1.4) * 0.09;
      });
      break;
    }

    case 'dark_houses': {
      const positions: Array<[number, number, number]> = [
        [-0.3, 0.28, -0.14],
        [0.24, 0.4, -0.1],
        [0.04, 0.22, 0.26],
      ];
      positions.forEach(([x, h, z], idx) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, h * 2, 0.36),
          voxMat(idx === 1 ? 0x43505e : 0x586675)
        );
        b.position.set(x, h, z);
        b.castShadow = true;
        g.add(b);
      });
      const singleGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.1, 0.39),
        voxMat(0xf5cf76, 0.2, 0.1, 0xe8b343, 0.85)
      );
      singleGlow.position.set(0.24, 0.5, -0.1);

      // Electric utility meter box in front to represent 60-kWh low-electricity threshold
      const meterBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.12), voxMat(0xd4cfc7));
      meterBox.position.set(-0.34, 0.12, 0.28);
      const meterDial = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.08, 0.14),
        voxMat(0x69f0ae, 0.2, 0.1, 0x00e676, 0.9)
      );
      meterDial.position.set(-0.34, 0.16, 0.28);
      g.add(singleGlow, meterBox, meterDial);
      break;
    }

    case 'wind_solar': {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), voxMat(0xf2efe9));
      mast.position.set(-0.2, 0.52, -0.12);
      mast.castShadow = true;

      const rotor = new THREE.Group();
      rotor.position.set(-0.2, 1.02, -0.05);
      for (let i = 0; i < 3; i++) {
        const bladeWrap = new THREE.Group();
        bladeWrap.rotation.z = (i * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.03), voxMat(0xffffff));
        blade.position.y = 0.21;
        bladeWrap.add(blade);
        rotor.add(bladeWrap);
      }

      const panel1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.05, 0.3),
        voxMat(0x2f5f8f, 0.35, 0.35)
      );
      panel1.position.set(0.24, 0.15, 0.15);
      panel1.rotation.x = 0.36;

      const panel2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.05, 0.3),
        voxMat(0x2f5f8f, 0.35, 0.35)
      );
      panel2.position.set(0.24, 0.15, -0.18);
      panel2.rotation.x = 0.36;

      // Green energy battery storage cabinet beside the turbine
      const essBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.18), voxMat(0xe8efe8));
      essBox.position.set(-0.22, 0.11, 0.24);
      const essStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.06, 0.19),
        voxMat(0x2eb872, 0.3, 0.1, 0x00c853, 0.75)
      );
      essStripe.position.set(-0.22, 0.14, 0.24);

      g.add(mast, rotor, panel1, panel2, essBox, essStripe);
      animCallbacks.push(t => {
        rotor.rotation.z = -t * 1.7;
      });
      break;
    }

    case 'hotel_inn': {
      const hotel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.42), voxMat(0xe6d7c0));
      hotel.position.set(0, 0.31, -0.06);
      hotel.castShadow = true;

      for (let r = 0; r < 2; r++) {
        const hw = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.44), buildingWinMat);
        hw.position.set(0, 0.22 + r * 0.22, -0.06);
        g.add(hw);
      }

      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.5), voxMat(0x824630));
      roof.position.set(0, 0.66, -0.06);

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.14, 0.08),
        voxMat(0xebb55b, 0.3, 0.1, 0xd99632, 0.85)
      );
      sign.position.set(0, 0.78, 0.08);

      // Day-trip tour bus parked in front of the hotel
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.18), voxMat(0x2c6db5));
      bus.position.set(0.12, 0.09, 0.32);
      const busWin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.19), buildingWinMat);
      busWin.position.set(0.12, 0.12, 0.32);

      g.add(hotel, roof, sign, bus, busWin);
      break;
    }

    case 'zebra_crossing': {
      const road = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.036, 0.96), voxMat(0x3a3d40));
      road.position.y = 0.022;
      g.add(road);

      for (let i = -2; i <= 2; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.014, 0.1), voxMat(0xf5f0e8));
        stripe.position.set(0, 0.043, i * 0.17);
        g.add(stripe);
      }

      // Pedestrian crossing light post with glowing green walk signal
      const pedPole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), voxMat(0xc7bfb3));
      pedPole.position.set(0.32, 0.25, -0.38);
      const pedLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.1),
        voxMat(0x2eb872, 0.25, 0.1, 0x00e676, 0.95)
      );
      pedLight.position.set(0.32, 0.48, -0.38);
      g.add(pedPole, pedLight);

      // Yielding car politely stopped before the crosswalk
      const yieldCar = new THREE.Group();
      const ycBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.2), voxMat(0xe09f2d));
      ycBody.position.y = 0.075;
      ycBody.castShadow = true;
      const ycTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.17), voxMat(0xf7f2e8));
      ycTop.position.set(-0.02, 0.16, 0);
      yieldCar.add(ycBody, ycTop);
      yieldCar.position.set(-0.48, 0.02, 0.12);
      g.add(yieldCar);

      // One animated citizen walking back & forth across the zebra crossing
      const crossCitizen1 = createVoxelCitizen(0x2e855a, 0x2b3648, 0x3b281e);
      g.add(crossCitizen1.group);

      animCallbacks.push(t => {
        const s1 = Math.sin(t * 1.65);
        const dir1 = Math.cos(t * 1.65) >= 0 ? 1 : -1;
        crossCitizen1.group.position.set(0.0, 0.04 + Math.abs(Math.sin(t * 9)) * 0.02, s1 * 0.34);
        crossCitizen1.group.rotation.y = dir1 > 0 ? 0 : Math.PI;
        const swing1 = Math.sin(t * 9) * 0.55;
        crossCitizen1.legL.rotation.x = swing1;
        crossCitizen1.legR.rotation.x = -swing1;
        crossCitizen1.armL.rotation.x = -swing1 * 0.8;
        crossCitizen1.armR.rotation.x = swing1 * 0.8;
      });
      break;
    }

    case 'speed_camera': {
      const hwy = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 0.54), voxMat(0x383636));
      hwy.position.y = 0.02;
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), voxMat(0xd49d3b));
      pole.position.set(0.28, 0.39, -0.32);
      const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.2), voxMat(0xf2ede4));
      camBox.position.set(0.28, 0.76, -0.26);
      const flashMat = voxMat(0xffffff, 0.2, 0.1, 0xfff59d, 0.6);
      const camLens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), flashMat);
      camLens.position.set(0.28, 0.76, -0.15);

      const fastCar = new THREE.Group();
      const fcBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.22), voxMat(0xc43c29));
      fcBody.position.y = 0.08;
      const fcCab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.18), voxMat(0xf5efe4));
      fcCab.position.set(-0.02, 0.17, 0);
      fastCar.add(fcBody, fcCab);
      fastCar.position.set(-0.18, 0.03, 0);

      // Distracted smartphone billboard icon on the opposite side of the road
      const phoneSign = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.05), voxMat(0x262b33));
      phoneSign.position.set(-0.32, 0.22, -0.34);
      const phoneScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.22, 0.06),
        voxMat(0x82b1ff, 0.25, 0.1, 0x2979ff, 0.85)
      );
      phoneScreen.position.set(-0.32, 0.22, -0.34);

      g.add(hwy, pole, camBox, camLens, fastCar, phoneSign, phoneScreen);
      animCallbacks.push(t => {
        flashMat.emissiveIntensity = Math.sin(t * 5.5) > 0.85 ? 2.2 : 0.35;
      });
      break;
    }

    case 'compost_farm': {
      const silo1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.58, 0.4), voxMat(0x738a52));
      silo1.position.set(-0.22, 0.29, -0.08);
      silo1.castShadow = true;
      const cap1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.3), voxMat(0x98ab72));
      cap1.position.set(-0.22, 0.65, -0.08);

      const silo2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.34), voxMat(0x5b7040));
      silo2.position.set(0.2, 0.22, -0.12);
      silo2.castShadow = true;

      const field = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, 0.36), voxMat(0x614731));
      field.position.set(0.04, 0.03, 0.24);

      // Cute voxel piglet on the organic farm + green recycling bin
      const pig = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.11), voxMat(0xf4a7b9));
      pig.position.set(0.22, 0.12, 0.24);
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), voxMat(0x2e855a));
      bin.position.set(-0.24, 0.13, 0.24);

      g.add(silo1, cap1, silo2, field, pig, bin);
      break;
    }
  }

  // Add a strolling voxel citizen only on a few selected islands with open front lawns (no roads at z = -0.58)
  if (zone.number === 4 || zone.number === 6 || zone.number === 11) {
    const shirtPalette = [0xc43c29, 0x2c6db5, 0x2e855a, 0xd9822b, 0x7b52ab, 0xd9534f];
    const seed = zone.number;
    const citizen = createVoxelCitizen(
      shirtPalette[seed % shirtPalette.length],
      0x2f3640,
      0x332219
    );
    g.add(citizen.group);

    animCallbacks.push(t => {
      // Walk back and forth along a clean straight promenade at z = -0.58, x = -0.26 .. +0.26
      const phase = t * 1.35 + seed * 0.9;
      const s = Math.sin(phase);
      const dir = Math.cos(phase) >= 0 ? 1 : -1;
      citizen.group.position.set(
        s * 0.26,
        0.01 + Math.abs(Math.sin(t * 7.5 + seed)) * 0.018,
        -0.58
      );
      citizen.group.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      const sw = Math.sin(t * 7.5 + seed) * 0.5;
      citizen.legL.rotation.x = sw;
      citizen.legR.rotation.x = -sw;
      citizen.armL.rotation.x = -sw * 0.75;
      citizen.armR.rotation.x = sw * 0.75;
    });
  }

  return g;
}

const OVERVIEW_POS = new THREE.Vector3(0, 18.8, 21.5);
const OVERVIEW_TARGET = new THREE.Vector3(-0.2, -0.2, 0.8);

export function CatanWorldStage({
  selectedZoneId,
  completedCaseIds,
  timeOfDay,
  showLinks,
  activeGroupFilter,
  searchQuery,
  overviewSignal,
  replayIntroSignal,
  onSelectZone,
  onIntroChange,
}: CatanWorldStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [introPlaying, setIntroPlaying] = useState<boolean>(true);

  useEffect(() => {
    onIntroChange?.(introPlaying);
  }, [introPlaying, onIntroChange]);

  const selectedIdRef = useRef<string | null>(selectedZoneId);
  selectedIdRef.current = selectedZoneId;

  const completedRef = useRef<string[]>(completedCaseIds);
  completedRef.current = completedCaseIds;

  const timeRef = useRef<number>(timeOfDay);
  timeRef.current = timeOfDay;

  const showLinksRef = useRef<boolean>(showLinks);
  showLinksRef.current = showLinks;

  const activeFilterRef = useRef<string>(activeGroupFilter);
  activeFilterRef.current = activeGroupFilter;

  const searchQueryRef = useRef<string>(searchQuery);
  searchQueryRef.current = searchQuery;

  const onSelectRef = useRef(onSelectZone);
  onSelectRef.current = onSelectZone;

  const introStateRef = useRef<{
    active: boolean;
    startTime: number;
    approachMs: number;
    pullbackMs: number;
  }>({
    active: true,
    startTime: 0,
    approachMs: 3400,
    pullbackMs: 2400,
  });

  const cameraTweenRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);

  const sceneObjectsRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    rimMeshes: Record<string, THREE.Mesh>;
    tileGroups: Record<string, THREE.Group>;
    dioramaGroups: Record<string, THREE.Group>;
    linkMeshes: Array<{ id: string; from: string; to: string; mesh: THREE.Mesh }>;
    zoneAnchors: Record<string, THREE.Vector3>;
    introBoat: THREE.Group;
  } | null>(null);

  const triggerBoardWaveIntro = (
    tileGroups: Record<string, THREE.Group>,
    dioramaGroups: Record<string, THREE.Group>,
    delaySec = 0.35
  ) => {
    const orderedIds = [...islandZones]
      .sort((a, b) => a.cell[1] - b.cell[1] || a.cell[0] - b.cell[0])
      .map(z => z.id);

    orderedIds.forEach((id, idx) => {
      const tg = tileGroups[id];
      const dg = dioramaGroups[id];
      if (tg) {
        gsap.killTweensOf([tg.position, tg.scale]);
        tg.position.y = -0.85;
        tg.scale.set(0.72, 0.72, 0.72);
        gsap.to(tg.position, {
          y: 0,
          duration: 0.95,
          delay: delaySec + idx * 0.065,
          ease: 'back.out(1.75)',
          overwrite: 'auto',
        });
        gsap.to(tg.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.9,
          delay: delaySec + idx * 0.065,
          ease: 'back.out(1.6)',
          overwrite: 'auto',
        });
      }
      if (dg) {
        gsap.killTweensOf(dg.scale);
        dg.scale.set(0.01, 0.01, 0.01);
        gsap.to(dg.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.05,
          delay: delaySec + 0.16 + idx * 0.065,
          ease: 'elastic.out(1, 0.52)',
          overwrite: 'auto',
        });
      }
    });
  };

  useEffect(() => {
    if (replayIntroSignal === 0) return;
    if (cameraTweenRef.current) cameraTweenRef.current.active = false;
    const objs = sceneObjectsRef.current;
    if (objs) {
      gsap.killTweensOf([objs.camera.position, objs.controls.target]);
      triggerBoardWaveIntro(objs.tileGroups, objs.dioramaGroups, 0.45);
    }
    introStateRef.current = {
      active: true,
      startTime: performance.now(),
      approachMs: 3400,
      pullbackMs: 2400,
    };
    setIntroPlaying(true);
  }, [replayIntroSignal]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs) return;
    const { camera, controls, zoneAnchors, introBoat, tileGroups, dioramaGroups } = objs;

    // GSAP 3D Tactile Hex Tile Elevation & Diorama Bounce
    islandZones.forEach(z => {
      const tg = tileGroups[z.id];
      const dg = dioramaGroups[z.id];
      const isSel = selectedZoneId === z.id;
      if (tg) {
        gsap.to(tg.position, {
          y: isSel ? 0.24 : 0,
          duration: isSel ? 0.65 : 0.45,
          ease: isSel ? 'back.out(2.2)' : 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(tg.scale, {
          x: isSel ? 1.045 : 1,
          y: isSel ? 1.045 : 1,
          z: isSel ? 1.045 : 1,
          duration: isSel ? 0.65 : 0.45,
          ease: isSel ? 'back.out(2.2)' : 'power2.out',
          overwrite: 'auto',
        });
      }
      if (dg && isSel) {
        gsap.fromTo(
          dg.scale,
          { x: 0.84, y: 0.72, z: 0.84 },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.85,
            ease: 'elastic.out(1, 0.42)',
            overwrite: 'auto',
          }
        );
      }
    });

    if (selectedZoneId && zoneAnchors[selectedZoneId]) {
      if (introStateRef.current.active) {
        introStateRef.current.active = false;
        introBoat.position.set(13.2, WATER_Y + 0.03, -3.6);
        setIntroPlaying(false);
      }
      if (cameraTweenRef.current) cameraTweenRef.current.active = false;
      const targetAnchor = zoneAnchors[selectedZoneId];
      const endTarget = new THREE.Vector3(targetAnchor.x, 0.48, targetAnchor.z);
      const endPos = new THREE.Vector3(targetAnchor.x + 1.4, 5.8, targetAnchor.z + 6.2);

      gsap.killTweensOf([camera.position, controls.target]);
      gsap.to(camera.position, {
        x: endPos.x,
        y: endPos.y,
        z: endPos.z,
        duration: 1.05,
        ease: 'expo.out',
        overwrite: 'auto',
      });
      gsap.to(controls.target, {
        x: endTarget.x,
        y: endTarget.y,
        z: endTarget.z,
        duration: 1.05,
        ease: 'expo.out',
        overwrite: 'auto',
      });

      const activeChip = chipRefs.current[selectedZoneId];
      if (activeChip) {
        gsap.fromTo(
          activeChip,
          { scale: 0.82 },
          { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.45)', overwrite: 'auto' }
        );
      }
    }
  }, [selectedZoneId]);

  useEffect(() => {
    if (overviewSignal === 0) return;
    const objs = sceneObjectsRef.current;
    if (!objs) return;
    const { camera, controls, introBoat, tileGroups } = objs;
    if (introStateRef.current.active) {
      introStateRef.current.active = false;
      introBoat.position.set(16.0, WATER_Y + 0.03, 1.6);
      setIntroPlaying(false);
    }
    if (cameraTweenRef.current) cameraTweenRef.current.active = false;
    Object.values(tileGroups).forEach(tg => {
      gsap.to(tg.position, { y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(tg.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    });
    gsap.killTweensOf([camera.position, controls.target]);
    gsap.to(camera.position, {
      x: OVERVIEW_POS.x,
      y: OVERVIEW_POS.y,
      z: OVERVIEW_POS.z,
      duration: 1.1,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    gsap.to(controls.target, {
      x: OVERVIEW_TARGET.x,
      y: OVERVIEW_TARGET.y,
      z: OVERVIEW_TARGET.z,
      duration: 1.1,
      ease: 'expo.out',
      overwrite: 'auto',
    });
  }, [overviewSignal]);

  const handleSkipIntro = () => {
    const objs = sceneObjectsRef.current;
    if (!objs || !introStateRef.current.active) return;
    introStateRef.current.active = false;
    objs.introBoat.position.set(13.2, WATER_Y + 0.03, -3.6);
    setIntroPlaying(false);
    if (cameraTweenRef.current) cameraTweenRef.current.active = false;
    Object.values(objs.tileGroups).forEach(tg => {
      gsap.to(tg.position, { y: 0, duration: 0.55, ease: 'back.out(1.5)', overwrite: 'auto' });
      gsap.to(tg.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: 'back.out(1.5)', overwrite: 'auto' });
    });
    Object.values(objs.dioramaGroups).forEach(dg => {
      gsap.to(dg.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.6)', overwrite: 'auto' });
    });
    gsap.killTweensOf([objs.camera.position, objs.controls.target]);
    gsap.to(objs.camera.position, {
      x: OVERVIEW_POS.x,
      y: OVERVIEW_POS.y,
      z: OVERVIEW_POS.z,
      duration: 1.0,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    gsap.to(objs.controls.target, {
      x: OVERVIEW_TARGET.x,
      y: OVERVIEW_TARGET.y,
      z: OVERVIEW_TARGET.z,
      duration: 1.0,
      ease: 'expo.out',
      overwrite: 'auto',
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeee7da);
    scene.fog = new THREE.FogExp2(0xeee7da, 0.011);

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      260
    );
    camera.position.set(23.8, WATER_Y + 0.65, 1.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    container.prepend(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(10.6, 0.6, 1.6);
    controls.minDistance = 5.2;
    controls.maxDistance = 34;
    controls.maxPolarAngle = Math.PI * 0.405;
    controls.minPolarAngle = 0.28;

    const onControlStart = () => {
      if (cameraTweenRef.current) {
        cameraTweenRef.current.active = false;
      }
      gsap.killTweensOf([camera.position, controls.target]);
    };
    controls.addEventListener('start', onControlStart);

    // Sky Dome
    const skyUniforms = {
      uTop: { value: new THREE.Color(0x7eaac4) },
      uHorizon: { value: new THREE.Color(0xf2ece1) },
    };
    const skyGeo = new THREE.SphereGeometry(150, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = clamp(pow(max(h, 0.0), 0.65), 0.0, 1.0);
          vec3 col = mix(uHorizon, uTop, t);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x998770, 0.98);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e8, 1.65);
    sunLight.position.set(16, 28, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 90;
    const d = 19;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Calm Sea Plane
    const waterGeo = new THREE.PlaneGeometry(200, 200);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x669cb0,
      roughness: 0.42,
      metalness: 0.08,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = WATER_Y;
    water.receiveShadow = true;
    scene.add(water);

    // =========================================================================
    // 3D EXTRUDED TAIWAN ISLAND BASE (台灣本島造型底盤)
    // =========================================================================
    const TAIWAN_CONTOUR: Array<[number, number]> = [
      [1.8, -13.6], // Fugui Cape / Keelung North Tip (富貴角・基隆)
      [5.8, -12.4], // Bitou Cape (鼻頭角)
      [9.2, -9.8], // Sandiaojiao North-East Cape (三貂角)
      [9.8, -5.8], // Yilan Su'ao Bay (宜蘭蘇澳)
      [9.5, -1.8], // Hualien East Harbor Coast (花蓮港)
      [8.4, 2.4], // Taitung Coast (台東海岸)
      [6.6, 6.4], // Dawu South-East Coast (大武)
      [4.4, 10.6], // Jialeshui / Hengchun East (佳樂水)
      [2.8, 13.6], // Eluanbi South-East Cape (鵝鑾鼻)
      [-0.6, 14.3], // Hengchun South Bay (墾丁南灣)
      [-4.0, 13.4], // Maobitou South-West Cape (貓鼻頭)
      [-5.4, 10.2], // Pingtung Fangliao (屏東枋寮)
      [-7.2, 6.6], // Kaohsiung / Tainan Coast (高屏台南海岸)
      [-9.5, 2.8], // Chiayi / Yunlin West Bulge (嘉南平原外傘頂洲)
      [-8.8, -1.4], // Changhua / Taichung Coast (彰中海岸)
      [-7.0, -5.2], // Miaoli / Hsinchu Coast (竹苗海岸)
      [-4.8, -9.2], // Taoyuan / Bali Coast (桃竹海岸)
      [-1.8, -12.4], // Tamsui North-West Coast (淡水河口)
    ];

    const buildTaiwanExtrude = (
      scaleX: number,
      scaleZ: number,
      depth: number,
      bevelSize: number
    ) => {
      const spline = new THREE.SplineCurve(
        TAIWAN_CONTOUR.map(([x, z]) => new THREE.Vector2(x * scaleX, -z * scaleZ))
      );
      const pts = spline.getPoints(140);
      const shape = new THREE.Shape(pts);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize,
        bevelSegments: 3,
        curveSegments: 32,
      });
      geo.rotateX(-Math.PI / 2);
      return geo;
    };

    const outerSand = new THREE.Mesh(
      buildTaiwanExtrude(1.09, 1.07, 0.24, 0.35),
      voxMat(0xd6c4a5, 0.88)
    );
    // ExtrudeGeometry depth=0.24 + bevelThickness=0.08 -> local top is +0.32; y=-0.39 puts top at Y=-0.07
    outerSand.position.set(0, -0.39, 0);
    outerSand.receiveShadow = true;
    scene.add(outerSand);

    const innerBoard = new THREE.Mesh(
      buildTaiwanExtrude(1.0, 1.0, 0.28, 0.22),
      voxMat(0xc4b193, 0.88)
    );
    // ExtrudeGeometry depth=0.28 + bevelThickness=0.08 -> local top is +0.36; y=-0.365 puts top at Y=-0.005 (flush below Y=0)
    innerBoard.position.set(0, -0.365, 0);
    innerBoard.receiveShadow = true;
    scene.add(innerBoard);

    const animCallbacks: Array<(t: number) => void> = [];

    // =========================================================================
    // TAIWAN INTER-ISLAND RAILWAY + MOVING TRAIN + SKY AIRPLANE!
    // =========================================================================

    // Single Inter-Island Railway weaving smoothly along Voronoi hex seams with tangent circular fillets
    const RY = TOP + 0.02;
    const W = (S * SQRT3) / 2; // 1.68875 exact seam half-width
    const voronoiRailVertices: Array<[number, number]> = [
      // 1. North seam (#0 | #1) heading South along x = W
      [W, -7.3125 - 0.5 * S],
      [W, -7.3125 + 0.5 * S],
      // 2. Row 1 West seam (#2 | #3) along x = 0
      [0, -4.3875 - 0.5 * S],
      [0, -4.3875 + 0.5 * S],
      // 3. Row 2 West seam (#5 | #7) along x = -W
      [-W, -1.4625 - 0.5 * S],
      [-W, -1.4625 + 0.5 * S],
      // 4. Row 3 West rim of #8 along x = -2W
      [-2 * W, 1.4625 - 0.5 * S],
      [-2 * W, 1.4625 + 0.5 * S],
      // 5. Row 4 seam (#10 | #11) along x = -W
      [-W, 4.3875 - 0.5 * S],
      [-W, 4.3875 + 0.5 * S],
      // 6. Loop around South Peninsula Island #12 (-W, 7.3125)
      [-2 * W, 7.3125 - 0.5 * S],
      [-2 * W, 7.3125 + 0.5 * S],
      [-W, 7.3125 + 1.0 * S],
      [0, 7.3125 + 0.5 * S],
      [0, 7.3125 - 0.5 * S],
      // 7. Row 4 East rim of #11 heading North along x = W
      [W, 4.3875 + 0.5 * S],
      [W, 4.3875 - 0.5 * S],
      // 8. Row 3 seam (#8 | #9) along x = 0
      [0, 1.4625 + 0.5 * S],
      [0, 1.4625 - 0.5 * S],
      // 9. Row 2 East seam (#7 | #6) along x = W
      [W, -1.4625 + 0.5 * S],
      [W, -1.4625 - 0.5 * S],
      // 10. Row 1 East seam (#3 | #4) along x = 2W
      [2 * W, -4.3875 + 0.5 * S],
      [2 * W, -4.3875 - 0.5 * S],
      // 11. Loop around North-East Island #1 (2W, -7.3125) back to start
      [3 * W, -7.3125 + 0.5 * S],
      [3 * W, -7.3125 - 0.5 * S],
      [2 * W, -7.3125 - 1.0 * S],
    ];

    const dCut = 0.25 * S;
    const rFillet = dCut * SQRT3;
    const arcSteps = 6;
    const smoothRailPoints: THREE.Vector3[] = [];
    const vCount = voronoiRailVertices.length;

    for (let i = 0; i < vCount; i++) {
      const vp = voronoiRailVertices[(i - 1 + vCount) % vCount];
      const v = voronoiRailVertices[i];
      const vn = voronoiRailVertices[(i + 1) % vCount];
      const uInX = (v[0] - vp[0]) / S;
      const uInZ = (v[1] - vp[1]) / S;
      const uOutX = (vn[0] - v[0]) / S;
      const uOutZ = (vn[1] - v[1]) / S;
      const bisX = uOutX - uInX;
      const bisZ = uOutZ - uInZ;
      const ox = v[0] + 2 * dCut * bisX;
      const oz = v[1] + 2 * dCut * bisZ;
      const pStartX = v[0] - dCut * uInX;
      const pStartZ = v[1] - dCut * uInZ;
      const rStartX = pStartX - ox;
      const rStartZ = pStartZ - oz;

      for (let k = 0; k <= arcSteps; k++) {
        const alpha = (k / arcSteps) * (Math.PI / 3);
        const ca = Math.cos(alpha);
        const sa = Math.sin(alpha);
        smoothRailPoints.push(
          new THREE.Vector3(
            ox + rStartX * ca + uInX * (rFillet * sa),
            RY,
            oz + rStartZ * ca + uInZ * (rFillet * sa)
          )
        );
      }

      const pEndX = v[0] + dCut * uOutX;
      const pEndZ = v[1] + dCut * uOutZ;
      const pNextStartX = vn[0] - dCut * uOutX;
      const pNextStartZ = vn[1] - dCut * uOutZ;
      smoothRailPoints.push(
        new THREE.Vector3(0.5 * (pEndX + pNextStartX), RY, 0.5 * (pEndZ + pNextStartZ))
      );
    }

    const islandCenters = islandZones.map(z => getZoneWorldPos(z.cell));
    const railCurve1 = new THREE.CatmullRomCurve3(smoothRailPoints, true, 'centripetal', 0.25);
    scene.add(buildRailwayTrack(railCurve1, 240, islandCenters));

    // =========================================================================
    // NIGHT / DUSK DYNAMIC LIGHTING MATERIALS
    // =========================================================================
    const buildingWinMat = voxMat(0xffdb8a, 0.28, 0.1, 0xffa726, 0.35);
    const trainWinMat = voxMat(0xffe082, 0.25, 0.1, 0xffb300, 0.65);
    const locoBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffe57f,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const planeLandingBeamMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c4,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lhBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffe57f,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const carHeadlightMat = voxMat(0xfff59d, 0.2, 0.1, 0xffca28, 0.4);
    const carTaillightMat = voxMat(0xff5252, 0.2, 0.1, 0xd50000, 0.4);

    // 4-Car Retro Red & Cream Sightseeing Train weaving between the islands
    const train1Cars: THREE.Group[] = [];
    for (let c = 0; c < 4; c++) {
      const car = createVoxelTrainCar(
        c === 0,
        c === 0 ? 0xc43c29 : 0xf5efe2,
        0xc43c29,
        trainWinMat,
        locoBeamMat
      );
      scene.add(car);
      train1Cars.push(car);
    }

    // SKY AIRPLANE: 3D Voxel Airplane taking off & landing at the Southern Hengchun Airport!
    const {
      plane: skyPlane,
      propeller: planeProp,
      strobeMat: planeStrobeMat,
    } = createVoxelAirplane(planeLandingBeamMat);
    scene.add(skyPlane);

    const flightCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-9.6, 2.4, 9.2), // West-Southwest approach over Taiwan Strait
        new THREE.Vector3(-6.2, 0.78, 11.75), // Final approach glide slope
        new THREE.Vector3(-3.8, 0.19, 11.95), // Over West runway threshold
        new THREE.Vector3(-2.6, 0.09, 11.95), // Touchdown on Southern Runway!
        new THREE.Vector3(-1.2, 0.09, 11.95), // Ground roll past Terminal
        new THREE.Vector3(0.2, 0.09, 11.95), // Ground roll past Control Tower
        new THREE.Vector3(1.5, 0.1, 11.95), // Takeoff acceleration roll
        new THREE.Vector3(3.1, 0.26, 11.95), // Rotation & Liftoff over Eluanbi!
        new THREE.Vector3(6.8, 1.45, 11.2), // Initial climb-out over Pacific Ocean
        new THREE.Vector3(10.8, 3.6, 3.2), // Cruising north along East Coast
        new THREE.Vector3(10.6, 5.0, -5.8), // Banking past East Harbor & Lighthouse
        new THREE.Vector3(2.2, 5.6, -11.5), // High cruise over North Tip of Taiwan
        new THREE.Vector3(-6.4, 5.1, -7.8), // Cruising over North-West Coast
        new THREE.Vector3(-10.8, 3.9, 1.0), // Downwind leg along West Coast
      ],
      true,
      'centripetal',
      0.45
    );

    const contrailPuffs: THREE.Mesh[] = [];
    const contrailMat = voxMat(0xffffff, 0.9, 0);
    for (let i = 0; i < 6; i++) {
      const sz = Math.max(0.06, 0.15 - i * 0.018);
      const puff = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), contrailMat);
      scene.add(puff);
      contrailPuffs.push(puff);
    }

    // =========================================================================
    // SOUTHERN TAIWAN AIRPORT (恆春半島機場: RUNWAY, TERMINAL, CONTROL TOWER)
    // =========================================================================
    const airportGroup = new THREE.Group();
    const AP_X = -0.6;
    const AP_Z = 11.95;

    // 1. Airport Runway (East-West along z = 11.42 .. 12.48, top surface at Y = +0.065)
    const runwayDeck = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.065, 1.06),
      voxMat(0x2d2f33, 0.88)
    );
    runwayDeck.position.set(AP_X, 0.0325, AP_Z);
    runwayDeck.receiveShadow = true;
    airportGroup.add(runwayDeck);

    // Runway centerline dashes & threshold piano keys (sitting flush on top of runwayDeck at Y = 0.065..0.079)
    const markMat = voxMat(0xf5f2eb, 0.8);
    for (let i = -5; i <= 5; i++) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.014, 0.055), markMat);
      dash.position.set(AP_X + i * 0.48, 0.072, AP_Z);
      airportGroup.add(dash);
    }
    [-3.05, 3.05].forEach(dx => {
      for (let k = -2; k <= 2; k++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.014, 0.09), markMat);
        bar.position.set(AP_X + dx, 0.072, AP_Z + k * 0.17);
        airportGroup.add(bar);
      }
    });

    // Runway edge lights + Green threshold lights
    const rwyLightMat = voxMat(0xffe082, 0.2, 0.1, 0xffb300, 0.65);
    for (let i = -6; i <= 6; i++) {
      [-0.5, 0.5].forEach(dz => {
        const rl = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.055), rwyLightMat);
        rl.position.set(AP_X + i * 0.48, 0.095, AP_Z + dz);
        airportGroup.add(rl);
      });
    }
    const rwyThreshMat = voxMat(0x69f0ae, 0.2, 0.1, 0x00e676, 0.85);
    [-3.32, 3.32].forEach(dx => {
      for (let k = -2; k <= 2; k++) {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), rwyThreshMat);
        tl.position.set(AP_X + dx, 0.095, AP_Z + k * 0.2);
        airportGroup.add(tl);
      }
    });

    // 2. Two Taxiways (z = 11.24 .. 11.42) & Terminal Apron (z = 10.94 .. 11.24) — butt-jointed with zero XZ overlap!
    const taxiLightMat = voxMat(0x82b1ff, 0.2, 0.1, 0x2979ff, 0.7);
    [-1.65, 0.15].forEach(tx => {
      const taxi = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.06, 0.18),
        voxMat(0x3a3c40, 0.88)
      );
      taxi.position.set(tx, 0.03, 11.33);
      taxi.receiveShadow = true;
      airportGroup.add(taxi);

      [-0.24, 0.24].forEach(dx => {
        const txl = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.045), taxiLightMat);
        txl.position.set(tx + dx, 0.088, 11.33);
        airportGroup.add(txl);
      });
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.3), voxMat(0x484a4f, 0.88));
    apron.position.set(-0.7, 0.03, 11.09);
    apron.receiveShadow = true;
    airportGroup.add(apron);

    // 3. Airport Terminal Building (at x = -1.35, z = 10.68, z range = 10.42 .. 10.94)
    const termBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 0.52),
      voxMat(0xf0e9dc, 0.82)
    );
    termBase.position.set(-1.35, 0.23, 10.68);
    termBase.castShadow = true;
    termBase.receiveShadow = true;
    const termGlassMat = voxMat(0x7cc0de, 0.25, 0.2, 0xffca28, 0.35);
    const termGlass = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.22, 0.55), termGlassMat);
    termGlass.position.set(-1.35, 0.24, 10.68);
    const termRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.76, 0.1, 0.66),
      voxMat(0xd96b27, 0.78)
    );
    termRoof.position.set(-1.35, 0.47, 10.68);
    termRoof.castShadow = true;
    const termUpper = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.15, 0.42),
      voxMat(0xf7f3eb, 0.82)
    );
    termUpper.position.set(-1.35, 0.57, 10.68);
    airportGroup.add(termBase, termGlass, termRoof, termUpper);

    // 4. Air Traffic Control Tower with Spinning Radar & Night Beacon (at x = 0.25, z = 10.72)
    const towerShaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.14, 0.32),
      voxMat(0xf5f0e6, 0.82)
    );
    towerShaft.position.set(0.25, 0.57, 10.72);
    towerShaft.castShadow = true;
    const towerStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.18, 0.34),
      voxMat(0xc43c29, 0.82)
    );
    towerStripe.position.set(0.25, 0.94, 10.72);
    const towerCabMat = voxMat(0x88cde8, 0.2, 0.2, 0xffe082, 0.45);
    const towerCab = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.48), towerCabMat);
    towerCab.position.set(0.25, 1.22, 10.72);
    const towerRoof = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.08, 0.54),
      voxMat(0xc43c29, 0.8)
    );
    towerRoof.position.set(0.25, 1.37, 10.72);
    const radarGroup = new THREE.Group();
    radarGroup.position.set(0.25, 1.46, 10.72);
    const radarDish = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.06),
      voxMat(0xffffff, 0.6)
    );
    const towerBeaconMat = voxMat(0x69f0ae, 0.2, 0.1, 0x00e676, 1.0);
    const towerBeacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      towerBeaconMat
    );
    towerBeacon.position.set(0, 0.09, 0);
    radarGroup.add(radarDish, towerBeacon);
    airportGroup.add(towerShaft, towerStripe, towerCab, towerRoof, radarGroup);
    animCallbacks.push(t => {
      radarGroup.rotation.y = t * 2.8;
    });

    // 5. Windsock at (1.15, 0, 10.82)
    const wsPole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.05), voxMat(0xd6d1c7));
    wsPole.position.set(1.15, 0.26, 10.82);
    const wsCone = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.09), voxMat(0xe05a2b));
    wsCone.position.set(1.28, 0.48, 10.82);
    airportGroup.add(wsPole, wsCone);

    scene.add(airportGroup);

    // 6. Taiwan Coastal & Airport Highway (濱海與機場高速公路 — 100% inside Taiwan & clear of all hexes)
    const baseHighwayCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-7.8, 0.03, 0.2), // West Coast Changhua/Yunlin plain
        new THREE.Vector3(-8.0, 0.03, 3.2), // Chiayi-Tainan coastal plain
        new THREE.Vector3(-6.2, 0.03, 6.4), // Kaohsiung coastal highway
        new THREE.Vector3(-4.4, 0.03, 9.4), // Pingtung Fangliao curve
        new THREE.Vector3(-1.4, 0.03, 10.12), // In front of Airport Terminal drop-off
        new THREE.Vector3(1.5, 0.03, 10.0), // Passing Airport Control Tower
        new THREE.Vector3(3.6, 0.03, 8.2), // South-East Hengchun curve
        new THREE.Vector3(5.4, 0.03, 5.2), // Taitung South-East highway
        new THREE.Vector3(7.0, 0.03, 1.8), // Hualien-Taitung coastal highway
        new THREE.Vector3(8.0, 0.03, -1.6), // Approaching Hualien East Harbor
        new THREE.Vector3(8.7, 0.03, -3.5), // East Harbor Pier terminal
      ],
      false,
      'centripetal',
      0.5
    );
    const clampedHwyPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 70; i++) {
      const p = baseHighwayCurve.getPointAt(i / 70);
      for (const [cx, cz] of islandCenters) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const dist = Math.hypot(dx, dz);
        if (dist < 2.38 && dist > 0.001) {
          p.x = cx + (dx / dist) * 2.38;
          p.z = cz + (dz / dist) * 2.38;
        }
      }
      clampedHwyPts.push(p);
    }
    const highwayCurve = new THREE.CatmullRomCurve3(clampedHwyPts, false, 'centripetal', 0.5);

    const hwyGroup = new THREE.Group();
    const hwySteps = 120;
    const hwyDummy = new THREE.Object3D();
    const hwyAsphaltMat = voxMat(0x3a3c40, 0.88);
    const hwyRailMat = voxMat(0xd4cdc0, 0.85);
    const hwyDashGeo = new THREE.BoxGeometry(0.035, 0.012, 0.11);
    const hwyDashMat = voxMat(0xf5c842, 0.8);

    // Continuous highway asphalt & guardrails (zero overlapping box faces on curves!)
    const hwyDeckMesh = new THREE.Mesh(
      buildCurveStripGeo(highwayCurve, 140, 0.54, 0.05, 0, 0.0, false),
      hwyAsphaltMat
    );
    hwyDeckMesh.receiveShadow = true;
    const hwyRailL = new THREE.Mesh(
      buildCurveStripGeo(highwayCurve, 140, 0.04, 0.068, 0.26, 0.036, false),
      hwyRailMat
    );
    const hwyRailR = new THREE.Mesh(
      buildCurveStripGeo(highwayCurve, 140, 0.04, 0.068, -0.26, 0.036, false),
      hwyRailMat
    );
    hwyGroup.add(hwyDeckMesh, hwyRailL, hwyRailR);

    for (let i = 1; i < hwySteps; i += 2) {
      const u = i / hwySteps;
      const pt = highwayCurve.getPointAt(u);
      const tan = highwayCurve.getTangentAt(u);
      hwyDummy.position.copy(pt);
      hwyDummy.lookAt(pt.clone().add(tan));

      const dash = new THREE.Mesh(hwyDashGeo, hwyDashMat);
      dash.position.set(pt.x, pt.y + 0.031, pt.z);
      dash.rotation.copy(hwyDummy.rotation);
      hwyGroup.add(dash);
    }

    // Taiwan-style Green Overhead Freeway Gantry Sign aligned perpendicular to the highway curve
    const uGantry = 0.36;
    const gPt = highwayCurve.getPointAt(uGantry);
    const gTan = highwayCurve.getTangentAt(uGantry);
    hwyDummy.position.copy(gPt);
    hwyDummy.lookAt(gPt.clone().add(gTan));
    const gRight = new THREE.Vector3(1, 0, 0).applyQuaternion(hwyDummy.quaternion);

    const gantryL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), hwyRailMat);
    gantryL.position.copy(gPt).addScaledVector(gRight, 0.3);
    gantryL.position.y = 0.31;
    gantryL.rotation.copy(hwyDummy.rotation);

    const gantryR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), hwyRailMat);
    gantryR.position.copy(gPt).addScaledVector(gRight, -0.3);
    gantryR.position.y = 0.31;
    gantryR.rotation.copy(hwyDummy.rotation);

    const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.05), hwyRailMat);
    gantryBeam.position.set(gPt.x, 0.58, gPt.z);
    gantryBeam.rotation.copy(hwyDummy.rotation);

    const gantrySign = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.22, 0.08),
      voxMat(0x1f7a4c, 0.75)
    );
    gantrySign.position.set(gPt.x, 0.58, gPt.z);
    gantrySign.rotation.copy(hwyDummy.rotation);
    hwyGroup.add(gantryL, gantryR, gantryBeam, gantrySign);

    scene.add(hwyGroup);

    // 4 Animated Voxel Highway Vehicles (Taxi, Blue Sedan, White SUV, Orange Airport Bus)
    const hwyCars: Array<{ mesh: THREE.Group; dir: 1 | -1; speed: number; offset: number }> = [];
    const carSpecs: Array<[number, number, 1 | -1, number, number]> = [
      [0xf2b705, 0.32, 1, 0.058, 0.0], // Yellow Airport Taxi
      [0x2c6db5, 0.34, -1, 0.05, 0.35], // Blue Sedan
      [0xe05a2b, 0.46, 1, 0.044, 0.55], // Orange Airport Shuttle Bus
      [0xf5efe6, 0.34, -1, 0.055, 0.8], // White SUV
    ];
    carSpecs.forEach(([col, len, dir, spd, off]) => {
      const cg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, len), voxMat(col));
      body.position.y = 0.06;
      body.castShadow = true;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.08, len * 0.62),
        voxMat(0xf7f4ed)
      );
      top.position.y = 0.14;
      // Front headlights (+Z) & rear taillights (-Z)
      const headL = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.035, 0.025),
        carHeadlightMat
      );
      headL.position.set(0, 0.065, len * 0.5 + 0.005);
      const tailL = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.035, 0.025),
        carTaillightMat
      );
      tailL.position.set(0, 0.065, -len * 0.5 - 0.005);
      cg.add(body, top, headL, tailL);
      scene.add(cg);
      hwyCars.push({ mesh: cg, dir, speed: spd, offset: off });
    });

    // =========================================================================
    // SURROUNDING 3D VOXEL PROPS + HUALIEN / SU'AO EAST HARBOR ENTRANCE
    // =========================================================================

    // 1. North-East Cape Voxel Lighthouse Islet (三貂角・基隆嶼燈塔) + Rotating Night Light Beam
    const lhGroup = new THREE.Group();
    const lhRock1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 2.2), voxMat(0x7d776f));
    lhRock1.position.y = -0.1;
    const lhRock2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), voxMat(0x637d56));
    lhRock2.position.y = 0.25;
    lhGroup.add(lhRock1, lhRock2);

    for (let s = 0; s < 5; s++) {
      const w = 0.56 - s * 0.05;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.34, w),
        voxMat(s % 2 === 0 ? 0xf7f2e8 : 0xc43c29)
      );
      seg.position.set(0, 0.58 + s * 0.34, 0);
      seg.castShadow = true;
      lhGroup.add(seg);
    }
    const lhLanternMat = voxMat(0xffe57f, 0.2, 0.1, 0xffc107, 0.95);
    const lhLantern = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.38),
      lhLanternMat
    );
    lhLantern.position.set(0, 2.26, 0);
    const lhRoof = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), voxMat(0x9e2a22));
    lhRoof.position.set(0, 2.46, 0);

    // Dual Rotating Volumetric Searchlight Beams on the Lighthouse
    const lhBeamGroup = new THREE.Group();
    lhBeamGroup.position.set(0, 2.26, 0);
    const lhConeGeo = new THREE.ConeGeometry(0.95, 5.4, 16, 1, true);
    lhConeGeo.translate(0, -2.7, 0);
    lhConeGeo.rotateX(-Math.PI / 2);
    const lhCone1 = new THREE.Mesh(lhConeGeo, lhBeamMat);
    lhCone1.rotation.x = 0.07;
    const lhCone2 = new THREE.Mesh(lhConeGeo, lhBeamMat);
    lhCone2.rotation.y = Math.PI;
    lhCone2.rotation.x = 0.07;
    lhBeamGroup.add(lhCone1, lhCone2);

    lhGroup.add(lhLantern, lhRoof, lhBeamGroup);
    lhGroup.position.set(11.6, 0, -11.2);
    scene.add(lhGroup);

    // 2. East Harbor Pier (花蓮・蘇澳港碼頭 at z = -3.6, top surface at Y = +0.06, cleanly above innerBoard Y = -0.005)
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.26, 1.35), voxMat(0x8c765c));
    pier.position.set(10.8, -0.07, -3.6);
    pier.receiveShadow = true;
    scene.add(pier);

    const bollardL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), voxMat(0x4d3624));
    bollardL.position.set(12.5, 0.28, -4.15);
    const bollardR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), voxMat(0x4d3624));
    bollardR.position.set(12.5, 0.28, -3.05);
    const pierLampL = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.16),
      voxMat(0xffe082, 0.2, 0.1, 0xffb300, 0.95)
    );
    pierLampL.position.set(12.5, 0.56, -4.15);
    const pierLampR = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.16),
      voxMat(0xffe082, 0.2, 0.1, 0xffb300, 0.95)
    );
    pierLampR.position.set(12.5, 0.56, -3.05);
    scene.add(bollardL, bollardR, pierLampL, pierLampR);

    const buoyCoords: Array<[number, number, number]> = [
      [15.0, -4.85, 0xc43c29],
      [15.0, -2.35, 0x2e855a],
      [18.4, -4.95, 0xc43c29],
      [18.4, -2.25, 0x2e855a],
    ];
    buoyCoords.forEach(([bx, bz, col]) => {
      const buoy = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.28), voxMat(col));
      base.position.y = 0.08;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 0.12),
        voxMat(0xffe57f, 0.2, 0.1, 0xffca28, 0.9)
      );
      top.position.y = 0.26;
      buoy.add(base, top);
      buoy.position.set(bx, WATER_Y, bz);
      scene.add(buoy);
    });

    const crane = new THREE.Group();
    const cLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), voxMat(0xe09f2d));
    cLeg1.position.set(-0.2, 0.6, -0.2);
    const cLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), voxMat(0xe09f2d));
    cLeg2.position.set(0.2, 0.6, -0.2);
    const cCab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.55), voxMat(0xe09f2d));
    cCab.position.set(0, 1.25, -0.1);
    const cBoom = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.14), voxMat(0xe09f2d));
    cBoom.position.set(0.45, 1.5, -0.1);
    cBoom.rotation.z = 0.25;
    crane.add(cLeg1, cLeg2, cCab, cBoom);
    crane.position.set(8.4, 0.08, -4.6);
    scene.add(crane);

    const introBoat = createPlayerIntroBoat();
    introBoat.position.set(22.0, WATER_Y + 0.03, -3.6);
    scene.add(introBoat);

    const wakeCubes: THREE.Mesh[] = [];
    const wakeMat = voxMat(0xf5fafc, 0.9, 0);
    for (let i = 0; i < 8; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.16), wakeMat);
      w.position.set(23.0 + i * 0.4, WATER_Y + 0.02, -3.6 + (i % 2 === 0 ? 0.24 : -0.24));
      scene.add(w);
      wakeCubes.push(w);
    }

    const cargoShip = new THREE.Group();
    const csHull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 2.7), voxMat(0x8c2d25));
    csHull.position.y = 0.14;
    const csBridge = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.56, 0.65), voxMat(0xf5efe4));
    csBridge.position.set(0, 0.56, -0.75);
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.36, 0.72), voxMat(0x2c6db5));
    box1.position.set(0, 0.48, 0.15);
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.36, 0.72), voxMat(0xd9822b));
    box2.position.set(0, 0.48, 0.92);
    const box3 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.34, 0.68), voxMat(0x3a855c));
    box3.position.set(0, 0.82, 0.52);
    cargoShip.add(csHull, csBridge, box1, box2, box3);
    cargoShip.position.set(14.8, WATER_Y + 0.04, 0.2);
    scene.add(cargoShip);

    // 3. West Coast Windmill (苗栗/彰化風車) & Coastal Village Cabins inside Taiwan
    const wmGroup = new THREE.Group();
    const wmBody = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.95, 0.66), voxMat(0xf2e9dc));
    wmBody.position.y = 0.47;
    wmBody.castShadow = true;
    const wmRoof = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.24, 0.74), voxMat(0x8c4a32));
    wmRoof.position.y = 1.05;
    const wmRotor = new THREE.Group();
    wmRotor.position.set(0, 0.78, 0.38);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.04), voxMat(0xd9c3a5));
      arm.rotation.z = (i * Math.PI) / 2;
      wmRotor.add(arm);
    }
    wmGroup.add(wmBody, wmRoof, wmRotor);
    wmGroup.position.set(-7.2, 0, -2.0);
    wmGroup.rotation.y = 0.6;
    scene.add(wmGroup);
    animCallbacks.push(t => {
      wmRotor.rotation.z = t * 1.1;
    });

    const placedProps: Array<[number, number, number]> = [
      [-7.2, -2.0, 0.85], // West Windmill
      [8.4, -4.6, 0.95], // Harbor Crane
    ];

    const pushClearOfAll = (x: number, z: number, radius: number): [number, number] => {
      let px = x;
      let pz = z;
      for (let pass = 0; pass < 6; pass++) {
        // 1. Keep strictly outside all 14 hex island bases (roadHex radius = 1.989)
        for (const [cx, cz] of islandCenters) {
          const dx = px - cx;
          const dz = pz - cz;
          const d = Math.hypot(dx, dz);
          const minHexDist = 2.32 + radius;
          if (d < minHexDist && d > 0.001) {
            px = cx + (dx / d) * minHexDist;
            pz = cz + (dz / d) * minHexDist;
          }
        }
        // 2. Keep clear of Airport Highway
        for (let s = 0; s <= 80; s++) {
          const hp = highwayCurve.getPointAt(s / 80);
          const dx = px - hp.x;
          const dz = pz - hp.z;
          const d = Math.hypot(dx, dz);
          const minHwyDist = 0.55 + radius;
          if (d < minHwyDist && d > 0.001) {
            px = hp.x + (dx / d) * minHwyDist;
            pz = hp.z + (dz / d) * minHwyDist;
          }
        }
        // 3. Keep clear of Railway
        for (let s = 0; s <= 100; s++) {
          const rp = railCurve1.getPointAt(s / 100);
          const dx = px - rp.x;
          const dz = pz - rp.z;
          const d = Math.hypot(dx, dz);
          const minRailDist = 0.48 + radius;
          if (d < minRailDist && d > 0.001) {
            px = rp.x + (dx / d) * minRailDist;
            pz = rp.z + (dz / d) * minRailDist;
          }
        }
        // 4. Keep clear of Southern Airport zone (z > 9.5)
        if (pz > 9.5 && Math.abs(px + 0.6) < 4.5) {
          pz = 9.4;
        }
        // 5. Keep clear of all previously placed cabins, trees, windmill & crane
        for (const [ox, oz, orad] of placedProps) {
          const dx = px - ox;
          const dz = pz - oz;
          const d = Math.hypot(dx, dz);
          const minPropDist = orad + radius + 0.35;
          if (d < minPropDist && d > 0.001) {
            px = ox + (dx / d) * minPropDist;
            pz = oz + (dz / d) * minPropDist;
          }
        }
      }
      placedProps.push([px, pz, radius]);
      return [px, pz];
    };

    const cabinSpots: Array<[number, number, number, number, number]> = [
      [-5.6, -4.6, 0.3, 0xf2e9dc, 0xb84635], // Hsinchu/Miaoli plain
      [-3.6, -8.2, 0.4, 0xeae0d0, 0x3b6e8c], // Taoyuan/Tamsui plain
      [1.2, -10.8, -0.1, 0xf2e9dc, 0x9e5a34], // Keelung North plain
      [6.8, -8.6, -0.5, 0xeae0d0, 0xb84635], // Yilan Lanyang plain
      [7.8, -6.2, -0.8, 0xf2e9dc, 0x4c785c], // Su'ao coast
    ];
    cabinSpots.forEach(([cx, cz, rot, wCol, rCol]) => {
      const [px, pz] = pushClearOfAll(cx, cz, 0.52);
      const cab = createVoxelCabin(wCol, rCol, buildingWinMat);
      cab.position.set(px, 0, pz);
      cab.rotation.y = rot;
      scene.add(cab);
    });

    // 4. Taiwan Coastal & Mountain Forest (strictly inside Taiwan contour & clear of all structures!)
    const perimeterTrees: Array<[number, number, number, number]> = [
      [-1.2, -10.5, 0x4e7a49, 1.0],
      [4.2, -10.8, 0x628a56, 0.95],
      [7.2, -9.6, 0xd98a6c, 1.0],
      [8.2, -7.4, 0x4e7a49, 1.05],
      [7.4, -0.4, 0x628a56, 0.95],
      [5.8, 3.6, 0x4e7a49, 1.0],
      [4.0, 7.2, 0xd98a6c, 0.95],
      [-4.6, -6.4, 0x4e7a49, 1.0],
      [-6.2, -3.4, 0x628a56, 0.95],
      [-7.4, -0.4, 0x4e7a49, 0.95],
      [-6.8, 4.4, 0xd98a6c, 0.95],
      [-4.8, 7.8, 0x628a56, 0.95],
    ];
    perimeterTrees.forEach(([tx, tz, col, sc]) => {
      const [px, pz] = pushClearOfAll(tx, tz, 0.42);
      const tr = createVoxelTree(col, sc);
      tr.position.set(px, 0, pz);
      scene.add(tr);
    });

    // 5. Voxel Sailboats & Voxel Whale (in the surrounding Taiwan Strait & Pacific Ocean)
    const sailboats: Array<{ mesh: THREE.Group; baseZ: number; phase: number }> = [];
    const boatConfigs: Array<[number, number, number, number, number]> = [
      [-14.5, -5.2, 0.4, 0xf7f2e8, 0x8c422b],
      [-14.2, 6.4, -0.3, 0xffd275, 0x3b6e8c],
      [14.2, 8.8, 2.2, 0xf7f2e8, 0x9e2a22],
      [-3.5, -17.2, 1.4, 0xf7f2e8, 0x4c785c],
    ];
    boatConfigs.forEach(([bx, bz, rot, sCol, hCol], idx) => {
      const sb = createVoxelSailboat(sCol, hCol);
      sb.position.set(bx, WATER_Y + 0.02, bz);
      sb.rotation.y = rot;
      scene.add(sb);
      sailboats.push({ mesh: sb, baseZ: bz, phase: idx * 1.5 });
    });

    const whale = new THREE.Group();
    const wBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 0.68), voxMat(0x3a6482));
    wBody.position.y = 0.08;
    const wTail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.52), voxMat(0x3a6482));
    wTail.position.set(-0.78, 0.14, 0);
    const spout1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), voxMat(0xe8f4f8));
    spout1.position.set(0.32, 0.42, 0);
    const spout2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.26), voxMat(0xe8f4f8));
    spout2.position.set(0.32, 0.6, 0);
    whale.add(wBody, wTail, spout1, spout2);
    whale.position.set(11.5, WATER_Y, 6.5); // East Coast Hualien-Taitung Whale Watching!
    whale.rotation.y = -0.4;
    scene.add(whale);

    // 6. Floating Voxel Clouds
    const clouds: Array<{ mesh: THREE.Group; baseX: number; speed: number }> = [];
    const cloudSpots: Array<[number, number, number, number]> = [
      [-11.5, 4.8, -8.5, 0.95],
      [9.5, 5.2, -9.2, 1.1],
      [-13.2, 4.5, 3.2, 0.85],
      [13.5, 4.9, 4.8, 1.0],
      [0.5, 5.5, -11.2, 0.9],
    ];
    cloudSpots.forEach(([cx, cy, cz, sc], idx) => {
      const cl = createVoxelCloud(sc);
      cl.position.set(cx, cy, cz);
      scene.add(cl);
      clouds.push({ mesh: cl, baseX: cx, speed: 0.25 + (idx % 3) * 0.1 });
    });

    // =========================================================================
    // 14 CATAN HEX ISLAND PLATEAUS
    // =========================================================================
    const roadMat = voxMat(0x4a423b, 0.9);
    const lampPostMat = voxMat(0x4b4442, 0.6, 0.4);
    const lampBulbMat = voxMat(0xffe4a0, 0.2, 0.1, 0xffb347, 0.2);

    // Pointy-top hexagons (default CylinderGeometry orientation matches odd-r cellToWorld honeycomb!)
    const roadHexGeo = new THREE.CylinderGeometry(S * 0.98, S * 0.99, 0.1, 6, 1);
    const rimHexGeo = new THREE.CylinderGeometry(R * 1.03, R * 1.06, TOP, 6, 1);
    const innerHexGeo = new THREE.CylinderGeometry(R * 0.95, R * 0.95, 0.04, 6, 1);
    const hitHexGeo = new THREE.CylinderGeometry(R * 0.98, R * 0.98, 1.35, 6, 1);
    const hitHexMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const pickables: Array<{ mesh: THREE.Object3D; zoneId: string }> = [];
    const rimMeshes: Record<string, THREE.Mesh> = {};
    const tileGroups: Record<string, THREE.Group> = {};
    const dioramaGroups: Record<string, THREE.Group> = {};
    const zoneAnchors: Record<string, THREE.Vector3> = {};
    const completionFX: Record<
      string,
      {
        flagGroup: THREE.Group;
        bannerSegs: THREE.Mesh[];
        orbMat: THREE.MeshStandardMaterial;
        ringGroup: THREE.Group;
        ringMat: THREE.MeshStandardMaterial;
      }
    > = {};

    islandZones.forEach(zone => {
      const [wx, wz] = getZoneWorldPos(zone.cell);
      zoneAnchors[zone.id] = new THREE.Vector3(wx, TOP + 0.9, wz);

      // Invisible full-column hit volume for reliable raycast selection (kept stationary in scene)
      const hitMesh = new THREE.Mesh(hitHexGeo, hitHexMat);
      hitMesh.position.set(wx, TOP + 0.55, wz);
      scene.add(hitMesh);
      pickables.push({ mesh: hitMesh, zoneId: zone.id });

      const roadHex = new THREE.Mesh(roadHexGeo, roadMat);
      roadHex.position.set(wx, 0.035, wz);
      roadHex.receiveShadow = true;
      scene.add(roadHex);

      // Interactive 3D Hex Tile Group for GSAP Elevation & Wave Assembly
      const tileGroup = new THREE.Group();
      tileGroup.position.set(wx, 0, wz);
      scene.add(tileGroup);
      tileGroups[zone.id] = tileGroup;

      const lampAngle = -0.65;
      const lx = Math.cos(lampAngle) * (R * 0.68);
      const lz = Math.sin(lampAngle) * (R * 0.68);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.04), lampPostMat);
      post.position.set(lx, TOP + 0.18, lz);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), lampBulbMat);
      bulb.position.set(lx, TOP + 0.38, lz);
      tileGroup.add(post, bulb);

      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xe6dccb,
        roughness: 0.82,
        flatShading: true,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zone.side),
        roughness: 0.88,
        flatShading: true,
      });
      const rimMesh = new THREE.Mesh(rimHexGeo, [sideMat, rimMat, sideMat]);
      rimMesh.position.set(0, TOP * 0.5, 0);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      tileGroup.add(rimMesh);
      rimMeshes[zone.id] = rimMesh;
      pickables.push({ mesh: rimMesh, zoneId: zone.id });

      const topMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zone.ground),
        roughness: 0.82,
        flatShading: true,
      });
      const innerHex = new THREE.Mesh(innerHexGeo, topMat);
      innerHex.position.set(0, TOP + 0.015, 0);
      innerHex.receiveShadow = true;
      tileGroup.add(innerHex);
      pickables.push({ mesh: innerHex, zoneId: zone.id });

      // Golden hexagonal beacon border & 3D victory flag for completed islands
      const ringMat = voxMat(0xffd54f, 0.25, 0.4, 0xffab00, 0.9);
      const ringGroup = new THREE.Group();
      ringGroup.position.set(0, TOP + 0.036, 0);
      const edgeRadius = R * 0.96 * (SQRT3 / 2);
      const edgeSideLen = R * 0.88;
      const edgeBarGeo = new THREE.BoxGeometry(edgeSideLen, 0.024, 0.046);
      for (let s = 0; s < 6; s++) {
        const ang = (s * Math.PI) / 3 + Math.PI / 6;
        const bar = new THREE.Mesh(edgeBarGeo, ringMat);
        bar.position.set(Math.cos(ang) * edgeRadius, 0, Math.sin(ang) * edgeRadius);
        bar.rotation.y = -ang + Math.PI / 2;
        ringGroup.add(bar);
      }
      ringGroup.visible = false;
      tileGroup.add(ringGroup);

      const { group: flagGroup, bannerSegs, orbMat } = createCompletionFlag(zone.groupColor);
      flagGroup.position.set(0.45, TOP + 0.032, 0.94);
      flagGroup.scale.setScalar(0.001);
      flagGroup.visible = false;
      tileGroup.add(flagGroup);
      pickables.push({ mesh: flagGroup, zoneId: zone.id });

      completionFX[zone.id] = {
        flagGroup,
        bannerSegs,
        orbMat,
        ringGroup,
        ringMat,
      };

      const diorama = buildIslandMiniature(zone, animCallbacks, buildingWinMat);
      diorama.position.set(0, TOP + 0.035, 0);
      tileGroup.add(diorama);
      dioramaGroups[zone.id] = diorama;
      pickables.push({ mesh: diorama, zoneId: zone.id });
    });

    // 3D Curved Link Arcs
    const linkMeshes: Array<{ id: string; from: string; to: string; mesh: THREE.Mesh }> = [];
    ISLAND_LINKS.forEach(link => {
      const a = zoneAnchors[link.from];
      const b = zoneAnchors[link.to];
      if (!a || !b) return;
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const dist = a.distanceTo(b);
      mid.y = TOP + 1.1 + dist * 0.2;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a.x, TOP + 0.4, a.z),
        mid,
        new THREE.Vector3(b.x, TOP + 0.4, b.z)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.04, 6, false);
      const col =
        link.group === '國旅交通' ? 0x2c6db5 : link.group === '社會安全' ? 0x9e2a22 : 0x2e7d56;
      const tubeMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.visible = false;
      scene.add(mesh);
      linkMeshes.push({ id: link.id, from: link.from, to: link.to, mesh });
    });

    sceneObjectsRef.current = {
      camera,
      controls,
      rimMeshes,
      tileGroups,
      dioramaGroups,
      linkMeshes,
      zoneAnchors,
      introBoat,
    };

    // Trigger GSAP Staggered Hex Wave Assembly on initial load
    triggerBoardWaveIntro(tileGroups, dioramaGroups, 0.45);

    introStateRef.current = {
      active: true,
      startTime: performance.now(),
      approachMs: 3400,
      pullbackMs: 2400,
    };

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let hoveredZoneId: string | null = null;

    const findZoneFromHit = (obj: THREE.Object3D | null): string | null => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const match = pickables.find(p => p.mesh === cur);
        if (match) return match.zoneId;
        cur = cur.parent;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (introStateRef.current.active) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        pickables.map(p => p.mesh),
        true
      );
      const nextHover = hits.length > 0 ? findZoneFromHit(hits[0].object) : null;
      if (nextHover !== hoveredZoneId) {
        const prevHover = hoveredZoneId;
        hoveredZoneId = nextHover;
        const curSel = selectedIdRef.current;

        if (prevHover && prevHover !== curSel && tileGroups[prevHover]) {
          gsap.to(tileGroups[prevHover].position, {
            y: 0,
            duration: 0.32,
            ease: 'power2.out',
            overwrite: 'auto',
          });
          gsap.to(tileGroups[prevHover].scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.32,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
        if (nextHover && nextHover !== curSel && tileGroups[nextHover]) {
          gsap.to(tileGroups[nextHover].position, {
            y: 0.1,
            duration: 0.35,
            ease: 'back.out(2.2)',
            overwrite: 'auto',
          });
          gsap.to(tileGroups[nextHover].scale, {
            x: 1.022,
            y: 1.022,
            z: 1.022,
            duration: 0.35,
            ease: 'back.out(2.2)',
            overwrite: 'auto',
          });
        }
      }
      renderer.domElement.style.cursor = hoveredZoneId ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      if (introStateRef.current.active) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        pickables.map(p => p.mesh),
        true
      );
      if (hits.length > 0) {
        const zId = findZoneFromHit(hits[0].object);
        if (zId) {
          onSelectRef.current(zId);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    let rafId = 0;
    const projVec = new THREE.Vector3();
    const colSelected = new THREE.Color(0xc43c29);
    const colHovered = new THREE.Color(0xd97254);
    const colDone = new THREE.Color(0x2e855a);
    const colDefault = new THREE.Color(0xe6dccb);

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const t = now * 0.001;

      const intro = introStateRef.current;
      let chipAlpha = 1;

      if (intro.active) {
        const elapsed = now - intro.startTime;
        const totalMs = intro.approachMs + intro.pullbackMs;

        if (elapsed <= intro.approachMs) {
          const u = Math.min(1, elapsed / intro.approachMs);
          const easeOut = 1 - Math.pow(1 - u, 2.2);
          const boatX = THREE.MathUtils.lerp(22.0, 13.2, easeOut);
          const boatZ = -3.6;
          const bob = Math.sin(t * 5.2) * 0.032;

          introBoat.position.set(boatX, WATER_Y + 0.03 + bob, boatZ);
          introBoat.rotation.z = Math.sin(t * 3.8) * 0.025;
          introBoat.rotation.x = Math.cos(t * 4.2) * 0.02;

          wakeCubes.forEach((wc, idx) => {
            const trailDist = 0.85 + idx * 0.42 + ((t * 2.5) % 0.42);
            wc.position.set(
              boatX + trailDist,
              WATER_Y + 0.015,
              boatZ + (idx % 2 === 0 ? 0.18 : -0.18) * (1 + idx * 0.15)
            );
            wc.visible = true;
          });

          camera.position.set(boatX + 0.25, WATER_Y + 0.68 + bob * 1.1, boatZ);
          controls.target.set(boatX - 6.0, 0.62 + Math.sin(t * 2.5) * 0.04, boatZ - 0.15);
          chipAlpha = 0;
        } else if (elapsed <= totalMs) {
          introBoat.position.set(13.2, WATER_Y + 0.03 + Math.sin(t * 2) * 0.02, -3.6);
          wakeCubes.forEach(wc => {
            wc.visible = false;
          });

          const u = Math.min(1, (elapsed - intro.approachMs) / intro.pullbackMs);
          const s = u * u * u * (u * (u * 6 - 15) + 10);

          const dockCamPos = new THREE.Vector3(13.45, WATER_Y + 0.68, -3.6);
          const dockTarget = new THREE.Vector3(4.2, 0.62, -3.75);

          camera.position.lerpVectors(dockCamPos, OVERVIEW_POS, s);
          controls.target.lerpVectors(dockTarget, OVERVIEW_TARGET, s);
          chipAlpha = Math.max(0, (u - 0.45) / 0.55);
        } else {
          intro.active = false;
          camera.position.copy(OVERVIEW_POS);
          controls.target.copy(OVERVIEW_TARGET);
          wakeCubes.forEach(wc => {
            wc.visible = false;
          });
          setIntroPlaying(false);
          chipAlpha = 1;
        }
      } else {
        introBoat.position.y = WATER_Y + 0.03 + Math.sin(t * 1.8) * 0.02;
        introBoat.rotation.z = Math.sin(t * 1.3) * 0.015;

        const tween = cameraTweenRef.current;
        if (tween && tween.active) {
          const u = Math.min(1, (now - tween.startTime) / tween.duration);
          const ease = 1 - Math.pow(1 - u, 3);
          camera.position.lerpVectors(tween.startPos, tween.endPos, ease);
          controls.target.lerpVectors(tween.startTarget, tween.endTarget, ease);
          if (u >= 1) tween.active = false;
        } else {
          // Clamp OrbitControls target so panning never drifts into awkward off-map angles
          controls.target.x = THREE.MathUtils.clamp(controls.target.x, -13.5, 11.5);
          controls.target.y = THREE.MathUtils.clamp(controls.target.y, -0.3, 2.2);
          controls.target.z = THREE.MathUtils.clamp(controls.target.z, -11.5, 11.5);
        }
      }

      controls.update();

      // =====================================================================
      // ANIMATE INTER-ISLAND TRAIN & SKY AIRPLANE!
      // =====================================================================
      const speed1 = 0.028;
      const carSpacing1 = 0.0115;
      train1Cars.forEach((car, idx) => {
        const u = (((t * speed1 - idx * carSpacing1) % 1) + 1) % 1;
        const pt = railCurve1.getPointAt(u);
        const tan = railCurve1.getTangentAt(u);
        car.position.set(pt.x, pt.y + 0.04, pt.z);
        car.lookAt(pt.x + tan.x, pt.y + 0.04, pt.z + tan.z);
      });

      // Sky Airplane (Takeoff & Landing on the Southern Airport Runway + Archipelago Flight!)
      const planeU = (t * 0.052) % 1;
      const planePt = flightCurve.getPointAt(planeU);
      const planeTan = flightCurve.getTangentAt(planeU);
      skyPlane.position.copy(planePt);
      skyPlane.lookAt(planePt.x + planeTan.x, planePt.y + planeTan.y, planePt.z + planeTan.z);

      const airborneFactor = THREE.MathUtils.clamp((planePt.y - 0.15) / 1.2, 0, 1);
      skyPlane.rotateZ(-0.26 * airborneFactor);
      planeProp.rotation.z = t * 28;

      contrailPuffs.forEach((puff, idx) => {
        const lagU = (((planeU - (idx + 1) * 0.0085) % 1) + 1) % 1;
        const lagPt = flightCurve.getPointAt(lagU);
        puff.position.copy(lagPt);
        puff.visible = lagPt.y > 0.35;
        puff.rotation.y = t + idx;
      });

      // Highway Cars cruising along the Airport Expressway (two-way traffic)
      hwyCars.forEach(hc => {
        const rawU = (t * hc.speed + hc.offset) % 1;
        const u = hc.dir === 1 ? rawU : 1 - rawU;
        const pt = highwayCurve.getPointAt(u);
        const tan = highwayCurve.getTangentAt(u);
        if (hc.dir === -1) tan.negate();
        const rightVec = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        hc.mesh.position.copy(pt).addScaledVector(rightVec, 0.12);
        hc.mesh.position.y = pt.y + 0.028;
        hc.mesh.lookAt(
          hc.mesh.position.x + tan.x,
          hc.mesh.position.y,
          hc.mesh.position.z + tan.z
        );
      });

      // Atmosphere & Water & Island Miniatures
      const env = sampleTimeStop(timeRef.current);
      skyUniforms.uTop.value.lerp(env.top, 0.08);
      skyUniforms.uHorizon.value.lerp(env.horizon, 0.08);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(env.fog, 0.08);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(env.fog, 0.08);
      }
      sunLight.color.lerp(env.sunColor, 0.08);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, env.sunInt, 0.08);
      const elevRad = THREE.MathUtils.degToRad(env.elev);
      const azimRad = THREE.MathUtils.degToRad(env.azim);
      sunLight.position.set(
        Math.cos(elevRad) * Math.sin(azimRad) * 28,
        Math.sin(elevRad) * 28,
        Math.cos(elevRad) * Math.cos(azimRad) * 28
      );
      hemiLight.color.lerp(env.hemiSky, 0.08);
      hemiLight.groundColor.lerp(env.hemiGround, 0.08);
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, env.hemiInt, 0.08);
      waterMat.color.lerp(env.water, 0.08);
      lampBulbMat.emissiveIntensity = THREE.MathUtils.lerp(
        lampBulbMat.emissiveIntensity,
        env.lamp * 1.5,
        0.08
      );

      // Night & Dusk Ambient Lighting Upgrade (Lighthouse Beam, Airport Runway, Train Headlamp & Building Windows)
      const nightFactor = lampBulbMat.emissiveIntensity / 1.5;
      buildingWinMat.emissiveIntensity = 0.22 + nightFactor * 1.35;
      trainWinMat.emissiveIntensity = 0.45 + nightFactor * 1.15;
      rwyLightMat.emissiveIntensity = 0.35 + nightFactor * 1.65;
      rwyThreshMat.emissiveIntensity = 0.45 + nightFactor * 1.6;
      taxiLightMat.emissiveIntensity = 0.3 + nightFactor * 1.4;
      termGlassMat.emissiveIntensity = 0.2 + nightFactor * 1.15;
      towerCabMat.emissiveIntensity = 0.25 + nightFactor * 1.1;
      carHeadlightMat.emissiveIntensity = 0.25 + nightFactor * 1.5;
      carTaillightMat.emissiveIntensity = 0.25 + nightFactor * 1.35;
      lhLanternMat.emissiveIntensity = 0.65 + nightFactor * 1.35;

      // Rotating Lighthouse Volumetric Light Cone
      lhBeamGroup.rotation.y = t * 0.85;
      lhBeamGroup.visible = nightFactor > 0.04;
      lhBeamMat.opacity = nightFactor * 0.28;

      // Locomotive Forward Headlamp Cone & Airplane Landing Light Cone
      locoBeamMat.opacity = nightFactor * 0.34;
      planeLandingBeamMat.opacity = nightFactor * 0.3;

      // Pulsing Aviation Beacons on Control Tower & Sky Airplane
      const strobePulse = Math.sin(t * 7.5) > 0.25 ? 1.8 : 0.25;
      planeStrobeMat.emissiveIntensity = strobePulse * (0.4 + nightFactor * 0.9);
      towerBeaconMat.emissiveIntensity =
        (0.5 + 0.5 * Math.sin(t * 4.2)) * (0.5 + nightFactor * 1.4);

      cargoShip.position.y = WATER_Y + 0.04 + Math.sin(t * 1.5) * 0.03;
      cargoShip.rotation.z = Math.sin(t * 1.1) * 0.02;

      sailboats.forEach(sb => {
        sb.mesh.position.y = WATER_Y + 0.02 + Math.sin(t * 1.8 + sb.phase) * 0.03;
        sb.mesh.position.z = sb.baseZ + Math.sin(t * 0.6 + sb.phase) * 0.25;
      });

      whale.position.y = WATER_Y + Math.sin(t * 1.4) * 0.05;
      spout2.position.y = 0.58 + Math.sin(t * 3.5) * 0.08;

      clouds.forEach(cl => {
        cl.mesh.position.x = cl.baseX + Math.sin(t * cl.speed) * 1.2;
      });

      animCallbacks.forEach(fn => fn(t));

      const activeId = selectedIdRef.current;
      const completed = completedRef.current;
      islandZones.forEach(z => {
        const rim = rimMeshes[z.id];
        if (!rim || !Array.isArray(rim.material)) return;
        const topRimMat = rim.material[1] as THREE.MeshStandardMaterial;
        const isSel = activeId === z.id;
        const isHov = hoveredZoneId === z.id;
        const isDone = completed.includes(z.id);
        const targetCol = isSel
          ? colSelected
          : isHov
          ? colHovered
          : isDone
          ? colDone
          : colDefault;
        topRimMat.color.lerp(targetCol, 0.18);
        // Enhance hex plateau contour visibility at night while preserving warm/cool contrast
        topRimMat.emissive.setHex(
          isSel ? 0xc43c29 : isHov ? 0xd97254 : isDone ? 0x2e855a : 0x9c8b70
        );
        topRimMat.emissiveIntensity = isSel || isHov ? 0.36 : 0.04 + nightFactor * 0.24;

        // Animate 3D Completion Flag & Golden Hexagonal Beacon Ring
        const fx = completionFX[z.id];
        if (fx) {
          if (isDone) {
            fx.flagGroup.visible = true;
            fx.ringGroup.visible = true;
            const curScale = fx.flagGroup.scale.x;
            const nextScale = THREE.MathUtils.lerp(curScale, 1.0, 0.12);
            fx.flagGroup.scale.setScalar(nextScale);

            // Gentle breeze wave on the 3 flag banner segments
            fx.bannerSegs.forEach((seg, idx) => {
              seg.position.z = Math.sin(t * 4.5 - idx * 0.95 + z.number) * (0.018 * (idx + 1));
            });

            const glowPulse =
              (0.65 + 0.35 * Math.sin(t * 2.8 + z.number)) * (0.75 + nightFactor * 0.85);
            fx.ringMat.emissiveIntensity = glowPulse;
            fx.orbMat.emissiveIntensity = glowPulse * 1.25;
          } else {
            fx.flagGroup.visible = false;
            fx.flagGroup.scale.setScalar(0.001);
            fx.ringGroup.visible = false;
          }
        }
      });

      const showAllLinks = showLinksRef.current;
      linkMeshes.forEach(lm => {
        const isRelated = activeId && (lm.from === activeId || lm.to === activeId);
        const visible = Boolean(showAllLinks || isRelated);
        lm.mesh.visible = visible;
        if (visible) {
          const mat = lm.mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = isRelated ? 0.88 : 0.5;
        }
      });

      renderer.render(scene, camera);

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const curGroupFilter = activeFilterRef.current;
      const curSearch = searchQueryRef.current.trim().toLowerCase();

      // Project all 14 island labels & apply 2D screen-space collision avoidance
      // Prioritize: 1) selectedZoneId, 2) hoveredZoneId, 3) active filter match, 4) closer to camera (smaller ndcZ)
      const projectedChips: Array<{
        id: string;
        chipEl: HTMLButtonElement;
        sx: number;
        sy: number;
        ndcZ: number;
        priority: number;
        alwaysVisible: boolean;
      }> = [];

      islandZones.forEach(z => {
        const chipEl = chipRefs.current[z.id];
        const anchor = zoneAnchors[z.id];
        if (!chipEl || !anchor) return;
        projVec.copy(anchor);
        projVec.y += tileGroups[z.id]?.position.y ?? 0;
        projVec.project(camera);
        if (projVec.z > 1 || chipAlpha <= 0.02) {
          chipEl.style.opacity = '0';
          chipEl.style.pointerEvents = 'none';
          return;
        }
        const sx = (projVec.x * 0.5 + 0.5) * cw;
        const sy = (-projVec.y * 0.5 + 0.5) * ch;
        const isSel = activeId === z.id;
        const isHov = hoveredZoneId === z.id;
        const matchesGroup = curGroupFilter === 'ALL' || z.group === curGroupFilter;
        const matchesQuery =
          !curSearch ||
          z.islandName.toLowerCase().includes(curSearch) ||
          z.researchCase.title.toLowerCase().includes(curSearch);
        const isMatched = matchesGroup && matchesQuery;

        const priority =
          (isSel ? 1000 : 0) +
          (isHov ? 500 : 0) +
          (isMatched ? 100 : 0) -
          projVec.z * 50;

        projectedChips.push({
          id: z.id,
          chipEl,
          sx,
          sy,
          ndcZ: projVec.z,
          priority,
          alwaysVisible: isSel || isHov,
        });
      });

      projectedChips.sort((a, b) => b.priority - a.priority);

      const placedBoxes: Array<{ l: number; r: number; t: number; b: number }> = [];
      // Reserve screen-space rectangles of active HUD controls so 3D island labels never peek behind UI buttons or cards
      const hudSelectors = [
        '.atlas-header',
        '.game-card.open',
        '.tile-strip-wrapper',
        '.board-compass',
        '.tools-dropdown',
      ];
      hudSelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        if (sel !== '.game-card.open' && parseFloat(style.opacity) < 0.1) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const finalLeft =
            sel === '.game-card.open' && rect.right > cw
              ? Math.max(8, cw - 14 - rect.width)
              : rect.left;
          const finalRight =
            sel === '.game-card.open' && rect.right > cw
              ? cw - 14
              : rect.right;
          placedBoxes.push({
            l: finalLeft - 8,
            r: finalRight + 8,
            t: rect.top - 8,
            b: rect.bottom + 8,
          });
        }
      });

      const HALF_W = cw < 520 ? 44 : 52;
      const CHIP_H = cw < 520 ? 30 : 34;

      const overlapsAny = (l: number, r: number, tBox: number, bBox: number) =>
        placedBoxes.some(box => !(r < box.l || l > box.r || bBox < box.t || tBox > box.b));

      projectedChips.forEach(item => {
        let drawX = item.sx;
        let drawY = item.sy;
        let collided = false;

        let l = drawX - HALF_W;
        let r = drawX + HALF_W;
        let tBox = drawY - CHIP_H;
        let bBox = drawY;

        if (!item.alwaysVisible && overlapsAny(l, r, tBox, bBox)) {
          // Try a subtle vertical nudge (-14px or +14px) before hiding
          const nudges = [-14, 14];
          let resolved = false;
          for (const dy of nudges) {
            if (!overlapsAny(l, r, tBox + dy, bBox + dy)) {
              drawY += dy;
              tBox += dy;
              bBox += dy;
              resolved = true;
              break;
            }
          }
          if (!resolved) {
            collided = true;
          }
        }

        if (!collided || item.alwaysVisible) {
          placedBoxes.push({ l, r, t: tBox, b: bBox });
        }

        item.chipEl.style.transform = `translate3d(${drawX.toFixed(1)}px, ${drawY.toFixed(1)}px, 0) translate(-50%, -100%)`;
        item.chipEl.style.zIndex = item.alwaysVisible ? '30' : '12';
        if (collided) {
          item.chipEl.style.opacity = '0';
          item.chipEl.style.pointerEvents = 'none';
        } else {
          item.chipEl.style.opacity = chipAlpha < 1 ? chipAlpha.toFixed(2) : '';
          item.chipEl.style.pointerEvents = chipAlpha < 0.8 ? 'none' : '';
        }
      });
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      controls.removeEventListener('start', onControlStart);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointermove', onPointerMove);
      domElem.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const normQuery = searchQuery.trim().toLowerCase();

  return (
    <div id="stage" ref={containerRef} aria-label="數據群島 3D 互動盤面">
      {introPlaying && (
        <button
          type="button"
          onClick={handleSkipIntro}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            padding: '10px 22px',
            borderRadius: 999,
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            background: 'rgba(30, 25, 22, 0.82)',
            backdropFilter: 'blur(8px)',
            color: '#f6f1e7',
            fontSize: 'clamp(12px, 3.3vw, 14px)',
            fontWeight: 800,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 24px)',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          正在駛入數據群島港口 · 點此略過動畫
        </button>
      )}
      <div className="catan-chips-layer">
        {islandZones.map(zone => {
          const isSelected = selectedZoneId === zone.id;
          const isCompleted = completedCaseIds.includes(zone.id);
          const matchesGroup =
            activeGroupFilter === 'ALL' || zone.group === activeGroupFilter;
          const matchesQuery =
            !normQuery ||
            zone.islandName.toLowerCase().includes(normQuery) ||
            zone.researchCase.title.toLowerCase().includes(normQuery);
          const isDimmed = !matchesGroup || !matchesQuery;

          return (
            <button
              key={zone.id}
              ref={el => {
                chipRefs.current[zone.id] = el;
              }}
              type="button"
              onClick={() => onSelectZone(zone.id)}
              className={`hex-chit ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${
                isDimmed ? 'dim' : ''
              }`}
              style={{ top: 0, left: 0 }}
            >
              <span className="chit-label">{zone.shortName}</span>
              {isCompleted && <span className="chit-verified" title="已完成校準" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
