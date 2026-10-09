import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/*
 * Extruded Kanku built from the same path data as KankuMark.tsx (200x200
 * viewBox, centred on 100,100). Cardinal petals are thick, diagonals thinner,
 * the ring is a true annulus. The centre disc is returned separately so it can
 * carry the one red mark.
 */

// Petals are drawn a little fuller than the flat mark so they hold their form edge-on.
const CARDINAL = [
    "M100 7 C100 7 124 58 100 100 C76 58 100 7 100 7Z",
    "M193 100 C193 100 142 124 100 100 C142 76 193 100 193 100Z",
    "M100 193 C100 193 76 142 100 100 C124 142 100 193 100 193Z",
    "M7 100 C7 100 58 76 100 100 C58 124 7 100 7 100Z",
];
const DIAGONAL = [
    "M167 33 C167 33 130 75 100 100 C110 63 167 33 167 33Z",
    "M167 167 C167 167 125 130 100 100 C137 110 167 167 167 167Z",
    "M33 167 C33 167 70 125 100 100 C90 137 33 167 33 167Z",
    "M33 33 C33 33 75 70 100 100 C63 90 33 33 33 33Z",
];

function shapesFrom(paths: string[]): THREE.Shape[] {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${paths
        .map((d) => `<path d="${d}"/>`)
        .join("")}</svg>`;
    const data = new SVGLoader().parse(svg);
    return data.paths.flatMap((p) => p.toShapes());
}

function ring(outer: number, inner: number): THREE.Shape {
    const s = new THREE.Shape();
    s.absarc(100, 100, outer, 0, Math.PI * 2, false);
    const h = new THREE.Path();
    h.absarc(100, 100, inner, 0, Math.PI * 2, true);
    s.holes.push(h);
    return s;
}

function extrude(shapes: THREE.Shape[], depth: number, bevel: number) {
    const g = new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel * 0.8,
        bevelSegments: 4,
        curveSegments: 48,
    });
    // SVG space -> centred, y-up, unit scale (diameter ~2). Flipping y and z
    // together keeps the winding (and so the normals) facing outwards.
    g.translate(-100, -100, -depth / 2);
    g.scale(0.01, -0.01, -0.01);
    g.computeVertexNormals();
    return g;
}

export interface KankuGeometries {
    body: THREE.BufferGeometry;
    diagonals: THREE.BufferGeometry;
    core: THREE.BufferGeometry;
}

export function buildKanku(): KankuGeometries {
    const body = extrude([...shapesFrom(CARDINAL), ring(95, 88)], 12, 2.4);
    const diagonals = extrude(shapesFrom(DIAGONAL), 6, 1.4);
    const core = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 64);
    core.rotateX(Math.PI / 2);
    return { body, diagonals, core };
}
