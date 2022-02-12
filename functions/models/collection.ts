import { Game } from "./game";

export class Collection {
    partitionKey: string;
    collectionType: string;

    constructor(userID:string) {
        this.partitionKey = `[User]#[${userID}]`
    }
}