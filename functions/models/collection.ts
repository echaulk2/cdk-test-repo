import { Game } from "./game";

export class Collection {
    userID: string;
    collectionID?: string;
    collectionType?: string;
    

    constructor(userID:string, collectionID?:string, collectionType?:string) {
        this.userID = userID;
        this.collectionID = collectionID;
        this.collectionType = collectionType;
    }
}