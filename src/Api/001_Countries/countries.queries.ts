import { CountriesModel } from './countries.model';

class Queries {
    constructor() {};

    // DONE: Verify Country Exists
    static async verifyCountryExists(sCountryId) {
        return await CountriesModel.query().findById(sCountryId).select('*').where('bActive', true)
    }
        
    /**
     * 
     * @param iPageNumber 
     * @param iPageSize 
     * @param sSearch search by sName
     * @returns 
     */
    static async findAllCountries(iPageNumber, iItemsPerPage, sSearch): Promise<any> {
        return await CountriesModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('*')    
            if (sSearch) {
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }
            queryBuilder.where('bActive', true)
        }).orderBy('updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
        
    }
}

export default Queries;


