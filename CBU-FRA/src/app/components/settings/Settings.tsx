import React, { useState } from "react";
import { Link } from "react-router";

type Tab = "general" | "fleet" | "notifications" | "users" | "integrations" | "security";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Dispatcher" | "Viewer";
  city: string;
  active: boolean;
}

const USERS: User[] = [
  { id: "u1", name: "Chanda Mwamba",  email: "chanda@zambiafreight.zm",  role: "Admin",      city: "Lusaka",  active: true  },
  { id: "u2", name: "Mutale Phiri",   email: "mutale@zambiafreight.zm",  role: "Dispatcher", city: "Chipata", active: true  },
  { id: "u3", name: "Bwalya Kunda",   email: "bwalya@zambiafreight.zm",  role: "Viewer",     city: "Ndola",   active: false },
  { id: "u4", name: "Mwape Zulu",     email: "mwape@zambiafreight.zm",   role: "Dispatcher", city: "Mongu",   active: true  },
];

const ROLE_COLOR: Record<User["role"], string> = {
  Admin:      "#f9a825",
  Dispatcher: "#43a047",
  Viewer:     "#90a4ae",
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid var(--color-border, #e0e0e0)" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground, #0D1B2A)" }}>{label}</div>
      {description && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? "var(--primary, #1B5E20)" : "#d1d5db",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background .2s", flexShrink: 0, marginLeft: 16,
      }}
      aria-checked={checked} role="switch"
    >
      <span style={{
        position: "absolute", top: 3,
        left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px #0003",
      }} />
    </button>
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string }> = ({ label, value, onChange, options, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1px solid #e0e0e0", background: "#fff",
        fontSize: 14, color: "#0D1B2A", cursor: "pointer", outline: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div>}
  </div>
);

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = "text", placeholder, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1px solid #e0e0e0", background: "#fff",
        fontSize: 14, color: "#0D1B2A", outline: "none",
        boxSizing: "border-box",
        transition: "border-color .15s",
      }}
      onFocus={e => (e.target.style.borderColor = "#1B5E20")}
      onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
    />
    {hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div>}
  </div>
);

const SectionTitle: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0D1B2A", margin: 0 }}>{title}</h2>
    </div>
    {subtitle && <p style={{ fontSize: 13, color: "#6b7280", margin: 0, paddingLeft: 30 }}>{subtitle}</p>}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: "#fff", borderRadius: 12,
    border: "1px solid #e8ecf0",
    padding: "24px", marginBottom: 20,
    boxShadow: "0 1px 4px #0d1b2a08",
    ...style,
  }}>
    {children}
  </div>
);

const SaveBar: React.FC<{ dirty: boolean; onSave: () => void; onDiscard: () => void }> = ({
  dirty,
  onSave,
  onDiscard,
}) => {
  if (!dirty) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 20,
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 14px #0d1b2a12",
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280" }}>You have unsaved changes</span>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onDiscard}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--primary, #1B5E20)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 2px 8px #1b5e2040",
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};


const GeneralPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const [orgName, setOrgName]     = useState("ZambiaFreight Ltd");
  const [hq, setHq]               = useState("Lusaka, Zambia");
  const [timezone, setTimezone]   = useState("africa_lusaka");
  const [language, setLanguage]   = useState("en");
  const [currency, setCurrency]   = useState("zmw");
  const [dateFormat, setDateFormat] = useState("dmy");

  const upd = (fn: (v: string) => void) => (v: string) => { fn(v); dirty(); };

  return (
    <>
      <SectionTitle icon="" title="Organisation" subtitle="Basic details about your company." />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <InputField label="Organisation Name" value={orgName} onChange={upd(setOrgName)} placeholder="Your company name" />
          <InputField label="Headquarters" value={hq} onChange={upd(setHq)} placeholder="City, Country" />
        </div>
        <SelectField label="Timezone" value={timezone} onChange={upd(setTimezone)} options={[
          { value: "africa_lusaka",     label: "Africa/Lusaka (CAT, UTC+2)" },
          { value: "africa_harare",     label: "Africa/Harare (CAT, UTC+2)" },
          { value: "africa_nairobi",    label: "Africa/Nairobi (EAT, UTC+3)" },
          { value: "africa_johannesburg",label:"Africa/Johannesburg (SAST, UTC+2)" },
        ]} hint="Used for ETA calculations and log timestamps." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 24px" }}>
          <SelectField label="Language" value={language} onChange={upd(setLanguage)} options={[
            { value: "en", label: "English" },
            { value: "ny", label: "Chichewa" },
          ]} />
          <SelectField label="Currency" value={currency} onChange={upd(setCurrency)} options={[
            { value: "zmw", label: "Zambian Kwacha" },
            { value: "usd", label: " US Dollar" },
            { value: "zar", label: "ZAR " },
          ]} />
          <SelectField label="Date Format" value={dateFormat} onChange={upd(setDateFormat)} options={[
            { value: "dmy", label: "DD/MM/YYYY" },
            { value: "mdy", label: "MM/DD/YYYY" },
            { value: "ymd", label: "YYYY-MM-DD" },
          ]} />
        </div>
      </Card>

      <SectionTitle icon="" title="Map Defaults" subtitle="Default view when opening the live map." />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <SelectField label="Default City" value="all" onChange={() => dirty()} options={[
            { value: "all",     label: "All Cities" },
            { value: "lusaka",  label: "Lusaka" },
            { value: "chipata", label: "Chipata" },
            { value: "ndola",   label: "Ndola" },
            { value: "mongu",   label: "Mongu" },
          ]} />
          <SelectField label="Default Zoom Level" value="5" onChange={() => dirty()} options={[
            { value: "4", label: "Country View (4)" },
            { value: "5", label: "Regional View (5)" },
            { value: "7", label: "City View (7)" },
          ]} />
        </div>
      </Card>
    </>
  );
};

const FleetPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const [simulSpeed, setSimulSpeed] = useState("1x");
  const [trailLength, setTrailLength] = useState("medium");
  const [autoArrival, setAutoArrival] = useState(true);
  const [showOffline, setShowOffline] = useState(false);
  const [pingInterval, setPingInterval] = useState("30");

  return (
    <>
      <SectionTitle icon="" title="Fleet Simulation" subtitle="Control how trucks move and are tracked." />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <SelectField label="Simulation Speed" value={simulSpeed} onChange={v => { setSimulSpeed(v); dirty(); }} options={[
            { value: "0.5x", label: "Slow" },
            { value: "1x",   label: "Realtime" },
            { value: "2x",   label: "Fast" },
            { value: "5x",   label: " Very Fast" },
          ]} hint="Affects how quickly trucks advance in simulation mode." />
          <SelectField label="Route Trail Length" value={trailLength} onChange={v => { setTrailLength(v); dirty(); }} options={[
            { value: "short",  label: "Short" },
            { value: "medium", label: "Medium" },
            { value: "long",   label: "Long" },
            { value: "full",   label: "Full Route" },
          ]} hint="How much of the traveled path stays visible." />
        </div>
        <InputField label="GPS Ping Interval (seconds)" value={pingInterval} onChange={v => { setPingInterval(v); dirty(); }} type="number" hint="How often truck positions update from backend." />
        <Toggle checked={autoArrival} onChange={v => { setAutoArrival(v); dirty(); }} label="Auto-mark arrival" description="Automatically change status to 'At Shed' when truck reaches destination." />
        <Toggle checked={showOffline} onChange={v => { setShowOffline(v); dirty(); }} label="Show offline trucks" description="Display trucks that haven't sent a GPS ping in over 10 minutes." />
      </Card>

      <SectionTitle icon="" title="Cargo Defaults" subtitle="Default cargo categories and weight limits." />
      <Card>
        <SelectField label="Default Cargo Type" value="general" onChange={() => dirty()} options={[
          { value: "general",    label: "General Goods" },
          { value: "copper_ore", label: "Copper Ore" },
          { value: "maize",      label: "Maize" },
          { value: "fertiliser", label: "Fertiliser" },
        ]} />
        <InputField label="Max Payload (tonnes)" value="30" onChange={() => dirty()} type="number" hint="Trucks exceeding this will be flagged." />
      </Card>
    </>
  );
};

const NotificationsPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const [email, setEmail]         = useState(true);
  const [sms, setSms]             = useState(false);
  const [inApp, setInApp]         = useState(true);
  const [arrivals, setArrivals]   = useState(true);
  const [delays, setDelays]       = useState(true);
  const [offline, setOffline]     = useState(false);
  const [digest, setDigest]       = useState(false);
  const [emailAddr, setEmailAddr] = useState("ops@zambiafreight.zm");

  const upd = (fn: (v: boolean) => void) => (v: boolean) => { fn(v); dirty(); };

  return (
    <>
      <SectionTitle icon="" title="Delivery Channels" subtitle="Choose how the system reaches you." />
      <Card>
        <Toggle checked={email} onChange={upd(setEmail)} label="Email notifications" description="Send alerts to the address below." />
        {email && (
          <div style={{ paddingLeft: 0, paddingTop: 8 }}>
            <InputField label="Notification Email" value={emailAddr} onChange={v => { setEmailAddr(v); dirty(); }} type="email" placeholder="ops@yourcompany.zm" />
          </div>
        )}
        <Toggle checked={sms} onChange={upd(setSms)} label="SMS alerts" description="Requires a linked phone number on your account." />
        <Toggle checked={inApp} onChange={upd(setInApp)} label="In-app notifications" description="Show banner alerts within the dashboard." />
        <Toggle checked={digest} onChange={upd(setDigest)} label="Daily digest email" description="One summary email per day instead of individual alerts." />
      </Card>

      <SectionTitle icon="" title="Alert Triggers" subtitle="Choose which events generate notifications." />
      <Card>
        <Toggle checked={arrivals} onChange={upd(setArrivals)} label="Truck arrival at shed"   description="Notify when a truck completes its route." />
        <Toggle checked={delays}   onChange={upd(setDelays)}   label="Truck delayed"           description="Notify when a truck's status changes to Delayed." />
        <Toggle checked={offline}  onChange={upd(setOffline)}  label="Truck goes offline"      description="Notify when GPS ping is lost for over 10 minutes." />
      </Card>
    </>
  );
};

const UsersPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const [users, setUsers] = useState<User[]>(USERS);

  const toggleActive = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, active: !u.active } : u));
    dirty();
  };

  return (
    <>
      <SectionTitle icon="" title="Team Members" subtitle="Manage who has access to the fleet dashboard." />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{users.length} members</span>
          <button style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: "#1B5E20", color: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}> Invite Member</button>
        </div>
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: "flex", alignItems: "center", padding: "14px 20px",
            borderBottom: i < users.length - 1 ? "1px solid #f3f4f6" : "none",
            gap: 14,
          }}>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: `${ROLE_COLOR[u.role]}22`,
              border: `2px solid ${ROLE_COLOR[u.role]}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: ROLE_COLOR[u.role],
            }}>
              {u.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0D1B2A" }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{u.email}</div>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", width: 70 }}>{u.city}</div>
            <span style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 20,
              background: `${ROLE_COLOR[u.role]}18`,
              color: ROLE_COLOR[u.role],
              fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
              width: 90, textAlign: "center",
            }}>{u.role}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: u.active ? "#1B5E20" : "#9ca3af" }}>
                {u.active ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => toggleActive(u.id)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: u.active ? "#1B5E20" : "#d1d5db",
                  border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                  transition: "background .2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 2,
                  left: u.active ? 18 : 2,
                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  transition: "left .2s",
                }} />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
};

const IntegrationsPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const integrations = [
    { id: "api", name: "REST API", desc: "Connect your backend truck data to the live map.", status: "connected", icon: "" },
    { id: "ws",  name: "WebSocket Stream", desc: "Real-time truck position stream via WS.", status: "disconnected", icon: "" },
    { id: "sms", name: "Zamtel SMS Gateway", desc: "Send SMS alerts via Zamtel.", status: "disconnected", icon: "" },
    { id: "erp", name: "SAP ERP", desc: "Sync cargo manifests from SAP.", status: "pending", icon: "" },
  ];

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    connected:    { bg: "#e8f5e9", color: "#1B5E20", label: "Connected" },
    disconnected: { bg: "#fce4ec", color: "#c62828", label: "Disconnected" },
    pending:      { bg: "#fff8e1", color: "#f9a825", label: "Pending" },
  };

  return (
    <>
      <SectionTitle icon="" title="Integrations" subtitle="Connect ZambiaFreight to your backend and third-party services." />
      {integrations.map(int => {
        const s = STATUS_STYLE[int.status];
        return (
          <Card key={int.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 24px" }}>
            <span style={{ fontSize: 28 }}>{int.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2A" }}>{int.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{int.desc}</div>
            </div>
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, fontWeight: 700 }}>
              {s.label}
            </span>
            <button onClick={() => dirty()} style={{
              padding: "7px 16px", borderRadius: 8,
              border: "1px solid #e0e0e0",
              background: "#fff", color: "#374151",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>
              {int.status === "connected" ? "Configure" : "Connect"}
            </button>
          </Card>
        );
      })}

      <SectionTitle icon="" title="API Keys" subtitle="Keys used by your backend to push data." />
      <Card>
        <InputField label="Backend API Endpoint" value="https://api.zambiafreight.zm/v1" onChange={() => dirty()} hint="The base URL your backend sends truck data to." />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <InputField label="API Key" value="" onChange={() => dirty()} type="password" />
          </div>
          <button style={{
            padding: "9px 16px", borderRadius: 8, border: "1px solid #e0e0e0",
            background: "#fff", cursor: "pointer", fontSize: 12, marginBottom: 20, whiteSpace: "nowrap",
          }}>Regenerate</button>
        </div>
      </Card>
    </>
  );
};

const SecurityPanel: React.FC<{ dirty: () => void }> = ({ dirty }) => {
  const [mfa, setMfa]               = useState(true);
  const [sessionTimeout, setTimeout] = useState("8h");
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [auditLog, setAuditLog]     = useState(true);

  return (
    <>
      <SectionTitle icon="" title="Authentication" subtitle="Control login and session policies." />
      <Card>
        <Toggle checked={mfa} onChange={v => { setMfa(v); dirty(); }} label="Two-factor authentication (2FA)" description="Require TOTP verification for all admin logins." />
        <Toggle checked={ipWhitelist} onChange={v => { setIpWhitelist(v); dirty(); }} label="IP whitelist" description="Restrict dashboard access to approved IP ranges only." />
        <SelectField label="Session Timeout" value={sessionTimeout} onChange={v => { setTimeout(v); dirty(); }} options={[
          { value: "1h",  label: "1 hour" },
          { value: "4h",  label: "4 hours" },
          { value: "8h",  label: "8 hours" },
          { value: "24h", label: "24 hours" },
          { value: "never", label: "Never (not recommended)" },
        ]} hint="Users will be logged out after this period of inactivity." />
      </Card>

      <SectionTitle icon="" title="Audit & Compliance" subtitle="Track activity and maintain compliance." />
      <Card>
        <Toggle checked={auditLog} onChange={v => { setAuditLog(v); dirty(); }} label="Audit logging" description="Log all user actions (logins, edits, exports) to an immutable audit trail." />
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 8, background: "#f9fafb", border: "1px dashed #e0e0e0" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Recent audit events</div>
          {[
            { time: "Today 09:14", user: "Chanda Mwamba", action: "Updated route T3 to Chipata" },
            { time: "Today 08:31", user: "Mutale Phiri",  action: "Dispatched truck ZMB-007" },
            { time: "Yesterday",   user: "Chanda Mwamba", action: "Added user Bwalya Kunda" },
          ].map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#9ca3af", width: 80, flexShrink: 0 }}>{e.time}</span>
              <span style={{ fontSize: 12, color: "#374151" }}><strong>{e.user}</strong> â€” {e.action}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "fleet", label: "Fleet" },
  { id: "notifications", label: "Notifications" },
  { id: "users", label: "Users" },
  { id: "integrations", label: "Integrations" },
  { id: "security", label: "Security" },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isDirty, setIsDirty]     = useState(false);

  const markDirty = () => setIsDirty(true);
  const handleSave = () => { setIsDirty(false); /* call API here */ };
  const handleDiscard = () => { setIsDirty(false); };

  return (
    <div
      style={{
        minHeight: "100%",
        fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
        background: "#F5F7FA",
        padding: "32px 36px 48px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Admin
            </span>
            <span style={{ color: "#d1d5db" }}>{">"}</span>
            <span style={{ fontSize: 11, color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0D1B2A", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
            Manage your fleet operations platform configuration.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <button
            onClick={() => setActiveTab("general")}
            style={{
              padding: "10px 14px",
              borderRadius: 9,
              border: "1px solid #1B5E20",
              background: activeTab === "general" ? "#1B5E20" : "#fff",
              color: activeTab === "general" ? "#fff" : "#1B5E20",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            General Settings
          </button>
          <Link
            to="/dashboard/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: 9,
              border: "1px solid #d8dee6",
              background: "#fff",
              color: "#0D1B2A",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Add Agent
          </Link>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: 9,
              border: "1px solid #b91c1c",
              background: "#fff",
              color: "#b91c1c",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Logout
          </Link>
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {TABS.map(tab => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: active ? "1px solid #1B5E20" : "1px solid #dbe1e8",
                  background: active ? "#e8f5e9" : "#fff",
                  color: active ? "#1B5E20" : "#475569",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {tab.label}
                {tab.id === "notifications" && isDirty ? " *" : ""}
              </button>
            );
          })}
        </nav>

        <div style={{ maxWidth: 820 }}>
          {activeTab === "general"       && <GeneralPanel       dirty={markDirty} />}
          {activeTab === "fleet"         && <FleetPanel         dirty={markDirty} />}
          {activeTab === "notifications" && <NotificationsPanel dirty={markDirty} />}
          {activeTab === "users"         && <UsersPanel         dirty={markDirty} />}
          {activeTab === "integrations"  && <IntegrationsPanel  dirty={markDirty} />}
          {activeTab === "security"      && <SecurityPanel      dirty={markDirty} />}
          <SaveBar dirty={isDirty} onSave={handleSave} onDiscard={handleDiscard} />
        </div>
      </div>
    </div>
  );
};

export default Settings;
