export class RunningPriceData {
    gameName: string;
    lowestRunningPrice: string;
    url: string;
    console: string;

    constructor(gameName: string, lowestRunningPrice: string, url: string, console: string) {
        this.gameName = gameName,
        this.lowestRunningPrice = lowestRunningPrice,
        this.url = url,
        this.console
    }
}