import { StatesModel } from './states.model';

class Queries {
    constructor() {
    };

    // DONE: Verify State Exists
    static async verifyStateExists(sStateId) {
        return await StatesModel.query().findById(sStateId).where('bActive', true)
    }
    
    /**
     * GET ALl states by country
     * @param iPageNumber 
     * @param iPageSize 
     * @param sSearch (general serach by name
     * @param sCountryId
     * @returns 
     */
      static async findAllStatesByCountry(iPageNumber, iItemsPerPage, sSearch, sCountryId) {
        return await StatesModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('*')    
            queryBuilder.where('bActive', true)
            queryBuilder.where('sCountryId', sCountryId)
            if (sSearch) {
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }
        }).orderBy('updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
    }

}

export default Queries;