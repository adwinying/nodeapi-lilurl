const path        = require('path')
const favicon			= require('serve-favicon')
const express     = require('express')
const mongoClient = require('mongodb').MongoClient

const app   = express();
const port  = process.env.PORT || 8000
const dbURL = `mongodb://${process.env.LILURL_USER}:${process.env.LILURL_PW}@ds141401.mlab.com:41401/lilurl`

//Set static page
app.use(express.static(path.join(__dirname, 'public')))
//Set favicon
app.use(favicon(path.join(__dirname, 'public/img/favicon.ico')))

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

//Route pages
app.get('/*', (req, res) => {
	console.log('req.params:', req.params[0])

	if (req.params[0].match(/^new\/.+/)) {
		newLinkController(req, res)
	} else {
		getLinkController(req, res)
	}
})

//Create new link
const newLinkController = (req, res) => {
	let url = req.params[0].match(/^new\/https?:\/\/.+\..+/)

	console.log('store url:', url)

	if (url) {
		let oriURL = url[0].replace('new/', '')
		
		mongoClient.connect(dbURL, (err, db) => {
			if (err) throw err

			let collection  = db.collection('urls')
			let isNumUnique = false

			getUniqueNum(collection, (err, uniqueNum) => {
				collection.insertOne({urlid: uniqueNum, oriURL: oriURL}, (err, insResults) => {
					if (err) throw err
					
					console.log('DB insert successful!\n')
					db.close()
					
					res.json({
						originalURL: oriURL,
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

}

//Redirect to original link if found
const getLinkController = (req, res) => {
	let urlid = parseInt(req.params[0])

	console.log('get oriURL:', urlid)
	
	if (!isNaN(urlid)) {
		mongoClient.connect(dbURL, (err, db) => {
			if (err) throw err

			let collection  = db.collection('urls')

			collection.findOne({'urlid': urlid}, (err, findResults) => {
				if (err) throw err

				db.close()

				if (findResults) {
					console.log('urlid found. Redirecting to', findResults.oriURL, '\n')
					res.redirect(findResults.oriURL)
				} else {
					console.log('urlid not found \n')
					res.json({
						error: 'URL not found'
					})
				}
			})
		})
	} else {
		console.log('invalid URL format \n')
		res.json({
			error: 'URL not found. Invalid URL provided'
		})
	}
}


app.listen(port)
console.log('Server started at port', port, '\n')