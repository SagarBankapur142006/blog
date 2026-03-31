const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const streamifier = require("streamifier");
const { v2: cloudinary } = require("cloudinary");

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const mongoUri =
  process.env.MONGO_URI && process.env.MONGO_URI.startsWith("mongodb")
    ? process.env.MONGO_URI
    : "mongodb://127.0.0.1:27017/inkly";

mongoose
  .connect(mongoUri)



  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const userSchema = new mongoose.Schema({
  name: String,
  handle: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  bio: { type: String, default: "New to Inkly. Here to write." },
  avatar: String,
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  followerIds: { type: [String], default: [] },
  followingIds: { type: [String], default: [] },
  color: { type: String, default: "#7c3aed" },
});

const postSchema = new mongoose.Schema({
  authorId: String,
  title: String,
  content: String,
  tags: { type: [String], default: [] },
  image: { type: String, default: "" },
  audio: { type: String, default: "" },
  video: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  postId: String,
  userId: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 });
userSchema.index({ handle: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

const COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981"];

function safeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  const { password, ...rest } = obj;
  return rest;
}

function uploadToCloudinary(file, resourceType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "inkly",
        resource_type: resourceType,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
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

app.post("/follow/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const targetId = req.params.id;

    if (!userId || userId === targetId) {
      return res.status(400).send("Invalid follow request");
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).send("User not found");
    }

    const isFollowing = targetUser.followerIds.includes(userId);

    if (isFollowing) {
      targetUser.followerIds = targetUser.followerIds.filter((id) => id !== userId);
      currentUser.followingIds = currentUser.followingIds.filter((id) => id !== targetId);
    } else {
      targetUser.followerIds = [...targetUser.followerIds, userId];
      currentUser.followingIds = [...currentUser.followingIds, targetId];
    }

    targetUser.followers = targetUser.followerIds.length;
    currentUser.following = currentUser.followingIds.length;

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.send({
      targetUser: safeUser(targetUser),
      currentUser: safeUser(currentUser),
    });
  } catch {
    res.status(500).send("Could not update follow");
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { authorId, title, content, tags = [], image = "", audio = "", video = "" } = req.body;
    if (!authorId || !title || !content) {
      return res.status(400).send("Missing post fields");
    }

    const post = new Post({ authorId, title, content, tags, image, audio, video });
    await post.save();
    res.send(post);
  } catch {
    res.status(500).send("Could not create post");
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).send("Cloudinary is not configured");
    }

    let resourceType = "image";

    if (req.file.mimetype.startsWith("audio/")) {
      resourceType = "video";
    } else if (req.file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    const result = await uploadToCloudinary(req.file, resourceType);
    res.send({
      url: result.secure_url,
      resourceType,
      originalName: req.file.originalname,
    });
  } catch {
    res.status(500).send("Upload failed");
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

app.get("/comments/:postId", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const userIds = [...new Set(comments.map((comment) => comment.userId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const byId = Object.fromEntries(users.map((u) => [String(u._id), safeUser(u)]));

  res.send(
    comments.map((comment) => ({
      ...comment,
      author: byId[String(comment.userId)] || null,
    }))
  );
});

app.post("/comments/:postId", async (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId || !content?.trim()) {
      return res.status(400).send("Comment content is required");
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId,
      content: content.trim(),
    });

    await comment.save();

    const author = await User.findById(userId);

    res.send({
      ...comment.toObject(),
      author: author ? safeUser(author) : null,
    });
  } catch {
    res.status(500).send("Could not add comment");
  }
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
