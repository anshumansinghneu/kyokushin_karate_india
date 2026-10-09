import * as THREE from "three";

/*
 * A flat cloth belt swept along a curve. Built by hand (not ExtrudeGeometry) so
 * the UVs run cleanly along the length (u) and across the width (v), which is
 * what the stitching texture needs, and so the ribbon can twist along its run.
 */

export function beltCurve() {
    // Laid like a belt set down on display: a long arc across, a loop back, and
    // the barred tail hanging free towards the viewer.
    return new THREE.CatmullRomCurve3(
        [
            new THREE.Vector3(-2.6, 1.05, -0.8),
            new THREE.Vector3(-1.2, 0.95, 0.1),
            new THREE.Vector3(0.4, 0.75, 0.5),
            new THREE.Vector3(1.55, 0.25, 0.1),
            new THREE.Vector3(1.2, -0.35, -0.5),
            new THREE.Vector3(0.1, -0.45, -0.2),
            new THREE.Vector3(-0.2, -0.95, 0.45),
            new THREE.Vector3(0.35, -1.75, 0.9),
        ],
        false,
        "centripetal",
    );
}

export function buildBelt(curve: THREE.Curve<THREE.Vector3>, segments = 360, width = 0.46, thickness = 0.045, twist = Math.PI * 0.6) {
    const frames = curve.computeFrenetFrames(segments, false);
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const hw = width / 2;
    const ht = thickness / 2;
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    const b = new THREE.Vector3();
    const across = new THREE.Vector3();
    const up = new THREE.Vector3();

    // Four faces of the cross-section: front, back, and the two edges.
    const faces: { a: [number, number]; c: [number, number]; normal: [number, number] }[] = [
        { a: [-hw, ht], c: [hw, ht], normal: [0, 1] },
        { a: [hw, -ht], c: [-hw, -ht], normal: [0, -1] },
        { a: [hw, ht], c: [hw, -ht], normal: [1, 0] },
        { a: [-hw, -ht], c: [-hw, ht], normal: [-1, 0] },
    ];

    faces.forEach((face, f) => {
        const base = positions.length / 3;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            curve.getPointAt(t, p);
            const angle = twist * (t - 0.5);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            // Rotate the cross-section frame around the tangent.
            n.copy(frames.normals[i]);
            b.copy(frames.binormals[i]);
            across.copy(n).multiplyScalar(cos).addScaledVector(b, sin);
            up.copy(b).multiplyScalar(cos).addScaledVector(n, -sin);

            for (const [k, pt] of [face.a, face.c].entries()) {
                positions.push(
                    p.x + across.x * pt[0] + up.x * pt[1],
                    p.y + across.y * pt[0] + up.y * pt[1],
                    p.z + across.z * pt[0] + up.z * pt[1],
                );
                const nx = across.x * face.normal[0] + up.x * face.normal[1];
                const ny = across.y * face.normal[0] + up.y * face.normal[1];
                const nz = across.z * face.normal[0] + up.z * face.normal[1];
                normals.push(nx, ny, nz);
                // Edges get a sliver of v so they do not sample the stitching.
                uvs.push(t, f < 2 ? k : 0.5);
            }
            if (i < segments) {
                const r = base + i * 2;
                indices.push(r, r + 2, r + 1, r + 1, r + 2, r + 3);
            }
        }
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    return g;
}

/**
 * Placement for rank bars near one tail of the belt, in the same twisted frame
 * as the ribbon: local X along the belt, Y across it, Z through it.
 */
export function barTransforms(curve: THREE.Curve<THREE.Vector3>, count: number, start = 0.9, spacing = 0.016, twist = Math.PI * 0.6) {
    const segments = 400;
    const frames = curve.computeFrenetFrames(segments, false);
    const out: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];
    for (let k = 0; k < count; k++) {
        const t = Math.min(0.995, start + k * spacing);
        const i = Math.round(t * segments);
        const angle = twist * (t - 0.5);
        const n = frames.normals[i];
        const b = frames.binormals[i];
        const across = n.clone().multiplyScalar(Math.cos(angle)).addScaledVector(b, Math.sin(angle));
        const up = b.clone().multiplyScalar(Math.cos(angle)).addScaledVector(n, -Math.sin(angle));
        const m = new THREE.Matrix4().makeBasis(frames.tangents[i], across, up);
        out.push({ position: curve.getPointAt(t), quaternion: new THREE.Quaternion().setFromRotationMatrix(m) });
    }
    return out;
}

/** Woven cotton: parallel stitch rows along the length, drawn once into a canvas. */
export function stitchTexture() {
    const w = 2048;
    const h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const rows = 9;
    for (let r = 1; r < rows; r++) {
        const y = (r / rows) * h;
        ctx.strokeStyle = "rgba(0,0,0,0.22)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    // Faint weave grain.
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
        const g = (Math.random() - 0.5) * 18;
        img.data[i] += g;
        img.data[i + 1] += g;
        img.data[i + 2] += g;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(3, 1);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
