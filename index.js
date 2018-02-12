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

//DATABASE SET UP USING SEQUELIZE/SQLITE
  const sequelize = new Sequelize('database', 'null', 'null', {
    host: 'localhost',
    dialect: 'sqlite',

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    storage: './db/database.db'
  });

// DEFINING A RECOMMENDATIONS MODEL
  let Recommendations = sequelize.define('films', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING
    },
    release_date: {
      type: Sequelize.STRING
    },
    genre: {
      type: Sequelize.STRING
    },
    averageRating: {
      type: Sequelize.INTEGER
    },
    reviews: {
      type: Sequelize.INTEGER
    }
  });

// ROUTES

app.get('/films/:id/recommendations', getFilmRecommendations);

// ERROR HANDLING FOR MISSING ROUTES
app.get('/films/:id/recommendations/notarealroute', (req, res) => {
  res.status(404).json({
    message: 'Key Missing'
  })
});

// ROUTE HANDLER
  // API CALL TO GET REVIEWS USING REQUEST AND GRABBING THE FILM ID PARAMETER IN THE URL
  function getFilmRecommendations(req, res) {
    request(`http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=${req.params.id}`, function (error, response, body) {
    //   console.log('body:', response);

      //DEFINING TWO NEW VARIABLES FOR RELEASE DATE LOGIC
      let plus15;
      let minus15;

      //CREATING A METHOD TO GRAB REVIEWS DATA FROM THIRD PARTY API AND DEFINE AVERAGE RATINGS
      //DEFINING ARRAY AS ALL REVIEWS DATA FROM API CALL
      let arr = JSON.parse(body)[0].reviews;
      function average(arr) {
         let sums = {}, counts = {}, results = [], rating;
         //LOOPING THROUGH ARRAY TO FIND SUM OF RATINGS AND TOTAL COUNT OF REVIEWS
         for (let i = 0; i < arr.length; i++) {
             rating = arr[i].id;
             if (!(rating in sums)) {
                 sums[rating] = 0;
                 counts[rating] = 0;
             }
             sums[rating] += arr[i].rating;
             counts[rating]++;
         }
         //AVERAGE RATING FOUND BY SUMMING ALL RATINGS AND DIVING BY COUNT OF ALL REVIEWS
         for(name in sums) {
             results.push({rating: sums[rating] / counts[rating] });
         }
         return results;
      }
      //SETTING A VARIABLE TO EQUAL THE AVERAGE RATING METHOD RESULT
      let avgRating = average(arr);
      let reviewsCount = JSON.parse(body)[0].reviews.length;
      console.log("rating", avgRating[0].rating);
      console.log("reviews", reviewsCount);

      //FIRST QUERY COMMAND TO FIND THE CHOSEN FILM DATA BY COMPARING THE FILM ID PARAMATER FROM URL
      sequelize.query(`SELECT * FROM films WHERE id == ${req.params.id}`, {type: sequelize.QueryTypes.SELECT})
      .then(chosenFilm => {

        //METHOD TO CREATE A RANGE OF +/- 15 YEARS FROM RELEASE DATE
        plus15 = chosenFilm[0].release_date.split('-');
        minus15 = chosenFilm[0].release_date.split('-');
        plus15[0] = (parseInt(plus15[0])+15).toString();
        minus15[0] = (parseInt(minus15[0])-15).toString();
        console.log("id", plus15.join('-'));

        //SECOND QUERY COMMAND TO SELECT ALL FILMS WITH THE SAME GENRE AND WITHIN RELEASE DATE RANGE AS CHOSEN FILM
        sequelize.query(
          `SELECT * FROM films WHERE genre_id == ${chosenFilm[0].genre_id} AND release_date >= '${minus15.join('-')}' AND release_date <= '${plus15.join('-')}' LIMIT 3`, {type: sequelize.QueryTypes.SELECT})
        .then(films => {
          console.log("films", films);

          //THIRD QUERY COMMAND TO GRAB THE GENRE NAME BY USING THE FILM GENRE ID
          sequelize.query(`SELECT name FROM genres WHERE genres.id == ${films[0].genre_id}`, {type: sequelize.QueryTypes.SELECT})
          // console.log("data", films);
          .then(genre => {
            console.log("id", films.length);
            // Films.findAll().then(recommendations => {

              //SENDING RESPONSE OF FILM RECOMMENDATIONS INCLUDING LIMITS AND OFFSET VALUES
              res.json({recommendations: films, recs: [{id: films[0].id, title: films[0].title, release_date: films[0].release_date, genre: genre[0].name, averageRating: avgRating[0].rating, reviews: JSON.parse(body)[0].reviews.length}], meta: {limit: 1, offset: 0}
                //COMMENTED CODE DISPLAYING CORRECT RECOMMENDATIONS FORMAT, BUT ONLY DISPLAYING ONE RESULT
                //CODE USED ABOVE IS DISPLAYING MULTIPLE FILMS MEETING CRITERIA
                // recommendations: [
                //   {
                //     id: films[0].id,
                //     title: films[0].title,
                //     release_date: films[0].release_date,
                //     genre: genre[0].name,
                //     averageRating: JSON.parse(body)[0].reviews[0].rating,
                //     reviews: JSON.parse(body)[0].reviews.length
                //   }
                // ],
                // meta: {
                //    limit: 1,
                //    offset: 0
                // }
              })
            // })
          })
          // ERROR HANDLING INVALD IDS AND QUERY COMMANDS
          .catch(err => {
            res.status(422).json({
              message: 'Key Missing'
            })
          });
        })
        .catch(err => {
          res.status(422).json({
            message: 'Key Missing'
          })
        });
      })
      .catch(err => {
        res.status(422).json({
          message: 'Key Missing'
        })
      });
    });
  };

module.exports = app;
