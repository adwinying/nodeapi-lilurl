const path        = require('path')
const express     = require('express')
const mongoClient = require('mongodb').MongoClient

const app   = express();
const port  = process.env.PORT || 8000
const dbURL = `mongodb://${process.env.LILURL_USER}:${process.env.LILURL_PW}@ds141401.mlab.com:41401/lilurl`

//Set static page
app.use(express.static(path.join(__dirname, 'public')))

function getUniqueNum(collection, callback) {
	let randNum = Math.floor(Math.random() * 9000 + 1000)

	collection.find({'urlid': randNum}).toArray((err, findResults) => {
		if (err) throw err

		console.log('getUniqueNum:', randNum)

		if (findResults.length === 0) {
			console.log('Unique urlid found!')
			callback(err, randNum)
		} else {
			console.log('Existing urlid found. Retrying...')
			getUniqueNum(collection)
		}
	})
}

//Create new link
app.get('/new/*', (req, res) => {
	let oriURL = req.params[0].match(/^http(s?):\/\/.+\..+/)

	if (oriURL) {
		
		mongoClient.connect(dbURL, (err, db) => {
			if (err) throw err

			let collection  = db.collection('urls')
			let isNumUnique = false

			getUniqueNum(collection, (err, uniqueNum) => {
				collection.insertOne({urlid: uniqueNum, oriURL: oriURL[0]}, (err, insResults) => {
					if (err) throw err
					
					console.log('DB insert successful!')
					db.close()
					
					res.json({
						originalURL: oriURL[0],
						lilURL: `http://lilurl.nodejs.iadw.in/${uniqueNum}`
					})
				})
			})
		})
		
	} else {
		res.json({
			error: 'Invalid URL'
		})
	}

})

//Redirect to original link if found
app.get('/:urlid', (req, res) => {
	let urlid = parseInt(req.params.urlid)

	console.log(urlid)
	
	mongoClient.connect(dbURL, (err, db) => {
		if (err) throw err

		let collection  = db.collection('urls')

		collection.findOne({'urlid': urlid}, (err, findResults) => {
			if (err) throw err

			db.close()

			if (findResults) {
				console.log('urlid found. Redirecting to', findResults.oriURL)
				res.redirect(findResults.oriURL)
			} else {
				console.log('urlid not found')
				res.json({
					error: 'URL not found'
				})
			}
		})
	})

})

app.listen(port)
console.log('Server started at port', port, '\n')