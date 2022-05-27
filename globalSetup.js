const { startDb, createTables, setup } = require("jest-dynalite");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = async () => {
  setup(__dirname);
  await startDb();
  await createTables();
};