// seeds/003_us_states.js
exports.seed = async knex => {
  const US_ID = '4ea76b09-621b-4518-814d-62582395d9f1';
const data  = require('../../../seedsUSA/states_us.json');   // 52 rows

  // make sure we don’t duplicate if seeds are re-run
  await knex('States').where({ sCountryId: US_ID }).del();

  await knex.batchInsert('States', data, 100);          // 52 rows → 1 chunk
};
