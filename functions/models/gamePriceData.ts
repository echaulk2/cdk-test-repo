export class GamePriceData {
    partitionKey: string;
    sortKey: string;
    itemType: string;
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;
    lastChecked?: string;

    constructor(partitionKey:string, sortKey:string, itemType:string, lowestPrice?: string, averagePrice?: string, listedItemTitle?: string, listedItemURL?: string, listedItemConsole?: string, lastChecked?: string) {
        this.partitionKey = partitionKey,
        this.sortKey = sortKey,
        this.itemType = itemType
        this.lowestPrice = lowestPrice,
        this.averagePrice = averagePrice,
        this.listedItemTitle = listedItemTitle,
        this.listedItemURL = listedItemURL,
        this.listedItemConsole = listedItemConsole,
        this.lastChecked = lastChecked
    }
}