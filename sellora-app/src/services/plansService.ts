/**
 * Pricing plans service — Integration #12
 * GET /api/v1/plans/ — public, no auth
 *
 * Returns the 3 static plans: starter (free), business (KSh 3,499/mo), growth (KSh 7,999/mo)
 * Data comes from PRICING_PLANS constant in apps/payments/constants.py — not a DB table.
 */

import { api } from './api'
import type { PricingPlan } from '@/types'

interface PlanApiObject {
  id: string
  name: string
  monthly_price: number
  annual_price: number
  description: string
  features: string[]
  highlighted: boolean
  cta_text: string
}

interface PlansEnvelope { success: boolean; data: PlanApiObject[] }

function mapPlan(raw: PlanApiObject): PricingPlan {
  return {
    id:           raw.id as PricingPlan['id'],
    name:         raw.name,
    monthlyPrice: raw.monthly_price,
    annualPrice:  raw.annual_price,
    description:  raw.description,
    features:     raw.features,
    highlighted:  raw.highlighted,
    ctaText:      raw.cta_text,
  }
}

export const plansService = {
  /** GET /api/v1/plans/ — returns all 3 plans */
  async getAll(): Promise<PricingPlan[]> {
    const res = await api.get<PlansEnvelope>('/api/v1/plans/', { public: true })
    return res.data.map(mapPlan)
  },
}
