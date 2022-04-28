export class GamePriceData {
    gamePriceDataID: string;
    priceMonitorID: string;
    gameName: string;
    desiredPrice: string;
    desiredCondition: string;
    desiredPriceExists: boolean;
    lastChecked: string;
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;

    constructor(gamePriceDataID:string, priceMonitorID:string, gameName:string, desiredPrice:string, desiredCondition:string, desiredPriceExists:boolean, lastChecked:string, lowestPrice?:string, averagePrice?:string, listedItemTitle?:string, listedItemURL?:string, listedItemConsole?:string) {
        this.gamePriceDataID = gamePriceDataID,
        this.priceMonitorID = priceMonitorID,
        this.gameName = gameName,
        this.desiredPrice = desiredPrice,
        this.desiredCondition = desiredCondition,
        this.desiredPriceExists = desiredPriceExists,
        this.lastChecked = lastChecked,
        this.lowestPrice = lowestPrice,
        this.averagePrice = averagePrice,
        this.listedItemTitle = listedItemTitle,
        this.listedItemURL = listedItemURL,
        this.listedItemConsole = listedItemConsole
    }
}