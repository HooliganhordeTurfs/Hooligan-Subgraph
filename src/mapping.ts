import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import {
  UniswapV2Pair,
  Approval,
  Burn,
  Mint,
  Swap,
  Sync,
  Transfer
} from "../generated/HooliganUniswapV2Pair/UniswapV2Pair"
import { Pair, Hooligan, Supply, Price, DayData, HourData, Cross } from "../generated/schema"
import { ADDRESS_ZERO, ZERO_BI, ONE_BI, ZERO_BD, ONE_BD, BI_6, BI_18, convertTokenToDecimal, exponentToBigDecimal } from "./helpers"

let hooliganAddress = Address.fromString('0xdc59ac4fefa32293a95889dc396682858d52e5db')
let hooliganPairAddress = Address.fromString('0x87898263b6c5babe34b4ec53f22d98430b91e371')
let usdcPairAddress = Address.fromString('0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc')

export function handleApproval(event: Approval): void {}

export function handleBurn(event: Burn): void {}

export function handleMint(event: Mint): void {}

export function handleSwap(event: Swap): void {}

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

export function handleTransfer(event: Transfer): void {

  if(event.address.toHexString() != hooliganAddress.toHexString()) return

  if (event.params.from.toHexString() == ADDRESS_ZERO || event.params.to.toHexString() == ADDRESS_ZERO) {
    let hooligan = getHooligan(event.block.timestamp)

    let value = convertTokenToDecimal(event.params.value, BI_6)

    if (event.params.from.toHexString() == ADDRESS_ZERO) hooligan.totalSupply = hooligan.totalSupply.plus(value)
    else if (event.params.to.toHexString() == ADDRESS_ZERO) hooligan.totalSupply = hooligan.totalSupply.minus(value)

    hooligan.totalSupplyUSD = hooligan.totalSupply.times(hooligan.price)

    hooligan.save()

    let supplyId = event.block.timestamp.toString()
    let supply = Supply.load(supplyId)
    if (supply === null) {
      supply = new Supply(supplyId)
      supply.hooligan = hooligan.id
      supply.timestamp = event.block.timestamp
    }
    supply.totalSupply = hooligan.totalSupply
    supply.totalSupplyUSD = hooligan.totalSupplyUSD
    supply.save()

    let timestamp = event.block.timestamp.toI32()

    let dayId = timestamp / 86400
    let dayData = DayData.load(dayId.toString())
    if (dayData === null) dayData = initializeDayData(dayId, hooligan!)
    dayData.totalSupply = hooligan.totalSupply
    dayData.totalSupplyUSD = hooligan.totalSupplyUSD
    dayData.save()

    let hourId = timestamp / 3600
    let hourData = HourData.load(hourId.toString())
    if (hourData === null) hourData = initializeHourData(hourId, hooligan!)
    hourData.totalSupply = hooligan.totalSupply
    hourData.totalSupplyUSD = hooligan.totalSupplyUSD
    hourData.save()
  }
}

function initializePair(address: Address): Pair {
  let pair = new Pair(address.toHex())
  if (address.toHexString() == hooliganPairAddress.toHexString()) {
    pair.decimals0 = BI_18
    pair.decimals1 = BI_6
  } else {
    pair.decimals1 = BI_18
    pair.decimals0 = BI_6
  }
  return pair
}

function getHooligan(timestamp: BigInt) : Hooligan {
  let hooligan = Hooligan.load(hooliganAddress.toHex())
  if (hooligan == null) return initializeHooligan(timestamp)
  return hooligan as Hooligan!
}

function initializeHooligan(timestamp: BigInt) : Hooligan {
  let hooligan = new Hooligan(hooliganAddress.toHex())
  hooligan.decimals = BI_6
  hooligan.lastCross = timestamp
  hooligan.price = ZERO_BD
  hooligan.totalSupply = ZERO_BD
  hooligan.totalSupplyUSD = ZERO_BD
  hooligan.totalCrosses = 0
  hooligan.totalTimeSinceCross = ZERO_BI
  hooligan.startTime = timestamp.toI32()
  return hooligan
}

function getDayData(dayId : i32, hooligan : Hooligan) : DayData {
  let dayData = DayData.load(dayId.toString())
  if (dayData === null) dayData = initializeDayData(dayId, hooligan!)
  return dayData as DayData!
}

function initializeDayData(dayId : i32, hooligan : Hooligan) : DayData {
  let dayStartTimestamp = dayId * 86400
  let dayData = new DayData(dayId.toString())
  dayData.hooligan = hooligan.id
  dayData.dayTimestamp = dayStartTimestamp
  dayData.totalSupply = hooligan.totalSupply
  dayData.totalSupplyUSD = hooligan.totalSupplyUSD
  dayData.price = hooligan.price
  dayData.newCrosses = 0
  dayData.totalCrosses = hooligan.totalCrosses
  dayData.totalTimeSinceCross = hooligan.totalTimeSinceCross
  let previousDayId = dayId - 1
  // let lastDayData = DayData.load(previousDayId.toString())
  // if (lastDayData != null) {
  //   lastDayData = updateDayDataWithCross(hooligan!, lastDayData!, dayStartTimestamp)
  //   dayData.averageTime7Day = lastDayData.averageTime7Day
  //   dayData.averageTime30Day = lastDayData.averageTime30Day
  //   lastDayData.save()
  // } else {
  //   dayData.averageTime7Day = 0
  //   dayData.averageTime30Day = 0

  // }
  return dayData
}

function getHourData(hourId: i32, hooligan: Hooligan) : HourData {
  let hourData = HourData.load(hourId.toString())
  if (hourData === null) hourData = initializeHourData(hourId, hooligan!)
  return hourData as HourData!
}

function initializeHourData(hourId : i32, hooligan : Hooligan) : HourData {
  let hourStartTimestamp = hourId * 3600
  let hourData = new HourData(hourId.toString())
  hourData.hooligan = hooligan.id
  hourData.hourTimestamp = hourStartTimestamp
  hourData.totalSupply = hooligan.totalSupply
  hourData.totalSupplyUSD = hooligan.totalSupplyUSD
  hourData.price = hooligan.price
  hourData.newCrosses = 0
  hourData.totalCrosses = hooligan.totalCrosses
  hourData.totalTimeSinceCross = hooligan.totalTimeSinceCross
  let previousHourId = hourId - 1
  // let lastHourData = HourData.load((previousHourId).toString())
  // if (lastHourData != null) {
  //   lastHourData = updateHourDataWithCross(hooligan!, lastHourData!, hourStartTimestamp)
  //   hourData.averageTime7Day = lastHourData.averageTime7Day
  //   hourData.averageTime30Day = lastHourData.averageTime30Day
  //   lastHourData.save()
  // } else {
  //   hourData.averageTime7Day = 0
  //   hourData.averageTime30Day = 0
  // }

  return hourData
}

function createCross(id: i32, timestamp: i32, lastCross: i32, dayData: string, hourData: string, crossAbove: bool): void {
  let cross = new Cross(id.toString())
  cross.timestamp = timestamp
  cross.timeSinceLastCross = timestamp - lastCross
  cross.above = crossAbove
  cross.dayData = dayData
  cross.hourData = hourData
  cross.save()
}

function updateDayDataWithCross(hooligan: Hooligan, dayData: DayData, timestamp: i32): DayData { 
  let dayId = parseInt(dayData.id)
  let previousDayId = dayId - 7
  let pastDayData = DayData.load((previousDayId).toString())
  if (pastDayData == null) dayData.averageTime7Day = getAverageTime(hooligan.startTime, timestamp, 0, dayData.totalCrosses);
  else dayData.averageTime7Day = getDayAverageTime(pastDayData!, dayData.totalCrosses, timestamp);
  previousDayId = dayId - 30
  pastDayData = DayData.load((previousDayId).toString())
  if (pastDayData == null) dayData.averageTime30Day = getAverageTime(hooligan.startTime, timestamp, 0, dayData.totalCrosses);
  else dayData.averageTime30Day = getDayAverageTime(pastDayData!, dayData.totalCrosses, timestamp);
  return dayData;
}

function updateHourDataWithCross(hooligan: Hooligan, hourData: HourData, timestamp: i32): HourData {
  let hourId = parseInt(hourData.id)
  let previousHourId = hourId - 168
  let pastHourData = HourData.load((previousHourId).toString())
  if (pastHourData == null) hourData.averageTime7Day = getAverageTime(hooligan.startTime, timestamp, 0, hourData.totalCrosses);
  else hourData.averageTime7Day = getHourAverageTime(pastHourData!, hourData.totalCrosses, timestamp);
  
  previousHourId = hourId - 720
  pastHourData = HourData.load((previousHourId).toString())
  if (pastHourData == null) hourData.averageTime30Day = getAverageTime(hooligan.startTime, timestamp, 0, hourData.totalCrosses);
  else hourData.averageTime30Day = getHourAverageTime(pastHourData!, hourData.totalCrosses, timestamp);
  return hourData;
}

function getHourAverageTime(ph: HourData, crosses: i32, timestamp: i32): i32 {
  let prevTimestamp = ph.hourTimestamp + 3600
  return getAverageTime(prevTimestamp, timestamp, ph.totalCrosses, crosses)
}

function getDayAverageTime(ph: DayData, crosses: i32, timestamp: i32): i32 {
  let prevTimestamp = ph.dayTimestamp + 86400
  return getAverageTime(prevTimestamp, timestamp, ph.totalCrosses, crosses)
}

function getAverageTime(pt: i32, nt: i32, pc: i32, nc: i32): i32 {
  if (nc == pc) return 0;
  return (nt - pt) / (nc - pc);
}