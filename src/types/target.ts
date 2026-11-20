export interface TargetRing {
  id: string;
  score: number;
  color: string;
}

export interface TargetConfig {
  schemaVersion: 1;
  name: string;
  rings: TargetRing[];
  box: { halfWidth: number; halfHeight: number };
}

export interface TargetPoint {
  x: number;
  y: number;
}
