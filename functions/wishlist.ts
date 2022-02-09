import { Collection } from "./collection";

export class Wishlist extends Collection {
    partitionKey: string;
    collectionType: string;

    constructor(userID:string) {
        super(userID);
        this.collectionType = "Wishlist";
    }
}