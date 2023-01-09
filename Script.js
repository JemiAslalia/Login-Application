const express = require("express");
const mongodb = require('mongodb');
const serveIndex = require('serve-index');
const nunjucks = require("nunjucks");
const path = require("path");
const cookieParser = require('cookie-parser');

const expressWs = require("express-ws");

const app = express();
const port = 3000;
const ws_app = expressWs(app);
app.use(cookieParser());
const uri = "mongodb+srv://Student:3909@student.tv6txbb.mongodb.net/?retryWrites=true&w=majority";

const client = new mongodb.MongoClient(uri);

async function connectClient(){
    await client.connect();
}

async function insertData(myData){
    const myCol = await client
    .db("Express").collection("userName");
    console.log(myData);
    myCol.insertOne(myData);
}

async function insertQuestion(myQuestion){
    const myCol = await client
    .db("Express").collection("myQuestion");
    myCol.insertOne(myQuestion);
}

let env = nunjucks.configure("views", {
    autoescape: true,
    express: app,
    cache: false
});

async function getProducts() {
    const myColo = await client
      .db("Express").collection("products")
    const cursor = myColo.find({});
    return cursor.toArray();
}

console.log(getProducts());

//serves static files
app.use(express.static(__dirname + "/public"));
app.use("/public", serveIndex(__dirname + "/public", {icons: true}));

app.route("/")
    .get((req,res) => {res.sendFile(__dirname+'/index.html')})

app.use(express.urlencoded({extended:true}))
app.use(express.json());

app.route("/register.html")
    .get((req, res) => { res.sendFile(__dirname + "/public/register.html") })
    .post((req, res) => { })


app.route("/signIn")
    .get((req, res) => { 
        console.log(req.query);
        res.sendFile(__dirname + "/public/signIn.html") })
    .post((req, res) => { })

app.get("/products", (req, res) => {
    getProducts().then(
        products => {
            console.log(products);
            res.render(__dirname + "/views/partials/products.njk", { products: products });
        }
    );

});

app.post("/register", (req,res) => {
    req.body.message = "User data received";
    res.send(req.body);
    insertData(req.body);

    });

    // Websocket
    app.route("/")
    .get((req, res) => {
        res.status(200).sendFile("Assistance.html", {root: path.join(__dirname, "public")});
    });

    app.ws("/accept-msg", (ws, req) => {
        console.log("Web Socket opened");
        const aWss = ws_app.getWss('/accept-msg');
        ws.on("message", (msg) => {
            console.log(JSON.parse(msg));
            let parsed = JSON.parse(msg);
            insertQuestion(parsed);
            aWss.clients.forEach(function (client) {
                client.send(`${parsed.myName} question is: ${parsed.myQuestion}`);
                client.send(`${parsed.myName} Email Address: ${parsed.myEmail}`)
            })
        })
    });

    // Server Side Cookiee
  app.post("/login", (req, res) => {
    const uri = "mongodb+srv://Student:3909@student.tv6txbb.mongodb.net/?retryWrites=true&w=majority";
    const client = new mongodb.MongoClient(uri);
    client.connect(err => {
      const collection = client.db("Express").collection("userName");
      collection.findOne({ email: req.body.email, password: req.body.password }, (err, user) => {
        if (err) {
            console.log(err);
        } else if (user) {
          res.cookie("/products", true, { httpOnly: true });
          res.redirect("/products");
        }
        else{
            res.cookie("register", true, {httpOnly: true});
            res.redirect("/register.html");
        }
    })
})
  });
  

//404 and 500 handlers
app.use ( (req, res) => {
    res.status(404).sendFile(__dirname + "/public/404.html");
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).sendFile(__dirname + "/public/500.html");
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});