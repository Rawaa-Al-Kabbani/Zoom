const express = require('express');
const path = require('path');
const fs = require('fs');
const uniqueString = require('unique-string');
const fileUpload = require('express-fileupload');
const dateTime = require('date-time');
const database = require('./database.js');
const PORT = process.env.PORT || 5000;
const app = express();
app.use(fileUpload());
app.use(express.json());

function makeQuery(query, args = []) {
  return new Promise((resolve, reject) => {

    database.query(query, args, function(err, result, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function getProducts() {
  return await makeQuery('SELECT * FROM product ORDER BY date DESC');
}

app.get('/getProducts', async function (request, response) {
  let products = await getProducts();
  response.send(products);
});

async function getUserItems(id) {
  return await makeQuery(`SELECT * FROM product WHERE userid=${id} ORDER BY productid DESC `);
}

app.get('/getUsersItems', async function(req, response) {
  const id = req.query.id;
  let products = await getUserItems(id);
  response.send(products);
});

async function getItemById(id) {
  return await makeQuery(`SELECT * FROM product WHERE productid=${id}`);
}

app.get('/getitembyid', async function(req, response) {
  const id = req.query.id;
  let products = await getItemById(id);
  response.send(products);
});

async function getUsers() {
  return await makeQuery('SELECT * FROM user');
}

app.get('/getUsers', async function (request, response) {
  let users = await getUsers();
  response.send(users);
});

async function getCategories() {
  return await makeQuery('SELECT * FROM category');
}


app.get('/getCategories', async function(request, response) {
  let categories = await getCategories();
  response.send(categories);
});

async function getSubCategories(category) {
  return await makeQuery(
    'SELECT zoom.sub_category.subcategoryname, zoom.sub_category.subcategoryid FROM sub_category WHERE zoom.sub_category.categoryid=?',
    [category],
  );
}

app.post('/getSubCategories', async function(request, response) {
  const category = request.body.category;
  let subCategories = await getSubCategories(category);
  response.send(subCategories);
});
async function getSubCategoryProducts(category) {
  return await makeQuery(
    `SELECT zoom.product.title, zoom.product.description, zoom.product.price, zoom.product.date, zoom.product.imageurl_1, zoom.sub_category.subcategoryname, zoom.category.categoryname, zoom.product.city, zoom.product.productid FROM zoom.product
INNER JOIN zoom.sub_category ON zoom.product.subcategoryid = zoom.sub_category.subcategoryid
INNER JOIN zoom.category ON zoom.category.categoryid = zoom.sub_category.categoryid
where zoom.sub_category.subcategoryid=?
ORDER BY zoom.product.date DESC`,
    [category],
  );
}

app.post('/getSubCategoryProducts', async function(request, response) {
  const category = request.body.category;
  let subCategoryProducts = await getSubCategoryProducts(category);
  response.send(subCategoryProducts);
});
async function getCities() {
  return await makeQuery('SELECT zoom.city.cityname FROM city ORDER BY zoom.city.cityname ASC');
}


app.get('/getCities', async function(request, response) {
  let cites = await getCities();
  response.send(cites);
});

async function getProductsForQuery() {
  return await makeQuery(`SELECT zoom.product.title, zoom.product.description, zoom.product.price, zoom.product.date, zoom.product.imageurl_1, zoom.sub_category.subcategoryname, zoom.category.categoryname, zoom.city.cityname, zoom.product.productid FROM zoom.product
INNER JOIN zoom.sub_category ON zoom.product.subcategoryid = zoom.sub_category.subcategoryid
INNER JOIN zoom.category ON zoom.category.categoryid = zoom.sub_category.categoryid
INNER JOIN zoom.user ON zoom.user.userid = zoom.product.userid
INNER JOIN zoom.city ON zoom.city.cityname = zoom.product.city`);
}

app.post('/queryProducts', async function (request, response) {
  const searchFields = ['title', 'description', 'subcategoryname', 'categoryname', 'cityname'];

  const query = request.body.query.toLowerCase();
  let products = await getProductsForQuery();
  if (query.length > 0) {
    products = products.filter(product => {
      for (let field of searchFields) {
        if (product[field].toLowerCase().indexOf(query) !== -1) {
          return true;
        }
      }
      return false;
    });
  }
  response.send(products);
});

//REGISTER
app.post('/register', (req, response) => {

  const sql = `INSERT INTO user (email, auth_str,username, phonenumber) values ('${req.body.email}','${req.body.password}','${req.body.username}','${req.body.tel}')`;

  database.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return response.status(500).send(err);
    }
    response.json({ sqlMessage: 'Registeration done' });
  });
});

//LOGIN
app.get('/getuser', (req, response) => {
  const email = req.query.email;
  const password = req.query.password;

  const sql = 'SELECT * FROM user WHERE email=? AND auth_str=?';
  database.query(sql, [email, password], (err, result) => {
    if (err) response.send(err);

    if (Array.isArray(result) && result.length === 0) {
      console.log('Bad request', result.length);
      return response.status(400).send('Invalid email or password !!!');
    }
    return response.send(result);
  });
});

//FOR PRODUCT DETAILS PAGE
app.get('/getproduct', (req, response) => {
  const sql =
    'SELECT product.* , user.phonenumber FROM product LEFT JOIN user ON product.userid=user.userid WHERE productid=?';
  database.query(sql, [req.query.id], (err, result) => {
    if (err) response.send(err);
    response.send(result);
  });
});

//POST NEW ITEM
app.post('/postitem', (req, res) => {
  const userid = req.body.userid;
  const title = req.body.title;
  const city = req.body.city;
  const category = req.body.category;
  const price = req.body.price;
  const date = dateTime();
  const desc = req.body.desc;

  const images = [
    req.files.image1,
    req.files.image2,
    req.files.image3,
    req.files.image4,
    req.files.image5,
  ];

  const uniqueName = uniqueString();
  const imageName = images.map(image => {
    if (image !== undefined) {
      return `http://127.0.0.1:5500/images/${uniqueName + '__' + image.name}`;
    } return null

  })


  images.map(image => {
    if (image !== undefined) {
      const imgName = image.name;
      image.mv(`images/${uniqueName + '__' + imgName}`);
    } return null

  })


  const sql = `INSERT INTO product (userid,title, description, price,date, city,subcategoryid, imageurl_1,imageurl_2,imageurl_3,imageurl_4,imageurl_5) values 
  ('${userid}','${title}','${desc}','${price}','${date}','${city}','${category}','${imageName[0]}','${imageName[1]}','${imageName[2]}','${imageName[3]}','${imageName[4]}')`;

  database.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(400).send(err.code);
    }
    res.json({
      sqlMessage: 'Item posted',
    });
  });
});

//UPDATE ITEM
app.put('/updatepost', (req, res) => {
  const id = req.query.id;

  const sql = `UPDATE product SET title='${req.body.title}', price='${req.body.price}', city='${req.body.city}', description='${req.body.desc}' WHERE productid=${id}`;
  database.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(400).send(err);
    }
    res.json({
      sqlMessage: 'done',
    });
  });
});

//DELETE ITEM
app.delete('/deleteUserItem', (req, res) => {
  const images = req.body;
  console.log(images)
  //Delete Images from Images Folder
  images.map(image => {
    const filepath = image;

    const filename = path.parse(filepath).base;

    if (image !== 'null') {

      fs.unlink(`${__dirname}/images/${filename}`, err => {
        if (err) console.log(err);
      });
    }
    return null;
  });
  //
  const id = req.query.id;
  const sql = `DELETE FROM product WHERE productid=${id}`;
  database.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ message: 'error' });
    }
    return res.json({ message: 'Item deleted Successfully' });
  });
});
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
