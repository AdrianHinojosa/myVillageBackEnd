// seeds/015_Guatemala.ts
const path = require('path');

// Import the transformed JSON files
const statesGT = require(path.join(__dirname, '../../../seedsGuatemala/states_guatemala.json'));
const citiesGT = require(path.join(__dirname, '../../../seedsGuatemala/cities_guatemala.json'));

// Fixed UUID for Guatemala country (keep this consistent across your app)
const GT_COUNTRY_ID = 'b1f5f1a2-2f07-4e6c-9b6d-1d1e0b2f3a4c';

const TABLES = {
  countries: 'Countries',
  states: 'States',
  cities: 'Cities',
};

const COUNTRY_ROW = { 
  sCountryId: GT_COUNTRY_ID, 
  sName: 'Guatemala', 
  sCode: 'GT',
  bActive: true 
};

exports.seed = async function (knex) {
  console.log('🇬🇹 Starting Guatemala seed...');
  
  // Collect all state IDs from the JSON
  const stateIds = statesGT.map(s => s.sStateId);

  // Step 1: Clean up existing Guatemala data (reverse order of dependencies)
  console.log('Cleaning up existing data...');
  
  // First, get ALL Guatemala states from the database (not just from JSON)
  const existingGTStates = await knex(TABLES.states)
    .where({ sCountryId: GT_COUNTRY_ID })
    .select('sStateId');

  if (existingGTStates.length > 0) {
    const existingStateIds = existingGTStates.map(s => s.sStateId);
    
    // Delete cities first (they depend on states)
    const deletedCities = await knex(TABLES.cities)
      .whereIn('sStateId', existingStateIds)
      .del();
    console.log(`  - Deleted ${deletedCities} cities`);
    
    // Then delete states
    const deletedStates = await knex(TABLES.states)
      .where({ sCountryId: GT_COUNTRY_ID })
      .del();
    console.log(`  - Deleted ${deletedStates} states`);
  }
  
  // Delete the Guatemala country entry
  const deletedCountry = await knex(TABLES.countries)
    .where({ sCountryId: GT_COUNTRY_ID })
    .del();
  console.log(`  - Deleted ${deletedCountry} country record(s)`);

  // Step 2: Insert Guatemala country
  console.log('Inserting Guatemala country...');
  await knex(TABLES.countries).insert([COUNTRY_ROW]);

  // Step 3: Prepare and insert states
  const statesToInsert = statesGT.map(s => ({
    sStateId: s.sStateId,
    sName: s.sName,
    sCode: s.sCode || null, // Optional - can be null
    iLegacyId: s.iLegacyId || 0,
    sCountryId: GT_COUNTRY_ID,
    bActive: true
  }));

  console.log(`Inserting ${statesToInsert.length} states...`);
  await knex.batchInsert(TABLES.states, statesToInsert, 100);

  // Step 4: Insert cities (only those with valid state references)
  const validStateSet = new Set(stateIds);
  const citiesToInsert = citiesGT
    .filter(c => validStateSet.has(c.sStateId))
    .map(c => ({
      sCityId: c.sCityId,
      iLegacyId: c.iLegacyId || 0,
      sStateId: c.sStateId,
      sName: c.sName,
      sCode: c.sCode || null,
      sCounty: c.sCounty || '',
      dLatitude: c.dLatitude || 0,
      dLongitude: c.dLongitude || 0,
      bIsRamp: false,
      bActive: true
    }));

  if (citiesToInsert.length > 0) {
    console.log(`Inserting ${citiesToInsert.length} cities...`);
    await knex.batchInsert(TABLES.cities, citiesToInsert, 1000);
  }

  console.log('✅ Guatemala seed completed successfully!');
  console.log(`   - 1 country`);
  console.log(`   - ${statesToInsert.length} states`);
  console.log(`   - ${citiesToInsert.length} cities`);
};