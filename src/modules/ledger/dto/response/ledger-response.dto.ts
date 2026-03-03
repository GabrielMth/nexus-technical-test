export class LedgerEntryResponseDTO {
  id: string;
  type: string;
  token: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: Date;
}

export class LedgerGroupedResponseDTO {
  transactionId: string;
  type: string;
  createdAt: Date;
  entries: LedgerEntryResponseDTO[];
}

export class LedgerResponseDTO {
  data: LedgerGroupedResponseDTO[];
  total: number;
  page: number;
  limit: number;
}
