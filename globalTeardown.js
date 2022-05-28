const { stopDb, deleteTables } = require("jest-dynalite");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = async () => {
  await deleteTables();
  await stopDb();
};