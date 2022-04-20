import { GamePriceData } from "./gamePriceData";

export class GamePriceMonitor {
    priceMonitorID: string;
    userID: string;
    collectionID: string;
    gameID: string;
    desiredCondition: string;
    desiredPrice: number;
    gamePriceData?: GamePriceData;

    constructor(priceMonitorID:string, userID:string, collectionID:string, gameID: string, desiredCondition:string, desiredPrice:number, gamePriceData?: GamePriceData) {
        this.priceMonitorID = priceMonitorID,
        this.userID = userID,
        this.collectionID = collectionID,
        this.gameID = gameID,
        this.desiredCondition = desiredCondition,
        this.desiredPrice = desiredPrice,
        this.gamePriceData = gamePriceData
    }
}