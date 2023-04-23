import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Hooligan, HooliganDailySnapshot, HooliganHourlySnapshot, Cross } from "../../generated/schema";
import { HOOLIGAN_ERC20 } from "./Constants";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadHooligan(): Hooligan {
    let hooligan = Hooligan.load(HOOLIGAN_ERC20.toHexString())
    if (hooligan == null) {
        hooligan = new Hooligan(HOOLIGAN_ERC20.toHexString())
        hooligan.decimals = BigInt.fromI32(6)
        hooligan.totalSupply = ZERO_BI
        hooligan.marketCap = ZERO_BD
        hooligan.totalVolume = ZERO_BI
        hooligan.totalVolumeUSD = ZERO_BD
        hooligan.totalLiquidity = ZERO_BI
        hooligan.totalLiquidityUSD = ZERO_BD
        hooligan.price = BigDecimal.fromString('1.072')
        hooligan.totalCrosses = 0
        hooligan.lastCross = ZERO_BI
        hooligan.save()
    }
    return hooligan as Hooligan
}

export function loadHooliganHourlySnapshot(timestamp: BigInt): HooliganHourlySnapshot {
    let hour = hourFromTimestamp(timestamp)
    let snapshot = HooliganHourlySnapshot.load(hour)
    if (snapshot == null) {
        let hooligan = loadHooligan()
        snapshot = new HooliganHourlySnapshot(hour)
        snapshot.hooligan = HOOLIGAN_ERC20.toHexString()
        snapshot.totalSupply = ZERO_BI
        snapshot.marketCap = hooligan.marketCap
        snapshot.totalVolume = hooligan.totalVolume
        snapshot.totalVolumeUSD = hooligan.totalVolumeUSD
        snapshot.totalLiquidity = hooligan.totalLiquidity
        snapshot.totalLiquidityUSD = hooligan.totalLiquidityUSD
        snapshot.price = hooligan.price
        snapshot.totalCrosses = hooligan.totalCrosses
        snapshot.deltaHooligans = ZERO_BI
        snapshot.hourlyVolume = ZERO_BI
        snapshot.hourlyVolumeUSD = ZERO_BD
        snapshot.hourlyLiquidity = ZERO_BI
        snapshot.hourlyLiquidityUSD = ZERO_BD
        snapshot.hourlyCrosses = 0
        snapshot.season = 6074
        snapshot.timestamp = timestamp
        snapshot.blockNumber = ZERO_BI
        snapshot.save()
    }
    return snapshot as HooliganHourlySnapshot
}

export function loadHooliganDailySnapshot(timestamp: BigInt): HooliganDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let snapshot = HooliganDailySnapshot.load(day)
    if (snapshot == null) {
        let hooligan = loadHooligan()
        snapshot = new HooliganDailySnapshot(day)
        snapshot.hooligan = HOOLIGAN_ERC20.toHexString()
        snapshot.totalSupply = ZERO_BI
        snapshot.marketCap = hooligan.marketCap
        snapshot.totalVolume = hooligan.totalVolume
        snapshot.totalVolumeUSD = hooligan.totalVolumeUSD
        snapshot.totalLiquidity = hooligan.totalLiquidity
        snapshot.totalLiquidityUSD = hooligan.totalLiquidityUSD
        snapshot.price = hooligan.price
        snapshot.totalCrosses = hooligan.totalCrosses
        snapshot.deltaHooligans = ZERO_BI
        snapshot.dailyVolume = ZERO_BI
        snapshot.dailyVolumeUSD = ZERO_BD
        snapshot.dailyLiquidity = ZERO_BI
        snapshot.dailyLiquidityUSD = ZERO_BD
        snapshot.dailyCrosses = 0
        snapshot.season = 6074
        snapshot.timestamp = timestamp
        snapshot.blockNumber = ZERO_BI
        snapshot.save()
    }
    return snapshot as HooliganDailySnapshot
}

export function loadCross(id: i32, timestamp: BigInt): Cross {
    let cross = Cross.load(id.toString())
    if (cross == null) {
        let hour = hourFromTimestamp(timestamp)
        let day = dayFromTimestamp(timestamp)
        cross = new Cross(id.toString())
        //cross.pool == '1'
        cross.price = ZERO_BD
        cross.timestamp = timestamp
        cross.timeSinceLastCross = ZERO_BI
        cross.above = false
        cross.hourlySnapshot = hour
        cross.dailySnapshot = day
        //cross.poolHourlySnapshot = '1'
        //cross.poolDailySnapshot = '1'
        cross.save()
    }
    return cross as Cross
}
