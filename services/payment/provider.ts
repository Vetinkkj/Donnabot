export type ChargeParams = {
  orderId: string;
  amount: number;
  description: string;
};

export type Charge = {
  externalId: string;
  /** Data URL (base64) de uma imagem PNG do QR Code. */
  qrCode: string;
  copyPasteCode: string;
  amount: number;
};

export interface PaymentProvider {
  createCharge(params: ChargeParams): Promise<Charge>;
}
