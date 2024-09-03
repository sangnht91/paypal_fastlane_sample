export const getPaypalClientID = (): string => {
  return process.env.PAYPAL_CLIENT_ID || 'ARdFH6JLgvNUCjpOfDFu37UI8IOzJtomuRB8otTYITxF56AuNfHYGb3uX1fvpqNneZjcSVjzTq1rYpWY'
}

export const getPaypalSecretKey = (): string => {
  return process.env.PAYPAL_SECRET_KEY || 'EIJXsj5qn8o41dQN9Qy2PF0r8GlLhiyrjk-4Kazh6nWZvsKXA0e7fAZuk2Xer9cAKboRPPOgWgpIfmgx'
}

export const getPaypalBaseEndpoint = (): string => {
  return process.env.PAYPAL_BASE_ENDPOINT || 'https://api-m.sandbox.paypal.com'
}

export const getMongoConnectionString = (): string => {
  return process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27017/'
}

export const getMongoDatabaseName = (): string => {
  return process.env.MONGO_DATABASE_NAME || ''
}