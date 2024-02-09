// app.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = 3001; // Use a different port for the backend

const url = "mongodb://localhost:27017";
const dbName = "fileUpload";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/files", async (req, res) => {
  // Connect to MongoDB
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("uploads");

    // Retrieve and send the list of uploaded files
    const files = await collection.find().toArray();
    res.json(files);
  } finally {
    await client.close();
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Connect to MongoDB
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("uploads");

    // Save file details to MongoDB
    const result = await collection.insertOne({
      filename: req.file.originalname, // Use the original file name
      path: req.file.path,
    });

    console.log(
      `File uploaded and details saved to MongoDB. InsertedId: ${result.insertedId}`
    );

    res.send("File uploaded successfully!");
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
