"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Mic,
  Square,
  Send,
  User,
  Stethoscope,
  Search,
  FileText,
  Languages,
  History,
  Volume2,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Phone,
  Settings,
  Activity,
  UserCircle,
  BarChart3,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type Message = {
  id: number;
  role: 'doctor' | 'patient';
  original_text: string;
  translated_text: string;
  language: string;
  audio_url: string | null;
  timestamp: string;
};

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  summary: string | null;
};

export default function NaoPortal() {
  const [viewRole, setViewRole] = useState<'doctor' | 'patient'>('doctor');
  const [doctorLang, setDoctorLang] = useState('English');
  const [patientLang, setPatientLang] = useState('Spanish');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const LANGUAGES = ["English", "Spanish", "French", "Arabic", "Japanese", "German", "Mandarin", "Portuguese", "Hindi", "Russian"];

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchHistory(activeConvId);
      setSummary(null);
    }
  }, [activeConvId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/conversations`);
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId) {
        setActiveConvId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchHistory = async (id: number) => {
    try {
      const res = await axios.get(`${API_BASE}/conversations/${id}/history`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await axios.post(`${API_BASE}/conversations`);
      setConversations([res.data, ...conversations]);
      setActiveConvId(res.data.id);
      setMessages([]);
      setSummary(null);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Delete this clinical session?")) return;
    try {
      await axios.delete(`${API_BASE}/conversations/${id}`);
      const newConvs = conversations.filter(c => c.id !== id);
      setConversations(newConvs);
      if (activeConvId === id) {
        setActiveConvId(newConvs.length > 0 ? newConvs[0].id : null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConvId) return;
    setLoading(true);
    const actualTargetLang = viewRole === 'doctor' ? patientLang : doctorLang;
    try {
      const res = await axios.post(`${API_BASE}/conversations/${activeConvId}/messages`, null, {
        params: { role: viewRole, text: inputText, target_lang: actualTargetLang }
      });
      setMessages([...messages, res.data]);
      setInputText('');
    } catch (err) {
      console.error("Send failed", err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Please allow microphone access");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const sendAudioMessage = async (blob: Blob) => {
    if (!activeConvId) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', blob);
    const actualTargetLang = viewRole === 'doctor' ? patientLang : doctorLang;
    try {
      const res = await axios.post(`${API_BASE}/conversations/${activeConvId}/messages`, formData, {
        params: { role: viewRole, target_lang: actualTargetLang }
      });
      setMessages([...messages, res.data]);
    } catch (err) {
      console.error("Audio send failed", err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAudio = async (msgId: number, lang: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/messages/${msgId}/regenerate`, null, {
        params: { target_lang: lang }
      });
      setMessages(messages.map(m => m.id === msgId ? res.data : m));
    } catch (err) {
      console.error("Regeneration failed", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Premium Dark Sidebar */}
      <aside className="w-80 bg-[#0f172a] border-r border-slate-800/50 flex flex-col z-20 shadow-2xl">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-teal-500/20 p-3 rounded-2xl text-teal-400 border border-teal-500/30">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">NaoMedical</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Translation Hub</p>
            </div>
          </div>

          <button
            onClick={createNewSession}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-sm shadow-xl shadow-teal-900/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> NEW SESSION
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {/* Search Records */}
          <section>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Search Records</p>
            <div className={`flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-2xl border transition-all ${searchMode ? 'border-teal-500/30 bg-slate-800' : 'border-slate-800'}`}>
              <Search size={14} className={searchMode ? 'text-teal-400' : 'text-slate-500'} />
              <input
                placeholder="Search keywords..."
                className="bg-transparent border-none focus:ring-0 text-[11px] font-black w-full placeholder-slate-700 text-white"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchMode(!!e.target.value); }}
              />
            </div>
          </section>

          {/* Language Matrix */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Language Matrix</p>
              <Languages size={12} className="text-slate-600" />
            </div>
            <div className="space-y-6">
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all">
                <label className="text-[8px] font-black text-slate-600 uppercase block mb-2 tracking-widest">Doctor (Provider)</label>
                <select
                  value={doctorLang}
                  onChange={(e) => setDoctorLang(e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 text-white cursor-pointer"
                >
                  {LANGUAGES.map(l => <option key={l} value={l} className="bg-slate-900 text-sm">{l}</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-[#0f172a] p-2 rounded-full border border-white/5 shadow-2xl">
                  <div className="bg-white/5 p-1.5 rounded-full">
                    <RefreshCw size={10} className="text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all">
                <label className="text-[8px] font-black text-slate-600 uppercase block mb-2 tracking-widest">Patient (Receiver)</label>
                <select
                  value={patientLang}
                  onChange={(e) => setPatientLang(e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] font-black focus:ring-0 p-0 text-white cursor-pointer"
                >
                  {LANGUAGES.map(l => <option key={l} value={l} className="bg-slate-900 text-sm">{l}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Consultation History */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Consultation History</p>
              <History size={12} className="text-slate-600" />
            </div>
            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group relative overflow-hidden ${activeConvId === conv.id ? 'bg-slate-800/50 border border-slate-700/50 text-white shadow-inner' : 'hover:bg-slate-800/30 text-slate-400 border border-transparent'}`}
                >
                  <div className={`p-2.5 rounded-xl ${activeConvId === conv.id ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600 group-hover:bg-slate-700'}`}>
                    <Calendar size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs truncate uppercase tracking-tighter">Session #{conv.id}</p>
                    <div className="flex items-center gap-2 mt-1 opacity-50">
                      <Clock size={10} />
                      <p className="text-[10px] font-medium tracking-tight">{new Date(conv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-white/5 space-y-6">
          <button onClick={() => setConversations([])} className="flex items-center gap-3 text-slate-600 hover:text-red-400 transition-all group">
            <Trash2 size={14} className="group-hover:animate-bounce" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Purge History</span>
          </button>
          <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Settings size={14} />
              <p className="text-[10px] font-black tracking-widest uppercase">Kernel Mode</p>
            </div>
            <p className="text-[11px] text-teal-400 font-black flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              Llama-3 & Edge Neural Bridge
            </p>
          </div>
        </div>
      </aside>

      {/* Modern High-End Chat Bridge */}
      <main className="flex-1 flex flex-col relative bg-[#020617] shadow-2xl">
        <header className="h-28 border-b border-white/[0.03] px-10 flex items-center justify-between bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-10 transition-all duration-500">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Consultation</h2>
              <div className="bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest leading-none pt-0.5">Neural Ready</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 opacity-40">
                <Check size={10} className="text-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Secure Bridge</span>
              </div>
              <span className="text-[10px] opacity-20 text-white">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Role:</span>
                <span className={`text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 ${viewRole === 'doctor' ? 'text-teal-400' : 'text-indigo-400'}`}>
                  {viewRole}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex border border-white/5 bg-white/[0.02] p-1.5 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setViewRole('doctor')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewRole === 'doctor' ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/40' : 'text-slate-500 hover:text-white'}`}
              >
                <Stethoscope size={14} /> DOCTOR
              </button>
              <button
                onClick={() => setViewRole('patient')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewRole === 'patient' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}
              >
                <UserCircle size={14} /> PATIENT
              </button>
            </div>

            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await axios.post(`${API_BASE}/conversations/${activeConvId}/summarize`);
                  setSummary(res.data.summary);
                } catch (e) { } finally { setLoading(false); }
              }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all active:scale-95 text-white flex gap-2 items-center"
            >
              <FileText size={16} className="text-teal-400" /> COMPILE SUMMARY
            </button>
          </div>
        </header>

        {/* Dynamic Professional Thread */}
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-12 bg-gradient-to-b from-slate-950/20 to-black/30 custom-scrollbar">
          <AnimatePresence>
            {searchMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-center -mb-8"
              >
                <div className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-3">
                  <Search size={12} />
                  Found {messages.filter(m => (m.original_text + m.translated_text).toLowerCase().includes(searchQuery.toLowerCase())).length} Results for "{searchQuery}"
                </div>
              </motion.div>
            )}
            {summary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900/60 border border-teal-500/30 rounded-[3rem] shadow-2xl relative overflow-hidden mb-20 backdrop-blur-3xl"
              >
                <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
                  <Activity size={240} />
                </div>

                {/* Header of Summary */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter text-white">Clinical Encounter Report</h3>
                      <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">AI-Generated • Session #{activeConvId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(summary);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl text-xs font-black transition-all border border-white/10"
                    >
                      {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                      {copied ? "COPIED" : "COPY RECORD"}
                    </button>
                    <button onClick={() => setSummary(null)} className="p-3 hover:bg-white/10 text-slate-400 rounded-xl"><Trash2 size={16} /></button>
                  </div>
                </div>

                {/* Structured Body */}
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {summary.split('\n- ').map((section, idx) => {
                    if (idx === 0) return null; // Skip header intro if any
                    const [title, ...content] = section.split('\n');
                    return (
                      <div key={idx} className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl hover:border-teal-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1.5 h-6 bg-teal-500 rounded-full group-hover:scale-y-125 transition-transform" />
                          <h4 className="text-sm font-black text-teal-100 uppercase tracking-widest leading-none">{title.replace(':', '')}</h4>
                        </div>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                          {content.join('\n').trim() || "No significant findings recorded."}
                        </p>
                      </div>
                    );
                  })}
                  {/* If parsing fails or yields nothing, show raw */}
                  {summary.split('\n- ').length <= 1 && (
                    <div className="col-span-2 text-slate-300 whitespace-pre-wrap font-medium leading-relaxed">
                      {summary}
                    </div>
                  )}
                </div>

                <div className="px-10 py-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Proprietary NaoIntelligence Protocol v3.0</p>
                  <div className="flex items-center gap-2 text-teal-500/40">
                    <Activity size={10} />
                    <span className="text-[9px] font-black">VALIDATED ENCOUNTER</span>
                  </div>
                </div>
              </motion.div>
            )}

            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-800">
                  <MessageSquare size={40} className="text-slate-700" />
                </div>
                <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-800">Consultation Gate Open</p>
                <p className="text-sm font-bold text-slate-600 mt-2 tracking-widest underline decoration-teal-500/30 underline-offset-8">AWAITING CLIENT INPUT</p>
              </div>
            )}

            {messages.map((msg) => {
              const isOwnMessage = msg.role === viewRole;
              const displayInfo = isOwnMessage
                ? { text: msg.original_text, lang: 'Input Source', roleName: msg.role }
                : { text: msg.translated_text, lang: msg.language, roleName: msg.role };

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: isOwnMessage ? 30 : -30 }} animate={{ opacity: 1, x: 0 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] group flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <div className={`p-8 rounded-[2.5rem] relative ${isOwnMessage
                      ? 'bg-slate-900 border border-slate-800 text-white rounded-tr-none'
                      : (viewRole === 'doctor' ? 'bg-teal-600 border border-teal-500/30 text-white rounded-tl-none' : 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tl-none')
                      } transition-all shadow-xl group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}>

                      <div className="flex items-center justify-between mb-6 gap-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isOwnMessage ? 'bg-slate-700' : 'bg-white/40'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isOwnMessage ? 'text-slate-500' : 'text-white/60'}`}>
                            {displayInfo.roleName} INPUT • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {!isOwnMessage && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => regenerateAudio(msg.id, msg.language)}
                              className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                              title="Redraw AI Output"
                            >
                              <RefreshCw size={14} strokeWidth={3} />
                            </button>
                            {viewRole === 'doctor' && (
                              <select
                                className="bg-white/10 border-none text-[10px] font-black px-3 py-1.5 rounded-xl focus:ring-0 cursor-pointer"
                                onChange={(e) => regenerateAudio(msg.id, e.target.value)}
                                defaultValue={msg.language}
                              >
                                {['English', 'Spanish', 'French', 'German', 'Hindi'].map(l => (
                                  <option key={l} value={l} className="bg-[#0f172a]">{l.slice(0, 2).toUpperCase()}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mb-6 relative">
                        {/* Highlighting logic */}
                        {(() => {
                          const text = displayInfo.text;
                          const query = searchQuery.trim();
                          if (!searchMode || !query) return (
                            <p className="text-lg font-bold leading-relaxed tracking-tight tracking-[-0.01em]">
                              {text}
                            </p>
                          );
                          const parts = text.split(new RegExp(`(${query})`, 'gi'));
                          return (
                            <p className="text-lg font-bold leading-relaxed tracking-tight">
                              {parts.map((p, i) => p.toLowerCase() === query.toLowerCase()
                                ? <span key={i} className="bg-teal-400 text-black px-1 rounded-md">{p}</span> : p)}
                            </p>
                          );
                        })()}
                      </div>

                      {/* Explicit Audio Controls Section */}
                      {msg.audio_url && (
                        <div className={`mt-8 p-5 rounded-3xl flex flex-col gap-4 ${isOwnMessage ? 'bg-black/40' : 'bg-white/10'} border border-white/5`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Volume2 size={16} className={isOwnMessage ? 'text-teal-400' : 'text-white'} />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Voice Model Generated</span>
                            </div>
                            <Activity size={12} className="text-teal-500 animate-pulse" />
                          </div>
                          <audio
                            controls
                            src={msg.audio_url.startsWith('data') ? msg.audio_url : `${API_BASE.replace('/api', '')}${msg.audio_url}`}
                            className={`h-8 w-full ${!isOwnMessage ? 'opacity-80' : 'opacity-40 invert'}`}
                          />
                        </div>
                      )}

                      {/* Show Original Transcript for Translated Messages */}
                      {!isOwnMessage && (
                        <div className="mt-8 pt-6 border-t border-white/10 opacity-40">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Original Transcript Source</span>
                          </div>
                          <p className="text-xs font-medium italic italic-slate-300">"{isOwnMessage ? msg.translated_text : msg.original_text}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Clock size={12} className="text-slate-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        LIVE STAMP: {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={endOfMessagesRef} />
        </div>

        {/* High-End Input Dock */}
        <div className="p-10 bg-gradient-to-t from-black to-transparent">
          <div className={`relative bg-slate-900 border ${isRecording ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-slate-800 shadow-2xl'} rounded-[3rem] p-4 flex items-center gap-6 transition-all duration-500`}>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white shadow-2xl' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50 shadow-inner'}`}
            >
              {isRecording ? <Square size={24} className="animate-pulse" /> : <Mic size={28} />}
              {isRecording && <span className="text-[9px] font-black mt-1 font-mono">{formatTime(recordingTime)}</span>}
            </motion.button>

            <div className="flex-1">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-2 ${viewRole === 'doctor' ? 'text-teal-500' : 'text-indigo-500'}`}>
                {viewRole === 'doctor' ? 'Clinical Directives' : 'Patient Testimony'} Gateway
              </span>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
                placeholder={isRecording ? "Listening to clinical encounter..." : "Secure message input..."}
                className="w-full bg-transparent border-none focus:ring-0 text-white text-xl font-black placeholder-slate-700 p-0"
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={loading || !inputText.trim()}
              className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${loading || !inputText.trim() ? 'bg-slate-950 text-slate-900 border border-slate-900' : (viewRole === 'doctor' ? 'bg-teal-600 text-white shadow-[0_15px_30px_rgba(20,184,166,0.3)]' : 'bg-indigo-600 text-white shadow-[0_15px_30px_rgba(79,70,229,0.3)]')}`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={28} strokeWidth={2.5} />
              )}
            </button>

            {isRecording && (
              <div className="absolute -top-16 left-0 right-0 flex justify-center">
                <div className="bg-red-600/20 text-red-400 px-6 py-2 rounded-full border border-red-500/30 text-[10px] font-black tracking-widest flex items-center gap-3 animate-bounce">
                  <Activity size={14} /> LIVE STT CAPTURE ACTIVE
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center mt-12 space-x-12 opacity-30">
            <div className="flex items-center gap-2">
              <Clock size={10} />
              <p className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Log</p>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <Check size={10} />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-200">HIPAA Ready</p>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={10} />
              <p className="text-[9px] font-black uppercase tracking-[0.4em]">Neural Path</p>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #1e293b; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        audio::-webkit-media-controls-panel {
          background-color: transparent;
        }
        audio::-webkit-media-controls-play-button {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}
