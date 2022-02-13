export class PriceData {
    gameName: string;
    lowestPrice: string;
    averagePrice: string;
    url: string;
    console: string;

    constructor(gameName: string, lowestPrice: string, averagePrice: string, url: string, console: string) {
        this.gameName = gameName,
        this.lowestPrice = lowestPrice,
        this.averagePrice = averagePrice,
        this.url = url,
        this.console
    }
}