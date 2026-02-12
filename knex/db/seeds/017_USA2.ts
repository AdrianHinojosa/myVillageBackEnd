// seeds/015_Canada.ts
// =================================
// CONFIGURATION - Change only these values
// =================================
const COUNTRYNAME = 'Estados Unidos de América | 2';
const COUNTRY_CODE = 'USA';
const COUNTRY_FLAG = 'US';
// =================================

// Auto-generated variables (don't change these)
const COUNTRYNAMELOWER = COUNTRYNAME.toLowerCase();
const COUNTRYNAME_UPPER = COUNTRYNAME.toUpperCase();

const path = require('path');

// Dynamic imports based on country name
const statesData = require(path.join(__dirname, `../../../seedsUSA2/states_USA.json`));
const citiesData = require(path.join(__dirname, `../../../seedsUSA2/cities_USA.json`));

// Generate consistent UUID for this country (you can also hardcode this if needed)
const COUNTRY_ID = `d67ed8ae-6011-406d-b558-01f7b0d7091a`; // Fixed UUID for ${COUNTRYNAME}

const TABLES = {
  countries: 'Countries',
  states: 'States',
  cities: 'Cities',
};

const COUNTRY_ROW = { 
  sCountryId: COUNTRY_ID, 
  sName: COUNTRYNAME, 
  sCode: COUNTRY_CODE,
  bActive: true 
};

exports.seed = async function (knex) {
  console.log(`${COUNTRY_FLAG} Starting ${COUNTRYNAME} seed...`);
  
  // Collect all state IDs from the JSON
  const stateIds = statesData.map(s => s.sStateId);

  // Step 1: Clean up existing data (reverse order of dependencies)
  console.log('Cleaning up existing data...');
  
  // First, get ALL states from the database for this country (not just from JSON)
  const existingStates = await knex(TABLES.states)
    .where({ sCountryId: COUNTRY_ID })
    .select('sStateId');

  if (existingStates.length > 0) {
    const existingStateIds = existingStates.map(s => s.sStateId);
    
    // Delete cities first (they depend on states)
    const deletedCities = await knex(TABLES.cities)
      .whereIn('sStateId', existingStateIds)
      .del();
    console.log(`  - Deleted ${deletedCities} cities`);
    
    // Then delete states
    const deletedStates = await knex(TABLES.states)
      .where({ sCountryId: COUNTRY_ID })
      .del();
    console.log(`  - Deleted ${deletedStates} states`);
  }
  
  // Delete the country entry
  const deletedCountry = await knex(TABLES.countries)
    .where({ sCountryId: COUNTRY_ID })
    .del();
  console.log(`  - Deleted ${deletedCountry} ${COUNTRYNAME} country record(s)`);

  // Step 2: Insert country
  console.log(`Inserting ${COUNTRYNAME} country...`);
  await knex(TABLES.countries).insert([COUNTRY_ROW]);

  // Step 3: Prepare and insert states
  const statesToInsert = statesData.map(s => ({
    sStateId: s.sStateId,
    sName: s.sName,
    sCode: s.sCode || null, // Optional - can be null
    iLegacyId: s.iLegacyId || 0,
    sCountryId: COUNTRY_ID,
    bActive: true
  }));

  console.log(`Inserting ${statesToInsert.length} ${COUNTRYNAME} states...`);
  await knex.batchInsert(TABLES.states, statesToInsert, 100);

  // Step 4: Insert cities (only those with valid state references)
  const validStateSet = new Set(stateIds);
  const citiesToInsert = citiesData
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
    console.log(`Inserting ${citiesToInsert.length} ${COUNTRYNAME} cities...`);
    await knex.batchInsert(TABLES.cities, citiesToInsert, 1000);
  }

  console.log(`✅ ${COUNTRYNAME} seed completed successfully!`);
  console.log(`   - 1 country (${COUNTRYNAME})`);
  console.log(`   - ${statesToInsert.length} states`);
  console.log(`   - ${citiesToInsert.length} cities`);
};