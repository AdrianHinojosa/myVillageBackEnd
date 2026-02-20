export default {

    // ========== General Modules ============
    UploadImages: {
        FileNotFound: {
            sp: "Por favor, selecciona un archivo correcto.",
            en: "Please, select a correct file."
        },
        FileNameNotFound: {
            sp: "Por favor, selecciona un nombre de archivo correcto.",
            en: "Please, select a correct file name."
        }
    },

    // ==========  Countries ============
    Countries: {
        getCountries: {
            sp: "Países mostrados con éxito.",
            en: "Countries displayed successfully."
        }
    },
    // ==========  States ============
    States: {
        getStates: {
            sp: "Estados mostrados con éxito.",
            en: "States displayed successfully."
        }
    },

    // ==========  Cities ============
    Cities: {
        getCities: {
            sp: "Ciudades mostradas con éxito.",
            en: "Cities displayed successfully."
        }
    },

    // ==========  Authentication ============
    Authentication: {
        login: {
            welcome: (sFullname: string, sLang: 'sp' | 'en'): string => {
                const Translations = {
                    sp: `Bienvenido a My Village ${sFullname}`,
                    en: `Welcome to My Village ${sFullname}`
                }
                return Translations[sLang];
            },
            token: {
                sp: "Token generado con éxito.",
                en: "Token generated successfully."
            }
        },
        session: {
            sessionKilled: {
                sp: "Esta sesión ha finalizado.",
                en: "This session has been finished."
            },
            logout: {
                sp: "Sesión finalizada con éxito.",
                en: "Session ended successfully."
            },
            verifySession: {
                sp: "Por favor, inicie sesión.",
                en: "Please, login."
            },
            expired: {
                sp: "Por seguridad, se ha cerrado tu sesión.",
                en: "For security reasons, you have been logged out."
            }
        },
        recovery: {
            sp: "Se ha actualizado la contraseña exitosamente.",
            en: "The password has been succesfuly updated."
        },

        requestRecovery: {
            sp: "Las instrucciones para la recuperación de contraseña han sido enviadas, revisa tu bandeja de entrada.",
            en: "Recovery password instructions have been sent to your email. Please check your inbox."
        },
    },

    // ==========  Administrators ============
    Administrators: {
        createAdministrator: {
            sp: 'Se creó el usuario administrador exitosamente!',
            en: "The admin user was successfully created."
        },
        updateAdministrator: {
            sp: 'Se actualizó el administrador exitosamente!',
            en: "The administrator was succesfully updated."
        },
        getOneAdministrator: {
            sp: 'Se ha encontrado la información del administrador!',
            en: "The administrator was succesfully found."
        },
        getAllAdministrators: {
            sp: 'Se han encontrado los administradores!',
            en: "The administrators were succesfully found."
        },
        patchAdministratorAccess: {
            sp: 'Se actualizó el estado del administrador exitosamente!',
            en: "The administrator's current status has been succesfully updated."
        },
        deleteAdministrator: {
            sp: 'Se eliminó el administrador exitosamente!',
            en: "The administrator was succesfully deleted."
        }
    },

    // Administrator Messages
    AdministratorModules: {
        getAllAdministratorModules: {
            sp: 'Se han encontrado los módulos de administradores!',
            en: "The administrator modules were succesfully found."
        }
    },


    // ========  Schools ==================
    Schools: {
        createSchool: {
            sp: 'Se creó la escuela exitosamente!',
            en: "The school was created successfully."
        },
        updateSchool: {
            sp: 'Se actualizó la escuela exitosamente!',
            en: "The school was updated successfully."
        },
        getOneSchool: {
            sp: 'Se ha encontrado la información de la escuela!',
            en: "The school was successfully found."
        },
        getAllSchools: {
            sp: 'Se han encontrado las escuelas!',
            en: "The schools were successfully found."
        },
        patchBlocked: {
            sp: 'Se ha actualizado el estado de la escuela y de los usuarios de la escuela exitosamente!',
            en: "The blocked status of the school and school users were updated successfully."
        },
        deleteSchool: {
            sp: 'Se eliminó la escuela exitosamente!',
            en: "The school was successfully deleted."
        },
        uploadSchoolLogo: {
            sp: 'Se actualizó el logo de la escuela exitosamente!',
            en: "The school logo was successfully updated!"
        },
        getAnalytics: {
            sp: 'Se ha obtenido exitosamente la analítica de escuelas',
            en: "The school analytics were successfully found"
        }
    },

    // ========  Students  ==================
    Students: {
        createStudent: {
            sp: 'Se creó el estudiante exitosamente!',
            en: "The student was created successfully."
        },
        updateStudent: {
            sp: 'Se actualizó el estudiante exitosamente!',
            en: "The student was updated successfully."
        },
        getOneStudent: {
            sp: 'Se ha encontrado la información del estudiante!',
            en: "The student was successfully found."
        },
        getAllStudents: {
            sp: 'Se han encontrado los estudiantes!',
            en: "The students were successfully found."
        },
        deleteStudent: {
            sp: 'Se eliminó el estudiante exitosamente!',
            en: "The student was successfully deleted."
        }
    },

    // ========  Goals  ==================
    Goals: {
        createGoal: {
            sp: 'Se creó la meta exitosamente!',
            en: "The goal was created successfully."
        },
        updateGoal: {
            sp: 'Se actualizó la meta exitosamente!',
            en: "The goal was updated successfully."
        },
        getOneGoal: {
            sp: 'Se ha encontrado la información de la meta!',
            en: "The goal was successfully found."
        },
        getAllGoals: {
            sp: 'Se han encontrado las metas!',
            en: "The goals were successfully found."
        },
        completeGoal: {
            sp: 'Se completó la meta exitosamente!',
            en: "The goal was completed successfully."
        },
        deleteGoal: {
            sp: 'Se eliminó la meta exitosamente!',
            en: "The goal was successfully deleted."
        }
    },

    // ========  GoalFiles  ==================
    GoalFiles: {
        createGoalFile: {
            sp: "Se dieron de alta los archivos de la meta exitosamente!",
            en: "The goal files were successfully uploaded."
        },
        getOneGoalFile: {
            sp: "Se ha encontrado la información del archivo de la meta exitosamente!",
            en: "The goal file was successfully found."
        },
        getAllGoalFiles: {
            sp: "Se han encontrado los archivos de la meta!",
            en: "The goal files were successfully found."
        },
        deleteGoalFile: {
            sp: "Se eliminó el archivo de la meta!",
            en: "The goal file was successfully deleted."
        }
    },

    // ========  GoalTasks  ==================
    GoalTasks: {
        createGoalTask: {
            sp: 'Se creó la tarea de la meta exitosamente!',
            en: "The goal task was created successfully."
        },
        getAllGoalTasks: {
            sp: 'Se han encontrado las tareas de la meta!',
            en: "The goal tasks were successfully found."
        },
        updateGoalTask: {
            sp: 'Se actualizó la tarea de la meta exitosamente!',
            en: "The goal task was updated successfully."
        },
        toggleGoalTask: {
            sp: 'Se actualizó el estado de la tarea exitosamente!',
            en: "The goal task status was updated successfully."
        },
        deleteGoalTask: {
            sp: 'Se eliminó la tarea de la meta exitosamente!',
            en: "The goal task was successfully deleted."
        }
    },

};
