exports.seed = async function (knex) {
    // Delete in correct order to respect foreign key constraints
    await knex('EnterpriseModules').del();
    await knex('EnterpriseModuleCategories').del();
   
    // First insert categories (if needed in the future)
    // await knex('EnterpriseModuleCategories').insert([
    // ]);
   
    // Then insert modules that reference the categories
    return knex('EnterpriseModules').insert([
      // Dashboard
      { sEnterpriseModuleId: '86e4be12-3060-4849-9ff7-471bfe2020c0', sEnterpriseModuleCategoryId: null, iType: 3, sUniqueName: 'Dashboard', sNameSP: 'Métricas', sNameEN: 'Dashboard', sDescriptionSP: 'Tablero de métricas y análisis para la toma de decisiones', sDescriptionEN: 'Metrics dashboard and analytics for decision making' },
      
      // Customers
      { sEnterpriseModuleId: '3820796a-a024-46e4-abfe-902161459990', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Customers', sNameSP: 'Clientes', sNameEN: 'Customers', sDescriptionSP: 'Gestión completa de información de clientes', sDescriptionEN: 'Complete customer information management' },
      
      // Carriers
      { sEnterpriseModuleId: '9086676a-c2f9-4f59-9c6d-378024be889a', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Carriers', sNameSP: 'Transportistas', sNameEN: 'Carriers', sDescriptionSP: 'Gestión de información de transportistas', sDescriptionEN: 'Carrier information management' },
      
      // Shipments
      { sEnterpriseModuleId: '9d83ada3-0c3a-46b4-89c5-90632f7c07d4', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Shipments', sNameSP: 'Envíos', sNameEN: 'Shipments', sDescriptionSP: 'Gestión de información de envíos y viajes', sDescriptionEN: 'Shipment and trip information management' },
      
      // Transactions
      { sEnterpriseModuleId: 'a1b2c3d4-5678-9012-3456-789012345678', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Transactions', sNameSP: 'Transacciones', sNameEN: 'Transactions', sDescriptionSP: 'Gestión de transacciones, facturas, cuentas por cobrar y cuentas por pagar', sDescriptionEN: 'Management of transactions, invoices, accounts receivable and accounts payable' },
      
      // Employees
      { sEnterpriseModuleId: 'c3d4e5f6-7890-1234-5678-901234567890', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Employees', sNameSP: 'Empleados', sNameEN: 'Employees', sDescriptionSP: 'Gestión completa de cuentas y perfiles de empleados', sDescriptionEN: 'Complete employee account and profile management' },
      
      // Settings
      { sEnterpriseModuleId: 'd04bc12b-fe0e-4aba-a40c-a4c761ed96f6', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Settings', sNameSP: 'Configuraciones', sNameEN: 'Settings', sDescriptionSP: 'Configuración y ajustes del sistema', sDescriptionEN: 'System configuration and settings' },
    

      // Accounts Receivables
      { sEnterpriseModuleId: '0a88c59c-0ad0-4676-8f27-c81afe9aac5c', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'AccountsReceivables', sNameSP: 'Cuentas por Cobrar', sNameEN: 'Accounts Receivables', sDescriptionSP: 'Gestión de cuentas por cobrar y seguimiento de pagos pendientes', sDescriptionEN: 'Accounts receivable management and pending payment tracking' },
      // Payables
      { sEnterpriseModuleId: 'a36739d3-23f8-40fb-b4c3-c6275bf5179e', sEnterpriseModuleCategoryId: null, iType: 0, sUniqueName: 'Payables', sNameSP: 'Cuentas por Pagar', sNameEN: 'Accounts Payables', sDescriptionSP: 'Gestión de cuentas por pagar y control de pagos a proveedores', sDescriptionEN: 'Accounts payable management and carrier payment control' }
    
    ])

    .catch(err => {
      console.log(err);
    });
};