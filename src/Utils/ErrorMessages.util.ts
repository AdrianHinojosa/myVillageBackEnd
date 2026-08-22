//  Error messages.
export default {
    // ============= General Errors ===============
    Pagination: {
        invalidNumber: {
            sp: "El número de página debe de ser un número mayor a 0.",
            en: "The page number must be a number greater than 0"
        },
        maximumNumber: {
            sp: "El número de página ingresado excede el número total de páginas.",
            en: "The page number entered exceeds the total number of pages."
        }
    },

   // ========= File Errors ========
   UploadImages: {
        FileNotFound: {
            sp: "Por favor, selecciona un archivo correcto.",
            en: "Please, select a correct file."
        },
        FileNameNotFound: {
            sp: "Por favor, selecciona un nombre de archivo correcto.",
            en: "Please, select a correct file name."
        },
        invalidFile: {
            sp: "Formato de documento no soportado.",
            en: "File format not supported.",
        },
        s3UploadError: {
            sp: "Error al subir el archivo. Verifique la configuración del servidor.",
            en: "Error uploading file. Please check server configuration."
        },
        moreThanAllowedImages: {
            sp: "Por favor, ingresa solamente una imagen.",
            en: "Please enter only one image.",
        },
        fileCategoriesAndFileAmountsNotMatch: {
            sp: "Por favor, ingresa la misma cantidad de categorías de archivos y archivos.",
            en: "Please, enter the same amount of file categories and files."
        },
        fileNamesAndFileAmountsNotMatch: {
            sp: "Por favor, ingresa la misma cantidad de nombres de archivos y archivos.",
            en: "Please, enter the same amount of file names and files."
        },
        fileTagsAndFileAmountsNotMatch: {
            sp: "Por favor, ingresa la misma cantidad de tags de archivos y archivos.",
            en: "Please, enter the same amount of file tags and files."
        },
        fileTypesAndFileAmountsNotMatch: {
            sp: "Por favor, ingresa la misma cantidad de tipos de archivos y archivos.",
            en: "Please, enter the same amount of file types and files."
        },
    },

    // ============= Authentication Errors ===============
    Authentication: {
        // ========== LOGIN Errors ==========
        login: {
            invalidCredentials: {
                sp: "Las credenciales ingresadas son incorrectas.",
                en: "The credentials entered are incorrect."
            },
            notActivatedAccount: {
                sp: "La cuenta aún no ha sido verificada. Por favor active su cuenta desde su correo o bien contacte al administrador.",
                en: "The account has not been verified. Please activate your account from your email or contact the administrator ."
            },
            blockedFromPlatform: {
                sp: "La cuenta ha sido bloqueada temporlamente, por favor contacte al administrador.",
                en: "The account has been termporarly blocked, please contact the administrator."
            },
        },
        // ========== Revovery Errors ==========
        recovery: {
            notFoundEmail: {
                sp: "No se encontró una cuenta asociada a ese correo electrónico.",
                en: "There does not exist an account associated with that email address."
            },
            tokenNotFound: {
                sp: "Su token ha expirado o no es válido. Por favor, solicite un nuevo reinicio de contraseña.",
                en: "Your token has expired or is not valid. Please request a new password reset."
            },
            passwordsDontMatch: {
                sp: "Su token ha expirado o no es válido. Por favor, solicite un nuevo reinicio de contraseña.",
                en: "Your token has expired or is not valid. Please request a new password reset."
            },
        },
        // ========== Session Errors ==========
        session: {
            verifySession: {
                sp: "Por favor, inicie sesión.",
                en: "Please, login."
            },
            expired: {
                sp: "Por seguridad, se ha cerrado tu sesión.",
                en: "For security reasons, you have been logged out."
            }
        },
        // ========== Other Authentication Errors ==========
        undefinedToken: {
            sp: "Por favor inicie sesión",
            en: "Please login."
        },
        invalidToken: {
            sp: "Token de verificación no válido.",
            en: "Invalid verification token."
        },
        accessDenied: {
            sp: "Accesso denegado.",
            en: "Access denied."
        },
        corruptedToken: {
            sp: "Token inválido.",
            en: "Invalid token."
        },

        // ========== Signup Errors ==========
        signup: {
            userExist: {
                sp: "El correo electrónico de usuario está en uso. Por favor prueba con otro.",
                en: "That user email is already taken. Try another."
            },
        },

    },


    // ============= Country Errors ===============
    Countries: {
        notFound: {
            sp: "El país especificado no existe.",
            en: "The specified country does not exist."
        },
    },
    // ============= States Errors ===============
    States: {
        notFound: {
            sp: "El estado especificado no existe.",
            en: "The specified state does not exist."
        },
    },

    // ============= Cities Errors ===============
    Cities: {
        notFound: {
            sp: "La ciudad especificada no existe.",
            en: "The specified city does not exist."
        },
    },


    // ==== Administrators : =======
    Administrators: {
        modulesNotExist: {
            sp: 'Por favor verifique los módulos ingresados',
            en: 'Please verify that the modules exist',
        },
        notFound: {
            sp: "El administrador especificado no existe.",
            en: "The specified administrator does not exist."
        },
    },

    // ==== Schools: =======
    Schools: {
        notFound: {
            sp: "La escuela especificada no existe.",
            en: "The school does not exist."
        },

        notFoundPermission: {
            sp: "Tu escuela no es parte de la plataforma.",
            en: "Your school is not part of the platform."
        },

        therapistNotAllowed: {
            sp: "Esta función no está disponible en las cuentas de terapeuta.",
            en: "This feature is not available on therapist accounts."
        },

        billingSuspended: {
            sp: "La suscripción de tu colegio está suspendida por falta de pago. Regulariza el pago para restaurar el acceso.",
            en: "Your school's subscription is suspended for non-payment. Settle the payment to restore access."
        },

        notTransferMode: {
            sp: "Este colegio no está en modalidad de pago por transferencia.",
            en: "This school is not in bank-transfer payment mode."
        },

        stripeNotForTransfer: {
            sp: "Este colegio paga por transferencia; no aplica el cobro con tarjeta.",
            en: "This school pays by bank transfer; card billing does not apply."
        },

        bBlockedPermission: {
            sp: "Tu escuela no cuenta con acceso a la plataforma.",
            en: "Your school does not have access to the platform."
        },

        analyticsError: {
            sp: "Error al obtener las analíticas de escuelas.",
            en: "Error fetching school analytics."
        },

    },

    SchoolUsers: {
        modulesNotExist: {
            sp: 'Por favor verifique los módulos ingresados',
            en: 'Please verify that the modules exist',
        },
        notFound: {
            sp: "El usuario de escuela especificado no existe.",
            en: "The specified school user does not exist."
        },
        emailAlreadyExists: {
            sp: "El correo electrónico especificado ya se encuentra utilizado, por favor intenta probar con otro.",
            en: "The specified email address is already in use. Please try another."
        },
        limitReached: {
            sp: "Se ha alcanzado el límite de usuarios para este colegio.",
            en: "The user limit for this school has been reached."
        },
        cannotDeleteMainAdmin: {
            sp: "No se puede eliminar al administrador principal de la escuela.",
            en: "Cannot delete the main school administrator."
        },
        cannotChangeMainAdminType: {
            sp: "No se puede cambiar el tipo del administrador principal de la escuela.",
            en: "Cannot change the type of the main school administrator."
        },
    },

    // ==== Students: =======
    Students: {
        notFound: {
            sp: "El estudiante especificado no existe.",
            en: "The specified student does not exist."
        },
        limitReached: {
            sp: "Se ha alcanzado el límite de estudiantes permitidos para esta escuela.",
            en: "The student limit for this school has been reached."
        },
        // Feature 2 — alumno compartido (folio)
        folioNotFound: {
            sp: "No se encontró un alumno con ese folio, nombre y fecha de nacimiento.",
            en: "No student was found with that folio, name and birth date."
        },
        folioMismatch: {
            sp: "El folio no coincide con el nombre y la fecha de nacimiento.",
            en: "The folio does not match the name and birth date."
        },
        alreadyLinked: {
            sp: "Este alumno ya está registrado en tu institución.",
            en: "This student is already registered in your institution."
        },
    },

    // ==== Goals: =======
    Goals: {
        notFound: {
            sp: "La meta especificada no existe.",
            en: "The specified goal does not exist."
        },
    },

    // ==== GoalFiles: =======
    GoalFiles: {
        notFound: {
            sp: "El archivo de la meta especificado no existe.",
            en: "The specified goal file does not exist."
        },
    },

    // ==== TrackingRecords: =======
    TrackingRecords: {
        notFound: {
            sp: "El registro especificado no existe.",
            en: "The specified tracking record does not exist."
        },
        goalNotActive: {
            sp: "No se pueden agregar registros a metas que no están activas.",
            en: "Cannot add records to goals that are not active."
        },
    },

    // ==== IEPs: =======
    IEPs: {
        notFound: {
            sp: "El IEP especificado no existe.",
            en: "The specified IEP does not exist."
        },
    },

    // ==== Profile: =======
    Profile: {
        userNotFound: {
            sp: "No se encontró el usuario.",
            en: "User not found."
        },
        wrongPassword: {
            sp: "La contraseña actual es incorrecta.",
            en: "The current password is incorrect."
        },
        passwordsDontMatch: {
            sp: "Las contraseñas no coinciden.",
            en: "The passwords do not match."
        },
    },

    // ==== StudentAssignments: =======
    StudentAssignments: {
        notFound: {
            sp: "La asignación especificada no existe.",
            en: "The specified assignment does not exist."
        },
        alreadyAssigned: {
            sp: "Este docente ya está asignado a este estudiante.",
            en: "This teacher is already assigned to this student."
        },
    },

    // ==== GoalTasks: =======
    GoalTasks: {
        notFound: {
            sp: "La tarea de la meta especificada no existe.",
            en: "The specified goal task does not exist."
        },
    },

    // ==== SubGoals: =======
    SubGoals: {
        notFound: {
            sp: "La submeta especificada no existe.",
            en: "The specified subgoal does not exist."
        },
        maxReached: {
            sp: "Una meta puede dividirse en un máximo de 5 submetas.",
            en: "A goal can be divided into a maximum of 5 subgoals."
        },
        nestingNotAllowed: {
            sp: "Una submeta no puede dividirse en más submetas.",
            en: "A subgoal cannot be divided into further subgoals."
        },
        parentHasSubGoals: {
            sp: "Esta meta está dividida en submetas: los registros se capturan en la submeta, no en la meta principal.",
            en: "This goal is divided into subgoals: records must be captured on a subgoal, not on the main goal."
        },
        // P7 sequential (client decision 2026-08-18): only the stage in progress accepts records.
        notActiveStage: {
            sp: "Solo se pueden capturar registros en la etapa en curso. Reactiva esta etapa o captura en la etapa activa.",
            en: "Records can only be captured on the stage in progress. Reactivate this stage, or capture on the active one."
        },
    },

    // ==== Billing (P3): =======
    Billing: {
        stripeNotConfigured: {
            sp: "El módulo de cobranza no está configurado. Contacta al administrador.",
            en: "The billing module is not configured. Please contact the administrator."
        },
        onlyMainUser: {
            sp: "Solo el usuario principal del colegio puede administrar los métodos de pago y la suscripción.",
            en: "Only the school's main user can manage payment methods and the subscription."
        },
        paymentMethodNotFound: {
            sp: "La tarjeta especificada no existe o no pertenece a tu colegio.",
            en: "The specified card does not exist or does not belong to your school."
        },
        cannotRemoveLastCard: {
            sp: "No puedes eliminar tu única tarjeta mientras la suscripción esté activa. Registra otra tarjeta primero o cancela la suscripción.",
            en: "You cannot remove your only card while the subscription is active. Add another card first, or cancel the subscription."
        },
        noSubscription: {
            sp: "Tu colegio no tiene una suscripción activa que cancelar.",
            en: "Your school has no active subscription to cancel."
        },
        noTariff: {
            sp: "Tu colegio no tiene una tarifa configurada. Contacta al administrador.",
            en: "Your school has no configured tariff. Please contact the administrator."
        },
    },

    // ==== Support: =======
    Support: {
        reporterNotFound: {
            sp: "No se pudo identificar al usuario que reporta. Intenta de nuevo.",
            en: "The reporting user could not be identified. Please try again."
        },
        sendTicketFailed: {
            sp: "No se pudo enviar el reporte. Intenta de nuevo.",
            en: "The report could not be sent. Please try again."
        },
    },

};
