require('dotenv').config()

const app = require('./app')

const port = process.env.PORT || 4000

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`API server listening on port ${port}`)
  })
}

module.exports = app