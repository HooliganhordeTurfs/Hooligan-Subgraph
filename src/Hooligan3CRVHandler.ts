import { BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { AddLiquidity, RemoveLiquidity, RemoveLiquidityImbalance, RemoveLiquidityOne, TokenExchange, TokenExchangeUnderlying } from "../generated/Hooligan3CRV/Hooligan3CRV";
import { CurvePrice } from "../generated/Hooligan3CRV/CurvePrice";
import { CURVE_PRICE } from "./utils/Constants";
import { ONE_BD, toDecimal, ZERO_BD, ZERO_BI } from "./utils/Decimals";
import { loadHooligan, loadHooliganDailySnapshot, loadHooliganHourlySnapshot, loadCross } from "./utils/EntityLoaders";

export function handleTokenExchange(event: TokenExchange): void {
    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let hooligan = loadHooligan()
    let hooliganHourly = loadHooliganHourlySnapshot(event.block.timestamp)
    let hooliganDaily = loadHooliganDailySnapshot(event.block.timestamp)

    let oldPrice = hooligan.price
    let newPrice = toDecimal(curve.value.price)
    let hooliganVolume = ZERO_BI

    if (event.params.sold_id == ZERO_BI) {
        hooliganVolume = event.params.tokens_sold
    } else if (event.params.bought_id == ZERO_BI) {
        hooliganVolume = event.params.tokens_bought
    }
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(hooligan.totalLiquidityUSD)

    hooligan.totalVolume = hooligan.totalVolume.plus(hooliganVolume)
    hooligan.totalVolumeUSD = hooligan.totalVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    //hooligan.totalLiquidity = curve.value.lpBdv
    hooligan.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    hooligan.price = toDecimal(curve.value.price)
    hooligan.save()

    hooliganHourly.totalVolume = hooligan.totalVolume
    hooliganHourly.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganHourly.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganHourly.price = hooligan.price
    hooliganHourly.hourlyVolume = hooliganHourly.hourlyVolume.plus(hooliganVolume)
    hooliganHourly.hourlyVolumeUSD = hooliganHourly.hourlyVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    hooliganHourly.hourlyLiquidityUSD = hooliganHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganHourly.save()

    hooliganDaily.totalVolume = hooligan.totalVolume
    hooliganDaily.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganDaily.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganDaily.price = hooligan.price
    hooliganDaily.dailyVolume = hooliganDaily.dailyVolume.plus(hooliganVolume)
    hooliganDaily.dailyVolumeUSD = hooliganDaily.dailyVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    hooliganDaily.dailyLiquidityUSD = hooliganDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(hooligan.lastCross)
        cross.above = false
        cross.save()

        hooligan.lastCross = event.block.timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(hooligan.lastCross)
        cross.above = true
        cross.save()

        hooligan.lastCross = event.block.timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {

    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let hooligan = loadHooligan()
    let hooliganHourly = loadHooliganHourlySnapshot(event.block.timestamp)
    let hooliganDaily = loadHooliganDailySnapshot(event.block.timestamp)

    let oldPrice = hooligan.price
    let newPrice = toDecimal(curve.value.price)
    let hooliganVolume = ZERO_BI

    if (event.params.sold_id == ZERO_BI) {
        hooliganVolume = event.params.tokens_sold
    } else if (event.params.bought_id == ZERO_BI) {
        hooliganVolume = event.params.tokens_bought
    }
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(hooligan.totalLiquidityUSD)

    hooligan.totalVolume = hooligan.totalVolume.plus(hooliganVolume)
    hooligan.totalVolumeUSD = hooligan.totalVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    //hooligan.totalLiquidity = curve.value.lpBdv
    hooligan.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    hooligan.price = toDecimal(curve.value.price)
    hooligan.save()

    hooliganHourly.totalVolume = hooligan.totalVolume
    hooliganHourly.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganHourly.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganHourly.price = hooligan.price
    hooliganHourly.hourlyVolume = hooliganHourly.hourlyVolume.plus(hooliganVolume)
    hooliganHourly.hourlyVolumeUSD = hooliganHourly.hourlyVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    hooliganHourly.hourlyLiquidityUSD = hooliganHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganHourly.save()

    hooliganDaily.totalVolume = hooligan.totalVolume
    hooliganDaily.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganDaily.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganDaily.price = hooligan.price
    hooliganDaily.dailyVolume = hooliganDaily.dailyVolume.plus(hooliganVolume)
    hooliganDaily.dailyVolumeUSD = hooliganDaily.dailyVolumeUSD.plus(toDecimal(hooliganVolume).times(newPrice))
    hooliganDaily.dailyLiquidityUSD = hooliganDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(hooligan.lastCross)
        cross.above = false
        cross.save()

        hooligan.lastCross = event.block.timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(hooligan.lastCross)
        cross.above = true
        cross.save()

        hooligan.lastCross = event.block.timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }
}

export function handleAddLiquidity(event: AddLiquidity): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amount, ZERO_BI)
}

function handleLiquidityChange(timestamp: BigInt, token0Amount: BigInt, token1Amount: BigInt): void {
    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let hooligan = loadHooligan()
    let hooliganHourly = loadHooliganHourlySnapshot(timestamp)
    let hooliganDaily = loadHooliganDailySnapshot(timestamp)

    let oldPrice = hooligan.price
    let newPrice = toDecimal(curve.value.price)
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(hooligan.totalLiquidityUSD)

    let volumeUSD = deltaLiquidityUSD < ZERO_BD ? deltaLiquidityUSD.div(BigDecimal.fromString('2')).times(BigDecimal.fromString('-1')) : deltaLiquidityUSD.div(BigDecimal.fromString('2'))
    let hooliganVolume = BigInt.fromString(volumeUSD.div(newPrice).times(BigDecimal.fromString('1000000')).truncate(0).toString())

    if (token0Amount !== ZERO_BI && token1Amount !== ZERO_BI) {
        volumeUSD = ZERO_BD
        hooliganVolume = ZERO_BI
    }
    hooligan.totalVolume = hooligan.totalVolume.plus(hooliganVolume)
    hooligan.totalVolumeUSD = hooligan.totalVolumeUSD.plus(volumeUSD)
    hooligan.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    hooligan.price = toDecimal(curve.value.price)
    hooligan.save()

    hooliganHourly.totalVolume = hooligan.totalVolume
    hooliganHourly.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganHourly.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganHourly.price = hooligan.price
    hooliganHourly.hourlyLiquidityUSD = hooliganHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganHourly.hourlyVolume = hooliganHourly.hourlyVolume.plus(hooliganVolume)
    hooliganHourly.hourlyVolumeUSD = hooliganHourly.hourlyVolumeUSD.plus(volumeUSD)
    hooliganHourly.save()

    hooliganHourly.totalVolume = hooligan.totalVolume
    hooliganHourly.totalVolumeUSD = hooligan.totalVolumeUSD
    hooliganDaily.totalLiquidityUSD = hooligan.totalLiquidityUSD
    hooliganDaily.price = hooligan.price
    hooliganDaily.dailyLiquidityUSD = hooliganDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    hooliganDaily.dailyVolume = hooliganDaily.dailyVolume.plus(hooliganVolume)
    hooliganDaily.dailyVolumeUSD = hooliganDaily.dailyVolumeUSD.plus(volumeUSD)
    hooliganDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = timestamp.minus(hooligan.lastCross)
        cross.above = false
        cross.save()

        hooligan.lastCross = timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(hooligan.totalCrosses + 1, timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = timestamp.minus(hooligan.lastCross)
        cross.above = true
        cross.save()

        hooligan.lastCross = timestamp
        hooligan.totalCrosses += 1
        hooligan.save()

        hooliganHourly.totalCrosses += 1
        hooliganHourly.hourlyCrosses += 1
        hooliganHourly.save()

        hooliganDaily.totalCrosses += 1
        hooliganDaily.dailyCrosses += 1
        hooliganDaily.save()
    }
}
