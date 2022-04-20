import { User } from "../../models/user";
import * as Interfaces from "../interfaces/interfaces";

export function serializeNewUserData(userData: Interfaces.IUserData) : User {
    return new User(userData.userID, userData.email);
}

export function deserializeUserData(data: Interfaces.IDynamoUser) : User {
    return new User(data.userID, data.email);
}