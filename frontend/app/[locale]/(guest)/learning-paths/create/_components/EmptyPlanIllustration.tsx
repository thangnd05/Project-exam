// Minh hoạ trạng thái chưa có lộ trình: con đường uốn qua đồi dẫn tới lá cờ đích.
// Vẽ inline để màu đi theo biến --brand-* của từng palette và chế độ sáng/tối.
function EmptyPlanIllustration() {
  return (
    <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true">
      <path d="M12 100C26 70 44 62 60 72C76 40 100 28 118 40C130 48 134 76 136 100H12Z" fill="var(--brand-150)" />
      <path d="M3 99C24 84 50 79 76 84C102 89 126 88 145 99C147 100.5 146 103 144 103H4C2 103 1 100.5 3 99Z" fill="var(--brand-200)" />
      <path
        d="M26 92C46 92 70 90 72 80C74 70 54 70 62 60C70 50 92 58 100 50C104 46 106 44 107 40"
        stroke="var(--brand-600)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <circle cx="26" cy="92" r="4.5" fill="var(--bg-white)" stroke="var(--brand-700)" strokeWidth="2.5" />
      <path d="M107 40V8" stroke="var(--brand-800)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M108 9H130C131.5 9 132.2 10.7 131.2 11.8L126 17L131.2 22.2C132.2 23.3 131.5 25 130 25H108V9Z" fill="var(--brand-500)" />
      <ellipse cx="107" cy="40.5" rx="6" ry="2" fill="var(--brand-400)" />
    </svg>
  );
}

export default EmptyPlanIllustration;
