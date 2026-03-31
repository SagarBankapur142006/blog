import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
const API = process.env.REACT_APP_API || "http://localhost:5000";

const TAGS = [
  "#Tech", "#Life", "#Design", "#Writing", "#Culture", "#Philosophy",
  "#Minimalism", "#UX", "#Wellness", "#Career", "#Personal", "#Art",
];

const glassCard = "bg-slate-900/40 border border-white/8 rounded-3xl backdrop-blur-xl";

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getSession() {
  return JSON.parse(localStorage.getItem("inkly_session") || "null");
}

function saveSession(user) {
  localStorage.setItem("inkly_session", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("inkly_session");
  localStorage.removeItem("token");
}

function persistSession(user, setUser) {
  saveSession(user);
  setUser(user);
}

function Avatar({ user, size = 40, className = "" }) {
  const colors = {
    "#7c3aed": "bg-violet-600",
    "#0ea5e9": "bg-sky-500",
    "#f59e0b": "bg-amber-500",
    "#10b981": "bg-emerald-500",
  };
  const bg = colors[user?.color] || "bg-violet-600";
  const initials =
    user?.avatar ||
    user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ||
    "?";
  const sz = size <= 32 ? "text-xs" : size <= 48 ? "text-sm" : "text-base";

  return (
    <div
      className={`${bg} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${sz} ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function CountPill({ label, value }) {
  return (
    <div className={`${glassCard} px-4 py-3 text-center min-w-[92px]`}>
      <p className="text-white font-semibold">{value}</p>
      <p className="text-gray-500 text-xs uppercase tracking-[0.18em] mt-1">{label}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", prefix }) {
  return (
    <div>
      <label className="text-xs text-gray-400 font-medium mb-1.5 block tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500/60 transition-all duration-200 ${
            prefix ? "pl-8 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

function FilePicker({ label, accept, uploading, fileName, onSelect, onClear, preview }) {
  return (
    <div className={`${glassCard} p-4`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-gray-500 text-xs mt-1">
            {fileName || "Choose from your device"}
          </p>
        </div>
        <label className="px-4 py-2 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-900/20" style={{ background: "linear-gradient(135deg, #334155, #2563eb)" }}>
          {uploading ? "Uploading..." : "Choose File"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {fileName && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 mb-3">
          <p className="text-sm text-gray-300 truncate">{fileName}</p>
          <button
            type="button"
            onClick={onClear}
            className="w-7 h-7 rounded-full border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-400/30 transition-all duration-200 active:scale-95"
          >
            x
          </button>
        </div>
      )}
      {preview}
    </div>
  );
}

function Landing({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", handle: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const submit = async () => {
    setError("");
    try {
      if (mode === "login") {
        const res = await axios.post(`${API}/login`, {
          email: form.email.trim().replace(/^@/, ""),
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        saveSession(res.data.user);
        onAuth(res.data.user);
      } else {
        await axios.post(`${API}/signup`, {
          name: form.name,
          handle: form.handle,
          email: form.email,
          password: form.password,
        });
        const res = await axios.post(`${API}/login`, {
          email: form.email.trim().replace(/^@/, ""),
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        saveSession(res.data.user);
        onAuth(res.data.user);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Auth failed");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ background: "rgba(148,163,184,0.10)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
        style={{ background: "rgba(59,130,246,0.08)" }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-black tracking-tight text-white mb-2"
            style={{ fontFamily: "Georgia, serif", letterSpacing: "-2px" }}
          >
            ink<span style={{ color: "#60a5fa" }}>ly</span>
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase font-medium">
            Write. Connect. Inspire.
          </p>
        </div>

        <div
          className={`rounded-3xl border border-white/10 p-8 transition-all duration-300 ${shake ? "translate-x-2" : ""}`}
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 0 1px rgba(148,163,184,0.10), 0 32px 64px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${
                  mode === m ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <>
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Your name"
                />
                <Input
                  label="Handle"
                  value={form.handle}
                  onChange={(v) => setForm((f) => ({ ...f, handle: v.replace(/\s/g, "").toLowerCase() }))}
                  placeholder="yourhandle"
                  prefix="@"
                />
              </>
            )}
            <Input
              label="Email or Handle"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder={mode === "login" ? "email or @handle" : "you@example.com"}
            />
            <Input
              label="Password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="........"
              type="password"
            />
          </div>

          {error && (
            <p className="mt-4 text-red-400 text-sm text-center bg-red-500/10 rounded-xl py-2 px-3">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!form.email || !form.password}
            className="mt-6 w-full py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #334155, #2563eb)",
              boxShadow: "0 8px 32px rgba(37,99,235,0.24)",
            }}
          >
            {mode === "login" ? "Continue to Inkly ->" : "Start Writing ->"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({ query, open, onClose, onNavigate }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setUsers([]);
      return;
    }

    const load = async () => {
      let res = { data: [] };
      try {
        res = await axios.get(`${API}/users`);
      } catch {}
      const q = query.toLowerCase();
      setUsers(
        res.data.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.handle?.toLowerCase().includes(q)
        )
      );
    };

    load();
  }, [query, open]);

  if (!open || !query.trim() || users.length === 0) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
      style={{ background: "rgba(12,12,24,0.98)", backdropFilter: "blur(24px)" }}
    >
      <div className="p-3">
        <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold px-2 mb-2">
          People
        </p>
        {users.slice(0, 5).map((u) => (
          <button
            key={u._id}
            onClick={() => {
              onNavigate("profile", u._id);
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
          >
            <Avatar user={u} size={32} />
            <div className="text-left">
              <p className="text-white text-sm font-medium">{u.name}</p>
              <p className="text-gray-500 text-xs">@{u.handle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentsSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    let res = { data: [] };
    try {
      res = await axios.get(`${API}/comments/${postId}`);
    } catch {}
    setComments(res.data);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async () => {
    if (!currentUser?._id || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/comments/${postId}`, {
        userId: currentUser._id,
        content,
      });
      setComments((prev) => [...prev, res.data]);
      setContent("");
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>
          Comments
        </h3>
        <span className="text-gray-500 text-sm">{comments.length}</span>
      </div>

      <div className={`${glassCard} p-4 mb-6`}>
        <div className="flex gap-3">
          <Avatar user={currentUser} size={36} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add your thoughts..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 resize-none transition-all duration-200"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={submitComment}
                disabled={!content.trim() || submitting}
                className="px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #334155, #2563eb)" }}
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading comments...</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-3xl mb-2">✦</p>
          <p>No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className={`${glassCard} p-4`}>
              <div className="flex items-start gap-3">
                <Avatar user={comment.author} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white text-sm font-semibold">{comment.author?.name || "Unknown"}</p>
                    <p className="text-gray-500 text-xs">{timeAgo(comment.createdAt)}</p>
                  </div>
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Navbar({ user, onNavigate, searchQuery, setSearchQuery, searchOpen, setSearchOpen, view }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/8 shadow-[0_8px_30px_rgba(0,0,0,0.22)]"
      style={{
        background: "rgba(8,12,24,0.78)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(148,163,184,0.08)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
        <button
          onClick={() => onNavigate("feed")}
          className="text-2xl font-black text-white flex-shrink-0 hover:text-blue-400 transition-colors active:scale-95"
          style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}
        >
          ink<span style={{ color: "#60a5fa" }}>ly</span>
        </button>

        <div className="flex-1 max-w-sm mx-auto relative">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search people..."
              className="w-full bg-white/6 border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
            />
          </div>
          <SearchOverlay query={searchQuery} open={searchOpen && searchQuery.length > 0} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {[["feed", "Home"], ["discover", "Discover"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => onNavigate(v)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                view === v ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate("editor")}
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-blue-900/20 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #334155, #2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.24)" }}
        >
          Write
        </button>

        <div className="relative flex-shrink-0" ref={dropRef}>
          <button onClick={() => setDropOpen(!dropOpen)} className="hover:ring-2 hover:ring-blue-500/50 rounded-full transition-all duration-200 active:scale-95">
            <Avatar user={user} size={36} />
          </button>
          {dropOpen && (
            <div
              className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
              style={{ background: "rgba(15,15,30,0.95)", backdropFilter: "blur(24px)" }}
            >
              <div className="p-4 border-b border-white/8">
                <p className="text-white text-sm font-semibold">{user.name}</p>
                <p className="text-gray-500 text-xs">@{user.handle}</p>
              </div>
              <button
                onClick={() => {
                  onNavigate("profile", user?._id);
                  setDropOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors active:scale-95"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  clearSession();
                  window.location.reload();
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors active:scale-95"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function PostCard({ post, currentUser, onNavigate, onLike }) {
  const author = post.author || { _id: "", name: "Unknown", handle: "writer" };
  const liked = (post.likedBy || []).includes(currentUser?._id);
  const [sparkAnim, setSparkAnim] = useState(false);
  const hasVisualMedia = Boolean(post.image || post.video);

  return (
    <article className="group bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden hover:border-blue-500/20 hover:bg-white/[0.05] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onNavigate("post", post._id)}>
        {post.video ? (
          <video src={post.video} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" muted playsInline />
        ) : (
          <img src={post.image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
        <div className="absolute bottom-3 left-4 flex gap-2 flex-wrap">
          {(post.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full text-blue-200 border border-blue-400/20" style={{ background: "rgba(37,99,235,0.16)" }}>
              {tag}
            </span>
          ))}
          {post.audio && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white border border-white/10" style={{ background: "rgba(15,23,42,0.68)" }}>
              Audio
            </span>
          )}
          {post.video && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white border border-white/10" style={{ background: "rgba(15,23,42,0.68)" }}>
              Video
            </span>
          )}
        </div>
        {!hasVisualMedia && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_42%),linear-gradient(180deg,#162033_0%,#0f172a_100%)]" />}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => author._id && onNavigate("profile", author._id)} className="active:scale-95">
            <Avatar user={author} size={36} />
          </button>
          <div>
            <button onClick={() => author._id && onNavigate("profile", author._id)} className="text-white text-sm font-semibold hover:text-blue-400 transition-colors active:scale-95">
              {author.name}
            </button>
            <p className="text-gray-600 text-xs">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <h2 className="text-white font-bold text-lg leading-tight mb-2 cursor-pointer hover:text-blue-300 transition-colors line-clamp-2" onClick={() => onNavigate("post", post._id)} style={{ fontFamily: "Georgia, serif" }}>
          {post.title}
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-5">{post.content}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSparkAnim(true);
              setTimeout(() => setSparkAnim(false), 400);
              onLike(post._id);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95 ${sparkAnim ? "scale-125" : "scale-100"} ${liked ? "bg-blue-600/20 text-blue-400" : "text-gray-500 hover:text-blue-400 hover:bg-blue-600/10"}`}
          >
            <span>{post.likes || 0}</span>
          </button>
          <button onClick={() => onNavigate("post", post._id)} className="text-xs text-gray-600 hover:text-blue-400 transition-colors font-medium active:scale-95">
            Read 
          </button>
        </div>
      </div>
    </article>
  );
}

function Feed({ currentUser, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/posts`);
      setPosts(res.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLike = async (postId) => {
    await axios.post(`${API}/like/${postId}`, { userId: currentUser?._id });
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likes: (p.likedBy || []).includes(currentUser?._id)
                ? (p.likes || 0) - 1
                : (p.likes || 0) + 1,
              likedBy: (p.likedBy || []).includes(currentUser?._id)
                ? p.likedBy.filter((id) => id !== currentUser?._id)
                : [...(p.likedBy || []), currentUser?._id],
            }
          : p
      )
    );
  };

  const filtered = activeTag ? posts.filter((p) => (p.tags || []).includes(activeTag)) : posts;

  if (loading) {
    return <p className="text-gray-500 text-center mt-10 animate-pulse">Loading...</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-4xl mb-3">✦</p>
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-2xl font-bold mb-6" style={{ fontFamily: "Georgia, serif" }}>
            Your Ink Feed
          </h1>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            <button onClick={() => setActiveTag(null)} className={`px-4 py-1.5 rounded-2xl text-sm font-medium flex-shrink-0 transition-all duration-200 active:scale-95 ${!activeTag ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}>All</button>
            {TAGS.slice(0, 8).map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-4 py-1.5 rounded-2xl text-sm font-medium flex-shrink-0 transition-all duration-200 active:scale-95 ${activeTag === tag ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}>
                {tag}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-4xl mb-3">✦</p>
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map((post) => (
                <PostCard key={post._id} post={post} currentUser={currentUser} onNavigate={onNavigate} onLike={handleLike} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Editor({ currentUser, onNavigate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [audioName, setAudioName] = useState("");
  const [videoName, setVideoName] = useState("");
  const [uploading, setUploading] = useState({ image: false, audio: false, video: false });
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= 5
        ? prev
        : [...prev, tag]
    );
  };

  const uploadMedia = async (file, kind) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading((prev) => ({ ...prev, [kind]: true }));

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (kind === "image") {
        setImageUrl(res.data.url);
        setImageName(file.name);
      }

      if (kind === "audio") {
        setAudioUrl(res.data.url);
        setAudioName(file.name);
      }

      if (kind === "video") {
        setVideoUrl(res.data.url);
        setVideoName(file.name);
      }
    } catch {
      return;
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const clearMedia = (kind) => {
    if (kind === "image") {
      setImageUrl("");
      setImageName("");
    }

    if (kind === "audio") {
      setAudioUrl("");
      setAudioName("");
    }

    if (kind === "video") {
      setVideoUrl("");
      setVideoName("");
    }
  };

  const publish = async () => {
    if (!currentUser?._id) return;
    if (!title.trim() || !content.trim() || selectedTags.length === 0) return;

    try {
      await axios.post(`${API}/posts`, {
        authorId: currentUser?._id,
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        image: imageUrl,
        audio: audioUrl,
        video: videoUrl,
      });
    } catch {
      return;
    }

    setSaved(true);
    setTimeout(() => onNavigate("feed"), 1200);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => onNavigate("feed")} className="text-gray-500 hover:text-white transition-colors active:scale-95">
          Back
        </button>
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Ink Studio
        </h1>
      </div>

      <div className="space-y-6">
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your headline..." rows={2} className="w-full bg-transparent text-white text-3xl font-bold placeholder-gray-800 outline-none resize-none leading-tight" style={{ fontFamily: "Georgia, serif" }} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell your story..." rows={14} className="w-full bg-transparent text-gray-300 text-base placeholder-gray-800 outline-none resize-none leading-relaxed" />

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95 ${selectedTags.includes(tag) ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}>
              {tag}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <FilePicker
            label="Cover Image"
            accept="image/*"
            uploading={uploading.image}
            fileName={imageName}
            onSelect={(file) => uploadMedia(file, "image")}
            onClear={() => clearMedia("image")}
            preview={
              imageUrl ? (
                <img src={imageUrl} alt="Upload preview" className="w-full h-48 object-cover rounded-2xl border border-white/10" />
              ) : null
            }
          />

          <FilePicker
            label="Audio Story"
            accept="audio/*"
            uploading={uploading.audio}
            fileName={audioName}
            onSelect={(file) => uploadMedia(file, "audio")}
            onClear={() => clearMedia("audio")}
            preview={
              audioUrl ? (
                <audio controls className="w-full">
                  <source src={audioUrl} />
                </audio>
              ) : null
            }
          />

          <FilePicker
            label="Video Clip"
            accept="video/*"
            uploading={uploading.video}
            fileName={videoName}
            onSelect={(file) => uploadMedia(file, "video")}
            onClear={() => clearMedia("video")}
            preview={
              videoUrl ? (
                <video controls className="w-full rounded-2xl border border-white/10">
                  <source src={videoUrl} />
                </video>
              ) : null
            }
          />
        </div>

        <button onClick={publish} disabled={uploading.image || uploading.audio || uploading.video} className="px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-95 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #334155, #2563eb)" }}>
          {saved ? "Published!" : "Publish Ink"}
        </button>
      </div>
    </div>
  );
}

function PostView({ postId, currentUser, onNavigate }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let res = { data: [] };
      try {
        res = await axios.get(`${API}/posts`);
      } catch {}
      setPost(res.data.find((x) => x._id === postId) || null);
      setLoading(false);
    };
    load();
  }, [postId]);

  const handleLike = async () => {
    await axios.post(`${API}/like/${postId}`, { userId: currentUser?._id });

    setPost((prev) => {
      if (!prev) return prev;

      const liked = (prev.likedBy || []).includes(currentUser?._id);

      return {
        ...prev,
        likes: liked ? (prev.likes || 0) - 1 : (prev.likes || 0) + 1,
        likedBy: liked
          ? prev.likedBy.filter((id) => id !== currentUser?._id)
          : [...(prev.likedBy || []), currentUser?._id],
      };
    });
  };

  if (loading) return <p className="text-gray-500 text-center mt-10 animate-pulse">Loading...</p>;
  if (!post) return <p className="text-gray-500 text-center mt-10">Post not found</p>;

  const author = post.author || { _id: "", name: "Unknown Author", handle: "writer" };
  const liked = (post.likedBy || []).includes(currentUser?._id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={() => onNavigate("feed")} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm active:scale-95">
        Back to Feed
      </button>

      <div className="flex gap-2 flex-wrap mb-4">
        {(post.tags || []).map((tag) => (
          <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full text-blue-300 border border-blue-400/20" style={{ background: "rgba(37,99,235,0.16)" }}>
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
        {post.title}
      </h1>

      <div className={`p-5 mb-8 ${glassCard}`}>
        <div className="flex items-center gap-3">
          <Avatar user={author} size={44} />
          <div>
            <p className="text-white font-semibold">{author.name}</p>
            <p className="text-gray-600 text-sm">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
      </div>

      {post.image && <img src={post.image} alt={post.title} className="w-full h-64 object-cover rounded-3xl mb-8" />}

      {post.video && (
        <video controls className="w-full rounded-3xl mb-8 border border-white/10">
          <source src={post.video} />
        </video>
      )}

      {post.audio && (
        <div className={`${glassCard} p-4 mb-8`}>
          <p className="text-white text-sm font-semibold mb-3">Audio narration</p>
          <audio controls className="w-full">
            <source src={post.audio} />
          </audio>
        </div>
      )}

      <div className="text-gray-300 leading-loose text-lg space-y-4">
        {(post.content || "").split("\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-white/8">
        <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-900/20 ${liked ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-gray-400 border border-white/10"}`}>
          {post.likes} Sparks
        </button>
      </div>

      <CommentsSection postId={postId} currentUser={currentUser} />
    </div>
  );
}

function Profile({ userId, currentUser, onNavigate, onSessionUpdate }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let userRes = { data: null };
      let postsRes = { data: [] };

      try {
        [userRes, postsRes] = await Promise.all([
          axios.get(`${API}/users/${userId}`),
          axios.get(`${API}/posts`),
        ]);
      } catch {}

      setUser(userRes.data);
      setPosts(postsRes.data.filter((post) => post.authorId === userId));
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <p className="text-gray-500 text-center mt-10 animate-pulse">Loading...</p>;
  if (!user) return <p className="text-gray-500 text-center mt-10">Profile not found</p>;

  const isOwn = userId === currentUser?._id;
  const isFollowing = (currentUser?.followingIds || []).includes(userId);

  const handleFollow = async () => {
    const res = await axios.post(`${API}/follow/${userId}`, { userId: currentUser?._id });
    setUser(res.data.targetUser);
    onSessionUpdate(res.data.currentUser);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="h-40 rounded-3xl overflow-hidden mb-6" style={{ background: `linear-gradient(135deg, rgba(148,163,184,0.18), rgba(37,99,235,0.08))` }} />
      <div className="flex items-end gap-5 -mt-14 pl-6 mb-8">
        <div className="ring-4 ring-gray-950 rounded-full">
          <Avatar user={user} size={80} />
        </div>
        <div className="flex-1 pb-2">
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{user.name}</h1>
          <p className="text-gray-500 text-sm">@{user.handle}</p>
        </div>
        {!isOwn && (
          <button
            onClick={handleFollow}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
              isFollowing
                ? "bg-white/5 text-gray-300 border border-white/10"
                : "text-white hover:shadow-lg hover:shadow-blue-900/20"
            }`}
            style={!isFollowing ? { background: "linear-gradient(135deg, #334155, #2563eb)" } : {}}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div className={`${glassCard} p-5 mb-8`}>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">{user.bio}</p>
        <div className="flex flex-wrap gap-3">
          <CountPill label="Inks" value={posts.length} />
          <CountPill label="Followers" value={user.followers || 0} />
          <CountPill label="Following" value={user.following || 0} />
        </div>
      </div>

      <h2 className="text-white font-semibold mb-5">
        {isOwn ? "Your Inks" : `Inks by ${user.name}`} <span className="text-gray-600 font-normal text-sm">({posts.length})</span>
      </h2>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">✦</p>
          <p>No posts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onNavigate={onNavigate}
              onLike={async (id) => {
                await axios.post(`${API}/like/${id}`, { userId: currentUser?._id });

                setPosts((prev) =>
                  prev.map((p) =>
                    p._id === id
                      ? {
                          ...p,
                          likes: (p.likedBy || []).includes(currentUser?._id)
                            ? (p.likes || 0) - 1
                            : (p.likes || 0) + 1,
                          likedBy: (p.likedBy || []).includes(currentUser?._id)
                            ? p.likedBy.filter((x) => x !== currentUser?._id)
                            : [...(p.likedBy || []), currentUser?._id],
                        }
                      : p
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Discover({ currentUser, onNavigate, onSessionUpdate }) {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let postsRes = { data: [] };
      let usersRes = { data: [] };

      try {
        [postsRes, usersRes] = await Promise.all([
          axios.get(`${API}/posts`),
          axios.get(`${API}/users`),
        ]);
      } catch {}

      setPosts(postsRes.data.sort((a, b) => (b.likes || 0) - (a.likes || 0)));
      setUsers(usersRes.data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-gray-500 text-center mt-10 animate-pulse">Loading...</p>;

  const handleFollow = async (profileId) => {
    const res = await axios.post(`${API}/follow/${profileId}`, { userId: currentUser?._id });
    setUsers((prev) => prev.map((u) => (u._id === profileId ? res.data.targetUser : u)));
    onSessionUpdate(res.data.currentUser);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-white text-2xl font-bold mb-8" style={{ fontFamily: "Georgia, serif" }}>Discover</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-4">Writers to Follow</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u._id} className={`w-full flex items-center gap-4 p-4 text-left hover:border-blue-500/20 hover:bg-white/[0.05] hover:scale-[1.02] transition-all duration-200 ${glassCard}`}>
                <button onClick={() => onNavigate("profile", u._id)} className="active:scale-95">
                  <Avatar user={u} size={48} />
                </button>
                <button onClick={() => onNavigate("profile", u._id)} className="flex-1 min-w-0 text-left active:scale-95">
                  <p className="text-white font-semibold">{u.name}</p>
                  <p className="text-gray-500 text-sm truncate">{u.bio}</p>
                </button>
                {u._id !== currentUser?._id && (
                  <button
                    onClick={() => handleFollow(u._id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      (currentUser?.followingIds || []).includes(u._id)
                        ? "bg-white/5 text-gray-300 border border-white/10"
                        : "text-white"
                    }`}
                    style={(currentUser?.followingIds || []).includes(u._id) ? {} : { background: "linear-gradient(135deg, #334155, #2563eb)" }}
                  >
                    {(currentUser?.followingIds || []).includes(u._id) ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-4">Top Inks</h2>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post, i) => (
              <button key={post._id} onClick={() => onNavigate("post", post._id)} className={`w-full flex items-start gap-4 p-4 text-left hover:border-blue-500/20 hover:bg-white/[0.05] hover:scale-[1.02] transition-all duration-200 active:scale-95 ${glassCard}`}>
                <span className="text-3xl font-black text-white/10 leading-none" style={{ fontFamily: "Georgia, serif" }}>0{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{post.title}</p>
                  <p className="text-gray-600 text-xs mt-1">by {post.author?.name || "Unknown"} · {post.likes || 0} sparks</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("feed");
  const [viewParam, setViewParam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);

    const initialState = window.history.state;
    if (initialState?.inklyView) {
      setView(initialState.inklyView);
      setViewParam(initialState.inklyParam ?? null);
    } else {
      window.history.replaceState(
        { inklyView: "feed", inklyParam: null },
        "",
        window.location.href
      );
    }

    setReady(true);
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (!state?.inklyView) return;
      setView(state.inklyView);
      setViewParam(state.inklyParam ?? null);
      setSearchQuery("");
      setSearchOpen(false);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateCurrentUser = (nextUser) => {
    persistSession(nextUser, setUser);
  };

  const navigate = (viewName, param = null, options = {}) => {
    const shouldPush = options.pushHistory !== false;
    setView(viewName);
    setViewParam(param);
    setSearchQuery("");
    setSearchOpen(false);

    if (shouldPush) {
      window.history.pushState(
        { inklyView: viewName, inklyParam: param },
        "",
        window.location.href
      );
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (!ready) return null;
  if (!user) return <Landing onAuth={updateCurrentUser} />;

  const renderView = () => {
    switch (view) {
      case "feed":
        return <Feed currentUser={user} onNavigate={navigate} />;
      case "editor":
        return <Editor currentUser={user} onNavigate={navigate} />;
      case "profile":
        return <Profile userId={viewParam || user._id} currentUser={user} onNavigate={navigate} onSessionUpdate={updateCurrentUser} />;
      case "post":
        return <PostView postId={viewParam} currentUser={user} onNavigate={navigate} />;
      case "discover":
        return <Discover currentUser={user} onNavigate={navigate} onSessionUpdate={updateCurrentUser} />;
      default:
        return <Feed currentUser={user} onNavigate={navigate} />;
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 28%), linear-gradient(180deg, #0b1020 0%, #0a0f1a 45%, #09090f 100%)",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #09090f; }
        .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: rgba(59,130,246,0.28); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar
        user={user}
        onNavigate={navigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        view={view}
      />

      <main className="animate-[fadeIn_.35s_ease]">{renderView()}</main>
    </div>
  );
}
