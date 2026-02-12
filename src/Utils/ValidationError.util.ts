//  JOI Valdation Errors
export default {
    JoiValidationError: {
        // Countries, States and Municipalities.
        Locations: {
            sCountryId: {
                sp: "Por favor, ingresa un id de país correcto.",
                en: "Please, enter a correct country id."
            },
            sStateId: {
                sp: "Por favor, ingresa un id de estado correcto.",
                en: "Please, enter a correct state id."
            },
            sCityId: {
                sp: "Por favor, ingresa un identificador de ciudad correcto.",
                en: "Please, enter a valid city id."
            },
            sCountryIdXORsStateId: {
                sp: "Por favor, ingresa un id de país o estado correcto.",
                en: "Please, enter a correct country or state id."
            },
            sMunicipalityId: {
                sp: "Por favor, ingresa un id de municipio correcto.",
                en: "Please, enter a correct municipality id."
            }
        },
        // Authentication validation
        Login: {
            sPassword: {
                sp: "Por favor, ingrese una contraseña correcta. Debe tener como mínimo 6 caracteres.",
                en: "Please enter a correct password. It must be at least 6 characters long."
            },
            sEmail: {
                sp: "Por favor, ingresa un correo electrónico válido.",
                en: "Please, enter a correct email."
            },
            sDeviceId: {
                sp: "Por favor, ingresa un id de dispositivo correcto.",
                en: "Please, enter a correct device id."
            },
            sDeviceName: {
                sp: "Por favor, ingresa un nombre de dispositivo correcto.",
                en: "Please, enter a correct device name."
            },
            sToken: {
                sp: "Por favor, ingresa un token de solicitud correcto.",
                en: "The session token is not correct."
            }
        },
        Filters: {
            sMimeType: {
                sp: "Por favor, ingresa un valor correcto para el tipo de archivo.",
                en: "Please, enter a correct value for file type."
            },
            sSearch: {
                sp: "Por favor, ingresa un valor correcto para la búsqueda",
                en: "Please, enter a correct value for search"
            },
            iPageNumber: {
                sp: "Por favor, ingresa un valor númerico mayor o igual a 1 para la paginación.",
                en: "Please, enter a numeric value bigger than or equal to 1 for pagination."
            },
            iItemsPerPage: {
                sp: "Por favor, ingresa un valor númerico mayor o igual a 1 para los elementos por página.",
                en: "Please, enter a numeric value bigger than or equal to 1 for items per page."
            },

            bDropdown: {
                sp: "Por favor, ingresa si es un listado.",
                en: "Please, specify if it is a dropdown."
            },

            iTotal: {
                sp: "Por favor, ingresa un valor númerico para el total de elementos.",
                en: "Please, enter a numeric value for total items."
            },
            aImagesSizes: {
                sp: "Por favor, asegurese de usar un arreglo de tamaño de imagenes correcto.",
                en: "Please, enter a correct array of images sizes"
            },
            iImageLength: {
                sp: "Por favor, ingrese un valor númerico para la longitud del arreglo de imagenes.",
                en: "Please, enter a numeric value for array of images length"
            },
            bCustomer: {
                sp: "Por favor, ingrese un valor booleano.",
                en: "Please, enter a boolean value."
            },
            sVendorEnterpriseId: {
                sp: "Por favor, ingresa un id de empresa proveedora correcta.",
                en: "Please, enter a correct vendor enterprise id."
            },
            bVerified: {
                sp: "Por favor, ingresa un valor booleano para el filtro de status de usuario.",
                en: "Please, input a boolean value for status user filter."
            },
            iFilter: {
                sp: "Por favor, ingresa un valor númerico para usar este filtro.",
                en: "Please, input a numeric value for use this filter."
            },
            sSort: {
                sp: "Por favor ingresa un valor entre 'asc' o 'desc' para ordenar los datos de forma correcta.",
                en: "Please, input a value between 'asc' or 'desc' to sort the data correctly."
            },
            sTransactionType: {
                sp: "Por favor ingresa un valor entre 'in' o 'out' para ordenar los datos de forma correcta.",
                en: "Please, input a value between 'in' or 'out' to sort the data correctly."
            },
            tStart: {
                sp: "La fecha de inicio ingresada no es válida, asegúrese de usar un formato YYYY-MM-DD.",
                en: "Entered start date is invalid, make sure to use a YYYY-MM-DD format."
            },
            tEnd: {
                sp: "La fecha final ingresada no es válida, asegurese de que sea mayor a la inicial y que cumpla con el formato YYYY-MM-DD.",
                en: "End date entered is not valid, make sure it is greater than the initial one and that it complies with the YYYY-MM-DD format."
            },
            sStatusId: {
                sp: "Por favor, ingresa un identificador para un estatus valido.",
                en: "Please, input a correct purchase order status id."
            }
        },
        RecoveryPassword: {
            sToken: {
                sp: "Por favor, ingrese un token de recuperación de contraseña válido.",
                en: "Please, enter a valid recovery password token."
            },
            sNewPassword: {
                sp: "Por favor, ingrese una contraseña con mas de 6 y menos de 13 caracteres.",
                en: "Please enter a password with more than 6 and less than 13 characters."
            },
            sConfirmNewPassword: {
                sp: "Por favor, ingrese una contraseña con mas de 6 y menos de 13 caracteres.",
                en: "Please enter a password with more than 6 and less than 13 characters."
            },
            sLang: {
                sp: "Por favor, ingresa un código de lenguage correcto.",
                en: "Please, enter a correct language code."
            },
            sUserType: {
                sp: "Por favor, ingresa un tipo de usuario correcto.",
                en: "Please, enter a correct user type"
            },
            sPrimaryKey: {
                sp: "Por favor, ingresa un identificador correcto para el tipo de usuario.",
                en: "Please, enter a correct id for the user type."
            },
        },
        Sessions: {
            Authorization: {
                sp: 'Por favor, ingresa un token de sesión correcto.'
            }
        },

        // ========== ADMINISTRATORS ===========

         // ==== Start Administrators =====
         Administrators: {
            sAdministratorId: {
                sp: "Por favor, ingresa un identificador de administrador correcto.",
                en: "Please, enter a valid administrator id."
            },
            sName: {
                sp: "Por favor, ingresa un nombre correcto.",
                en: "Please, enter a valid name."
            },
            sLastName: {
                sp: "Por favor, ingresa un apellido correcto.",
                en: "Please, enter a valid last name."
            },
            sSecondLastName: {
                sp: "Por favor, ingresa un apellido materno correcto.",
                en: "Please, enter a valid second last name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo válida.",
                en: "Please, enter a valid email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono correcto.",
                en: "Please, enter a valid phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa un número de extensión para usuario correcto.",
                en: "Please, input a correct phone number."
            },
            bPlatformAccess: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado de usuario.",
                en: "Please, input a true or false value for platform access user status."
            },
        },

        AdministratorModules: {
            sAdministratorModuleId: {
                sp: "Por favor, ingresa un id de módulo correcto",
                en: "Please, input a correct module id."
            },
            sAction: {
                sp: "Por favor, ingresa una acción correcta",
                en: "Please, input a correct action."
            }
        },



        // ========== END Administrators ===========

        Users: {
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo válida.",
                en: "Please, enter a valid email."
            },
            sPassword: {
                sp: "Por favor, ingrese una contraseña correcta. Debe tener como mínimo 6 caracteres.",
                en: "Please enter a correct password. It must be at least 6 characters long."
            },
            bPlatformAccess: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado de usuario.",
                en: "Please, input a true or false value for platform access user status."
            },
        },


          // ==============  Start Enterprises ===============
        Enterprises: {
            sEnterpriseId: {
                sp: "Por favor, ingresa un identificador de empresa correcto.",
                en: "Please, enter a valid enterprise id."
            },
            sEnterpriseName: {
                sp: "Por favor, ingresa un nombre de empresa correcto.",
                en: "Please, enter a valid enterprise name."
            },
            sCommercialName: {
                sp: "Por favor, ingresa un nombre comercial de empresa correcto.",
                en: "Please, enter a valid enterprise commercial name."
            },
            sRFC: {
                sp: "Por favor, ingresa un RFC correcto.",
                en: "Please, enter a valid tax id."
            },
            sTaxAddress: {
                sp: "Por favor, ingresa una dirección correcta de facturación.",
                en: "Please, enter a valid tax address."
            },
            sTaxZipCode: {
                sp: "Por favor, ingresa un código postal de facturación correcto.",
                en: "Please, enter a valid tax zip code."
            },
            sCityId: {
                sp: "Por favor, ingresa un identificador de ciudad correcto.",
                en: "Please, enter a valid city id."
            },
            sComments: {
                sp: "Por favor, ingresa comentarios válidos.",
                en: "Please, enter valid comments."
            },
            bPlatformAccess: {
                sp: "Por favor, ingresa un valor booleano del acceso a la plataforma.",
                en: "Please, enter a valid boolean regarding the platform access."
            },
            oImage: {
                sp: "Por favor, ingresa la imagen a subir.",
                en: "Please, enter the image to upload."
            },
            bDeleteImage: {
                sp: "Por favor, ingrese si desea borrar la imagen o subir una.",
                en: "Please, specify if the image will be deleted or uploaded."
            }
        },

        
        EnterpriseModules: {
            sEnterpriseModuleId: {
                sp: "Por favor, ingresa un id de módulo correcto",
                en: "Please, input a correct module id."
            },
            sActionCode: {
                sp: "Por favor, ingresa una acción correcta",
                en: "Please, input a correct action."
            },
            aEnterprisePermissionSet: {
                sp: "Por favor, ingresa un arreglo de permisos correcto.",
                en: "Please, enter a correct array of permissions."
            }
        },

        // =============================================================

        // ==== Enterprise Users =====
        EnterpriseUsers: {
            bAddUser: {
                sp: "Por favor, ingresa un valor booleano para indicar si se agregará un usuario.",
                en: "Please, enter a valid boolean regarding if a user will be added."
            },
            sEnterpriseUserId: {
                sp: "Por favor, ingresa un identificador de usuario empresa correcto.",
                en: "Please, enter a valid enterprise user id."
            },
            sName: {
                sp: "Por favor, ingresa un nombre correcto.",
                en: "Please, enter a valid name."
            },
            sLastName: {
                sp: "Por favor, ingresa un apellido correcto.",
                en: "Please, enter a valid last name."
            },
            sSecondLastName: {
                sp: "Por favor, ingresa un apellido materno correcto.",
                en: "Please, enter a valid second last name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo válida.",
                en: "Please, enter a valid email."
            },
            sPersonalEmail: {
                sp: "Por favor, ingresa una dirección de correo personal válida.",
                en: "Please, enter a valid personal email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono correcto.",
                en: "Please, enter a valid phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa un número de extensión correcto.",
                en: "Please, input a correct phone number."
            },
            bPlatformAccess: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado de usuario empresa.",
                en: "Please, input a true or false value for platform access enterprise user status."
            },
        },


        // ==============  Start Customers ===============
        Customers: {
            sCustomerId: {
                sp: "Por favor, ingresa un identificador de cliente correcto.",
                en: "Please, enter a valid client id."
            },
            sArrCustomerIds: {
                sp: "Por favor, ingresa un arreglo de identificadores de cliente correctos.",
                en: "Please, enter a valid array of client ids."
            },
            sCountryId: {
                sp: "Por favor, ingresa un identificador de país correcto.",
                en: "Please, enter a valid country id."
            },
            sCommercialName: {
                sp: "Por favor, ingresa un nombre de cliente correcto.",
                en: "Please, enter a valid client name."
            },
            sCommercialAddress: {
                sp: "Por favor, ingresa una dirección comercial válida.",
                en: "Please, enter a valid commercial address."
            },
            sIndustry: {
                sp: "Por favor, ingresa una industria válida.",
                en: "Please, enter a valid industry."
            },
            sWebPage: {
                sp: "Por favor, ingresa una página web válida.",
                en: "Please, enter a valid web page."
            },
            dAnnualRevenue: {
                sp: "Por favor, ingresa un ingreso anual válido.",
                en: "Please, enter a valid annual revenue."
            },
            bHasCredit: {
                sp: "Por favor, ingresa si el cliente tiene crédito permitido",
                en: "Please, enter if the client has permitted credit."
            },
            iCreditDays: {
                sp: "Por favor, ingresa la cantidad correcta de días de crédito permitido como un número entero positivo",
                en: "Please, enter the correct amount of permitted credit days permitted as a positive integer"
            },
            aCustomerContacts: {
                sp: "Por favor, ingresa un arreglo de contactos válido",
                en: "Please, enter a valid array of contacts."
            },
            // Tax info
            sFiscalRegime: {
                sp: "Por favor, ingresa el regimen fiscal.",
                en: "Please, enter the fiscal regime."
            },
            sFiscalCompanyName: {
                sp: "Por favor, ingresa la razón social.",
                en: "Please, enter the tax company name."
            },
            sRFC: {
                sp: "Por favor, ingresa un RFC válido.",
                en: "Please, enter a valid tax id."
            },
            sTaxAddress: {
                sp: "Por favor, ingresa una dirección correcta de facturación.",
                en: "Please, enter a valid tax address."
            },
            sTaxZipCode: {
                sp: "Por favor, ingresa un código postal de facturación correcto.",
                en: "Please, enter a valid tax zip code."
            },
            sBankName: {
                sp: "Por favor, ingresa un nombre de banco válido.",
                en: "Please, enter a valid bank name."
            },
            sBankReference: {
                sp: "Por favor, ingresa una referencia de banco válida.",
                en: "Please, enter a valid bank reference."
            },
            sClabeNumber: {
                sp: "Por favor, ingresa un número CLABE válido.",
                en: "Please, enter a valid CLABE number."
            }
        },
        // =============================================================


        // ==== Customer Contacts =====
        CustomerContacts: {
            sCustomerContactId: {
                sp: "Por favor, ingresa un identificador de contacto correcto.",
                en: "Please, enter a valid contact id."
            },
            sFullName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo de contacto válida.",
                en: "Please, enter a valid contact email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa una extensión de número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number extension."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de contacto correcto.",
                en: "Please, enter a valid contact type."
            }
        },

        // Validation Error Messages
        CustomerFiles: {
            sCustomerFileId: {
                sp: "Por favor, ingresa un identificador de archivo del cliente.",
                en: "Please, enter a valid customer file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrCustomerFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            }
        },



        //  ========= Customer Lanes ===================
        CustomerLanes: {
            sCustomerLaneId: {
                sp: "Por favor, ingresa un identificador de ruta válido.",
                en: "Please, enter a valid lane id."
            },
            sOriginCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de origen válido.",
                en: "Please, enter a valid origin city id."
            },
            sOriginAddress: {
                sp: "Por favor, ingresa una dirección de origen válida.",
                en: "Please, enter a valid origin address."
            },
            sOriginAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de origen válidos.",
                en: "Please, enter valid origin address details."
            },
            sOriginZipCode: {
                sp: "Por favor, ingresa un código postal de origen válido.",
                en: "Please, enter a valid origin zip code."
            },
        
            sDestinationCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de destino válido.",
                en: "Please, enter a valid destination city id."
            },
            sDestinationAddress: {
                sp: "Por favor, ingresa una dirección de destino válida.",
                en: "Please, enter a valid destination address."
            },
            sDestinationAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de destino válidos.",
                en: "Please, enter valid destination address details."
            },
            sDestinationZipCode: {
                sp: "Por favor, ingresa un código postal de destino válido.",
                en: "Please, enter a valid destination zip code."
            },
            iLoadsPerWeek: {
                sp: "Por favor, ingresa un número válido de cargas por semana como número entero positivo.",
                en: "Please, enter a valid number of loads per week as a positive integer."
            },
            dCustomerRate: {
                sp: "Por favor, ingresa una tarifa válida como valor monetario positivo.",
                en: "Please, enter a valid rate as a positive monetary value."
            },
            sCommodity: {
                sp: "Por favor, ingresa un tipo de mercancía válido.",
                en: "Please, enter a valid commodity type."
            },
            sBorderCrossing: {
                sp: "Por favor, ingresa un cruce fronterizo válido.",
                en: "Please, enter a valid border crossing."
            },
            sEquipmentType: {
                sp: "Por favor, ingresa un tipo de equipo válido.",
                en: "Please, enter a valid equipment type."
            },
            bHazmat: {
                sp: "Por favor, indica si la carga es material peligroso.",
                en: "Please, indicate if the load is hazardous material."
            },
            sServiceType: {
                sp: "Por favor, ingresa un tipo de servicio válido.",
                en: "Please, enter a valid service type."
            },
            tExpirationDate: {
                sp: "Por favor, ingresa una fecha de expiración válida en formato UTC.",
                en: "Please, enter a valid expiration date in UTC format."
            },

            bTeamDriver: {
                sp: "Por favor, indica si hay doble operador.",
                en: "Please, indicate if the load if there are two operators."
            },

            arrLegs: {
                sp: "Por favor, ingresa un listado de tramos válido.",
                en: "Please, enter a valid list of legs."
            }



        },


        // Carriers
        Carriers: {
            sCarrierId: {
                sp: "Por favor, ingresa un identificador de transportista correcto.",
                en: "Please, enter a valid carrier id."
            },
            sArrCarrierIds: {
                sp: "Por favor, ingresa un arreglo de identificadores de transportista correctos.",
                en: "Please, enter a valid array of carrier ids."
            },
            sCityId: {
                sp: "Por favor, ingresa un identificador de ciudad correcto.",
                en: "Please, enter a valid city id."
            },
            sCommercialName: {
                sp: "Por favor, ingresa un nombre comercial del transportista correcto.",
                en: "Please, enter a valid carrier commercial name."
            },
            sCommercialAddress: {
                sp: "Por favor, ingresa una dirección comercial válida.",
                en: "Please, enter a valid commercial address."
            },
            sWebPage: {
                sp: "Por favor, ingresa una página web válida.",
                en: "Please, enter a valid web page."
            },
            dAnnualRevenue: {
                sp: "Por favor, ingresa un ingreso anual válido.",
                en: "Please, enter a valid annual revenue."
            },
            bHasCredit: {
                sp: "Por favor, indica si el transportista tiene crédito permitido.",
                en: "Please, indicate if the carrier has permitted credit."
            },
            iCreditDays: {
                sp: "Por favor, ingresa la cantidad correcta de días de crédito permitido como un número entero positivo.",
                en: "Please, enter the correct amount of permitted credit days as a positive integer."
            },
            aCarrierContacts: {
                sp: "Por favor, ingresa un arreglo de contactos válido.",
                en: "Please, enter a valid array of contacts."
            },
            // Tax info
            sFiscalRegime: {
                sp: "Por favor, ingresa el régimen fiscal.",
                en: "Please, enter the fiscal regime."
            },
            sFiscalCompanyName: {
                sp: "Por favor, ingresa la razón social.",
                en: "Please, enter the tax company name."
            },
            sRFC: {
                sp: "Por favor, ingresa un RFC válido.",
                en: "Please, enter a valid tax id."
            },
            sTaxAddress: {
                sp: "Por favor, ingresa una dirección fiscal válida.",
                en: "Please, enter a valid tax address."
            },
            sTaxZipCode: {
                sp: "Por favor, ingresa un código postal fiscal válido.",
                en: "Please, enter a valid tax zip code."
            },
            sBankName: {
                sp: "Por favor, ingresa un nombre de banco válido.",
                en: "Please, enter a valid bank name."
            },
            sBankReference: {
                sp: "Por favor, ingresa una referencia bancaria válida.",
                en: "Please, enter a valid bank reference."
            },
            sClabeNumber: {
                sp: "Por favor, ingresa un número CLABE válido.",
                en: "Please, enter a valid CLABE number."
            },
            iTruckCapacity: {
                sp: "Por favor, ingresa una capacidad de camiones válida como número entero positivo.",
                en: "Please, enter a valid truck capacity as a positive integer."
            },
            sMCNumber: { 
                sp: "Por favor, ingresa un número MC válido.",
                en: "Please, enter a valid MC number."
            },
            sCTPATNumber: {
                sp: "Por favor, ingresa un número CTPAT válido.",
                en: "Please, enter a valid CTPAT number."
            },
            sDOTNumber: {
                sp: "Por favor, ingresa un número DOT válido.", 
                en: "Please, enter a valid DOT number."
            }
        },


        // ==== Carrier Contacts =====
        CarrierContacts: {
            sCarrierContactId: {
                sp: "Por favor, ingresa un identificador de contacto correcto.",
                en: "Please, enter a valid contact id."
            },
            sFullName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo de contacto válida.",
                en: "Please, enter a valid contact email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa una extensión de número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number extension."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de contacto correcto.",
                en: "Please, enter a valid contact type."
            }
        },

        // Validation Error Messages
        CarrierFiles: {
            sCarrierFileId: {
                sp: "Por favor, ingresa un identificador de archivo del cliente.",
                en: "Please, enter a valid carrier file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrCarrierFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            }
        },


        //  ========= Carrier Lanes ===================
        CarrierLanes: {
            sCarrierLaneId: {
                sp: "Por favor, ingresa un identificador de ruta válido.",
                en: "Please, enter a valid lane id."
            },
            sOriginCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de origen válido.",
                en: "Please, enter a valid origin city id."
            },
            sOriginCountryId: {
                sp: "Por favor, ingresa un identificador de país de origen válido.",
                en: "Please, enter a valid origin country id."
            },
            sOriginAddress: {
                sp: "Por favor, ingresa una dirección de origen válida.",
                en: "Please, enter a valid origin address."
            },
            sOriginAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de origen válidos.",
                en: "Please, enter valid origin address details."
            },
            sDestinationCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de destino válido.",
                en: "Please, enter a valid destination city id."
            },
            sDestinationCountryId: {
                sp: "Por favor, ingresa un identificador de país de destino válido.",
                en: "Please, enter a valid destination country id."
            },
            sDestinationAddress: {
                sp: "Por favor, ingresa una dirección de destino válida.",
                en: "Please, enter a valid destination address."
            },
            sDestinationAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de destino válidos.",
                en: "Please, enter valid destination address details."
            },
            iLoadsPerWeek: {
                sp: "Por favor, ingresa un número válido de cargas por semana como número entero positivo.",
                en: "Please, enter a valid number of loads per week as a positive integer."
            },
            dCarrierRate: {
                sp: "Por favor, ingresa una tarifa válida como valor monetario positivo.",
                en: "Please, enter a valid rate as a positive monetary value."
            },
            sCommodity: {
                sp: "Por favor, ingresa un tipo de mercancía válido.",
                en: "Please, enter a valid commodity type."
            },
            sBorderCrossing: {
                sp: "Por favor, ingresa un cruce fronterizo válido.",
                en: "Please, enter a valid border crossing."
            },
            sEquipmentType: {
                sp: "Por favor, ingresa un tipo de equipo válido.",
                en: "Please, enter a valid equipment type."
            },
            bHazmat: {
                sp: "Por favor, indica si la carga es material peligroso.",
                en: "Please, indicate if the load is hazardous material."
            },
            sServiceType: {
                sp: "Por favor, ingresa un tipo de servicio válido.",
                en: "Please, enter a valid service type."
            },
            tExpirationDate: {
                sp: "Por favor, ingresa una fecha de expiración válida en formato UTC.",
                en: "Please, enter a valid expiration date in UTC format."
            },
            
            sOrderBy: {
                sp: "Por favor, ingresa un valor válido para ordenar.",
                en: "Please, enter a valid value to sort."
            },

            bTeamDriver: {
                sp: "Por favor, indica si hay doble operador.",
                en: "Please, indicate if the load if there are two operators."
            },
            dTeamDriverRate: {
                sp: "Por favor, ingresa una tarifa de doble operador válida como valor monetario positivo.",
                en: "Please, enter a valid team driver rate as a positive monetary value."
            },
        },


        // ========== Employees ==============
        Employees: {
            sEmployeeId: {
                sp: "Por favor, ingresa un identificador de empleado correcto.",
                en: "Please, enter a valid employee id."
            },
            sArrEmployeeIds: {
                sp: "Por favor, ingresa un arreglo de identificadores de empleado correctos.",
                en: "Please, enter a valid array of employee ids."
            },
            sName: {
                sp: "Por favor, ingresa un nombre correcto.",
                en: "Please, enter a valid name."
            },
            sLastName: {
                sp: "Por favor, ingresa un apellido correcto.",
                en: "Please, enter a valid last name."
            },
            sSecondLastName: {
                sp: "Por favor, ingresa un apellido materno correcto.",
                en: "Please, enter a valid second last name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo válida.",
                en: "Please, enter a valid email."
            },
            sPersonalEmail: {
                sp: "Por favor, ingresa una dirección de correo personal válida.",
                en: "Please, enter a valid personal email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono correcto.",
                en: "Please, enter a valid phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa un número de extensión correcto.",
                en: "Please, enter a valid phone extension."
            },
            sJobRole: {
                sp: "Por favor, ingresa un rol de trabajo válido.",
                en: "Please, enter a valid job role."
            },
            sEmployeeManagerId: {
                sp: "Por favor, ingresa un identificador de gerente válido.",
                en: "Please, enter a valid manager id."
            },
            bAddUser: {
                sp: "Por favor, ingresa un valor booleano para indicar si se agregará un usuario.",
                en: "Please, enter a valid boolean regarding if a user will be added."
            },
            bPlatformAccess: {
                sp: "Por favor, ingresa un valor verdadero o falso para el acceso a la plataforma.",
                en: "Please, input a true or false value for platform access."
            },
            oImage: {
                sp: "Por favor, ingresa la imagen a subir.",
                en: "Please, enter the image to upload."
            },
            bDeleteImage: {
                sp: "Por favor, ingrese si desea borrar la imagen o subir una.",
                en: "Please, specify if the image will be deleted or uploaded."
            }
        },

        // =========== END Employees ===================
        // ========== Employee Files ==============
        EmployeeFiles: {
            sEmployeeFileId: {
                sp: "Por favor, ingresa un identificador de archivo de empleado correcto.",
                en: "Please, enter a valid employee file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrEmployeeFileCategories: {
                sp: "Por favor, ingresa las categorías de los archivos a subir.",
                en: "Please, enter the file categories to upload."
            },
            sArrEmployeeFileNames: {
                sp: "Por favor, ingresa el nombre de los archivos a subir.",
                en: "Please, enter the file names to upload."
            }
        },
        
        // ======= END Employee files =========

        // ========== Start Shipments ==============
        Shipments: {
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            dShipmentRate: {
                sp: "Por favor, ingresa una tarifa de envío válida como valor monetario positivo.",
                en: "Please, enter a valid shipment rate as a positive monetary value."
            },
            arrShipmentLegs: { // Changed from arrPreShipments
                sp: "Por favor, incluye al menos un tramo de envío en el array.",
                en: "Please, include at least one shipment leg in the array."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
            sPODStatus: {
                sp: "Por favor, ingresa un estado de POD válido ('PENDING', 'DECLINED', 'APPROVED').",
                en: "Please, enter a valid POD status ('PENDING', 'DECLINED', 'APPROVED')."
            },
            dIVA: {
                sp: "Por favor, ingresa un valor de IVA válido como monto monetario positivo.",
                en: "Please, enter a valid IVA value as a positive monetary amount."
            },
            dRetention: {
                sp: "Por favor, ingresa un valor de retención válido como monto monetario positivo.",
                en: "Please, enter a valid retention value as a positive monetary amount."
            },
            tPickupDate: {
                sp: "Por favor, ingresa una fecha de recogida válida en formato UTC.",
                en: "Please, enter a valid pickup date in UTC format."
            },
            dShipmentCustomerLaneRate: {
                sp: "Por favor, ingresa una tarifa de ruta de cliente válida como valor monetario positivo.",
                en: "Please, enter a valid customer lane rate as a positive monetary value."
            },
            sOriginCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de origen válido.",
                en: "Please, enter a valid origin city id."
            },
            sDestinationCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de destino válido.",
                en: "Please, enter a valid destination city id."
            },
            sCustomerLaneId: {
                sp: "Por favor, ingresa un identificador de ruta de cliente válido.",
                en: "Please, enter a valid customer lane id."
            },
           sComments: {
                sp: "Por favor, ingresa un comentario válido.",
                en: "Please, enter a valid comment."
            },
            sPONumber: {
                sp: "Por favor, ingresa un número de referencia del cliente válido.",
                en: "Please, enter a valid customer reference number."
            },
            bPODAlreadyApproved: {
                sp: "Por favor, indica si el POD ya ha sido aprobado.",
                en: "Please, indicate if the POD has already been approved."
            },
            bExpired: {
                sp: "Por favor, ingresa un valor booleano válido para filtrar por cuentas por cobrar vencidas.",
                en: "Please, enter a valid boolean value to filter by expired accounts receivable."
            },
            bAllowPublicAccess: {
                sp: "Por favor, ingresa un valor booleano válido para habilitar/deshabilitar el acceso público.",
                en: "Please, enter a valid boolean value to enable/disable public access."
            }
        },


        PreShipments: {
            sPreShipmentId: {
                sp: "Por favor, ingresa un identificador de pre-envío válido.",
                en: "Please, enter a valid pre-shipment id."
            },
            sCarrierLaneId: {
                sp: "Por favor, ingresa un identificador de ruta de transportista válido.",
                en: "Please, enter a valid carrier lane id."
            },
             sShipmentLegId: { // Added
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            tPickupDate: {
                sp: "Por favor, ingresa una fecha de recogida válida en formato UTC.",
                en: "Please, enter a valid pickup date in UTC format."
            },
            tEstimatedDeliveryDate: {
                sp: "Por favor, ingresa una fecha estimada de entrega válida en formato UTC.",
                en: "Please, enter a valid estimated delivery date in UTC format."
            },
            tRealDeliveryDate: {
                sp: "Por favor, ingresa una fecha real de entrega válida en formato UTC.",
                en: "Please, enter a valid real delivery date in UTC format."
            },
            iDaysOfFlexibility: {
                sp: "Por favor, ingresa un número válido de días de flexibilidad como número entero positivo.",
                en: "Please, enter a valid number of flexibility days as a positive integer."
            },
            dPreShipmentRate: {
                sp: "Por favor, ingresa una tarifa de pre-envío válida como valor monetario positivo.",
                en: "Please, enter a valid pre-shipment rate as a positive monetary value."
            },
            bPreselectedPreShipment: {
                sp: "Por favor, indica si este pre-envío está preseleccionado.",
                en: "Please, indicate if this pre-shipment is preselected."
            }
        },


        PreShipmentStatuses: {
            sPreShipmentStatusId: {
                sp: "Por favor, ingresa un identificador de estado de pre-envío válido.",
                en: "Please, enter a valid pre-shipment status id."
            },
        },

        PreShipmentStatusRecords: {
            sPreShipmentStatusRecordId: {
                sp: "Por favor, ingresa un identificador de registro de estado de pre-envío válido.",
                en: "Please, enter a valid pre-shipment status record id."
            },
            sPreShipmentId: {
                sp: "Por favor, ingresa un identificador de pre-envío válido.",
                en: "Please, enter a valid pre-shipment id."
            },
            sPreShipmentStatusId: {
                sp: "Por favor, ingresa un identificador de estado de pre-envío válido.",
                en: "Please, enter a valid pre-shipment status id."
            },
            sComments: {
                sp: "Por favor, ingresa comentarios válidos.",
                en: "Please, enter valid comments."
            }
        },


        ShipmentStatuses: {
            sShipmentStatusId: {
                sp: "Por favor, ingresa un identificador de estado de envío válido.",
                en: "Please, enter a valid shipment status id."
            },
        },


        // Shipment status records
        ShipmentStatusRecords: {
            sShipmentStatusRecordId: {
                sp: "Por favor, ingresa un identificador de registro de estado de envío válido.",
                en: "Please, enter a valid shipment status record id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sComments: {
                sp: "Por favor, ingresa comentarios válidos.",
                en: "Please, enter valid comments."
            }
        },
        

        // Add to ValidationErrorMessages.util.ts
        ShipmentFiles: {
            sShipmentFileId: {
                sp: "Por favor, ingresa un identificador de archivo de envío válido.",
                en: "Please, enter a valid shipment file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrShipmentFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            },
            sArrFileTypes: {
                sp: "Por favor, ingresa los tipos de archivos a subir ('SHIPMENT', 'POD').",
                en: "Please, enter the file types to upload.('SHIPMENT', 'POD')."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de archivo válido ('SHIPMENT', 'POD').",
                en: "Please, enter a valid file type ('SHIPMENT', 'POD')."
            }
        },

        // Transactions
        Transactions: {
            sTransactionId: {
                sp: "Por favor, ingresa un identificador de transacción válido.",
                en: "Please, enter a valid transaction id."
            },
            sTransactionType: {
                sp: "Por favor, selecciona un tipo de transacción válido (INCOME o EXPENSE).",
                en: "Please, select a valid transaction type (INCOME or EXPENSE)."
            },
            bFiscal: {
                sp: "Por favor, indica si la transacción es fiscal (true o false).",
                en: "Please, indicate if the transaction is fiscal (true or false)."
            },
            tDate: {
                sp: "Por favor, ingresa una fecha válida para la transacción.",
                en: "Please, enter a valid date for the transaction."
            },
            bIVAExempt: {
                sp: "Por favor, indica si está exento de IVA (true o false).",
                en: "Please, indicate if it's exempt from IVA (true or false)."
            },
            sPaymentMethod: {
                sp: "Por favor, ingresa un método de pago válido.",
                en: "Please, enter a valid payment method."
            },
            sConcept: {
                sp: "Por favor, ingresa un concepto válido para la transacción.",
                en: "Please, enter a valid concept for the transaction."
            },
            sReference: {
                sp: "Por favor, ingresa una referencia válida.",
                en: "Please, enter a valid reference."
            },
            sCarrierId: {
                sp: "Por favor, ingresa un identificador de transportista válido.",
                en: "Please, enter a valid carrier id."
            },
            sCustomerId: {
                sp: "Por favor, ingresa un identificador de cliente válido.",
                en: "Please, enter a valid customer id."
            },
            sCurrency: {
                sp: "Por favor, ingresa una moneda válida.",
                en: "Please, enter a valid currency."
            },
            TransactionItems: {
                sp: "Por favor, proporciona al menos un elemento de transacción válido.",
                en: "Please, provide at least one valid transaction item."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
            iItemsPerPage: {
                sp: "Por favor, ingresa un número válido de elementos por página.",
                en: "Please, enter a valid number of items per page."
            },
            iPageNumber: {
                sp: "Por favor, ingresa un número de página válido.",
                en: "Please, enter a valid page number."
            },
            sSearch: {
                sp: "Por favor, ingresa un término de búsqueda válido.",
                en: "Please, enter a valid search term."
            }
        },

        TransactionFiles: {
            sTransactionFileId: {
                sp: "Por favor, ingresa un identificador de archivo de transacción válido.",
                en: "Please, enter a valid transaction file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrTransactionFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            },
        },

        TaxEntities: {
            sTaxEntityId: {
                sp: "Por favor, ingresa un identificador de entidad fiscal correcto.",
                en: "Please, enter a valid tax entity id."
            },
            sArrTaxEntityIds: {
                sp: "Por favor, ingresa un arreglo de identificadores de entidad fiscal correctos.",
                en: "Please, enter a valid array of tax entity ids."
            },
            sCustomerId: {
                sp: "Por favor, ingresa un identificador de cliente correcto.",
                en: "Please, enter a valid customer id."
            },
            sCarrierId: {
                sp: "Por favor, ingresa un identificador de transportista correcto.",
                en: "Please, enter a valid carrier id."
            },
            sFiscalRegime: {
                sp: "Por favor, ingresa el régimen fiscal.",
                en: "Please, enter the fiscal regime."
            },
            sFiscalCompanyName: {
                sp: "Por favor, ingresa la razón social.",
                en: "Please, enter the tax company name."
            },
            sRFC: {
                sp: "Por favor, ingresa un RFC válido.",
                en: "Please, enter a valid tax id."
            },
            sTaxAddress: {
                sp: "Por favor, ingresa una dirección correcta de facturación.",
                en: "Please, enter a valid tax address."
            },
            sTaxZipCode: {
                sp: "Por favor, ingresa un código postal de facturación correcto.",
                en: "Please, enter a valid tax zip code."
            },
            bDefault: {
                sp: "Por favor, especifica si esta entidad fiscal es por defecto.",
                en: "Please, specify if this tax entity is default."
            },
            invalidEntityFilter: {
                sp: "Por favor, ingresa un tipo de entidad válido.",
                en: "Please, enter a valid entity type."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de entidad fiscal válido ('MX' ó 'USA').",
                en: "Please, enter a valid tax entity type ('MX' ó 'USA')."
            }
        },

        //  ========= Addresses ===================
        Addresses: {
            sAddressId: {
                sp: "Por favor, ingresa un identificador de dirección válido.",
                en: "Please, enter a valid address id."
            },
            sAddressType: {
                sp: "Por favor, ingresa un tipo de dirección válido (SHIPMENTORDER).",
                en: "Please, enter a valid address type (SHIPMENTORDER)."
            },
            sAddress: {
                sp: "Por favor, ingresa una dirección válida.",
                en: "Please, enter a valid address."
            }
        },


         //  ========= Legs ===================
        Legs: {
            sLegId: {
                sp: "Por favor, ingresa un identificador de tramo válido.",
                en: "Please, enter a valid leg id."
            },
            sCustomerLaneId: {
                sp: "Por favor, ingresa un identificador de ruta de cliente válido.",
                en: "Please, enter a valid customer lane id."
            },
            sOriginCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de origen válido.",
                en: "Please, enter a valid origin city id."
            },
            sOriginAddress: {
                sp: "Por favor, ingresa una dirección de origen válida.",
                en: "Please, enter a valid origin address."
            },
            sOriginAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de origen válidos.",
                en: "Please, enter valid origin address details."
            },
            sOriginZipCode: {
                sp: "Por favor, ingresa un código postal de origen válido.",
                en: "Please, enter a valid origin zip code."
            },

            sDestinationCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de destino válido.",
                en: "Please, enter a valid destination city id."
            },
            sDestinationAddress: {
                sp: "Por favor, ingresa una dirección de destino válida.",
                en: "Please, enter a valid destination address."
            },
            sDestinationAddressDetails: {
                sp: "Por favor, ingresa detalles de dirección de destino válidos.",
                en: "Please, enter valid destination address details."
            },
            sDestinationZipCode: {
                sp: "Por favor, ingresa un código postal de destino válido.",
                en: "Please, enter a valid destination zip code."
            },
            dLegRate: {
                sp: "Por favor, ingresa una tarifa del tramo válida como valor monetario positivo.",
                en: "Please, enter a valid leg rate as a positive monetary value."
            },
            sBorderCrossing: {
                sp: "Por favor, ingresa un cruce fronterizo válido.",
                en: "Please, enter a valid border crossing."
            },
            bTeamDriver: {
                sp: "Por favor, indica si requiere doble operador.",
                en: "Please, indicate if team driver is required."
            },
            dTeamDriverRate: {
                sp: "Por favor, ingresa una tarifa de doble operador válida como valor monetario positivo.",
                en: "Please, enter a valid team driver rate as a positive monetary value."
            },

            iLegOrder: {
                sp: "Por favor, ingresa un número de orden de tramo válido como número entero positivo.",
                en: "Please, enter a valid leg order as a positive integer."
            },
            bExpired: {
                sp: "Por favor, indica si quieres filtrar por rutas expiradas.",
                en: "Please, indicate if you want to filter by expired lanes."
            }
        },


        // Add to ValidationErrorMessages.util.ts
        ShipmentLegs: {
            sShipmentLegId: {
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            dShipmentLegRate: {
                sp: "Por favor, ingresa una tarifa de tramo de envío válida como valor monetario positivo.",
                en: "Please, enter a valid shipment leg rate as a positive monetary value."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
            sPODStatus: {
                sp: "Por favor, ingresa un estado de POD válido ('PENDING', 'DECLINED', 'APPROVED').",
                en: "Please, enter a valid POD status ('PENDING', 'DECLINED', 'APPROVED')."
            },
            dIVA: {
                sp: "Por favor, ingresa un valor de IVA válido como monto monetario positivo.",
                en: "Please, enter a valid IVA value as a positive monetary amount."
            },
            dRetention: {
                sp: "Por favor, ingresa un valor de retención válido como monto monetario positivo.",
                en: "Please, enter a valid retention value as a positive monetary amount."
            },
            tPickupDate: {
                sp: "Por favor, ingresa una fecha de recogida válida en formato UTC.",
                en: "Please, enter a valid pickup date in UTC format."
            },
            tEstimatedDeliveryDate: {
                sp: "Por favor, ingresa una fecha estimada de entrega válida en formato UTC.",
                en: "Please, enter a valid estimated delivery date in UTC format."
            },
            iDaysOfFlexibility: {
                sp: "Por favor, ingresa un número válido de días de flexibilidad como número entero positivo.",
                en: "Please, enter a valid number of flexibility days as a positive integer."
            },
            dShipmentLegCarrierLaneRate: {
                sp: "Por favor, ingresa una tarifa de ruta de transportista para el tramo válida como valor monetario positivo.",
                en: "Please, enter a valid carrier lane rate for the leg as a positive monetary value."
            },
            sOriginCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de origen válido.",
                en: "Please, enter a valid origin city id."
            },
            sDestinationCityId: {
                sp: "Por favor, ingresa un identificador de ciudad de destino válido.",
                en: "Please, enter a valid destination city id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sShipmentLegStatusId: {
                sp: "Por favor, ingresa un identificador de estado de tramo de envío válido.",
                en: "Please, enter a valid shipment leg status id."
            },
            sLegId: {
                sp: "Por favor, ingresa un identificador de tramo válido.",
                en: "Please, enter a valid leg id."
            },
            
            sPrimaryDriverName: {
                sp: "Por favor, ingresa un nombre de conductor principal válido.",
                en: "Please, enter a valid primary driver name."
            },
            sPrimaryDriverPhone: {
                sp: "Por favor, ingresa un número de teléfono de conductor principal válido.",
                en: "Please, enter a valid primary driver phone number."
            },
            sSecondaryDriverName: {
                sp: "Por favor, ingresa un nombre de conductor secundario válido.",
                en: "Please, enter a valid secondary driver name."
            },
            sSecondaryDriverPhone: {
                sp: "Por favor, ingresa un número de teléfono de conductor secundario válido.",
                en: "Please, enter a valid secondary driver phone number."
            },
            sTrailerNumber: {
                sp: "Por favor, ingresa un número de remolque válido.",
                en: "Please, enter a valid trailer number."
            },
            bExpired: {
                sp: "Por favor, ingresa un valor booleano válido para filtrar por cuentas por pagar vencidas.",
                en: "Please, enter a valid boolean value to filter by expired accounts payable."
            }
        },

        ShipmentLegStatuses: {
            sShipmentLegStatusId: {
                sp: "Por favor, ingresa un identificador de estado de tramo de envío válido.",
                en: "Please, enter a valid shipment leg status id."
            },
        },

        // Shipment leg status records
        ShipmentLegStatusRecords: {
            sShipmentLegStatusRecordId: {
                sp: "Por favor, ingresa un identificador de registro de estado de tramo de envío válido.",
                en: "Please, enter a valid shipment leg status record id."
            },
            sShipmentLegId: {
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            sComments: {
                sp: "Por favor, ingresa comentarios válidos.",
                en: "Please, enter valid comments."
            },
            sLatitude: {
                sp: "Por favor, ingresa una latitud válida.",
                en: "Please, enter a valid latitude."
            },
            sLongitude: {
                sp: "Por favor, ingresa una longitud válida.",
                en: "Please, enter a valid longitude."
            },
            tRecordDate: {
                sp: "Por favor, ingresa una fecha de registro válida.",
                en: "Please, enter a valid record date."
            }
        },

        // ShipmentLeg Files
        ShipmentLegFiles: {
            sShipmentLegFileId: {
                sp: "Por favor, ingresa un identificador de archivo de tramo de envío válido.",
                en: "Please, enter a valid shipment leg file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrShipmentLegFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos de tramo a subir.",
                en: "Please, enter the shipment leg file names to upload."
            },
            sArrFileTypes: {
                sp: "Por favor, ingresa los tipos de archivos a subir ('SHIPMENT', 'POD').",
                en: "Please, enter the file types to upload.('SHIPMENT', 'POD')."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de archivo válido ('SHIPMENT', 'POD').",
                en: "Please, enter a valid file type ('SHIPMENT', 'POD')."
            },
            bUseAsShipmentPOD: {
                sp: "Por favor, indica si este archivo se usará como POD del envío.",
                en: "Please, indicate if this file will be used as the shipment POD."
            },
            bPODAlreadyApproved: { 
                sp: "Por favor, indica si el POD ya ha sido aprobado.",
                en: "Please, indicate if the POD has already been approved."
            }
        },

        Analytics: {
            sPeriod: {
                sp: "Por favor, selecciona un período válido (CurrentMonth, LastMonth, Last30, Last90, YTD, LastYear, Custom).",
                en: "Please, select a valid period (CurrentMonth, LastMonth, Last30, Last90, YTD, LastYear, Custom)."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida en formato UTC.",
                en: "Please, enter a valid start date in UTC format."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida en formato UTC.",
                en: "Please, enter a valid end date in UTC format."
            }
        },


        ShipmentDispatchers: {
            sShipmentDispatcherId: {
                sp: "Por favor, ingresa un identificador de despachador de envío válido.",
                en: "Please, enter a valid shipment dispatcher id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sEmployeeId: {
                sp: "Por favor, ingresa un identificador de empleado válido.",
                en: "Please, enter a valid employee id."
            },
            bOwner: {
                sp: "Por favor, ingresa un valor booleano válido para propietario.",
                en: "Please, enter a valid boolean value for owner."
            },
        },

        // ========== Exchange Rates ==============
        ExchangeRates: {
            sCurrencyCode: {
                sp: "Por favor, ingresa un código de moneda válido de 3 letras mayúsculas (ej: USD, MXN, JPY).",
                en: "Please, enter a valid 3-letter uppercase currency code (e.g., USD, MXN, JPY)."
            },
            sExchangeRateId: {
                sp: "Por favor, ingresa un identificador de tipo de cambio válido.",
                en: "Please, enter a valid exchange rate id."
            },
            dAmount: {
                sp: "Por favor, ingresa una cantidad válida como número positivo.",
                en: "Please, enter a valid amount as a positive number."
            },
            sFromCurrency: {
                sp: "Por favor, ingresa un código de moneda de origen válido de 3 letras mayúsculas.",
                en: "Please, enter a valid 3-letter uppercase source currency code."
            },
            sToCurrency: {
                sp: "Por favor, ingresa un código de moneda de destino válido de 3 letras mayúsculas.",
                en: "Please, enter a valid 3-letter uppercase target currency code."
            },
            tFromDate: {
                sp: "Por favor, ingresa una fecha de inicio válida en formato UTC.",
                en: "Please, enter a valid start date in UTC format."
            },
            tToDate: {
                sp: "Por favor, ingresa una fecha final válida en formato UTC.",
                en: "Please, enter a valid end date in UTC format."
            },
            bLatestOnly: {
                sp: "Por favor, ingresa un valor booleano para mostrar solo los últimos tipos de cambio.",
                en: "Please, enter a boolean value to show only latest exchange rates."
            }
        },

          // ========== Exchange Rates ==============
        Currencies: {
            sCurrency: {
                sp: "Por favor, ingresa un código de moneda válido de 3 letras mayúsculas (ej: USD, MXN, JPY).",
                en: "Please, enter a valid 3-letter uppercase currency code (e.g., USD, MXN, JPY)."
            },
        },


        // Invoices validation messages
        Invoices: {
            sInvoiceId: {
                sp: "Por favor, ingresa un identificador de factura válido.",
                en: "Please, enter a valid invoice id."
            },
            sBilledByTaxEntityId: {
                sp: "Por favor, ingresa un identificador de entidad fiscal emisor válido.",
                en: "Please, enter a valid billed by tax entity id."
            },
            sBilledToTaxEntityId: {
                sp: "Por favor, ingresa un identificador de entidad fiscal receptor válido.",
                en: "Please, enter a valid billed to tax entity id."
            },

            sInvoiceType: {
                sp: "Por favor, selecciona un tipo de factura válido (INCOME o EXPENSE).",
                en: "Please, select a valid invoice type (INCOME or EXPENSE)."
            },
            sTaxEntityId: {
                sp: "Por favor, ingresa un identificador de entidad fiscal válido.",
                en: "Please, enter a valid tax entity id."
            },
            bFiscal: {
                sp: "Por favor, indica si la factura es fiscal (true o false).",
                en: "Please, indicate if the invoice is fiscal (true or false)."
            },
            tDate: {
                sp: "Por favor, ingresa una fecha válida para la factura.",
                en: "Please, enter a valid date for the invoice."
            },
            InvoiceItems: {
                sp: "Por favor, ingresa un arreglo válido de elementos de factura.",
                en: "Please, enter a valid array of invoice items."
            },
            sPaymentMethod: {
                sp: "Por favor, ingresa un método de pago válido.",
                en: "Please, enter a valid payment method."
            },
            sConcept: {
                sp: "Por favor, ingresa un concepto válido para la factura.",
                en: "Please, enter a valid concept for the invoice."
            },
            sReference: {
                sp: "Por favor, ingresa una referencia válida.",
                en: "Please, enter a valid reference."
            },
            sCFDIUse: {
                sp: "Por favor, ingresa un uso de CFDI válido.",
                en: "Please, enter a valid CFDI use."
            },
            sPaymentManner: {
                sp: "Por favor, ingresa una forma de pago válida.",
                en: "Please, enter a valid payment manner."
            },
            sManualFolio: {
                sp: "Por favor, ingresa un folio manual válido.",
                en: "Please, enter a valid manual folio."
            },
            sCurrency: {
                sp: "Por favor, selecciona una moneda válida.",
                en: "Please, select a valid currency."
            },
            bCancelled: {
                sp: "Por favor, indica si la factura está cancelada (true o false).",
                en: "Please, indicate if the invoice is cancelled (true or false)."
            },
            sStatus: {
                sp: "Por favor, selecciona un estado válido (CANCELLED, PAID, PARTIALLY_PAID o UNPAID).",
                en: "Please, select a valid status (CANCELLED, PAID, PARTIALLY_PAID, or UNPAID)."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sShipmentLegId: {
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            sCarrierId: {
                sp: "Por favor, ingresa un identificador de transportista válido.",
                en: "Please, enter a valid carrier id."
            },
            sCustomerId: {
                sp: "Por favor, ingresa un identificador de cliente válido.",
                en: "Please, enter a valid customer id."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            }
        },

        // InvoiceItems validation messages
        InvoiceItems: {
            sInvoiceItemId: {
                sp: "Por favor, ingresa un identificador de elemento de factura válido.",
                en: "Please, enter a valid invoice item id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sShipmentLegId: {
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            dAmount: {
                sp: "Por favor, ingresa un monto válido como valor monetario positivo.",
                en: "Please, enter a valid amount as a positive monetary value."
            },
            dIVA: {
                sp: "Por favor, ingresa un valor de IVA válido como monto monetario positivo.",
                en: "Please, enter a valid IVA value as a positive monetary amount."
            },
            dRetention: {
                sp: "Por favor, ingresa un valor de retención válido como monto monetario positivo.",
                en: "Please, enter a valid retention value as a positive monetary amount."
            }
        },

        // Validation Errors
        InvoiceFiles: {
            sInvoiceFileId: {
                sp: "Por favor, ingresa un identificador de archivo de factura válido.",
                en: "Please, enter a valid invoice file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrInvoiceFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            },
            sArrFileTypes: {
                sp: "Por favor, ingresa tipos de archivo válidos (PDF o XML).",
                en: "Please, enter valid file types (PDF or XML)."
            },
            sType: {
                sp: "Por favor, selecciona un tipo de archivo válido (PDF o XML).",
                en: "Please, select a valid file type (PDF or XML)."
            },
        },

        // ========== ContactForms ==============
        ContactForms: {
            sContactFormId: {
                sp: "Por favor, ingresa un identificador de formulario de contacto correcto.",
                en: "Please, enter a valid contact form id."
            },
            sFullName: {
                sp: "Por favor, ingresa un nombre completo válido.",
                en: "Please, enter a valid full name."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono válido (8-10 dígitos).",
                en: "Please, enter a valid phone number (8-10 digits)."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo electrónico válida.",
                en: "Please, enter a valid email address."
            },
            sCompanyName: {
                sp: "Por favor, ingresa un nombre de empresa válido.",
                en: "Please, enter a valid company name."
            },
            sApproxMonthlyShipments: {
                sp: "Por favor, ingresa una cantidad aproximada de envíos mensuales válida.",
                en: "Please, enter a valid approximate monthly shipments amount."
            },
            sPlanOfInterest: {
                sp: "Por favor, ingresa un plan de interés válido.",
                en: "Please, enter a valid plan of interest."
            },
            sMainChallenge: {
                sp: "Por favor, ingresa un reto principal válido.",
                en: "Please, enter a valid main challenge."
            },
            sDescription: {
                sp: "Por favor, ingresa una descripción válida.",
                en: "Please, enter a valid description."
            }
        },

        TransactionItems: {
            sTransactionItemId: {
                sp: "Por favor, ingresa un identificador de elemento de transacción válido.",
                en: "Please, enter a valid transaction item id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sShipmentLegId: {
                sp: "Por favor, ingresa un identificador de tramo de envío válido.",
                en: "Please, enter a valid shipment leg id."
            },
            sInvoiceItemId: {
                sp: "Por favor, ingresa un identificador de elemento de factura válido.",
                en: "Please, enter a valid invoice item id."
            },
            dAmount: {
                sp: "Por favor, ingresa un monto válido como valor monetario positivo.",
                en: "Please, enter a valid amount as a positive monetary value."
            },
            dIVA: {
                sp: "Por favor, ingresa un valor de IVA válido como monto monetario positivo.",
                en: "Please, enter a valid IVA value as a positive monetary amount."
            },
            dRetention: {
                sp: "Por favor, ingresa un valor de retención válido como monto monetario positivo.",
                en: "Please, enter a valid retention value as a positive monetary amount."
            }
        },

        // ========== Accessorials ==============
        Accessorials: {
            sAccessorialId: {
                sp: "Por favor, ingresa un identificador de accesorial válido.",
                en: "Please, enter a valid accessorial id."
            },
            sEntity: {
                sp: "Por favor, selecciona un tipo de entidad válido (CUSTOMER o CARRIER).",
                en: "Please, select a valid entity type (CUSTOMER or CARRIER)."
            },
            sConcept: {
                sp: "Por favor, ingresa un concepto válido (máximo 255 caracteres).",
                en: "Please, enter a valid concept (maximum 255 characters)."
            },
            sDescription: {
                sp: "Por favor, ingresa una descripción válida.",
                en: "Please, enter a valid description."
            },
            dCost: {
                sp: "Por favor, ingresa un costo válido como valor monetario positivo.",
                en: "Please, enter a valid cost as a positive monetary value."
            },
            dCostIVA: {
                sp: "Por favor, ingresa un IVA de costo válido como valor monetario positivo.",
                en: "Please, enter a valid cost IVA as a positive monetary value."
            },
            dCostRetention: {
                sp: "Por favor, ingresa una retención de costo válida como valor monetario positivo.",
                en: "Please, enter a valid cost retention as a positive monetary value."
            },
            dCostToSum: {
                sp: "Por favor, ingresa un costo a sumar válido como valor monetario positivo.",
                en: "Please, enter a valid cost to sum as a positive monetary value."
            },
            dCostToSumIVA: {
                sp: "Por favor, ingresa un IVA de costo a sumar válido como valor monetario positivo.",
                en: "Please, enter a valid cost to sum IVA as a positive monetary value."
            },
            dCostToSumRetention: {
                sp: "Por favor, ingresa una retención de costo a sumar válida como valor monetario positivo.",
                en: "Please, enter a valid cost to sum retention as a positive monetary value."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
            sCurrency: {
                sp: "Por favor, selecciona una moneda válida.",
                en: "Please, select a valid currency."
            }
        },

        // ========== Start ShipmentOrders ==============
        ShipmentOrders: {
            sShipmentOrderId: {
                sp: "Por favor, ingresa un identificador de orden de envío válido.",
                en: "Please, enter a valid shipment order id."
            },
            sShipmentId: {
                sp: "Por favor, ingresa un identificador de envío válido.",
                en: "Please, enter a valid shipment id."
            },
            sEnterpriseId: {
                sp: "Por favor, ingresa un identificador de empresa válido.",
                en: "Please, enter a valid enterprise id."
            },
            tEstimatedDateOfDelivery: {
                sp: "Por favor, ingresa una fecha estimada de entrega válida.",
                en: "Please, enter a valid estimated date of delivery."
            },
            sOrderNumber: {
                sp: "Por favor, ingresa un número de orden válido.",
                en: "Please, enter a valid order number."
            },
            sComments: {
                sp: "Por favor, ingresa un comentario válido.",
                en: "Please, enter a valid comment."
            },
            sAddress: {
                sp: "Por favor, ingresa una dirección válida.",
                en: "Please, enter a valid address."
            },
            sLatitude: {
                sp: "Por favor, ingresa una latitud válida.",
                en: "Please, enter a valid latitude."
            },
            sLongitude: {
                sp: "Por favor, ingresa una longitud válida.",
                en: "Please, enter a valid longitude."
            },
            iPallets: {
                sp: "Por favor, ingresa un número de pallets válido como entero positivo.",
                en: "Please, enter a valid number of pallets as a positive integer."
            },
            dWeight: {
                sp: "Por favor, ingresa un peso válido como valor decimal positivo.",
                en: "Please, enter a valid weight as a positive decimal value."
            },
            sMeasurementUnit: {
                sp: "Por favor, ingresa una unidad de medida válida.",
                en: "Please, enter a valid measurement unit."
            },
            sReference: {
                sp: "Por favor, ingresa una referencia válida.",
                en: "Please, enter a valid reference."
            }
        },

        ShipmentOrderStatuses: {
            sShipmentOrderStatusId: {
                sp: "Por favor, ingresa un identificador de estado de orden de envío válido.",
                en: "Please, enter a valid shipment order status id."
            }
        },

        ShipmentOrderStatusRecords: {
            sShipmentOrderStatusRecordId: {
                sp: "Por favor, ingresa un identificador de registro de estado de orden de envío válido.",
                en: "Please, enter a valid shipment order status record id."
            },
            sShipmentOrderId: {
                sp: "Por favor, ingresa un identificador de orden de envío válido.",
                en: "Please, enter a valid shipment order id."
            },
            sShipmentOrderStatusId: {
                sp: "Por favor, ingresa un identificador de estado de orden de envío válido.",
                en: "Please, enter a valid shipment order status id."
            },
            sComments: {
                sp: "Por favor, ingresa un comentario válido.",
                en: "Please, enter a valid comment."
            },
            sLatitude: {
                sp: "Por favor, ingresa una latitud válida.",
                en: "Please, enter a valid latitude."
            },
            sLongitude: {
                sp: "Por favor, ingresa una longitud válida.",
                en: "Please, enter a valid longitude."
            },
            tRecordDate: {
                sp: "Por favor, ingresa una fecha de registro válida.",
                en: "Please, enter a valid record date."
            }
        },

        // ShipmentOrderFiles validation errors
        ShipmentOrderFiles: {
            sShipmentOrderFileId: {
                sp: "Por favor, ingresa un identificador de archivo de orden de envío válido.",
                en: "Please, enter a valid shipment order file id."
            },
            oFile: {
                sp: "Por favor, ingresa los archivos a subir.",
                en: "Please, enter the files to upload."
            },
            sArrShipmentOrderFileNames: {
                sp: "Por favor, ingresa los nombres de los archivos a subir.",
                en: "Please, enter the file names to upload."
            },
            sArrFileTypes: {
                sp: "Por favor, ingresa los tipos de archivos a subir ('SHIPMENTORDER', 'POD').",
                en: "Please, enter the file types to upload ('SHIPMENTORDER', 'POD')."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de archivo válido ('SHIPMENTORDER', 'POD').",
                en: "Please, enter a valid file type ('SHIPMENTORDER', 'POD')."
            }
        },
        // ========== End ShipmentOrders ==============

        // ========== Start AddressContacts ==============
        AddressContacts: {
            sAddressContactId: {
                sp: "Por favor, ingresa un identificador de contacto correcto.",
                en: "Please, enter a valid contact id."
            },
            sAddressId: {
                sp: "Por favor, ingresa un identificador de dirección válido.",
                en: "Please, enter a valid address id."
            },
            sName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sFullName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo de contacto válida.",
                en: "Please, enter a valid contact email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa una extensión de número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number extension."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de contacto correcto.",
                en: "Please, enter a valid contact type."
            },
            bReceiveEmailNotifications: {
                sp: "Por favor, ingresa un valor válido para recibir notificaciones por correo.",
                en: "Please, enter a valid value for receiving email notifications."
            },
            bReceiveWhatsappNotifications: {
                sp: "Por favor, ingresa un valor válido para recibir notificaciones por WhatsApp.",
                en: "Please, enter a valid value for receiving WhatsApp notifications."
            },
            sNotificationLang: {
                sp: "Por favor, ingresa un idioma de notificación válido.",
                en: "Please, enter a valid notification language."
            }
        },
        // ========== End AddressContacts ==============

        // ========== Start ShipmentOrderContacts ==============
        ShipmentOrderContacts: {
            sShipmentOrderContactId: {
                sp: "Por favor, ingresa un identificador de contacto correcto.",
                en: "Please, enter a valid contact id."
            },
            sShipmentOrderId: {
                sp: "Por favor, ingresa un identificador de orden de envío válido.",
                en: "Please, enter a valid shipment order id."
            },
            sName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sFullName: {
                sp: "Por favor, ingresa un nombre de contacto correcto.",
                en: "Please, enter a valid contact name."
            },
            sEmail: {
                sp: "Por favor, ingresa una dirección de correo de contacto válida.",
                en: "Please, enter a valid contact email."
            },
            sPhoneNumber: {
                sp: "Por favor, ingresa un número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number."
            },
            sPhoneExtension: {
                sp: "Por favor, ingresa una extensión de número de teléfono de contacto correcto.",
                en: "Please, enter a valid contact phone number extension."
            },
            sType: {
                sp: "Por favor, ingresa un tipo de contacto correcto.",
                en: "Please, enter a valid contact type."
            },
            bReceiveEmailNotifications: {
                sp: "Por favor, ingresa un valor válido para recibir notificaciones por correo.",
                en: "Please, enter a valid value for receiving email notifications."
            },
            bReceiveWhatsappNotifications: {
                sp: "Por favor, ingresa un valor válido para recibir notificaciones por WhatsApp.",
                en: "Please, enter a valid value for receiving WhatsApp notifications."
            },
            sNotificationLang: {
                sp: "Por favor, ingresa un idioma de notificación válido.",
                en: "Please, enter a valid notification language."
            }
        },
        // ========== End ShipmentOrderContacts ==============

    }
}