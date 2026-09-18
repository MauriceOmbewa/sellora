import { api } from './api'

export interface PaymentConfiguration {
  id: string
  provider: 'mpesa'
  method: 'paybill' | 'till'
  paybill_number: string
  paybill_account_reference: string
  till_number: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentConfiguration {
  provider: 'mpesa'
  method: 'paybill' | 'till'
  paybill_number?: string
  paybill_account_reference?: string
  till_number?: string
}

export const paymentService = {
  async getConfiguration(
    businessId: string
  ): Promise<PaymentConfiguration> {
    return api.get<PaymentConfiguration>(
      `/api/v1/payments/configuration/${businessId}/`
    )
  },

  async createConfiguration(
    businessId: string,
    data: CreatePaymentConfiguration
  ): Promise<PaymentConfiguration> {
    return api.post<PaymentConfiguration>(
      `/api/v1/payments/configuration/${businessId}/`,
      data
    )
  },

  async updateConfiguration(
    businessId: string,
    data: Partial<CreatePaymentConfiguration>
  ): Promise<PaymentConfiguration> {
    return api.patch<PaymentConfiguration>(
      `/api/v1/payments/configuration/${businessId}/`,
      data
    )
  },
}