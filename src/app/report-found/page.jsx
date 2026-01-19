"use client"
import React, { useState } from 'react';
import { Heart, MapPin, CheckCircle, Package, ShieldCheck, ArrowLeft, Camera, X, PartyPopper, MessageSquare } from 'lucide-react';

const ReportFound = () => {
  // 1. Initial State including Image and Description
  const initialState = {
    itemName: '',
    location: '',
    handedTo: 'Still with me',
    description: '',
    image: null
  };

  const [formData, setFormData] = useState(initialState);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 2. Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 3. Submit and Reset
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulated API Call
    console.log("Final Found Submission:", formData);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Auto-reset form after success animation
      setTimeout(() => {
        setFormData(initialState);
        setImagePreview(null);
        setShowSuccess(false);
      }, 2500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      {/* Visual Accent */}
      <div className="bg-teal-500 h-2 w-full"></div>
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <a href="/">
        <button className="mb-8 flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-all font-bold uppercase text-xs tracking-widest group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit to Home
        </button>
        </a>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left Column: Context */}
          <div className="lg:w-1/3 space-y-8">
            <div className="w-20 h-20 bg-teal-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Heart className="text-teal-500 fill-teal-500" size={32} />
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 leading-[1.1]">
                Found an <span className="text-teal-500">Item?</span>
              </h1>
              <p className="text-xl text-slate-500 mt-6 leading-relaxed">
                You're doing a great thing. Fill in the details to reunite this item with its owner.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
              <ShieldCheck className="text-teal-500 shrink-0" size={24} />
              <p className="text-sm text-slate-600 font-medium">
                <strong>Safety First:</strong> Avoid sharing your personal phone number in the public description.
              </p>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:w-2/3 w-full relative">
            
            {/* Success Animation Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center rounded-[3rem] animate-in fade-in zoom-in duration-500">
                <div className="bg-teal-100 p-6 rounded-full mb-4">
                  <PartyPopper className="text-teal-600 animate-bounce" size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900">Thank You!</h2>
                <p className="text-slate-500 mt-2 font-medium">Your good deed is now live on the feed.</p>
              </div>
            )}

            <div className={`bg-white border-2 border-slate-50 p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-teal-900/10 transition-all duration-500 ${isSubmitting ? 'blur-sm grayscale' : 'blur-0 grayscale-0'}`}>
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Image Upload Section */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-teal-600 uppercase tracking-widest">Snap a Photo</label>
                  {!imagePreview ? (
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-3xl p-10 transition-all flex flex-col items-center justify-center bg-slate-50/30 cursor-pointer">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="text-teal-500" size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Click or Drag to Upload</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden h-56 border-4 border-teal-50 group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => {setImagePreview(null); setFormData(p => ({...p, image: null}))}}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-rose-500 shadow-xl hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Main Title Input */}
                <div className="relative group">
                    <Package className="absolute right-0 top-0 text-slate-100 group-focus-within:text-teal-500 transition-colors" size={44} />
                    <label className="block text-xs font-black text-teal-600 mb-2 uppercase tracking-tighter">Item Name</label>
                    <input 
                      required name="itemName" value={formData.itemName} onChange={handleChange}
                      type="text" placeholder="e.g. Blue JBL Headphones" 
                      className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-100 text-slate-800" 
                    />
                    <div className="h-0.5 w-full bg-slate-100 group-focus-within:bg-teal-500 transition-all mt-2"></div>
                </div>

                {/* 3. Grid for Location and Handover */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 group">
                      <label className="text-xs font-black text-slate-400 uppercase">Found Location</label>
                      <div className="flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl group-focus-within:ring-2 ring-teal-500 transition-all">
                        <MapPin size={18} className="text-teal-500" />
                        <input required name="location" value={formData.location} onChange={handleChange} type="text" placeholder="Gym Area" className="bg-transparent w-full outline-none font-medium text-slate-700" />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-black text-slate-400 uppercase">Handed Over To?</label>
                      <select name="handedTo" value={formData.handedTo} onChange={handleChange} className="w-full bg-slate-50 px-5 py-4 rounded-2xl outline-none font-medium focus:ring-2 ring-teal-500 appearance-none cursor-pointer text-slate-700">
                        <option value="Still with me">Still with me</option>
                        <option value="Security Desk">Security Desk</option>
                        <option value="Admin Office">Admin Office</option>
                      </select>
                    </div>
                </div>

                {/* 4. Description Field */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase">
                    <MessageSquare size={14} className="text-teal-500" /> Description & Details
                  </label>
                  <textarea 
                    required
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="4" 
                    placeholder="Describe specific details (e.g. 'found near table 4', 'has a small crack on the left side')..."
                    className="w-full bg-slate-50 rounded-3xl p-6 outline-none focus:ring-2 ring-teal-500 transition-all font-medium text-slate-700 resize-none border border-transparent focus:bg-white"
                  />
                </div>

                {/* 5. Submit Button */}
                <button 
                  disabled={isSubmitting}
                  type="submit" 
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-teal-600 hover:shadow-teal-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-300"
                >
                  {isSubmitting ? "Uploading Report..." : "Post Found Item"} 
                  {!isSubmitting && <CheckCircle size={24} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFound;