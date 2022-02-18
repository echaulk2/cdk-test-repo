export enum DesiredCondition {
  loose = 'used_price',
  cib = 'cib_price',
  new = 'new_price'
}

export enum excludedKeys {
  partitionKey,
  gamename,
  sortKey,
  gamePriceData
}