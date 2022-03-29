export class GamePriceData {
    id: string;
    gameName: string;
    itemType: string;
    desiredPrice: string;
    desiredCondition: string;
    desiredPriceExists: boolean;
    lastChecked: string;
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;

    constructor(id:string, gameName:string, itemType:string, desiredPrice:string, desiredCondition:string, desiredPriceExists:boolean, lastChecked:string, lowestPrice?:string, averagePrice?:string, listedItemTitle?:string, listedItemURL?:string, listedItemConsole?:string) {
        this.id = id,
        this.gameName = gameName,
        this.itemType = itemType,
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