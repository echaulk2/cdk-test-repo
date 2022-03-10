export enum DesiredCondition {
  loose = 'used_price',
  completeInBox = 'cib_price',
  new = 'new_price'
}

export enum excludedKeys {
  partitionKey,
  sortKey,
  gamename
}