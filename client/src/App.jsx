import React, { useState, useRef } from 'react';
import html2pdf from "html2pdf.js";
import { Search, History } from 'lucide-react';
import './App.css';

const localMockData = {
  "success": true,
  "data": {
    "domainName": "domainexample.com",
    "registrar": "OwnerXYZ SP.ZOO",
    "dates": { "registration": "12.05.2011", "updated": "08.09.2019", "expiration": "12.05.2029" },
    "status": ["registered", "active"],
    "timeLeft": "2y 125 days left"
  }
};

export default function App() {
  const [domainData] = useState(localMockData.data);
  const [query, setQuery] = useState("");
  const [searchHistory] = useState([
    { name: "domain.name.com", date: "5 minutes ago", status: "active" },
    { name: "github.io", date: "1 hour ago", status: "active" }
  ]);
  const pdfRef = useRef();

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    const options = {
      margin: 0.5,
      filename: `${domainData.domainName}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
  };

    return (
    <div className="main-container">
      <header className="text-center mb-20">
        <h1 className="text-5xl font-bold mb-6 text-white tracking-tight">Looking for current status of domain?</h1>
        <p className="text-[#888] text-lg mb-10">enter below name of domain that you are looking for</p>
        
        <input 
          type="text"
          className="custom-input mb-8"
          placeholder="type here ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <br />
        <button className="bg-[#222] border border-white/10 px-12 py-3 rounded-full text-xs text-[#aaa] uppercase tracking-[0.3em] hover:bg-[#333] transition-all">
          search <Search size={14} className="inline ml-2 text-purple-500" />
        </button>
      </header>

      {domainData && (
        <div ref={pdfRef} className="result-card">
          <div className="flex gap-12">
            <div className="flex-1">
              <h2 className="text-4xl font-bold tracking-widest text-white uppercase mb-10 border-b border-white/10 pb-6">
                {domainData.domainName}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <StatBox title="registration date" value={domainData.dates.registration} />
                <StatBox title="last update" value={domainData.dates.updated} />
                <StatBox title="expiration date" value={domainData.dates.expiration} />
              </div>
              <div className="mt-12 p-8 border-t border-white/5 bg-black/20 rounded-xl">
                 <p className="text-[10px] text-[#666] uppercase tracking-[0.3em] mb-4">linked dns server</p>
              </div>
            </div>

            {/* PRAWA KOLUMNA Z PDF */}
            <div className="w-[300px] flex flex-col gap-6">
              <Badge text="registered" />
              <Badge text="active" color="green" />
              <p className="text-purple-400/50 text-[10px] text-center italic">to expire: {domainData.timeLeft}</p>
              
              <div className="bg-black/30 border border-white/5 rounded-3xl p-10 text-center">
                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-6">ownership</p>
                <div className="w-10 h-10 bg-purple-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                   <div className="w-3 h-3 bg-purple-500 rounded-full blur-[1px]"></div>
                </div>
                <p className="text-sm font-semibold uppercase mb-8">{domainData.registrar}</p>
                
                {/* PRZYCISK PDF TUTAJ */}
                <button onClick={handleDownloadPDF} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all">
                  Download PDF Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY --- */}
      <div className="w-full max-w-[960px] mb-24">
        <p className="text-xs text-[#888] flex items-center gap-2 tracking-[0.2em] font-bold uppercase mb-8 ml-5">
          <History size={16} /> Your latest search history
        </p>
        <div className="grid grid-cols-2 gap-6">
          {searchHistory.map((h, i) => (
            <div key={i} className="bg-[#2F2F2F] border border-white/5 rounded-2xl flex justify-between items-center p-6 px-9 hover:bg-[#353535] transition-all cursor-pointer">
              <span className="text-[#eee] font-semibold text-[12px] tracking-wide">{h.name}</span>
              <span className="text-green-500 font-bold uppercase flex items-center gap-2 text-[10px] tracking-widest">{h.status}</span>
              <span className="text-[#666] text-[10px] italic font-light">{h.date}</span>
            </div>
          ))}
        </div>
      </div>
      <footer className="py-10 text-[10px] text-[#444] tracking-[0.6em] uppercase font-light">2026 ®</footer>
    </div>
  );
}

function StatBox({ title, value }) {
  return (
    <div className="bg-[#151515]/40 border border-white/5 rounded-2xl text-center py-8 px-2 hover:bg-[#151515]/60 transition-colors">
      <p className="text-[9px] text-[#999] uppercase tracking-[0.15em] font-bold mb-4">{title}</p>
      <p className="text-[13px] font-bold text-[#DCDCDC] tracking-tight">{value}</p>
    </div>
  );
}

function Badge({ text, variant }) {
  const styles = variant === 'success' 
    ? "bg-green-500/10 text-green-400 border-green-500/20" 
    : "bg-[#151515]/60 text-[#bbb] border-white/5";
  return (
    <div className={`${styles} py-2.5 rounded-full text-[10px] text-center uppercase tracking-[3px] border`}>{text}</div>
  );
}
