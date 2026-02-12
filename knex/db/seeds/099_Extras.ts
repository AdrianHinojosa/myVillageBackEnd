// seeds/016_AddAccountingModules.ts

exports.seed = async function (knex) {
  console.log('💰 Adding Accounting Enterprise Modules...');
  
  // Define the new modules to add
  const newModules = [
    // Accounts Receivables
    { 
      sEnterpriseModuleId: '0a88c59c-0ad0-4676-8f27-c81afe9aac5c', 
      sEnterpriseModuleCategoryId: null, 
      iType: 0, 
      sUniqueName: 'AccountsReceivables', 
      sNameSP: 'Cuentas por Cobrar', 
      sNameEN: 'Accounts Receivables', 
      sDescriptionSP: 'Gestión de cuentas por cobrar y seguimiento de pagos pendientes', 
      sDescriptionEN: 'Accounts receivable management and pending payment tracking' 
    },
    
    // Payables
    { 
      sEnterpriseModuleId: 'a36739d3-23f8-40fb-b4c3-c6275bf5179e', 
      sEnterpriseModuleCategoryId: null, 
      iType: 0, 
      sUniqueName: 'Payables', 
      sNameSP: 'Cuentas por Pagar', 
      sNameEN: 'Accounts Payables', 
      sDescriptionSP: 'Gestión de cuentas por pagar y control de pagos a proveedores', 
      sDescriptionEN: 'Accounts payable management and carrier payment control' 
    }
  ];
  
  // Extract the IDs to check/delete
  const moduleIds = newModules.map(m => m.sEnterpriseModuleId);
  
  // Delete existing entries if they exist (to allow re-running the seed)
  const deleted = await knex('EnterpriseModules')
    .whereIn('sEnterpriseModuleId', moduleIds)
    .del();
  
  if (deleted > 0) {
    console.log(`  - Removed ${deleted} existing module(s)`);
  }
  
  // Insert the new modules
  await knex('EnterpriseModules').insert(newModules);
  
  console.log('✅ Successfully added Accounting modules:');
  console.log('   - Accounts Receivables');
  console.log('   - Accounts Payables');
};