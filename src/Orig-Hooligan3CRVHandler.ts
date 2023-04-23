import { TokenExchangeUnderlying } from '../generated/Hooligan3CRV/Hooligan3CRV'
import { CurvePrice } from '../generated/Hooligan3CRV/CurvePrice'
import { CURVE_PRICE } from './utils/Constants'
import { toDecimal, ZERO_BI } from './utils/Decimals'
import { loadHooligan, loadHooliganDayData, loadHooliganHourData, loadPool, loadPoolDayData, loadPoolHourData } from './utils/Orig-EntityLoaders'

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
    let curvePrice = CurvePrice.bind(CURVE_PRICE)

    let price = curvePrice.try_getCurve()

    let hooligan = loadHooligan()
    let hooliganHourly = loadHooliganHourData(event.block.timestamp)
    let hooliganDaily = loadHooliganDayData(event.block.timestamp)

    let hooliganVolume = event.params.sold_id == ZERO_BI ? toDecimal(event.params.tokens_sold) : toDecimal(event.params.tokens_bought)

    hooligan.price = toDecimal(price.price)
    hooligan.totalVolume = hooligan.totalVolume.plus(hooliganVolume)
    hooligan.totalVolumeUSD = hooligan.totalVolumeUSD.plus(hooliganVolume.times(toDecimal(price.price)))
    hooligan.save()

    hooliganHourly.price = toDecimal(price.price)
    hooliganHourly.totalVolume = hooliganHourly.totalVolume.plus(hooliganVolume)
    hooliganHourly.totalVolumeUSD = hooliganHourly.totalVolumeUSD.plus(hooliganVolume.times(toDecimal(price.price)))
    hooliganHourly.totalLiquidity = toDecimal(price.lpBdv)
    hooliganHourly.totalLiquidityUSD = toDecimal(price.lpUsd)
    hooliganHourly.save()

    hooliganDaily.price = toDecimal(price.price)
    hooliganDaily.totalVolume = hooliganDaily.totalVolume.plus(hooliganVolume)
    hooliganDaily.totalVolumeUSD = hooliganDaily.totalVolumeUSD.plus(hooliganVolume.times(toDecimal(price.price)))
    hooliganDaily.save()

    let pool = loadPool(event.address)
    let poolHourly = loadPoolHourData(event.block.timestamp, event.address)
    let poolDaily = loadPoolDayData(event.block.timestamp, event.address)


}


/*

export function handleSync(event: Sync): void {
    let pair = Pair.load(event.address.toHex())
    if (pair == null) pair = initializePair(event.address)

    pair.reserve0 = convertTokenToDecimal(event.params.reserve0, pair.decimals0)
    pair.reserve1 = convertTokenToDecimal(event.params.reserve1, pair.decimals1)

    pair.save()

    let hooliganPair = Pair.load(hooliganPairAddress.toHex())
    let usdcPair = Pair.load(usdcPairAddress.toHex())

    let hooligan = getHooligan(event.block.timestamp)
    if (hooligan.lastCross == ZERO_BI) hooligan.lastCross = event.block.timestamp

    if (hooliganPair != null && usdcPair != null) {

        let timestamp = event.block.timestamp.toI32()
        let dayId = timestamp / 86400
        let dayData = getDayData(dayId, hooligan!)

        let hourId = timestamp / 3600
        let hourData = getHourData(hourId, hooligan!)

        let price = hooliganPair.reserve0 / hooliganPair.reserve1 * usdcPair.reserve0 / usdcPair.reserve1
        if ((hooligan.price.le(ONE_BD) && price.ge(ONE_BD)) ||
            (hooligan.price.ge(ONE_BD) && price.le(ONE_BD))) {

            let timestamp = event.block.timestamp.toI32()

            createCross(hooligan.totalCrosses, timestamp, hooligan.lastCross.toI32(), dayData.id, hourData.id, price.ge(ONE_BD))
            // dayData = updateDayDataWithCross(hooligan!, dayData, timestamp)
            // hourData = updateHourDataWithCross(hooligan!, hourData!, timestamp)

            hourData.newCrosses = hourData.newCrosses + 1
            hourData.totalCrosses = hourData.totalCrosses + 1

            dayData.newCrosses = dayData.newCrosses + 1
            dayData.totalCrosses = dayData.totalCrosses + 1

            hooligan.totalCrosses = hooligan.totalCrosses + 1

            let timeSinceLastCross = event.block.timestamp.minus(hooligan.lastCross)
            hourData.totalTimeSinceCross = hourData.totalTimeSinceCross.plus(timeSinceLastCross)
            dayData.totalTimeSinceCross = hourData.totalTimeSinceCross.plus(timeSinceLastCross)
            hooligan.totalTimeSinceCross = hooligan.totalTimeSinceCross.plus(timeSinceLastCross)

            hooligan.lastCross = event.block.timestamp
        }
        hooligan.price = price
        hooligan.save()

        let priceId = event.block.timestamp.toString()
        let timestampPrice = Price.load(priceId)
        if (timestampPrice === null) {
            timestampPrice = new Price(priceId)
            timestampPrice.hooligan = hooligan.id
            timestampPrice.timestamp = event.block.timestamp
            timestampPrice.price = hooligan.price
        }
        timestampPrice.save()

        dayData.price = hooligan.price
        dayData.save()

        hourData.price = hooligan.price
        hourData.save()
    }

}
*/
