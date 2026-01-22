Smart Arabic Linter & Fixer (v2.0)
Smart Arabic Linter is a high-performance React application designed to automatically correct common Arabic spelling mistakes, grammar nuances (like Hamza positions), and punctuation errors. It uses advanced Regex patterns and Morphological expansion to ensure text quality.

🚀 Key Features
Intelligent Punctuation: Automatically fixes spacing before/after commas, periods, and question marks.

Hamza Normalization: Corrects common mistakes in Hamza al-Wasl and al-Qat' (e.g., الى → إلى).

Prefix Support: Unlike basic search-and-replace, this tool handles Arabic prefixes like (و، ف، بـ) attached to words (e.g., واسهل → وأسهل).

Whitespace Collapsing: Intelligently handles multiple spaces and non-breaking spaces (nbsp).

Real-time Processing: Optimized using React useMemo for lag-free typing.

Modern UI: A clean, responsive dashboard with a "Copy to Clipboard" feature.

🛠️ Technical Logic
The core of this project lies in its Morphological Generator. Instead of manually listing every possible mistake, the engine uses a "Root-Prefix" expansion logic:

Static Dictionary: For unique words like إن شاء الله.

Dynamic Generation: Takes a root word (e.g., أفضل) and automatically generates rules for وأفضل, فأفضل, بأفضل, etc.

Regex Lookaround Assertions: Uses (?<=^|[^أ-ي]) to ensure corrections only happen at word boundaries, preventing accidental changes inside larger words.

💻 Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/arabic-fixer.git
Install dependencies:

Bash

npm install
Run the project:

Bash

npm start
📂 Project Structure
Plaintext

src/
├── ArabicFixer.jsx   # Core logic & UI components
├── ArabicFixer.css   # Modern Glassmorphism styling
├── constants/
│   └── dictionary.js # The 500+ rules generator
└── App.js            # Main entry point
🌟 Why this project?
This project demonstrates:

Deep understanding of Arabic Typography.

Efficiency in String Manipulation and Regular Expressions.

Clean React Architecture and Performance Optimization.