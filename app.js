console.log ("application is starting");const express = require('express')
const app = express()
const port = 3001

app.get("/", (req,res,next) => {
    console.log ("I received a get request on the path //");
    res.send ("<h1>Self-sOrdering Project/h1>");
})

//app.get('/', (req, res) => {
//  res.send('Hello World!')
//})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})