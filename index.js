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
    //   console.log('body:', response);
    //   res.send(body);

    let plus15;
    let minus15;
    sequelize.query(`SELECT * FROM films WHERE id == ${req.params.id}`, { type: sequelize.QueryTypes.SELECT})

      .then(chosenFilm => {
        plus15 = chosenFilm[0].release_date.split('-');
        minus15 = chosenFilm[0].release_date.split('-');
        plus15[0] = (parseInt(plus15[0])+15).toString();
        minus15[0] = (parseInt(minus15[0])-15).toString();

        console.log("id", plus15.join('-'));

        // We don't need spread here, since only the results will be returned for select queries
        sequelize.query(`SELECT * FROM films WHERE genre_id == ${chosenFilm[0].genre_id} AND release_date >= '${minus15.join('-')}' AND release_date <= '${plus15.join('-')}'`, { type: sequelize.QueryTypes.SELECT})

          .then(films => {
            console.log("films", films);
            sequelize.query(`SELECT name FROM genres WHERE genres.id == ${films[0].genre_id}`, { type: sequelize.QueryTypes.SELECT})
            // console.log("data", films);
            // We don't need spread here, since only the results will be returned for select queries
            .then(genre => {
              console.log("id", films.length);
              // films.map((d, i) => {
                res.send({
                  recommendations: [
                    {
                      id: films[0].id,
                      title: films[0].title,
                      release_date: films[0].release_date,
                      genre: genre[0].name,
                      averageRating: null,
                      reviews: null
                    }
                  ]
                })
              // })
            })
          })
          .catch(err => {
            res.status(500).send('Not Implemented');
          })
      })
      .catch(err => {
        res.status(500).send('Not Implemented');
      })
    // })
  }






module.exports = app;
