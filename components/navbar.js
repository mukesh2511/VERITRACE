import { Shield } from "lucide-react";
export default function Navbar() {
  return (
    <>
      <style>
        {`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,15,30,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-links {
          display: flex;
          gap: 4px;
        }
        .nav-link {
          color: rgba(232,237,247,0.5);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }
          /* Live indicator */
        .live-dot {
          display: inline-block;
          width: 8px; height: 8px;
          background: #00C9A7;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 0 0 rgba(0,201,167,0.4);
        }
        @keyframes pulse2 {
          0% { box-shadow: 0 0 0 0 rgba(0,201,167,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(0,201,167,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,201,167,0); }
        }
        `}
      </style>
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="logo-mark"
            style={{ width: 36, height: 36, borderRadius: 10 }}
          >
            <Shield size={16} color="#fff" />
          </div>
          <span
            className="syne"
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            VeriTrace
          </span>
        </div>
        <div className="nav-links">
          {[
            "Provenance",
            "Products",
            "Organizations",
            "Transfers",
            "Assembly",
          ].map((link) => (
            <a key={link} href={`/${link.toLowerCase()}`} className="nav-link">
              {link}
            </a>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.82rem",
            color: "rgba(232,237,247,0.4)",
          }}
        >
          <span className="live-dot" />
          System Live
        </div>
      </nav>
    </>
  );
}
