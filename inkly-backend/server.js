const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  handle: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  bio: { type: String, default: "New to Inkly. Here to write." },
  avatar: String,
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  color: { type: String, default: "#7c3aed" },
});

const postSchema = new mongoose.Schema({
  authorId: String,
  title: String,
  content: String,
  tags: { type: [String], default: [] },
  image: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 });
userSchema.index({ handle: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

const COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981"];

function safeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  const { password, ...rest } = obj;
  return rest;
}

app.post("/signup", async (req, res) => {
  try {
    const { name = "", handle = "", email = "", password = "" } = req.body;

    if (!name || !handle || !email || !password) {
      return res.status(400).send("All fields are required");
    }

    const cleanHandle = handle.trim().replace(/^@/, "").toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const exists = await User.findOne({
      $or: [{ email: cleanEmail }, { handle: cleanHandle }],
    });

    if (exists) return res.status(400).send("Email or handle already taken");

    const hashed = await bcrypt.hash(password, 10);
    const avatar = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const user = new User({
      name,
      handle: cleanHandle,
      email: cleanEmail,
      password: hashed,
      avatar,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    await user.save();
    res.send({ message: "User created", user: safeUser(user) });
  } catch {
    res.status(500).send("Signup failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const raw = (email || "").trim();
    const query = raw.toLowerCase().replace(/^@/, "");

    const user = await User.findOne({
      $or: [{ email: query }, { handle: query }],
    });

    if (!user) return res.status(400).send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Wrong password");

    const token = jwt.sign({ id: user._id }, "secret123");
    res.send({ token, user: safeUser(user) });
  } catch {
    res.status(500).send("Login failed");
  }
});

app.get("/users", async (_req, res) => {
  const users = await User.find().sort({ followers: -1 });
  res.send(users.map(safeUser));
});

app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  res.send(safeUser(user));
});

app.post("/posts", async (req, res) => {
  try {
    const { authorId, title, content, tags = [], image = "" } = req.body;
    if (!authorId || !title || !content) {
      return res.status(400).send("Missing post fields");
    }

    const post = new Post({ authorId, title, content, tags, image });
    await post.save();
    res.send(post);
  } catch {
    res.status(500).send("Could not create post");
  }
});

app.get("/posts", async (_req, res) => {
  const posts = await Post.find().limit(50).sort({ createdAt: -1, _id: -1 }).lean();
  const userIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const byId = Object.fromEntries(users.map((u) => [String(u._id), safeUser(u)]));

  res.send(
    posts.map((post) => ({
      ...post,
      author: byId[String(post.authorId)] || null,
    }))
  );
});

app.post("/like/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (userId) {
      const liked = post.likedBy.includes(userId);
      post.likedBy = liked
        ? post.likedBy.filter((id) => id !== userId)
        : [...post.likedBy, userId];
      post.likes = post.likedBy.length || 0;
    } else {
      post.likes += 1;
    }

    await post.save();
    res.send(post);
  } catch {
    res.status(500).send("Could not update like");
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
