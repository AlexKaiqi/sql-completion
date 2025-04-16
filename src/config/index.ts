export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
}; 