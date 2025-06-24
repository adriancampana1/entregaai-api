import { Prisma } from '@prisma/client';
import { stopRunWithRelationsSelect } from './stop';

export const runWithRelationsSelect = {
  id: true,
  status: true,
  entregadorId: true,
  createdAt: true,
  updatedAt: true,
  entregador: {
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
      status: true,
    },
  },
  paradas: {
    select: stopRunWithRelationsSelect,
  },
};

export type Run = Prisma.CorridaGetPayload<{
  select: typeof runWithRelationsSelect;
}>;

export interface RunWithRouteDetails {
  run: Run;
  routeDetails: {
    totalDistance: number;
    totalDuration: string;
    optimizedSequence: number[];
  };
}
