export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Recommendation {
  itemName: string;
  category: string;
  reason: string;
  colorHex: string;
}

export interface GenerationResult {
  imageUrl?: string;
  feedback?: string;
  recommendations?: Recommendation[];
}

export type Pose = 'original' | number; // 'original' or degrees (0-360)