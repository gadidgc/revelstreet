export type StopType = 'pickup' | 'delivery';

export type StopStatus =
  | 'pending'
  | 'arrived'
  | 'departed'   // pickup only
  | 'completed'  // delivery only
  | 'failed';    // delivery only

export type Stop = {
  id: string;
  type: StopType;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: StopStatus;
  arrivedAt?: string;
  departedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
};

export type Route = {
  id: string;
  operatorName: string;
  stops: Stop[];
};
