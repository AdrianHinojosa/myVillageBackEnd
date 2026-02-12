import { CitiesModel } from './cities.model';

class Queries {
    constructor() {
    };

    // DONE: Verify City Exists
    static async verifyCityExists(sCityId) {
        return await CitiesModel.query().findById(sCityId).where('bActive', true)
    }

    // Used: Verify multiple cities exist
    static async verifyCitiesExist(sArrCityIds) {
        return await CitiesModel.query()
            .whereIn('sCityId', sArrCityIds)
            .where('bActive', true)
            .select('sCityId');
    }
    
    /**
     * GET ALl states by country
     * @param iPageNumber 
     * @param iPageSize 
     * @param sSearch (general serach by name
     * @param sCountryId
     * @param sStateId
     * @returns 
     */
      static async findAllCitiesByStateOrCountry(iPageNumber, iItemsPerPage, sSearch, sCountryId, sStateId) {
        return await CitiesModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('Cities.*')    
            queryBuilder.where('Cities.bActive', true)
            if (sSearch) {
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("Cities"."sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }
            if (sCountryId) {
                queryBuilder.joinRelated('State')
                queryBuilder.where('State.sCountryId', sCountryId)
            }
            if (sStateId) {
                queryBuilder.where('Cities.sStateId', sStateId)
            }
        }).orderBy('Cities.updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
    }

}

export default Queries;