import { loadHooliganDailySnapshot, loadHooliganHourlySnapshot } from "./utils/EntityLoaders";
import { Sunrise } from '../generated/Hooliganhorde/Hooliganhorde'

export function handleSunrise(event: Sunrise): void {
    // Update the season for hourly and daily liquidity metrics
    let hourly = loadHooliganHourlySnapshot(event.block.timestamp)
    let daily = loadHooliganDailySnapshot(event.block.timestamp)

    hourly.season = event.params.season.toI32()
    hourly.timestamp = event.block.timestamp
    hourly.blockNumber = event.block.number
    hourly.save()

    daily.season = event.params.season.toI32()
    daily.timestamp = event.block.timestamp
    daily.blockNumber = event.block.number
    daily.save()
}
