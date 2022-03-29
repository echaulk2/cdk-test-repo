import { GamePriceMonitor } from "../../models/gamePriceMonitor";
import * as Interfaces from "../interfaces/interfaces";
import * as Enums from "../enums/enums";
import { GamePriceMonitorError } from "../../error/gamePriceMonitorErrorHandler";

export function deserializeGamePriceMonitorData(data: Interfaces.IDynamoGamePriceMonitor) : GamePriceMonitor {
    return new GamePriceMonitor(data.partitionKey, data.collectionID, data.userID, data.email, data.desiredCondition, data.desiredPrice);
}

export function serializeGamePriceMonitorData(userData: Interfaces.IUserData, data: Interfaces.IJSONGamePriceMonitor) : GamePriceMonitor {
  return new GamePriceMonitor(data.id, data.collectionID, userData.userID, userData.email, data.desiredCondition, data.desiredPrice);
}