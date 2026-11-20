import {
  BufferGeometry, CylinderGeometry, DataTexture, DoubleSide,
  ExtrudeGeometry, Float32BufferAttribute, Group, LatheGeometry,
  LinearFilter, LineBasicMaterial, LineSegments, Mesh,
  MeshStandardMaterial, RepeatWrapping, Shape, SRGBColorSpace,
  TorusGeometry, Vector2, type Texture, type Material,
} from "three";

function createBambooTexture() {
  const width = 128;
  const height = 512;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grain = Math.sin(x * 12.7 + Math.sin(y * 0.018) * 0.6);
      const fibers = Math.pow(Math.abs(Math.sin(x * 3.71)), 12);
      const variation = grain * 7 - fibers * 22 + Math.sin(y * 0.04) * 3;
      const offset = (y * width + x) * 4;
      data[offset] = 190 + variation;
      data[offset + 1] = 139 + variation;
      data[offset + 2] = 66 + variation * 0.6;
      data[offset + 3] = 255;
    }
  }

  const texture = new DataTexture(data, width, height);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createFeather(color: string) {
  const feather = new Group();
  const shape = new Shape();
  shape.moveTo(0.048, 0);
  shape.bezierCurveTo(0.2, 0.02, 0.36, 0.12, 0.35, 0.3);
  shape.bezierCurveTo(0.34, 0.67, 0.18, 1.12, 0.048, 1.3);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.009,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -0.0045);
  feather.add(new Mesh(geometry, new MeshStandardMaterial({
    color, roughness: 0.91, side: DoubleSide,
  })));

  const barbs: number[] = [];
  for (let i = 1; i < 44; i++) {
    const y = i * 0.026;
    const width = y < 0.3
      ? 0.12 + y * 0.7
      : 0.35 * (1 - Math.pow((y - 0.3) / 1.03, 1.15));

    for (const z of [-0.008, 0.008]) {
      barbs.push(0.052, y, z, Math.max(0.055, width), y + 0.105, z);
    }
  }

  const barbGeometry = new BufferGeometry();
  barbGeometry.setAttribute("position", new Float32BufferAttribute(barbs, 3));
  feather.add(new LineSegments(barbGeometry, new LineBasicMaterial({
    color: "#61432a", transparent: true, opacity: 0.38,
  })));
  feather.position.y = 0.43;
  return feather;
}

function addBinding(arrow: Group, y: number, turns: number) {
  const thread = new MeshStandardMaterial({
    color: "#503322", roughness: 0.95,
  });
  const geometry = new TorusGeometry(0.052, 0.004, 5, 24);

  for (let i = 0; i < turns; i++) {
    const loop = new Mesh(geometry, thread);
    loop.rotation.x = Math.PI / 2;
    loop.position.y = y + i * 0.009;
    arrow.add(loop);
  }
}

/** The tip is the origin; the shaft extends along negative Y. */
export function createPetungArrow() {
  const arrow = new Group();
  arrow.name = "petung-arrow";

  const bamboo = new MeshStandardMaterial({
    map: createBambooTexture(), roughness: 0.53, metalness: 0,
  });
  const shaft = new Mesh(new CylinderGeometry(0.042, 0.05, 7.6, 24), bamboo);
  shaft.name = "bamboo-shaft";
  shaft.position.y = 3.98;
  arrow.add(shaft);

  const nodeMaterial = new MeshStandardMaterial({
    color: "#9b713c", roughness: 0.68,
  });
  for (const y of [2.1, 4.55, 6.7]) {
    const radius = 0.05 - ((y - 0.18) / 7.6) * 0.008;
    const node = new Mesh(
      new TorusGeometry(radius, 0.0028, 6, 24), nodeMaterial,
    );
    node.rotation.x = Math.PI / 2;
    node.position.y = y;
    arrow.add(node);
  }

  const steel = new MeshStandardMaterial({
    color: "#aeb9bd", metalness: 0.88, roughness: 0.27,
  });
  const profile = [
    [0, 7.69], [0.05, 7.69], [0.057, 7.72], [0.057, 7.91],
    [0.065, 7.94], [0.065, 8.02], [0.048, 8.13], [0, 8.4],
  ].map(([x, y]) => new Vector2(x, y));
  const point = new Mesh(new LatheGeometry(profile, 24), steel);
  point.name = "steel-point";
  arrow.add(point);

  for (let i = 0; i < 3; i++) {
    const feather = createFeather(i === 0 ? "#eee0bc" : "#a57246");
    feather.name = `feather-${i + 1}`;
    feather.rotation.y = i * Math.PI * 2 / 3;
    arrow.add(feather);
  }

  const nockShape = new Shape();
  nockShape.moveTo(-0.047, 0.2);
  nockShape.lineTo(-0.047, 0);
  nockShape.lineTo(-0.019, 0);
  nockShape.lineTo(-0.019, 0.11);
  nockShape.quadraticCurveTo(0, 0.14, 0.019, 0.11);
  nockShape.lineTo(0.019, 0);
  nockShape.lineTo(0.047, 0);
  nockShape.lineTo(0.047, 0.2);
  nockShape.closePath();
  const nockGeometry = new ExtrudeGeometry(nockShape, {
    depth: 0.07, bevelEnabled: true, bevelSize: 0.004,
    bevelThickness: 0.004, bevelSegments: 2, steps: 1,
  });
  nockGeometry.translate(0, 0, -0.035);
  const nock = new Mesh(nockGeometry, new MeshStandardMaterial({
    color: "#dcc49a", roughness: 0.48,
  }));
  nock.name = "slotted-nock";
  arrow.add(nock);

  addBinding(arrow, 0.23, 14);
  addBinding(arrow, 1.72, 10);
  addBinding(arrow, 7.55, 12);

  for (const part of arrow.children) part.position.y -= 8.4;
  return arrow;
}

export function disposePetungArrow(arrow: Group) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  arrow.traverse((part) => {
    if (!(part instanceof Mesh || part instanceof LineSegments)) return;

    geometries.add(part.geometry);
    const entries = Array.isArray(part.material) ? part.material : [part.material];
    for (const material of entries) {
      materials.add(material);
      if (material instanceof MeshStandardMaterial && material.map) {
        textures.add(material.map);
      }
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
