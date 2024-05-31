const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 9000;

// Middlewares============
const options = {
  origin: [
    'http://localhost:5173',
    'https://altquery.web.app',
    'https://altquery.firebaseapp.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(options));
app.use(express.json());
app.use(cookieParser());
// Veryfy JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  if (token) {
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: 'Unauthorized access' });
      }
      // console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.htex290.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    const helpCallection = client.db('altQueryDB').collection('help');
    const queriesCallection = client.db('altQueryDB').collection('queries');
    const recommendationCallection = client
      .db('altQueryDB')
      .collection('recommendation');

    // JWT Genaret TOKEN and added cookie
    app.post('/jwt', async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
        expiresIn: '1d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          // sameSite: 'none',
        })
        .send({ success: true });
    });
    // Remove token form cookie ============
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.MODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true });
    });

    // Queries added to database
    app.post('/queries', async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await queriesCallection.insertOne(data);
      res.send(result);
    });
    //  get only 8 data from database
    app.get('/latest-queries', async (req, res) => {
      const data = await queriesCallection
        .find()
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.send(data);
    });
    // Get All query data from database
    app.get('/all-queries', async (req, res) => {
      const searchs = req.query.searchs;
      const size = req.query.size;
      const page = parseInt(req.query.page) - 1;
      const query = {
        productName: { $regex: searchs, $options: 'i' },
      };
      // console.log(size, page);
      const data = await queriesCallection
        .find(query)
        .skip(page * parseInt(size))
        .limit(parseInt(size))
        .sort({ _id: -1 })
        .toArray();
      res.send(data);
    });

    // Get All query data length from database
    app.get('/all-queries-len', async (req, res) => {
      const searchs = req.query.searchs;
      const query = {
        productName: { $regex: searchs, $options: 'i' },
      };
      const data = await queriesCallection.countDocuments(query);
      res.send({ data });
    });
    //  get only my added query data from database
    app.get('/my-queries/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(4033).send({ message: 'Forbidden access' });
      }
      const query = { userEmail: email };
      const data = await queriesCallection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(data);
    });

    // Get only select query details data from database
    app.get('/query-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCallection.findOne(query);
      res.send(result);
    });

    //  Update my added query data
    app.put('/my-query-update/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      // console.log(id, { ...data });
      const updateDoc = {
        $set: { ...data },
      };
      const result = await queriesCallection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //  Update Count recomedation product in query data
    app.patch(
      '/recomendaton-count-update/:id',
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await queriesCallection.updateOne(filter, {
          $inc: { recommendationCount: 1 },
        });
        res.send(result);
      }
    );
    //  Update Count recomedation product in query data
    app.patch(
      '/recomendaton-countdecreases-update/:id',
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await queriesCallection.updateOne(filter, {
          $inc: { recommendationCount: -1 },
        });
        res.send(result);
      }
    );

    //  Delete my added query data
    app.delete('/my-queries-delete/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await queriesCallection.deleteOne(query);
      res.send(data);
    });

    //  Recommendation Collection part ==============

    // Recommendation single  data adding
    app.post('/recommendation', verifyToken, async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await recommendationCallection.insertOne(data);
      res.send(result);
    });
    // All Recommendation data for login user
    app.get('/my-recommendations/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { recUserEmail: email };
      const result = await recommendationCallection
        .find(filter)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // All Recommendation for me data for login user
    app.get('/recommendation-for-me/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { userEmails: email };
      const result = await recommendationCallection
        .find(filter)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // Recommendation data get for only opened query
    app.get('/recommended-query/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      // return;
      const filter = { queryId: id };
      const data = await recommendationCallection
        .find(filter)
        .sort({ _id: -1 })
        .toArray();
      res.send(data);
    });

    // My Recommendations single data delete
    app.delete(
      '/my-recommendations-delete/:id',
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await recommendationCallection.deleteOne(filter);
        res.send(result);
      }
    );

    app.post('/help', async (req, res) => {
      const help = req.body;
      console.log(help);
      const resut = helpCallection.insertOne(help);
      res.send(resut);
    });

    //  End all work============
  } catch (err) {
    console.log(err);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
