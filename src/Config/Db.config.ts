import conf from '../knexfile';

let Environment: string = null;
// console.log('config congif')

switch (process.env.NODE_ENV) {
    case 'development':
        Environment = 'development'
        break;
    default:
    Environment = process.env.NODE_ENV
        break;
}

const config: any = conf[Environment];

const db = require("knex")(config);

async function RawQuery(raw: string): Promise<any> {
    const Query = await db.schema.raw(raw);
    return Query.rows.length == 0
        ? null
        : Query.rows.length > 1
            ? Query.rows
            : Query.rows[0];
}

async function RawQueryInArray(raw: string): Promise<any> {
    const Query = await db.schema.raw(raw);
    return Query.rows;
}


function SelectJsonData(ParsedJson: Array<any>, Elements: Array<string>) {
    const Stringify = JSON.stringify(ParsedJson);
    const Columns = Elements.map(e => {
        switch (true) {
            case e.includes('Id'):
                if (e.includes('TaxId') || e.includes('FolioId')) {
                    return `jsonb_array_elements(j)->>'${e}' as "${e}"`
                } else {
                    return `(jsonb_array_elements(j)->>'${e}')::uuid as "${e}"`
                }
            case e.charAt(0) == 'd' || e.charAt(0) == 'i':
                return `(jsonb_array_elements(j)->>'${e}')::numeric as "${e}"`
            default:
                return `jsonb_array_elements(j)->>'${e}' as "${e}"`
        }
    });
    const Query = `select ${Columns.join(',')}
  from (
      select '${Stringify}'::jsonb as j
  ) t`;
    return Query
}

export { db, RawQuery, RawQueryInArray, SelectJsonData };