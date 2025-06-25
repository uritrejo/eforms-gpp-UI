const SustainabilityIcon = () => (
    <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo sustainability"
    >
        {/* Leaf shape */}
        <path
            d="M48 8C25.9 8 8 25.9 8 48C26.5 48 41.5 33 41.5 14.5C43.5 10.5 45.7 8.8 48 8Z"
            fill="#4CAF50"
        />
        <path
            d="M48 8C70.1 8 88 25.9 88 48C69.5 48 54.5 33 54.5 14.5C52.5 10.5 50.3 8.8 48 8Z"
            fill="#66BB6A"
        />
        {/* Stem */}
        <line
            x1="48"
            y1="48"
            x2="48"
            y2="84"
            stroke="#4CAF50"
            strokeWidth="4"
            strokeLinecap="round"
        />
        {/* Small leaves on stem */}
        <ellipse
            cx="42"
            cy="58"
            rx="8"
            ry="4"
            fill="#81C784"
            transform="rotate(-30 42 58)"
        />
        <ellipse
            cx="54"
            cy="68"
            rx="8"
            ry="4"
            fill="#81C784"
            transform="rotate(30 54 68)"
        />
        {/* Veins in main leaves */}
        <path
            d="M35 25C40 30 43 35 41.5 40"
            stroke="#388E3C"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M61 25C56 30 53 35 54.5 40"
            stroke="#2E7D32"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);

export default SustainabilityIcon;
