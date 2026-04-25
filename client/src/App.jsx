import React, { useState, useRef } from 'react';
import html2pdf from "html2pdf.js";
import { Search, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


const S = {
  // Główny kontener strony (Viewport)
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a', 
    color: '#DCDCDC',
    fontFamily: "'Montserrat', sans-serif",
    padding: '120px 20px 40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // Efekt poświaty w tle (Radial Gradients)
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(147, 51, 234, 0.12) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 40%)',
  },
  // Sekcja nagłówkowa (Hero Section)
  header: {
    textAlign: 'center',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '100px', 
    marginTop: '40px',
  },
  // Pasek wyszukiwania (Search Input)
  input: {
    backgroundColor: 'rgba(55, 11, 85, 0.5)', // Twoja fioletowa baza z lekką przezroczystością
    color: 'white',
    border: '1px solid rgba(115, 7, 210, 0.4)',
    borderRadius: '999px',
    height: '60px', 
    width: '550px', 
    textAlign: 'center',
    fontSize: '16px',
    outline: 'none',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
    marginBottom: '30px', 
  },
  // Główna karta wyników (Results Display Card)
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
  // Kontener na dane domenowe (Primary Info)
  leftCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', 
  },
  // Box serwerów nazw (DNS Info Box)
  dnsBox: {
    backgroundColor: '#151515',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
  },
  // Kontener na statusy i akcje (Sidebar Actions)
  rightCol: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', 
  },
  // Box rejestratora (Registrar/Ownership Box)
  ownershipBox: {
    backgroundColor: '#151515',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '35px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
  },
  // Przycisk wyszukiwania (Action Button)
  searchBtn: {
    backgroundColor: '#1a1a1a',
    color: '#888',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '15px 50px',
    borderRadius: '999px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  // Etykiety statusów (Status Tags)
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px 20px',
    textAlign: 'center',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    fontWeight: '700',
    color: '#aaa',
    marginBottom: '10px',
  },
  // Przycisk generowania PDF (Export Button)
  pdfBtn: {
    backgroundColor: 'rgba(147, 51, 234, 0.4)', // Wygaszony fiolet na start
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(147, 51, 234, 0.3)',
    borderRadius: '12px',
    padding: '15px 25px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    marginTop: '20px',
    transition: 'all 0.3s ease',
  },
  // Elementy historii (History List Item)
  historyItem: {
    backgroundColor: 'rgba(28, 28, 28, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '20px 35px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  }
};

export default function App() {
  const [domainData, setDomainData] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const pdfRef = useRef();

  // Logika wyszukiwania domeny
  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/domain/${query}`);
      if (!response.ok) throw new Error('Domain not found');
      const result = await response.json();
      setDomainData(result); 
      // Dodawanie do historii sesyjnej
      const newItem = { 
        name: result.domainName, 
        status: "ACTIVE", 
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

  // Logika eksportu do PDF (ze skalowaniem i dopasowaniem do A4)
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    const options = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `${domainData?.domainName || 'report'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#1C1C1C' 
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(options).from(element).save();
  };

  return (
    <div style={S.container}>
      
      {/* Interaktywne style (Hovery i Animacje) */}
      <style>{`
        .search-btn:hover {
           background-color: #9333ea !important;
           color: white !important;
           border-color: #9333ea !important;
        }
        .pdf-btn:hover {
           background-color: #9333ea !important;
           color: white !important;
           box-shadow: 0 0 25px rgba(147, 51, 234, 0.6) !important;
           transform: scale(1.02);
        }
        .history-item:hover {
           border-color: rgba(147, 51, 234, 0.4) !important;
           background-color: rgba(147, 51, 234, 0.05) !important;
        }
      `}</style>

      {/* --- NAGŁÓWEK (Hero Section) --- */}
      <header style={S.header}>
        <h1 className="text-5xl font-bold mb-10 text-white tracking-tight leading-tight">
          Looking for current status of domain?
        </h1>
        <p className="text-[#888] text-lg mb-16 font-light tracking-wide">
          enter below name of domain that you are looking for
        </p>
        
        {/* --- MODUŁ WYSZUKIWARKI (Search Bar Module) --- */}
        <div className="flex flex-col items-center">
          <input 
            type="text"
            style={S.input}
            className="custom-input focus:border-purple-500/50 transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="type domain here..."
          />
          <button 
            onClick={handleSearch}
            style={S.searchBtn}
            className="search-btn"
          >
            {loading ? 'searching...' : 'search'} <Search size={16} color="#9333ea" />
          </button>
          {error && <p className="text-red-500 mt-6 text-xs uppercase tracking-widest font-bold">{error}</p>}
        </div>
      </header>

      {/* --- WIDOK SZCZEGÓŁÓW (Domain Details View) --- */}
      {domainData && (
        <div ref={pdfRef} style={S.card}>
          {/* Kolumna Informacyjna (Data Column) */}
          <div style={S.leftCol}>
            <div className="border-b border-white/10 pb-10 mb-6">
              <h2 className="text-4xl font-bold tracking-[0.2em] text-white uppercase">{domainData.domainName}</h2>
            </div>
            
            {/* Siatka Statystyk (Statistics Grid) */}
            <div className="grid grid-cols-3 gap-6">
              <StatBox title="registration date" value={domainData.createdAt || "N/A"} />
              <StatBox title="last update" value={domainData.updatedAt || "N/A"} />
              <StatBox title="expiration date" value={domainData.expiresAt || "N/A"} />
            </div>

            {/* Box DNS (Network Infrastructure) */}
            <div style={S.dnsBox} className="mt-8">
                 <p className="text-[11px] text-[#999] uppercase tracking-[0.3em] font-bold mb-6">linked dns server</p>
                 <p className="text-sm text-[#eee] leading-relaxed tracking-wide">
                    {domainData.nameservers?.join(', ') || "No data available"}
                 </p>
            </div>
          </div>

          {/* Kolumna Statusu i Akcji (Actions Sidebar) */}
          <div style={S.rightCol}>
            {/* Status Badges */}
            <div style={{ marginBottom: '30px' }}>
              <div style={S.statusBadge}>registered</div>
              <div style={{ ...S.statusBadge, color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.2)', backgroundColor: 'rgba(74, 222, 128, 0.05)' }}>
                active
              </div>
              <p style={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', color: '#666', marginTop: '15px' }}>
                days left: <span className="text-white font-bold">{domainData?.daysLeft || "N/A"}</span>
              </p>
            </div>

            {/* Moduł Właściciela (Ownership Module) */}
            <div style={S.ownershipBox}>
              <p className="text-[11px] text-[#999] uppercase tracking-[0.3em] font-bold mb-10">ownership</p>
              <div className="w-16 h-16 bg-purple-500/10 rounded-full mx-auto mb-10 flex items-center justify-center border border-purple-500/20">
                 <div className="w-4 h-4 bg-purple-500 rounded-full blur-[1px]"></div>
              </div>
              <p className="text-[14px] font-bold tracking-[0.15em] text-white uppercase mb-14 leading-relaxed">
                {domainData.registrar || "MarkMonitor Inc."}
              </p>
         
              {/* Przycisk Exportu (PDF Trigger) */}
              <button 
                onClick={handleDownloadPDF} 
                style={S.pdfBtn}
                className="pdf-btn"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SEKCJA HISTORII (Search History Section) --- */}
      {searchHistory.length > 0 && (
        <div className="w-full max-w-[960px] mb-20">
          <p className="text-xs text-[#555] flex items-center gap-4 tracking-[0.4em] font-bold uppercase mb-10 ml-6">
            <History size={20} /> Your search history
          </p>
          <div className="flex flex-col gap-4">
            {searchHistory.map((h, i) => (
              <div key={i} style={S.historyItem} className="history-item">
                <span className="text-[#eee] font-semibold text-[14px] tracking-wide w-1/3">{h.name}</span>
                <div className="flex items-center gap-3 w-1/3 justify-center">
                   <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                   <span className="text-green-500/80 font-bold uppercase text-[11px] tracking-widest">{h.status}</span>
                </div>
                <span className="text-[#444] text-[11px] italic w-1/3 text-right">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STOPKA (Global Footer) --- */}
      <footer className="w-full border-t border-white/5 py-10 mt-10 text-center">
          <p className="text-[11px] text-[#333] tracking-[0.8em] uppercase font-light">
            2026 ® ALL RIGHTS RESERVED
          </p>
      </footer>
    </div>
  );
}

// Komponent pomocniczy dla boksów danych (Data Tile Component)
function StatBox({ title, value }) {
  const style = {
    backgroundColor: '#151515',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    padding: '35px 20px',
    textAlign: 'center',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
  };
  return (
    <div style={style}>
      <p className="text-[10px] text-[#666] uppercase tracking-[0.2em] font-bold mb-5">{title}</p>
      <p className="text-[16px] font-bold text-[#eee] tracking-tight">{value}</p>
    </div>
  );
}
