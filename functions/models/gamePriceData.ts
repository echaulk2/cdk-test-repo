export class GamePriceData {
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;
    lastChecked?: string;

    constructor(lowestPrice?: string, averagePrice?: string, listedItemTitle?: string, listedItemURL?: string, listedItemConsole?: string, lastChecked?: string) {
        this.lowestPrice = lowestPrice,
        this.averagePrice = averagePrice,
        this.listedItemTitle = listedItemTitle,
        this.listedItemURL = listedItemURL,
        this.listedItemConsole = listedItemConsole,
        this.lastChecked = lastChecked
    }
}