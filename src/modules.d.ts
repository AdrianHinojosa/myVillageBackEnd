declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'alfa' | 'production' | 'local'
    PROJECT_NAME: string;
    PG_CONNECTION_LOCAL: string;
    PG_SCHEMA_LOCAL: string;
    PG_SCHEMA: string;
    PG_CONNECTION_DEVELOPMENT: string;
    PG_CONNECTION_ALFA: string;
    PG_CONNECTION_PRODUCTION: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    EMAIL_SOURCE: string;
    ADMIN_PHONE: string;
    AWS_BUCKET_IMAGES: string;
    AWS_BUCKET_FILES: string;
    AWS_BUCKET_PUBLIC_IMAGES: string;
    NODE_PORT: string;
    JWT_SECRET: string;
    AES_SECRET: string;
    JWT_ALGORITHM: string;
    HOME_PAGE: string;
    STRIPE_PUBLIC_KEY: string;
    STRIPE_PRIVATE_KEY: string;
  }
}