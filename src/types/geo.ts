export interface GeoJSON {
  type: 'FeatureCollection';
  features: Feature[];
}

export interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    probability?: number;
    intensity?: number;
    [key: string]: any;
  };
} 