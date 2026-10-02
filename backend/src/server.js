require('dotenv').config()

const app = require('./app')

const port = process.env.PORT || 4000

app.listen(port, '127.0.0.1', () => {
  console.log(`API server listening on http://127.0.0.1:${port}`)
})