import { GamePriceData } from "./gamePriceData";

export class GamePriceMonitor {
    id: string;
    collectionID: string;
    userID: string;
    email: string;
    desiredCondition: string;
    desiredPrice: number;
    gamePriceData?: GamePriceData;

    constructor(id:string, collectionID:string, userID:string, email:string, desiredCondition:string, desiredPrice:number, gamePriceData?: GamePriceData) {
        this.id = id,
        this.collectionID = collectionID,
        this.userID = userID,
        this.email = email,
        this.desiredCondition = desiredCondition,
        this.desiredPrice = desiredPrice,
        this.gamePriceData = gamePriceData
    }
}