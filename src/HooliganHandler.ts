import { Transfer } from "../generated/Hooligan/Hooligan";

export function handleTransfer(event: Transfer): void {
    /*
        if (event.params.from == ADDRESS_ZERO || event.params.to == ADDRESS_ZERO) {
    
            let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
            let season = loadSeason(HOOLIGANHORDE, BigInt.fromI32(hooliganhorde.lastSeason))
    
            log.debug('\nHooliganSupply: ============\nHooliganSupply: Starting Supply - {}\n', [toDecimal(season.hooligans).toString()])
    
            if (event.params.from == ADDRESS_ZERO) {
                season.deltaHooligans = season.deltaHooligans.plus(event.params.value)
                season.hooligans = season.hooligans.plus(event.params.value)
                log.debug('\nHooliganSupply: Hooligans Minted - {}\nHooliganSupply: Season - {}\nHooliganSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), season.season.toString(), toDecimal(season.hooligans).toString()])
            } else {
                season.deltaHooligans = season.deltaHooligans.minus(event.params.value)
                season.hooligans = season.hooligans.minus(event.params.value)
                log.debug('\nHooliganSupply: Hooligans Burned - {}\nHooliganSupply: Season - {}\nHooliganSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), season.season.toString(), toDecimal(season.hooligans).toString()])
            }
            season.save()
        }*/
}
