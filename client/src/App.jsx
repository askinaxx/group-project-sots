import React, { useState, useRef } from 'react';
import html2pdf from "html2pdf.js";
import { Search, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const S = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a', 
    color: '#DCDCDC',
    fontFamily: "'Montserrat', sans-serif",
    padding: '60px 20px 40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(146, 51, 234, 0.22) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 40%)',
  },
  header: {
    textAlign: 'center',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '80px', 
    marginTop: '40px',
  },
  input: {
    backgroundColor: 'rgba(55, 11, 85, 0.5)',
    color: 'white',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    borderRadius: '999px',
    height: '60px', 
    width: '580px', 
    textAlign: 'left',
    paddingLeft: '40px',
    fontSize: '15px',
    outline: 'none',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
    marginBottom: '30px', 
  },
  card: {
    backgroundColor: '#1C1C1C', 
    width: '960px',
    borderRadius: '40px',
    padding: '60px',
    marginBottom: '100px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxSizing: 'border-box',
    display: 'flex',
    gap: '60px', 
  },
  leftCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', 
  },
  dnsBox: {
    backgroundColor: '#151515',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    padding: '25px 30px',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
  },
  rightCol: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', 
  },
  ownershipBox: {
    backgroundColor: '#151515',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '35px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
  },
  footer: {
    width: '100%',
    maxWidth: '960px',
    borderTop: '1px solid rgba(147, 51, 234, 0.2)',
    paddingTop: '40px',
    marginTop: '80px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
};

export default function App() {
  const [domainData, setDomainData] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const pdfRef = useRef();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/domain/${query}`);
      if (!response.ok) throw new Error('Domain not found');
      const result = await response.json();
      setDomainData(result); 

       // --- LOGIKA STATUSU DLA HISTORII (Spójna z kartą główną) ---
      const statusFromApi = result.status?.[0]?.toLowerCase() || "";
      
      // Definiujemy co uznajemy za "ACTIVE"
      const isActive = statusFromApi.includes('active') || 
                       (statusFromApi.includes('prohibited') && !statusFromApi.includes('pending'));

      const displayStatus = isActive ? "ACTIVE" : "INACTIVE";

      const newItem = { 
        name: result.domainName, 
        status: displayStatus, 
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      };
      setSearchHistory(prev => [newItem, ...prev].slice(0, 5));
      setQuery("");
    } catch (err) {
      setError(err.message);
      setDomainData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    const options = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `${domainData?.domainName || 'report'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#1C1C1C' },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(options).from(element).save();
  };

  return (
    <div style={S.container}>
      
      <style>{`
        .search-btn:hover { background-color: #9333ea !important; color: white !important; }
        .pdf-btn { background-color: rgba(147, 51, 234, 0.4) !important; color: rgba(255, 255, 255, 0.8) !important; border: 1px solid rgba(147, 51, 234, 0.3) !important; }
        .pdf-btn:hover { background-color: #9333ea !important; color: white !important; box-shadow: 0 0 25px rgba(147, 51, 234, 0.6) !important; }
        .history-item:hover { border-color: rgba(147, 51, 234, 0.4) !important; background-color: rgba(147, 51, 234, 0.05) !important; }
      `}</style>

      {/* --- HEADER --- */}
      <header style={S.header}>
        <h1 className="text-5xl font-bold mb-10 text-white tracking-tight leading-tight">Looking for current status of domain?</h1>
        <p className="text-[#888] text-lg mb-16 font-light tracking-wide">Enter below name of domain that you are looking for</p>
        
        {/* --- WYSZUKIWARKA --- */}
        <div className="flex flex-col items-center">
          <input 
            type="text"
            style={S.input}
            className="focus:border-purple-500/50 transition-all"
            placeholder="Please type your desired domain here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} style={{backgroundColor: '#1a1a1a', color: '#888', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '15px 50px', borderRadius: '999px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s ease'}} className="search-btn">
            {loading ? 'searching...' : 'search'} <Search size={16} color="#9333ea" />
          </button>
          {error && <p className="text-red-500 mt-6 text-xs uppercase tracking-widest font-bold">{error}</p>}
        </div>
      </header>

      {/* --- KARTA WYNIKÓW --- */}
      {domainData && (
        <div ref={pdfRef} style={S.card}>
          <div style={S.leftCol}>
            {/* --- DOMAIN NAME --- */}
            <div className="border-b border-white/10 pb-10 mb-6">
              <h2 className="text-4xl font-bold tracking-[0.2em] text-white uppercase">{domainData.domainName}</h2>
            </div>
            
            {/* --- KEY DATES --- */}
            <div className="grid grid-cols-3 gap-6">
              <StatBox title="REGISTRATION DATE" value={domainData.createdAt || "N/A"} />
              <StatBox title="LAST UPDATE DATE" value={domainData.updatedAt || "N/A"} />
              <StatBox title="EXPIRATION DATE" value={domainData.expiresAt || "N/A"} />
            </div>

            {/* --- LINKED DNS SERVER --- */}
            <div style={S.dnsBox} className="mt-8">
                 <p className="text-[11px] text-[#999] uppercase tracking-[0.3em] font-bold mb-4 border-b border-purple-500/30 pb-2 inline-block">linked dns server</p>
                 <div className="flex flex-wrap gap-3 mt-4">
                    {domainData.nameservers ? domainData.nameservers.map((ns, idx) => (
                      <span key={idx} style={{backgroundColor: 'rgba(147, 51, 234, 0.05)', border: '1px solid rgba(147, 51, 234, 0.2)', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', color: '#ddd', letterSpacing: '0.05em'}}>
                        {ns}
                      </span>
                    )) : <p className="text-sm text-[#666]">No data available</p>}
                 </div>
            </div>
          </div>

          <div style={S.rightCol}>
            {/* --- TE TRZY STATUSY --- */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px 20px', textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: '700', color: '#aaa', marginBottom: '10px'}}>registered</div>
              <div style={{
                backgroundColor: (domainData.status?.[0]?.toLowerCase().includes('active') || domainData.status?.[0]?.toLowerCase().includes('prohibited')) 
                  ? 'rgba(74, 222, 128, 0.05)' 
                  : 'rgba(239, 68, 68, 0.05)', 
                color: (domainData.status?.[0]?.toLowerCase().includes('active') || domainData.status?.[0]?.toLowerCase().includes('prohibited')) 
                  ? '#4ade80' 
                  : '#ef4444', 
                border: `1px solid ${(domainData.status?.[0]?.toLowerCase().includes('active') || domainData.status?.[0]?.toLowerCase().includes('prohibited')) 
                  ? 'rgba(74, 222, 128, 0.2)' 
                  : 'rgba(239, 68, 68, 0.2)'}`, 
                borderRadius: '8px', 
                padding: '12px 20px', 
                textAlign: 'center', 
                fontSize: '10px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.3em', 
                fontWeight: '700', 
                marginBottom: '10px'
              }}>
                {(domainData.status?.[0]?.toLowerCase().includes('active') || domainData.status?.[0]?.toLowerCase().includes('prohibited')) 
                  ? "ACTIVE" 
                  : "INACTIVE"}
              </div>
              <p style={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', color: '#666', marginTop: '15px' }}>
                days left: <span className="text-white font-bold">{domainData?.daysLeft || "N/A"}</span>
              </p>
            </div>

            {/* --- WŁAŚCICIEL (OWNERSHIP) --- */}
            <div style={S.ownershipBox}>
              <p className="text-[11px] text-[#999] uppercase tracking-[0.3em] font-bold mb-10">ownership</p>
              <div className="w-16 h-16 bg-purple-500/10 rounded-full mx-auto mb-10 flex items-center justify-center border border-purple-500/20">
                 <div className="w-4 h-4 bg-purple-500 rounded-full blur-[1px]"></div>
              </div>
              <p className="text-[14px] font-bold tracking-[0.15em] text-white uppercase mb-14 leading-relaxed">
                {domainData.registrar || "MarkMonitor Inc."}
              </p>
              <button onClick={handleDownloadPDF} style={{backgroundColor: 'rgba(147, 51, 234, 0.4)', color: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: '12px', padding: '15px 25px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', cursor: 'pointer', width: '100%', marginTop: '20px', transition: 'all 0.3s ease'}} className="pdf-btn">Download PDF Report</button>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY --- */}
      <div className="w-full max-w-[960px] mb-20 flex flex-col items-center">
        <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '40px', paddingLeft: '24px'}}>
           <History size={20} color="#555" />
           <span style={{marginLeft: '15px', color: '#555', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em'}}>Your search history</span>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {searchHistory.length > 0 ? searchHistory.map((h, i) => (
            <div key={i} className="history-item" style={{backgroundColor: 'rgba(28, 28, 28, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '20px 35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease'}}>
              <span className="text-[#eee] font-semibold text-[14px] tracking-wide w-1/3">{h.name}</span>
              <div className="flex items-center gap-3 w-1/3 justify-center">
                 <div style={{backgroundColor: h.status === 'ACTIVE' ? '#4ade80' : '#ef4444'}} className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                 <span style={{color: h.status === 'ACTIVE' ? '#4ade80' : '#ef4444'}} className="font-bold uppercase text-[11px] tracking-widest">{h.status}</span>
              </div>
              <span className="text-[#444] text-[11px] italic w-1/3 text-right">{h.date}</span>
            </div>
          )) : <p className="text-[#333] text-center italic text-sm">No recent searches yet...</p>}
        </div>
      </div>

      {/* --- STOPKA --- */}
      <footer style={S.footer}>
          <p className="text-[12px] text-[#555] tracking-[0.4em] uppercase font-bold mb-2">2026 ® ALL RIGHTS RESERVED</p>
          <p className="text-[10px] text-[#333] tracking-[0.6em] uppercase font-light">WSB Merito Student project</p>
      </footer>
    </div>
  );
}

function StatBox({ title, value }) {
  const words = title.split(' ');
  const dateWord = words.pop();
  const restOfTitle = words.join(' ');

  return (
    <div style={{backgroundColor: '#151515', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '15px', padding: '20px 10px', textAlign: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <p className="text-[10px] text-[#666] uppercase tracking-[0.2em] font-bold mb-3">
        {restOfTitle}<br/>{dateWord}
      </p>
      <p className="text-[16px] font-bold text-[#eee] tracking-tight">{value}</p>
    </div>
  );
}
