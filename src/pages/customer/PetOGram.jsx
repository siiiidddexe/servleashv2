import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, MessageCircle, Send, X, Plus, Clock } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function PetOGram() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const fileRef = useRef();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getPosts(); setPosts(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowCreate(true);
  };

  const handlePost = async () => {
    if (!file) return;
    setPosting(true);
    try {
      await api.createPost(file, caption);
      setShowCreate(false);
      setFile(null); setCaption(""); setPreview(null);
      fetchPosts();
    } catch { /* */ }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    try { await api.likePost(postId); } catch { /* */ }
  };

  const openComments = async (post) => {
    setCommentPost(post);
    try { const c = await api.getComments(post.id); setComments(c); } catch { /* */ }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    try {
      await api.addComment(commentPost.id, commentText);
      setCommentText("");
      const c = await api.getComments(commentPost.id);
      setComments(c);
      setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    } catch { /* */ }
  };

  const handleFollow = async (userId) => {
    setPosts(prev => prev.map(p => p.userId === userId ? { ...p, isFollowing: !p.isFollowing } : p));
    try { await api.followUser(userId); } catch { /* */ }
  };

  const timeAgo = (d) => {
    const mins = Math.floor((Date.now() - new Date(d)) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <h1 className="text-[20px] font-bold text-brand-dark">Pet-O-Gram 🐾</h1>
          </div>
          <button onClick={() => fileRef.current?.click()} className="h-10 w-10 rounded-full bg-brand-orange flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </button>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFile} />
        </div>
        <p className="text-[12px] text-brand-light mt-1">Stories disappear after 24 hours</p>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : posts.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl">📸</div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-4">No stories yet</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">Be the first to share a moment with your pet!</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary mt-5 px-8 flex items-center gap-2"><Camera size={16} /> Share a Moment</button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div key={post.id} className="rounded-2xl bg-white shadow-soft overflow-hidden"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-orange to-amber-400 flex items-center justify-center text-white text-[13px] font-bold">
                      {(post.userName || "U")[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-brand-dark">{post.userName || "User"}</p>
                      <p className="text-[10px] text-brand-light flex items-center gap-1"><Clock size={10} /> {timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleFollow(post.userId)} className={`rounded-full px-3 py-1 text-[11px] font-bold ${post.isFollowing ? "bg-brand-bg text-brand-medium" : "bg-brand-orange text-white"}`}>
                    {post.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>

                {/* Media */}
                {post.mediaUrl && (
                  post.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={post.mediaUrl} controls className="w-full max-h-[400px] object-cover bg-black" />
                  ) : (
                    <img src={post.mediaUrl} alt="" className="w-full max-h-[400px] object-cover bg-gray-50" />
                  )
                )}

                {/* Actions */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5">
                      <Heart size={20} className={post.liked ? "text-brand-red fill-brand-red" : "text-brand-medium"} />
                      <span className="text-[13px] font-semibold text-brand-medium">{post.likes || 0}</span>
                    </button>
                    <button onClick={() => openComments(post)} className="flex items-center gap-1.5">
                      <MessageCircle size={20} className="text-brand-medium" />
                      <span className="text-[13px] font-semibold text-brand-medium">{post.commentCount || 0}</span>
                    </button>
                  </div>
                  {post.caption && <p className="mt-2 text-[13px] text-brand-dark"><span className="font-bold">{post.userName}</span> {post.caption}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-brand-dark">New Post</h2>
                <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              {preview && <img src={preview} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />}
              <input type="text" value={caption} onChange={e => setCaption(e.target.value)} className="input-field" placeholder="Write a caption..." />
              <button onClick={handlePost} disabled={posting || !file} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
                {posting ? <><span className="spinner" /> Posting...</> : "Share Post"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Sheet */}
      <AnimatePresence>
        {commentPost && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setCommentPost(null)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[60vh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-brand-dark">Comments</h2>
                <button onClick={() => setCommentPost(null)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center text-brand-light text-[13px] py-4">No comments yet</p>
                ) : comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-brand-bg flex items-center justify-center text-[10px] font-bold text-brand-medium">
                      {(c.userName || "U")[0]}
                    </div>
                    <div>
                      <p className="text-[12px]"><span className="font-bold text-brand-dark">{c.userName}</span> <span className="text-brand-medium">{c.text}</span></p>
                      <p className="text-[10px] text-brand-light mt-0.5">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-bg">
                <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} className="input-field flex-1"
                  placeholder="Add a comment..." onKeyDown={e => e.key === "Enter" && submitComment()} />
                <button onClick={submitComment} className="h-10 w-10 shrink-0 rounded-full bg-brand-orange flex items-center justify-center">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" activeTab="petogram" />
    </div>
  );
}
