const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

  // const Sequelize = require('sequelize');
  const sequelize = new Sequelize('database', 'null', 'null', {
    host: 'localhost',
    dialect: 'sqlite',

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    // SQLite only
    storage: './db/database.db'
  });

  const Films = sequelize.define('films', {
    title: {
      type: Sequelize.STRING
    },
    release_date: {
      type: Sequelize.STRING
    },
    genre_id: {
      type: Sequelize.INTEGER
    }
  });

// ROUTES

app.get('/films/:id/recommendations', getFilmRecommendations);
app.get("*", (req, res) => {
  res.status(500).send("Incorrect path, try again.");
});

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  // request(`http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=${req.params.id}`, function (error, response, body) {
  //   console.log('body:', body);
  //   res.send(body);
  sequelize.query("SELECT * FROM `films`", { type: sequelize.QueryTypes.SELECT})

    .then(films => {
      // We don't need spread here, since only the results will be returned for select queries
      res.json(films)
    })
    .catch(err => {
      res.status(500).send('Not Implemented');
    })
  // })
}





module.exports = app;
