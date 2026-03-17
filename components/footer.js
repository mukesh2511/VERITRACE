import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <>
      <style>
        {`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
                .syne { font-family: 'Syne', sans-serif; }
                /* Logo */
        .logo-mark {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #4F8EF7, #00C9A7);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 40px rgba(79, 142, 247, 0.4), 0 0 80px rgba(0,201,167,0.15);
        }
        .logo-mark::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 19px;
          background: linear-gradient(135deg, rgba(79,142,247,0.6), rgba(0,201,167,0.6));
          z-index: -1;
          filter: blur(8px);
        }
                `}
      </style>
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "28px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="logo-mark"
            style={{ width: 28, height: 28, borderRadius: 8 }}
          >
            <Shield size={12} color="#fff" />
          </div>
          <span
            className="syne"
            style={{
              fontSize: "0.85rem",
              color: "rgba(232,237,247,0.4)",
              fontWeight: 600,
            }}
          >
            VeriTrace
          </span>
        </div>
        <span style={{ fontSize: "0.8rem", color: "rgba(232,237,247,0.25)" }}>
          Supply Chain Transparency Platform · 2026
        </span>
      </div>
    </>
  );
}
