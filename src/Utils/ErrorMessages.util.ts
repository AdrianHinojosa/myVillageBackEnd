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

    // ==== GoalTasks: =======
    GoalTasks: {
        notFound: {
            sp: "La tarea de la meta especificada no existe.",
            en: "The specified goal task does not exist."
        },
    },

};
