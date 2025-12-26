export interface BarcodeResult {
  success: boolean;
  barcodeId?: string;
  error?: string;
}

export interface BarcodeState {
  barcodeId: string | null;
  isLoading: boolean;
  error: string | null;
  timeUntilRefresh: number;
}

export interface BarcodeDisplayProps {
  value: string;
  height?: number;
  isLoading?: boolean;
}
