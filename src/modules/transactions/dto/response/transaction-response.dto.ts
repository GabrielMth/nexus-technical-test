export class TransactionResponseDTO {
  id: string;
  type: string;
  fromToken?: string;
  toToken?: string;
  amount?: string;
  fee?: string;
  createdAt: Date;
}

export class TransactionsListResponseDTO {
  data: TransactionResponseDTO[];
  total: number;
  page: number;
  limit: number;
}
