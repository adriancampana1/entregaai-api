export type TspSolverInput = {
  waypoints: {
    orderId: number;
    lat: number;
    lng: number;
    timeMax: string;
  }[];
};

export type TspSolverOutput = {
  optimizedRoute: number[];
  optimizedWaypoints: TspSolverInput['waypoints'];
  totalDistance: number;
  totalDuration: string;
};
