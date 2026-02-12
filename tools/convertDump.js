const fs   = require('fs');
const { v4: uuid } = require('uuid');
const strip = require('strip-comments');

const SQL_FILE = 'tools/us_locations.sql';
const US_ID    = '4ea76b09-621b-4518-814d-62582395d9f1';   // your Countries row

// ───────────────── helpers ─────────────────
/**
 * Return the block that contains all value tuples for a table.
 * Works no matter where the final semicolon sits or how many line-breaks exist.
 */
/* tools/convertDump.js  – only the helper changed */
function grabInsert(sql, table) {
  // 1 – locate the keyword  INSERT INTO … VALUES (
  const re = new RegExp(
    `INSERT\\s+INTO\\s+\\\`?${table}\\\`?\\s+VALUES\\s*\\(`,
    'i'               // case-insensitive
  );
  const where = sql.search(re);
  if (where === -1) throw new Error(`INSERT not found for ${table}`);

  // 2 – slice from *that* “(” (keep it!) up to the semicolon
  const slice = sql.slice(sql.indexOf('(', where));   // <── no “+ 1”
  const semi  = slice.indexOf(';');
  if (semi === -1) throw new Error(`No semicolon after INSERT ${table}`);

  return slice.substring(0, semi);   // ends with the final “)”
}



function splitRows(block) {
  const rows = []; let depth=0, start=0;
  for (let i=0;i<block.length;i++){
    if (block[i]=='(' && depth++==0) start=i+1;
    if (block[i]==')' && --depth==0) rows.push(block.slice(start,i));
  } return rows;
}
function cells(row) {
  return row.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(v=>{
    v=v.trim(); if (v==='NULL') return null;
    return v.startsWith("'") ? v.slice(1,-1) : Number(v);
  });
}

// ───────────────── read & strip ─────────────────
const sql = strip(fs.readFileSync(SQL_FILE,'utf8'));

// STATES
const stateRows   = splitRows(grabInsert(sql,'US_STATES'));
const idMap = {};
const statesUS = stateRows.map(r=>{
  const [id,code,name] = cells(r);
  const sStateId = uuid(); idMap[id]=sStateId;
  return { sStateId,iLegacyId:id,sCode:code,sName:name,sCountryId:US_ID };
});

// CITIES
const cityRows = splitRows(grabInsert(sql,'US_CITIES'));
const citiesUS = cityRows.map(r=>{
  const [id,id_state,city,county,lat,lon] = cells(r);
  return {
    sCityId   : uuid(),
    iLegacyId : id,
    sStateId  : idMap[id_state],
    sName     : city,
    sCounty   : county,
    dLatitude : lat,
    dLongitude: lon
  };
});

fs.writeFileSync('seedsUSA/states_us.json',  JSON.stringify(statesUS, null, 2));
fs.writeFileSync('seedsUSA/cities_us.json',  JSON.stringify(citiesUS, null, 2));
console.log(`✓  ${statesUS.length} US states, ${citiesUS.length} cities ready`);