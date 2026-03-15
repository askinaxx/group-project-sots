import React, { useState } from 'react';
import { Search, History, ArrowDown } from 'lucide-react';

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

function App() {
  const [domainData] = useState(localMockData.data);
  const [query, setQuery] = useState("");
  const [searchHistory] = useState([
    { name: "domain.name.com", date: "5 minutes ago", status: "active" },
    { name: "domain.name.com", date: "5 minutes ago", status: "active" }
  ]);

  return (
    <div className="min-h-screen text-[#DCDCDC] flex flex-col items-center" 
         style={{ backgroundColor: '#151515', fontFamily: "'Montserrat', sans-serif", padding: '80px 20px' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
      `}</style>

      {/* --- HEADER --- */}
      <header className="text-center w-full max-w-2xl" style={{ marginBottom: '80px' }}>
        <h1 className="text-4xl font-semibold mb-4 text-white tracking-tight">Looking for current status of domain?</h1>
        <p className="text-[#888] text-sm" style={{ marginBottom: '40px' }}>enter below name of domain that you are looking for</p>
        
        <div className="flex flex-col items-center">
          <input 
            type="text"
            className="bg-[#1c1c1c] border border-white/5 rounded-full py-3 px-8 text-center text-sm outline-none focus:border-purple-500/40 shadow-inner"
            style={{ width: '400px', marginBottom: '24px' }}
            placeholder="type here ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="bg-[#222] border border-white/5 px-10 py-2.5 rounded-full text-[11px] text-[#aaa] flex items-center gap-2 hover:bg-[#333] transition-all uppercase tracking-widest">
            search <Search size={14} className="text-purple-400" />
          </button>
        </div>
      </header>

      {/* --- MAIN RESULT CARD --- */}
      {domainData && (
        <div className="rounded-[40px] shadow-2xl border border-white/5" 
             style={{ backgroundColor: '#2F2F2F', width: '960px', padding: '60px', marginBottom: '100px' }}>
          
          <div style={{ display: 'flex', gap: '60px' }}>
            
            {/* Lewa strona */}
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px', marginBottom: '50px' }}>
                <h2 className="text-3xl font-bold tracking-[0.15em] text-white uppercase">{domainData.domainName}</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <StatBox title="registration date" value={domainData.dates.registration} />
                <StatBox title="last update" value={domainData.dates.updated} />
                <StatBox title="expiration date" value={domainData.dates.expiration} />
              </div>

              <div className="bg-[#151515]/40 border border-white/5 rounded-[25px]" style={{ marginTop: '60px', padding: '40px' }}>
                 <p className="text-[10px] text-[#999] uppercase tracking-[0.2em] font-bold" style={{ marginBottom: '20px' }}>linked dns server</p>
                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', minHeight: '60px' }}></div>
              </div>
            </div>

            {/* Prawa strona */}
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div className="bg-[#151515]/60 text-[#bbb] py-2.5 rounded-full text-[10px] text-center uppercase tracking-[3px] border border-white/5">registered</div>
                 <div className="bg-green-500/10 text-green-400 py-2.5 rounded-full text-[10px] text-center uppercase tracking-[3px] border border-green-500/20">active</div>
                 <p className="text-purple-400/70 text-[10px] text-center italic font-light" style={{ marginTop: '15px' }}>to expire: {domainData.timeLeft}</p>
              </div>

              <div className="bg-[#151515]/50 border border-white/5 rounded-[35px] text-center shadow-inner" style={{ padding: '40px 20px' }}>
                <p className="text-[10px] text-[#999] uppercase tracking-widest font-bold" style={{ marginBottom: '30px' }}>ownership</p>
                <div className="w-12 h-12 bg-purple-500/10 rounded-full mx-auto flex items-center justify-center border border-purple-500/10" style={{ marginBottom: '25px' }}>
                   <div className="w-4 h-4 bg-purple-400/40 rounded-full blur-[2px]"></div>
                </div>
                <p className="text-[12px] font-semibold tracking-[0.1em] text-[#DCDCDC] uppercase">{domainData.registrar}</p>
              </div>
              
              <div className="flex justify-center" style={{ marginTop: '10px' }}>
                <ArrowDown size={28} className="text-[#666] bg-[#151515] p-2 rounded-xl border border-white/5 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY --- */}
      <div className="w-full" style={{ maxWidth: '960px', marginBottom: '100px' }}>
        <p className="text-xs text-[#888] flex items-center gap-2 tracking-[0.2em] font-bold uppercase" style={{ marginBottom: '30px', marginLeft: '20px' }}>
          <History size={16} /> Your latest search history
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          {searchHistory.map((h, i) => (
            <div key={i} className="bg-[#2F2F2F] border border-white/5 rounded-2xl flex justify-between items-center shadow-lg hover:bg-[#353535] transition-all cursor-pointer" style={{ padding: '25px 35px' }}>
              <span className="text-[#eee] font-semibold text-[12px] tracking-wide">{h.name}</span>
              <span className="text-[#888] text-[9px] uppercase tracking-widest font-bold">registered</span>
              <span className="text-green-500 font-bold uppercase flex items-center gap-2 text-[10px] tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>{h.status}
              </span>
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
    <div className="bg-[#151515]/40 border border-white/5 rounded-2xl text-center hover:bg-[#151515]/60 transition-colors" style={{ padding: '30px 10px' }}>
      <p className="text-[9px] text-[#999] uppercase tracking-[0.15em] font-bold" style={{ marginBottom: '15px' }}>{title}</p>
      <p className="text-[13px] font-bold text-[#DCDCDC] tracking-tight">{value}</p>
    </div>
  );
}

export default App;
