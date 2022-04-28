import { Collection } from "./collection";

export class Wishlist extends Collection {
    collectionType: string;

    constructor(userID:string, collectionID:string) {
        super(userID, collectionID);
        this.collectionType = "Wishlist";
    }
}