import 'dotenv/config';
import * as joi from 'joi';

interface IEnvVars {
  PORT: number;
  API_BASE_URL: string;

  STRIPE_SECRET_KEY: string;
  STRIPE_ENDPOINT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    API_BASE_URL: joi.string().required(),

    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message} `);
}

const envVars: IEnvVars = value;

export const envs = {
  port: envVars.PORT,
  apiBaseUrl: envVars.API_BASE_URL,

  stripeSecretKey: envVars.STRIPE_SECRET_KEY,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
};
