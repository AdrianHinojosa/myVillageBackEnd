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

        // ========== Schools ==========
        Schools: {
            sSchoolId: {
                sp: "Por favor, ingresa un identificador de escuela correcto.",
                en: "Please, enter a valid school id."
            },
            sName: {
                sp: "Por favor, ingresa un nombre de escuela correcto.",
                en: "Please, enter a valid school name."
            },
            sPhone: {
                sp: "Por favor, ingresa un número de teléfono correcto.",
                en: "Please, enter a valid phone number."
            },
            iUsersLimit: {
                sp: "Por favor, ingresa un límite de usuarios correcto.",
                en: "Please, enter a valid users limit."
            },
            iStudentsLimit: {
                sp: "Por favor, ingresa un límite de estudiantes correcto.",
                en: "Please, enter a valid students limit."
            },
            bBlocked: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado bloqueado.",
                en: "Please, enter a true or false value for the blocked status."
            },
            oImage: {
                sp: "Por favor, ingresa la imagen a subir.",
                en: "Please, enter the image to upload."
            },
            bDeleteImage: {
                sp: "Por favor, ingresa si desea borrar la imagen o subir una.",
                en: "Please, specify if the image will be deleted or uploaded."
            },
        },

        // ========== SchoolUsers ==========
        SchoolUsers: {
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
        },

        // ========== Students ==========
        Students: {
            sStudentId: {
                sp: "Por favor, ingresa un identificador de estudiante correcto.",
                en: "Please, enter a valid student id."
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
            sCustomStudentId: {
                sp: "Por favor, ingresa un ID de alumno correcto.",
                en: "Please, enter a valid student ID."
            },
            iBirthYear: {
                sp: "Por favor, ingresa un año de nacimiento correcto.",
                en: "Please, enter a valid birth year."
            },
            sGrade: {
                sp: "Por favor, ingresa un grado correcto.",
                en: "Please, enter a valid grade."
            },
            sGroup: {
                sp: "Por favor, ingresa un grupo correcto.",
                en: "Please, enter a valid group."
            },
            sDiagnosis: {
                sp: "Por favor, ingresa un diagnóstico correcto.",
                en: "Please, enter a valid diagnosis."
            },
            sNotes: {
                sp: "Por favor, ingresa notas correctas.",
                en: "Please, enter valid notes."
            },
        },

        // ========== Goals ==========
        Goals: {
            sGoalId: {
                sp: "Por favor, ingresa un identificador de meta correcto.",
                en: "Please, enter a valid goal id."
            },
            sStudentId: {
                sp: "Por favor, ingresa un identificador de estudiante correcto.",
                en: "Please, enter a valid student id."
            },
            sTitle: {
                sp: "Por favor, ingresa un título correcto.",
                en: "Please, enter a valid title."
            },
            sDescription: {
                sp: "Por favor, ingresa una descripción correcta.",
                en: "Please, enter a valid description."
            },
            sMeasurementType: {
                sp: "Por favor, ingresa un tipo de medición correcto (EXACTITUD, TAREAS, ESCALA, FRECUENCIA, DURACION, OPORTUNIDAD).",
                en: "Please, enter a valid measurement type (EXACTITUD, TAREAS, ESCALA, FRECUENCIA, DURACION, OPORTUNIDAD)."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio correcta.",
                en: "Please, enter a valid start date."
            },
            tTargetDate: {
                sp: "Por favor, ingresa una fecha objetivo correcta.",
                en: "Please, enter a valid target date."
            },
            iTargetValue: {
                sp: "Por favor, ingresa un valor objetivo correcto.",
                en: "Please, enter a valid target value."
            },
            iTargetDuration: {
                sp: "Por favor, ingresa una duración objetivo correcta.",
                en: "Please, enter a valid target duration."
            },
            iScaleMin: {
                sp: "Por favor, ingresa un valor mínimo de escala correcto.",
                en: "Please, enter a valid scale minimum."
            },
            iScaleMax: {
                sp: "Por favor, ingresa un valor máximo de escala correcto.",
                en: "Please, enter a valid scale maximum."
            },
            sFrequencyUnit: {
                sp: "Por favor, ingresa una unidad de frecuencia correcta.",
                en: "Please, enter a valid frequency unit."
            },
            aTasks: {
                sp: "Por favor, ingresa las tareas correctamente.",
                en: "Please, enter the tasks correctly."
            },
            sStatus: {
                sp: "Por favor, ingresa un estado correcto (COMPLETED, NOT_ACHIEVED).",
                en: "Please, enter a valid status (COMPLETED, NOT_ACHIEVED)."
            },
            sCompletionNotes: {
                sp: "Por favor, ingresa notas de cierre correctas.",
                en: "Please, enter valid completion notes."
            },
            iBaselineValue: {
                sp: "Por favor, ingresa un valor de línea base correcto.",
                en: "Please, enter a valid baseline value."
            },
        },

        // ========== GoalTasks ==========
        GoalTasks: {
            sGoalId: {
                sp: "Por favor, ingresa un identificador de meta correcto.",
                en: "Please, enter a valid goal id."
            },
            sGoalTaskId: {
                sp: "Por favor, ingresa un identificador de tarea correcto.",
                en: "Please, enter a valid goal task id."
            },
            sTitle: {
                sp: "Por favor, ingresa un título correcto.",
                en: "Please, enter a valid title."
            },
            bCompleted: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado de la tarea.",
                en: "Please, enter a true or false value for the task completion status."
            },
            iOrder: {
                sp: "Por favor, ingresa un orden correcto.",
                en: "Please, enter a valid order."
            },
        },

        // ========== GoalFiles ==========
        GoalFiles: {
            sGoalFileId: {
                sp: "Por favor, ingresa un identificador de archivo de meta correcto.",
                en: "Please, enter a valid goal file id."
            },
            oFile: {
                sp: "Por favor, ingresa un archivo correcto.",
                en: "Please, enter a valid file."
            },
            sArrGoalFileNames: {
                sp: "Por favor, ingresa los nombres de archivos correctamente.",
                en: "Please, enter the file names correctly."
            },
        },

        // ========== Analytics ==========
        Analytics: {
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
        },

        // ========== TrackingRecords ==========
        TrackingRecords: {
            sTrackingRecordId: {
                sp: "Por favor, ingresa un identificador de registro correcto.",
                en: "Please, enter a valid tracking record id."
            },
            sGoalId: {
                sp: "Por favor, ingresa un identificador de meta correcto.",
                en: "Please, enter a valid goal id."
            },
            dtDate: {
                sp: "Por favor, ingresa una fecha de registro válida.",
                en: "Please, enter a valid record date."
            },
            sNotes: {
                sp: "Por favor, ingresa observaciones válidas.",
                en: "Please, enter valid notes."
            },
            iCorrect: {
                sp: "Por favor, ingresa un valor de aciertos correcto.",
                en: "Please, enter a valid correct count."
            },
            iTotal: {
                sp: "Por favor, ingresa un valor total correcto.",
                en: "Please, enter a valid total count."
            },
            iScaleValue: {
                sp: "Por favor, ingresa un valor de escala correcto.",
                en: "Please, enter a valid scale value."
            },
            iFrequencyCount: {
                sp: "Por favor, ingresa un conteo de frecuencia correcto.",
                en: "Please, enter a valid frequency count."
            },
            iDurationMinutes: {
                sp: "Por favor, ingresa una duración en minutos correcta.",
                en: "Please, enter a valid duration in minutes."
            },
            iSuccessful: {
                sp: "Por favor, ingresa un valor de éxitos correcto.",
                en: "Please, enter a valid successful count."
            },
            iOpportunities: {
                sp: "Por favor, ingresa un valor de oportunidades correcto.",
                en: "Please, enter a valid opportunities count."
            },
            aTasksCompleted: {
                sp: "Por favor, ingresa las tareas completadas correctamente.",
                en: "Please, enter the completed tasks correctly."
            },
            bExcludedFromAverage: {
                sp: "Por favor, ingresa un valor verdadero o falso para la exclusión del promedio.",
                en: "Please, enter a true or false value for average exclusion."
            },
            tStartDate: {
                sp: "Por favor, ingresa una fecha de inicio válida.",
                en: "Please, enter a valid start date."
            },
            tEndDate: {
                sp: "Por favor, ingresa una fecha de fin válida.",
                en: "Please, enter a valid end date."
            },
        },

        // ========== IEPs ==========
        IEPs: {
            sStudentId: {
                sp: "Por favor, ingresa un identificador de estudiante correcto.",
                en: "Please, enter a valid student id."
            },
            sStatus: {
                sp: "Por favor, ingresa un estado correcto (DRAFT, ACTIVE, ARCHIVED).",
                en: "Please, enter a valid status (DRAFT, ACTIVE, ARCHIVED)."
            },
            aExternalServices: {
                sp: "Por favor, ingresa los servicios externos correctamente.",
                en: "Please, enter the external services correctly."
            },
            sParentNames: {
                sp: "Por favor, ingresa los nombres de los padres correctamente.",
                en: "Please, enter the parent names correctly."
            },
            sParentConcerns: {
                sp: "Por favor, ingresa las preocupaciones de los padres correctamente.",
                en: "Please, enter the parent concerns correctly."
            },
            sSchoolAssignment: {
                sp: "Por favor, ingresa la asignación escolar correctamente.",
                en: "Please, enter the school assignment correctly."
            },
            sSchoolAssignmentOther: {
                sp: "Por favor, ingresa la asignación escolar alternativa correctamente.",
                en: "Please, enter the other school assignment correctly."
            },
            sStrengths: {
                sp: "Por favor, ingresa las fortalezas correctamente.",
                en: "Please, enter the strengths correctly."
            },
            sAreasOfOpportunity: {
                sp: "Por favor, ingresa las áreas de oportunidad correctamente.",
                en: "Please, enter the areas of opportunity correctly."
            },
            sCognitiveEvaluations: {
                sp: "Por favor, ingresa las evaluaciones cognitivas correctamente.",
                en: "Please, enter the cognitive evaluations correctly."
            },
            sSubjectGrades: {
                sp: "Por favor, ingresa las calificaciones por materia correctamente.",
                en: "Please, enter the subject grades correctly."
            },
            sEvaluationResults: {
                sp: "Por favor, ingresa los resultados de evaluación correctamente.",
                en: "Please, enter the evaluation results correctly."
            },
            sCommunicationComments: {
                sp: "Por favor, ingresa los comentarios de comunicación correctamente.",
                en: "Please, enter the communication comments correctly."
            },
            sMotorComments: {
                sp: "Por favor, ingresa los comentarios motores correctamente.",
                en: "Please, enter the motor comments correctly."
            },
            sSocioemotionalComments: {
                sp: "Por favor, ingresa los comentarios socioemocionales correctamente.",
                en: "Please, enter the socioemotional comments correctly."
            },
            sIndependenceComments: {
                sp: "Por favor, ingresa los comentarios de independencia correctamente.",
                en: "Please, enter the independence comments correctly."
            },
            aFocusAreas: {
                sp: "Por favor, ingresa las áreas de enfoque correctamente.",
                en: "Please, enter the focus areas correctly."
            },
            sFocusAreasSubjects: {
                sp: "Por favor, ingresa las materias de áreas de enfoque correctamente.",
                en: "Please, enter the focus area subjects correctly."
            },
            aAccommodations: {
                sp: "Por favor, ingresa las adecuaciones correctamente.",
                en: "Please, enter the accommodations correctly."
            },
            sOtherAccommodations: {
                sp: "Por favor, ingresa las otras adecuaciones correctamente.",
                en: "Please, enter the other accommodations correctly."
            },
            bRequiresModifications: {
                sp: "Por favor, ingresa si requiere modificaciones.",
                en: "Please, specify if modifications are required."
            },
            aModifications: {
                sp: "Por favor, ingresa las modificaciones correctamente.",
                en: "Please, enter the modifications correctly."
            },
            aObjectives: {
                sp: "Por favor, ingresa los objetivos correctamente.",
                en: "Please, enter the objectives correctly."
            },
        },

        // ========== SchoolUsersCrud ==========
        SchoolUsersCrud: {
            sSchoolUserId: {
                sp: "Por favor, ingresa un identificador de usuario correcto.",
                en: "Please, enter a valid school user id."
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
            sType: {
                sp: "Por favor, ingresa un tipo de usuario correcto (FACULTY, ADMINISTRATION).",
                en: "Please, enter a valid user type (FACULTY, ADMINISTRATION)."
            },
            bActive: {
                sp: "Por favor, ingresa un valor verdadero o falso para el estado activo.",
                en: "Please, enter a true or false value for active status."
            },
        },

        // ========== Profile ==========
        Profile: {
            sName: {
                sp: "Por favor, ingresa un nombre correcto.",
                en: "Please, enter a valid name."
            },
            sPhone: {
                sp: "Por favor, ingresa un número de teléfono correcto.",
                en: "Please, enter a valid phone number."
            },
            sCurrentPassword: {
                sp: "Por favor, ingresa tu contraseña actual.",
                en: "Please, enter your current password."
            },
            sNewPassword: {
                sp: "Por favor, ingresa una nueva contraseña válida. Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
                en: "Please, enter a valid new password. Must be at least 8 characters with one uppercase, one lowercase, one number, and one special character."
            },
            sConfirmPassword: {
                sp: "Por favor, confirma tu nueva contraseña.",
                en: "Please, confirm your new password."
            },
        },

    }
}