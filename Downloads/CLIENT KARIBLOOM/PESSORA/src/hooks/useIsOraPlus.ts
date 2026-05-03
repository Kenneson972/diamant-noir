import { useAuth } from '../contexts/AuthContext'
import { oraMemberUnitPrice } from '../lib/oraPricing'

export function useIsOraPlus() {
  const { subscription } = useAuth()
  const isOraPlus = subscription?.plan === 'ora_plus' && subscription?.status === 'active'

  function effectiveUnitPrice(publicPrice: number): number {
    return isOraPlus ? oraMemberUnitPrice(publicPrice) : publicPrice
  }

  return { isOraPlus, effectiveUnitPrice }
}
