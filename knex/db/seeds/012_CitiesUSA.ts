// seeds/004_us_cities.js
exports.seed = async knex => {
  const statesUS = require('../../../seedsUSA/states_us.json');
  const cities   = require('../../../seedsUSA/cities_us.json');  // 29 880 rows

  // list of the 52 UUIDs to delete previous runs quickly
  const stateIds = statesUS.map(s => s.sStateId);

  await knex('Cities').whereIn('sStateId', stateIds).del();

  // chunks of 1 000 keep memory usage low and are plenty fast
  await knex.batchInsert('Cities', cities, 1000);
};
