require('dotenv').config()
const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port=process.env.PORT || 5000;
const app=express();
// middleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.miz4u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


// Blog related apis
const blogCollection=client.db('blogSite').collection('blogs')
// commentCollection
const commentCollection = client.db('blogSite').collection('comments');


// home page er jonne 
app.get('/sixBlogs',async(req,res)=>{
  const result =await blogCollection.find({}).sort({ createdAt: -1 }).limit(6).toArray();
  res.send(result)
  })

// addblog er jonne
  app.post('/blogs',async(req,res)=>{
    const allBlogs=req.body
    const result=await blogCollection.insertOne(allBlogs)
    res.send(result)
  })

// Backend: Fetch all blogs
app.get('/blogs', async (req, res) => {
  const cursor = blogCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});


 // post a comment

app.post('/comments', async (req, res) => {
  console.log("Incoming Comment Payload:", req.body); // Log request payload

  try {
    const result = await commentCollection.insertOne(req.body);
    res.send(result);
  } catch (error) {
    console.error("Failed to add comment:", error); // Log the error
    res.status(500).send({ message: "Failed to add comment" });
  }
});



app.get('/comments/:blogId', async (req, res) => {
  const blogId = req.params.blogId;

  try {
    // Validate blogId format
    if (!blogId) {
      return res.status(400).send({ message: "Blog ID is required" });
    }

    const comments = await commentCollection
      .find({ blogId: blogId }) // Ensure blogId matches the schema
      .sort({ createdAt: -1 })
      .toArray();

    if (!comments.length) {
      return res.status(404).send({ message: "No comments found for this blog" });
    }

    res.send(comments);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch comments" });
  }
});



// blogDetails
app.get('/blogs/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await blogCollection.findOne(query);
    
res.send(result)
  } catch (error) {
    console.error("Error fetching details:", error);
    res.status(500).send({ message: "Server error" });
  }
});


// update blog
app.put("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  const { title, details, category } = req.body;

  console.log("Blog ID:", id); // Log the ID
  console.log("Request Body:", req.body); // Log the payload

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid Blog ID" });
    }

    const result = await blogCollection.updateOne(
      { _id:new ObjectId(id) },
      { $set: { title, details, category } }
    );

    console.log("Update Result:", result); // Log the result from MongoDB

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Blog not found" });
    }

    res.send({ message: "Blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error); // Log the actual error
    res.status(500).send({ message: "Failed to update blog" });
  }
});




// featuredBlogs
app.get("/blogs", async (req, res) => {
  try {
    // Fetch all blogs from the database
    const blogs = await blogCollection.find({}).toArray();

    // Calculate word count for each blog and sort by word count in descending order
    const topBlogs = blogs
      .map((blog) => ({
        ...blog,
        wordCount: blog.details ? blog.details.split(/\s+/).length : 0, // Calculate word count
      }))
      .sort((a, b) => b.wordCount - a.wordCount) // Sort blogs by word count (descending)
      .slice(0, 10); // Take the top 10 blogs

    res.send(topBlogs); // Send the top blogs to the frontend
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    res.status(500).send({ message: "Failed to fetch featured blogs" });
  }
});



// Add to Watchlist
app.post('/watchList', async (req, res) => {
  const data = req.body;


  // Insert the data into the watchlist collection
  const result = await blogCollection.insertOne(data);

  res.send(result);
});



// Get Watchlist
app.get('/watchList', async (req, res) => {

  // Find all items in the collection
  const cursor = blogCollection.find();
  const result = await cursor.toArray();

  res.send(result);
});



// Remove from Watchlist
app.delete('/watchList/:id', async (req, res) => {
  const id = req.params.id;
  console.log('Removing from watchlist:', id);



  // Delete the item with the specified ID
  const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});






    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('BlogSite is running')
})


app.listen(port,()=>{
    console.log(`BlogSite is running on port : ${port}`);
})