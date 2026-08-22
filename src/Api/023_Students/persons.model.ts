import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';

Model.knex(db);

/**
 * Identidad compartida de un niño entre instituciones (Feature 2). Contiene SOLO lo que se
 * comparte: nombre + fecha de nacimiento. El "folio" que se comparte entre colegios es `sPersonId`.
 */
export interface IPerson {
    sPersonId?: string;
    sName?: string;
    sLastName?: string;
    sSecondLastName?: string;
    tBirthDate?: string;
    bActive?: boolean;
}

export class PersonsModel extends Model {
    public sPersonId?: string;
    public sName?: string;
    public sLastName?: string;
    public sSecondLastName?: string;
    public tBirthDate?: string;
    public bActive?: boolean;

    static tableName: string = 'Persons';
    static idColumn: string | string[] = 'sPersonId';

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
