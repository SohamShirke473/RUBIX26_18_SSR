"use client"
import React, { useState } from 'react';
import { Search, MapPin, Calendar, Camera, ArrowLeft, AlertCircle, X, CheckCircle2 } from 'lucide-react';

const ReportLost = () => {
  // 1. Initial State Definition (for easy resetting)
  const initialState = {
    itemName: '',
    location: '',
    dateLost: '',
    description: '',
    image: null
  };

  const [formData, setFormData] = useState(initialState);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 2. Handle Text Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 4. Submit and Reset Logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Backend API Call simulation ---
    console.log("Payload to Backend:", formData);
    
    // Show success state
    setIsSubmitted(true);

    // Reset logic: Clear form after a short delay
    setTimeout(() => {
      setFormData(initialState);
      setImagePreview(null);
      setIsSubmitted(false);
      alert("Report submitted successfully and form cleared!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-all">
      <nav className="p-6 flex items-center justify-between max-w-6xl mx-auto">
        <a href="/">
        <button className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors">
          <ArrowLeft size={20} /> <span className="font-medium">Back</span>
        </button>
        </a>
        <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-teal-500"></div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        <header className="mb-10 text-center">
          <span className="inline-block px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Lost Report
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">What did you lose?</h1>
          <p className="text-slate-500 mt-2">Provide details to help our community find your item.</p>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 p-8 md:p-12 border border-slate-100 relative overflow-hidden">
          
          {/* Submission Overlay (Hackathon "Wow" Factor) */}
          {isSubmitted && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <CheckCircle2 size={80} className="text-teal-500 animate-bounce" />
              <h2 className="text-2xl font-bold mt-4">Reporting Item...</h2>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 uppercase">Item Name</label>
              <input 
                required
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                type="text" 
                placeholder="e.g. Blue JBL Headphones" 
                className="w-full text-2xl font-semibold bg-transparent border-b-2 border-slate-100 focus:border-teal-500 outline-none pb-4 transition-all text-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Location */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-1 uppercase">
                  <MapPin size={16} className="text-teal-500" /> Location
                </label>
                <input 
                  required
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  type="text" 
                  placeholder="Main Library" 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none font-medium" 
                />
              </div>
              
              {/* Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-1 uppercase">
                  <Calendar size={16} className="text-teal-500" /> Date
                </label>
                <input 
                  required
                  name="dateLost"
                  value={formData.dateLost}
                  onChange={handleChange}
                  type="date" 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none text-slate-500 font-medium" 
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 uppercase">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Scratches, stickers, or unique markings..."
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none font-medium resize-none"
              />
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1 uppercase">Photo</label>
              {!imagePreview ? (
                <div className="group relative border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-[2rem] p-20 transition-all flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer">
                  <Camera className="text-teal-400 group-hover:scale-110 transition-transform" size={32} />
                  <p className="mt-2 text-sm font-medium text-slate-400">Click to upload reference</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ) : (
                <div className="relative rounded-[2rem] overflow-hidden h-40 border border-slate-100">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => {setImagePreview(null); setFormData(p => ({...p, image: null}))}}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-rose-500 shadow-md"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-teal-600 hover:shadow-2xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Post Lost Item Search
              <Search size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ReportLost;