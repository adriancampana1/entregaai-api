import { Prisma } from '@prisma/client';

export const orderWithRelationsSelect = {
  id: true,
  crmPedidoId: true,
  enderecoCompleto: true,
  nomeCliente: true,
  latitude: true,
  longitude: true,
  tempoMaximoEntrega: true,
  statusGeral: true,
  createdAt: true,
  updatedAt: true,
  paradas: {
    select: {
      id: true,
      corridaId: true,
      corrida: {
        select: {
          id: true,
          status: true,
          entregadorId: true,
        },
      },
      horarioConclusao: true,
      status: true,
      ordem: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

export type Order = Prisma.PedidoGetPayload<{
  select: typeof orderWithRelationsSelect;
}>;
