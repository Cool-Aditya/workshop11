const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const mongodb = require("mongodb");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));

let id = Date.now();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + id + path.extname(file.originalname));
  },
});

const maxSize = 1 * 1024 * 1024; // for 1MB

//

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
  limits: { fileSize: maxSize },
});

const MongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017";

MongoClient.connect(
  url,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  (err, client) => {
    if (err) return console.log(err);

    db = client.db("Images");

    app.listen(3000, () => {
      console.log("MongoDB server listening at 3000");
    });
  }
);

//configuring the home route

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//configuring upload file route

app.post("/uploadfile", upload.single("myFile"), (req, res, next) => {
  const file = req.file;

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(file);
});

app.delete("/:id", (req, res) => {
  fs.unlink(`./uploads/${req.params.id}.png`, function (err) {
    if (err) {
      throw err;
    } else {
      res.json({ message: `Deleted item id:${req.params.id}` });
    }
  });
});

// app.post("/:rename", (req, res) => {
//   fs.rename(
//     `./uploads/${req.body.id}.png`,
//     `./uploads/image_${req.body.id}.png`,
//     function (err) {
//       if (err) {
//         throw err;
//       } else {
//         res.json({
//           message: `file image_${req.body.id} is rename as ${req.body.name}`,
//         });
//       }
//     }
//   );
// });

// Multiple file route

// app.post("/uploadmultiple", upload.array("myfiles", 12), (req, res, next) => {
//   const files = req.files;

//   if (!files) {
//     const error = new Error("Please choose files");

//     error.httpStatusCode = 400;

//     return next(error);
//   }

//   res.send(files);
// });

app.post("/uploadFileToDB", upload.single("myFileToDB"), (req, res) => {
  var img = fs.readFileSync(req.file.path);

  var encode_image = img.toString("base64");

  // JSON Object for the image

  var finalImg = {
    contentType: req.file.mimetype,
    path: req.file.path,
    image: new Buffer.from(encode_image, "base64"),
  };

  db.collection("image").insertOne(finalImg, (err, result) => {
    console.log(result);

    if (err) return console.log(err);

    console.log("Saved to database");

    res.contentType(finalImg.contentType);

    res.send(finalImg.image);
  });
});

// Deleting file
// app.post()

app.listen(5000, () => {
  console.log("Server is listening at 5000");
});
