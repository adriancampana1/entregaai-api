import { Prisma } from '@prisma/client';

export const stopRunWithRelationsSelect = {
  id: true,
  status: true,
  horarioConclusao: true,
  corridaId: true,
  ordem: true,
  pedidoId: true,
  pedido: {
    select: {
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
    },
  },
  createdAt: true,
  updatedAt: true,
};

export type StopRun = Prisma.ParadaGetPayload<{
  select: typeof stopRunWithRelationsSelect;
}>;
