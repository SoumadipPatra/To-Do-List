//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://soumadippatra:%40SoumadipDB28@soumadip.c0t3khv.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  console.error(error.stack);
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Items", itemsSchema);

const item1 = new Item({
  name: "Welcome to your database."
});

const item2 = new Item({
  name: "Hit the + button to add item."
})

const item3 = new Item({
  name: "<--- Hit this to delete an Item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("Lists", listSchema);

app.get("/", function(req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => console.log('Saved documents successfully!'))
          .catch(err => console.log('Error occurred while saving items!' + err));

        res.redirect("/")  
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
      .then(foundList =>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName); 
      })
  }
});

app.post("/delete", function(req, res){
  const checkID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkID)
    .then((err) =>{
      if(!err){
        console.log("Successfully removed the checked item");
       
      }
      res.redirect("/");
    });
  
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkID}}})
    .then((err) =>{
      res.redirect("/" + listName);
    })
  }



  
});

app.get("/:customListName", function(req,res){
  const customName = _.capitalize(req.params.customListName);
  
  List.findOne({ name: customName })
  .then(foundList => {
    if (!foundList) {
      const list = new List({
        name: customName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customName); 
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  })
  .catch(err => {
    // Handle any errors that occur during the database operation
    console.error(err);
    // Optionally, send an error response to the client
    res.status(500).send("Internal Server Error");
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
